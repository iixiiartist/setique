import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { Clock, Mail } from './Icons'

export default function BetaAccessManagement() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [pendingUsers, setPendingUsers] = useState([])
  const [approvedUsers, setApprovedUsers] = useState([])
  const [rejectedUsers, setRejectedUsers] = useState([])
  const [waitlistUsers, setWaitlistUsers] = useState([])
  const [activeTab, setActiveTab] = useState('pending')
  const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0, waitlist: 0, total: 0 })
  const [selectedUsers, setSelectedUsers] = useState(new Set())
  const [actionInProgress, setActionInProgress] = useState(false)

  const fetchBetaUsers = useCallback(async () => {
    try {
      setLoading(true)

      // Fetch all beta access records
      const { data, error } = await supabase
        .from('beta_access')
        .select(`
          *,
          profiles!beta_access_user_id_fkey(username, display_name, avatar_url),
          approved_by_profile:profiles!beta_access_approved_by_fkey(username, display_name)
        `)
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false })

      if (error) throw error

      // Separate by status
      const pending = data?.filter(u => u.status === 'pending_approval') || []
      const approved = data?.filter(u => u.status === 'approved') || []
      const rejected = data?.filter(u => u.status === 'rejected') || []
      const waitlist = data?.filter(u => u.status === 'waitlist') || []

      setPendingUsers(pending)
      setApprovedUsers(approved)
      setRejectedUsers(rejected)
      setWaitlistUsers(waitlist)

      setStats({
        pending: pending.length,
        approved: approved.length,
        rejected: rejected.length,
        waitlist: waitlist.length,
        total: data?.length || 0
      })
    } catch (error) {
      console.error('Error fetching beta users:', error)
      alert('Failed to load beta access data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (user) {
      fetchBetaUsers()
    }
  }, [user, fetchBetaUsers])

  const handleApprove = async (userId, adminNote = '') => {
    try {
      setActionInProgress(true)
      
      const { data, error } = await supabase.rpc('admin_approve_beta_user', {
        target_user_id: userId,
        admin_note: adminNote || null
      })

      if (error) throw error

      alert(`User approved! Access code: ${data.access_code}\n\nThe user should receive an email with this code.`)
      await fetchBetaUsers()
      setSelectedUsers(new Set())
    } catch (error) {
      console.error('Error approving user:', error)
      alert(`Failed to approve user: ${error.message}`)
    } finally {
      setActionInProgress(false)
    }
  }

  const handleReject = async (userId, adminNote = '') => {
    try {
      setActionInProgress(true)
      
      const { error } = await supabase.rpc('admin_reject_beta_user', {
        target_user_id: userId,
        admin_note: adminNote || null
      })

      if (error) throw error

      alert('User rejected successfully')
      await fetchBetaUsers()
      setSelectedUsers(new Set())
    } catch (error) {
      console.error('Error rejecting user:', error)
      alert(`Failed to reject user: ${error.message}`)
    } finally {
      setActionInProgress(false)
    }
  }

  const handleBatchApprove = async () => {
    if (selectedUsers.size === 0) {
      alert('Please select users to approve')
      return
    }

    if (!confirm(`Approve ${selectedUsers.size} user(s)?`)) return

    setActionInProgress(true)
    let successCount = 0
    let failCount = 0

    for (const userId of selectedUsers) {
      try {
        await supabase.rpc('admin_approve_beta_user', {
          target_user_id: userId,
          admin_note: 'Batch approved'
        })
        successCount++
      } catch (error) {
        console.error(`Failed to approve ${userId}:`, error)
        failCount++
      }
    }

    alert(`Batch approval complete!\nSuccess: ${successCount}\nFailed: ${failCount}`)
    await fetchBetaUsers()
    setSelectedUsers(new Set())
    setActionInProgress(false)
  }

  const handleMoveToWaitlist = async (userId) => {
    try {
      setActionInProgress(true)
      
      const { error } = await supabase
        .from('beta_access')
        .update({ status: 'waitlist', updated_at: new Date().toISOString() })
        .eq('user_id', userId)

      if (error) throw error

      alert('User moved to waitlist')
      await fetchBetaUsers()
    } catch (error) {
      console.error('Error moving to waitlist:', error)
      alert(`Failed to move user: ${error.message}`)
    } finally {
      setActionInProgress(false)
    }
  }

  const handleResendCode = async (userId, email, accessCode) => {
    // This would integrate with your email service
    alert(`Email notification feature coming soon!\n\nAccess code for ${email}: ${accessCode}\n\nPlease manually send this code to the user.`)
  }

  const toggleUserSelection = (userId) => {
    const newSelected = new Set(selectedUsers)
    if (newSelected.has(userId)) {
      newSelected.delete(userId)
    } else {
      newSelected.add(userId)
    }
    setSelectedUsers(newSelected)
  }

  const selectAll = (users) => {
    const allIds = users.map(u => u.user_id)
    setSelectedUsers(new Set(allIds))
  }

  const deselectAll = () => {
    setSelectedUsers(new Set())
  }

  const UserCard = ({ user: betaUser, showActions = true }) => {
    const isSelected = selectedUsers.has(betaUser.user_id)
    const profile = betaUser.profiles
    const displayName = profile?.display_name || profile?.username || betaUser.email
    const approvedBy = betaUser.approved_by_profile

    return (
      <div 
        className={`bg-white border-3 border-black rounded-xl p-4 hover:shadow-[4px_4px_0_#000] transition-all ${
          isSelected ? 'ring-4 ring-yellow-400' : ''
        }`}
      >
        <div className="flex items-start gap-4">
          {showActions && activeTab === 'pending' && (
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => toggleUserSelection(betaUser.user_id)}
              className="mt-1 w-5 h-5 border-2 border-black"
            />
          )}
          
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h4 className="font-bold text-lg">{displayName}</h4>
                <p className="text-sm text-gray-600">{betaUser.email}</p>
              </div>
              
              {betaUser.priority > 0 && (
                <span className="px-3 py-1 bg-yellow-200 border-2 border-black text-xs font-bold">
                  PRIORITY {betaUser.priority}
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs mb-3">
              <div>
                <span className="text-gray-500">Signup:</span> {new Date(betaUser.created_at).toLocaleDateString()}
              </div>
              <div>
                <span className="text-gray-500">Status:</span>{' '}
                <span className={`font-bold ${
                  betaUser.status === 'approved' ? 'text-green-600' :
                  betaUser.status === 'rejected' ? 'text-red-600' :
                  betaUser.status === 'waitlist' ? 'text-blue-600' :
                  'text-yellow-600'
                }`}>
                  {betaUser.status.replace('_', ' ').toUpperCase()}
                </span>
              </div>
              {betaUser.signup_source && (
                <div className="col-span-2">
                  <span className="text-gray-500">Source:</span> {betaUser.signup_source}
                </div>
              )}
              {betaUser.approved_at && (
                <div className="col-span-2">
                  <span className="text-gray-500">
                    {betaUser.status === 'approved' ? 'Approved' : 'Reviewed'}:
                  </span> {new Date(betaUser.approved_at).toLocaleString()}
                  {approvedBy && ` by ${approvedBy.display_name || approvedBy.username}`}
                </div>
              )}
              {betaUser.code_used_at && (
                <div className="col-span-2">
                  <span className="text-gray-500">Code Used:</span> {new Date(betaUser.code_used_at).toLocaleString()}
                </div>
              )}
            </div>

            {betaUser.admin_notes && (
              <div className="bg-gray-100 border-2 border-gray-300 rounded p-2 mb-3 text-sm">
                <strong>Admin Notes:</strong> {betaUser.admin_notes}
              </div>
            )}

            {betaUser.status === 'approved' && (
              <div className="bg-green-50 border-2 border-green-500 rounded p-2 mb-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold">Access Code:</span>
                  <code className="bg-white px-2 py-1 border-2 border-black text-sm font-mono">
                    {betaUser.access_code}
                  </code>
                </div>
              </div>
            )}

            {showActions && (
              <div className="flex gap-2 flex-wrap">
                {betaUser.status === 'pending_approval' && (
                  <>
                    <button
                      onClick={() => {
                        const note = prompt('Add approval note (optional):')
                        if (note !== null) handleApprove(betaUser.user_id, note)
                      }}
                      disabled={actionInProgress}
                      className="px-3 py-1 bg-green-500 text-white border-2 border-black font-bold text-sm hover:bg-green-600 disabled:opacity-50"
                    >
                      ✓ Approve
                    </button>
                    <button
                      onClick={() => {
                        const note = prompt('Add rejection reason (optional):')
                        if (note !== null) handleReject(betaUser.user_id, note)
                      }}
                      disabled={actionInProgress}
                      className="px-3 py-1 bg-red-500 text-white border-2 border-black font-bold text-sm hover:bg-red-600 disabled:opacity-50"
                    >
                      ✗ Reject
                    </button>
                    <button
                      onClick={() => handleMoveToWaitlist(betaUser.user_id)}
                      disabled={actionInProgress}
                      className="px-3 py-1 bg-blue-500 text-white border-2 border-black font-bold text-sm hover:bg-blue-600 disabled:opacity-50"
                    >
                      → Waitlist
                    </button>
                  </>
                )}
                
                {betaUser.status === 'approved' && (
                  <button
                    onClick={() => handleResendCode(betaUser.user_id, betaUser.email, betaUser.access_code)}
                    className="px-3 py-1 bg-blue-500 text-white border-2 border-black font-bold text-sm hover:bg-blue-600"
                  >
                    <Mail className="inline h-4 w-4 mr-1" /> Resend Code
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <Clock className="h-12 w-12 animate-spin mx-auto mb-4" />
          <p className="font-bold">Loading beta access data...</p>
        </div>
      </div>
    )
  }

  const currentUsers = {
    pending: pendingUsers,
    approved: approvedUsers,
    rejected: rejectedUsers,
    waitlist: waitlistUsers
  }[activeTab]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-400 via-pink-400 to-yellow-400 border-3 border-black rounded-xl p-6">
        <h2 className="text-3xl font-extrabold text-white drop-shadow-lg mb-2">
          🔐 Beta Access Management
        </h2>
        <p className="text-white/90 font-semibold">
          Review and approve new user signups for beta access
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-yellow-200 border-3 border-black rounded-xl p-4 text-center">
          <div className="text-3xl font-extrabold">{stats.pending}</div>
          <div className="text-sm font-bold">Pending</div>
        </div>
        <div className="bg-green-200 border-3 border-black rounded-xl p-4 text-center">
          <div className="text-3xl font-extrabold">{stats.approved}</div>
          <div className="text-sm font-bold">Approved</div>
        </div>
        <div className="bg-red-200 border-3 border-black rounded-xl p-4 text-center">
          <div className="text-3xl font-extrabold">{stats.rejected}</div>
          <div className="text-sm font-bold">Rejected</div>
        </div>
        <div className="bg-blue-200 border-3 border-black rounded-xl p-4 text-center">
          <div className="text-3xl font-extrabold">{stats.waitlist}</div>
          <div className="text-sm font-bold">Waitlist</div>
        </div>
        <div className="bg-purple-200 border-3 border-black rounded-xl p-4 text-center">
          <div className="text-3xl font-extrabold">{stats.total}</div>
          <div className="text-sm font-bold">Total</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {['pending', 'approved', 'rejected', 'waitlist'].map(tab => (
          <button
            key={tab}
            onClick={() => {
              setActiveTab(tab)
              deselectAll()
            }}
            className={`px-4 py-2 font-bold border-3 border-black ${
              activeTab === tab
                ? 'bg-yellow-400'
                : 'bg-white hover:bg-gray-100'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1).replace('_', ' ')} ({stats[tab]})
          </button>
        ))}
      </div>

      {/* Batch Actions */}
      {activeTab === 'pending' && pendingUsers.length > 0 && (
        <div className="bg-gray-100 border-3 border-black rounded-xl p-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <span className="font-bold">{selectedUsers.size} selected</span>
              <button
                onClick={() => selectAll(pendingUsers)}
                className="text-sm underline hover:no-underline"
              >
                Select All
              </button>
              <button
                onClick={deselectAll}
                className="text-sm underline hover:no-underline"
              >
                Deselect All
              </button>
            </div>
            
            {selectedUsers.size > 0 && (
              <button
                onClick={handleBatchApprove}
                disabled={actionInProgress}
                className="px-4 py-2 bg-green-500 text-white border-2 border-black font-bold hover:bg-green-600 disabled:opacity-50"
              >
                ✓ Batch Approve ({selectedUsers.size})
              </button>
            )}
          </div>
        </div>
      )}

      {/* User List */}
      <div className="space-y-4">
        {currentUsers.length === 0 ? (
          <div className="bg-white border-3 border-black rounded-xl p-12 text-center">
            <p className="text-gray-500 font-semibold">
              No users in this category
            </p>
          </div>
        ) : (
          currentUsers.map(user => (
            <UserCard key={user.id} user={user} />
          ))
        )}
      </div>
    </div>
  )
}
