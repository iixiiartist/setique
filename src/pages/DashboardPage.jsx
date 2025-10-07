import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { DatasetUploadModal } from '../components/DatasetUploadModal'
import ProCuratorProfile from '../components/ProCuratorProfile'
import CurationRequestModal from '../components/CurationRequestModal'
import ProposalsModal from '../components/ProposalsModal'
import ProposalSubmissionModal from '../components/ProposalSubmissionModal'
import CuratorSubmissionModal from '../components/CuratorSubmissionModal'
import SubmissionReviewCard from '../components/SubmissionReviewCard'
import DeletionRequestModal from '../components/DeletionRequestModal'
import ConfirmDialog from '../components/ConfirmDialog'
import {
  Database,
  ShoppingBag,
  DollarSign,
  TrendingUp,
  Download,
  LogOut,
  Home,
  Package,
  Edit,
  Trash,
  Eye,
  EyeOff,
  Upload,
  X,
  Star,
} from '../components/Icons'

const badgeColors = {
  verified: 'bg-blue-100 text-blue-800 border-blue-800',
  expert: 'bg-purple-100 text-purple-800 border-purple-800',
  master: 'bg-yellow-100 text-yellow-800 border-yellow-800'
};

function DashboardPage() {
  const navigate = useNavigate()
  const { user, profile, signOut } = useAuth()
  const [loading, setLoading] = useState(true)
  const [deletionRequests, setDeletionRequests] = useState([])
  const [deletionModalDataset, setDeletionModalDataset] = useState(null)
  const [activeTab, setActiveTab] = useState('overview')
  
  // Upload modal state
  const [uploadModalOpen, setUploadModalOpen] = useState(false)
  
  // Curation request modal state
  const [curationRequestModalOpen, setCurationRequestModalOpen] = useState(false)
  
  // Curator data
  const [myDatasets, setMyDatasets] = useState([])
  const [earnings, setEarnings] = useState(null)
  const [payoutAccount, setPayoutAccount] = useState(null)
  
  // Buyer data
  const [myPurchases, setMyPurchases] = useState([])
  
  // Bounty data
  const [myBounties, setMyBounties] = useState([])
  const [mySubmissions, setMySubmissions] = useState([])
  const [expandedBounty, setExpandedBounty] = useState(null)
  
  // Curation requests data
  const [myCurationRequests, setMyCurationRequests] = useState([])
  const [selectedRequest, setSelectedRequest] = useState(null)
  const [proposalsModalOpen, setProposalsModalOpen] = useState(false)
  const [openCurationRequests, setOpenCurationRequests] = useState([])
  const [proposalSubmissionOpen, setProposalSubmissionOpen] = useState(false)
  const [selectedRequestForProposal, setSelectedRequestForProposal] = useState(null)
  const [curatorProfile, setCuratorProfile] = useState(null)
  const [curatorAssignedRequests, setCuratorAssignedRequests] = useState([])
  
  // Curator submission modal state
  const [submissionModalOpen, setSubmissionModalOpen] = useState(false)
  const [selectedRequestForSubmission, setSelectedRequestForSubmission] = useState(null)
  
  // Stripe Connect state
  const [connectingStripe, setConnectingStripe] = useState(false)
  const [connectError, setConnectError] = useState(null)
  
  // Dataset management state
  const [editingDataset, setEditingDataset] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, title: '', message: '', onConfirm: () => {} })
  
  // Admin state
  const [isAdmin, setIsAdmin] = useState(false)
  
  // Bounty creation modal state
  const [showBountyModal, setShowBountyModal] = useState(false)
  const [newBounty, setNewBounty] = useState({
    title: '',
    description: '',
    modality: 'text',
    budget_min: '',
    budget_max: ''
  })

  const fetchDashboardData = useCallback(async () => {
    if (!user) return
    
    setLoading(true)
    try {
      // Batch 1: Core user data (parallel execution)
      const [
        datasetsResult,
        earningsResult,
        payoutResult,
        purchasesResult,
        adminResult
      ] = await Promise.all([
        // Fetch user's created datasets with partnership info
        supabase
          .from('datasets')
          .select(`
            *,
            dataset_partnerships (
              id,
              status,
              curator_user_id,
              pro_curators (
                display_name,
                badge_level
              )
            )
          `)
          .eq('creator_id', user.id)
          .order('created_at', { ascending: false }),
        
        // Fetch earnings summary
        supabase
          .from('creator_earnings')
          .select('*')
          .eq('creator_id', user.id)
          .order('earned_at', { ascending: false }),
        
        // Fetch payout account
        supabase
          .from('creator_payout_accounts')
          .select('*')
          .eq('creator_id', user.id)
          .maybeSingle(),
        
        // Fetch user's purchases
        supabase
          .from('purchases')
          .select(`
            *,
            datasets (*)
          `)
          .eq('user_id', user.id)
          .eq('status', 'completed')
          .order('purchased_at', { ascending: false }),
        
        // Check if user is admin
        supabase
          .from('admins')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle()
      ]);

      const datasets = datasetsResult.data || [];
      
      // Batch fetch all purchase counts in ONE query instead of loop
      if (datasets.length > 0) {
        const datasetIds = datasets.map(d => d.id);
        const { data: purchaseCounts } = await supabase
          .from('purchases')
          .select('dataset_id')
          .in('dataset_id', datasetIds)
          .eq('status', 'completed');
        
        // Count purchases per dataset
        const countMap = {};
        purchaseCounts?.forEach(p => {
          countMap[p.dataset_id] = (countMap[p.dataset_id] || 0) + 1;
        });
        
        // Add counts to datasets
        datasets.forEach(dataset => {
          dataset.purchase_count = countMap[dataset.id] || 0;
        });
      }
      
      setMyDatasets(datasets)

      // Process earnings (already fetched in parallel)
      const earningsData = earningsResult.data || [];
      const totalEarned = earningsData.reduce((sum, e) => sum + parseFloat(e.creator_net), 0) || 0;
      const pendingEarnings = earningsData.filter(e => e.status === 'pending').reduce((sum, e) => sum + parseFloat(e.creator_net), 0) || 0;
      
      setEarnings({
        total: totalEarned,
        pending: pendingEarnings,
        paid: totalEarned - pendingEarnings,
        transactions: earningsData
      });

      // Process payout account (already fetched in parallel)
      const payout = payoutResult.data;
      setPayoutAccount(payout);
      
      // Process purchases (already fetched in parallel)
      setMyPurchases(purchasesResult.data || []);

      // Process admin status (already fetched in parallel)
      if (!adminResult.error && adminResult.data) {
        setIsAdmin(true);
      }
      
      // Verify Stripe account if needed (background, non-blocking)
      if (payout && payout.stripe_connect_account_id && !payout.payouts_enabled) {
        fetch('/.netlify/functions/verify-stripe-account', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ creatorId: user.id })
        })
          .then(res => res.json())
          .then(verifyData => {
            if (verifyData.success && verifyData.account?.payouts_enabled) {
              supabase
                .from('creator_payout_accounts')
                .select('*')
                .eq('creator_id', user.id)
                .single()
                .then(({ data }) => setPayoutAccount(data));
            }
          })
          .catch(err => console.log('Background verification failed:', err));
      }

      // Batch 2: Bounty and curation data (parallel execution)
      const [
        bountiesResult,
        submissionsResult,
        curationRequestsResult,
        openRequestsResult,
        curatorProfileResult,
        deletionRequestsResult
      ] = await Promise.all([
        supabase.from('curation_requests').select('*').eq('creator_id', user.id).order('created_at', { ascending: false }),
        supabase.from('bounty_submissions').select('*, curation_requests!request_id (*), datasets (*)').eq('creator_id', user.id).order('submitted_at', { ascending: false }),
        supabase.from('curation_requests').select('*, curator_proposals (id, status, curator_id, proposal_text, estimated_completion_days, suggested_price, created_at, pro_curators (id, display_name, badge_level, rating, total_projects, specialties)), curator_submissions (id, submission_number, file_name, file_size, file_path, completion_notes, changes_made, status, reviewer_feedback, created_at, reviewed_at)').eq('creator_id', user.id).order('created_at', { ascending: false }),
        supabase.from('curation_requests').select('*').eq('status', 'open').order('created_at', { ascending: false }).limit(20),
        supabase.from('pro_curators').select('*').eq('user_id', user.id).maybeSingle(),
        supabase.from('deletion_requests').select('*, datasets (id, title, description)').eq('requester_id', user.id).order('requested_at', { ascending: false })
      ]);

      // Process bounties with proposals
      const bounties = bountiesResult.data || [];
      if (bounties.length > 0) {
        const requestIds = bounties.map(b => b.id);
        const [proposalsResult, curatorsResult] = await Promise.all([
          supabase.from('curator_proposals').select('*').in('request_id', requestIds),
          supabase.from('pro_curators').select('id, display_name, badge_level')
        ]);
        
        const proposalsWithCurators = (proposalsResult.data || []).map(proposal => ({
          ...proposal,
          pro_curators: (curatorsResult.data || []).find(c => c.id === proposal.curator_id)
        }));
        
        setMyBounties(bounties.map(bounty => ({
          ...bounty,
          curator_proposals: proposalsWithCurators.filter(p => p.request_id === bounty.id)
        })));
      } else {
        setMyBounties([]);
      }

      setMySubmissions(submissionsResult.data || []);
      setMyCurationRequests(curationRequestsResult.data || []);
      setOpenCurationRequests(openRequestsResult.data || []);
      setCuratorProfile(curatorProfileResult.data);
      setDeletionRequests(deletionRequestsResult.data || []);

      // If user is a Pro Curator, fetch assigned requests
      const curatorData = curatorProfileResult.data;
      if (curatorData) {
        const { data: assignedData } = await supabase
          .from('curation_requests')
          .select('*')
          .eq('assigned_curator_id', curatorData.id)
          .order('created_at', { ascending: false });

        if (assignedData && assignedData.length > 0) {
          const requestIds = assignedData.map(r => r.id);
          const creatorIds = assignedData.map(r => r.creator_id).filter(Boolean);

          // Fetch proposals and creator profiles in parallel
          const [proposalsResult, creatorsResult] = await Promise.all([
            supabase.from('curator_proposals').select('*').in('request_id', requestIds),
            supabase.from('profiles').select('id, username, avatar_url').in('id', creatorIds)
          ]);

          const proposals = proposalsResult.data || [];
          const creators = creatorsResult.data || [];

          setCuratorAssignedRequests(assignedData.map(request => ({
            ...request,
            requestor: creators.find(c => c.id === request.creator_id) || null,
            curator_proposals: proposals.filter(p => p.request_id === request.id),
            accepted_proposal: proposals.filter(p => p.request_id === request.id && p.status === 'accepted')
          })));
        } else {
          setCuratorAssignedRequests([]);
        }
      } else {
        setCuratorAssignedRequests([]);
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    }

    setLoading(false)
  }, [user])

  useEffect(() => {
    if (!user) {
      navigate('/')
      return
    }
    
    fetchDashboardData()
    
    // Check for Stripe onboarding completion
    const urlParams = new URLSearchParams(window.location.search)
    const onboardingStatus = urlParams.get('onboarding')
    const tabParam = urlParams.get('tab')
    
    if (onboardingStatus === 'complete') {
      // Verify Stripe account status with Stripe API
      ;(async () => {
        try {
          console.log('Starting Stripe account verification for user:', user.id)
          
          const response = await fetch('/.netlify/functions/verify-stripe-account', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ creatorId: user.id })
          })
          
          console.log('Response status:', response.status)
          const data = await response.json()
          console.log('Response data:', data)
          
          if (data.success) {
            alert(`✅ ${data.message || 'Stripe account connected successfully! Your payout account is now set up.'}`)
          } else {
            console.error('Verification failed:', data)
            alert(`⚠️ ${data.message || 'Account verification incomplete. Please complete all required information.'}`)
          }
        } catch (error) {
          console.error('Error verifying Stripe account:', error)
          alert('⚠️ Error verifying account status. Please refresh and try again.')
        }
        
        // Switch to earnings tab if not already there
        if (tabParam === 'earnings') {
          setActiveTab('earnings')
        }
        // Clean up URL
        window.history.replaceState({}, '', '/dashboard')
        // Refresh data to show updated payout account
        setTimeout(() => fetchDashboardData(), 1000)
      })()
    } else if (onboardingStatus === 'refresh') {
      alert('⚠️ Stripe onboarding was interrupted. Please try again.')
      if (tabParam === 'earnings') {
        setActiveTab('earnings')
      }
      window.history.replaceState({}, '', '/dashboard')
    }
  }, [user, navigate, fetchDashboardData])

  const handleDownload = async (datasetId) => {
    try {
      const response = await fetch('/.netlify/functions/generate-download', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          datasetId: datasetId,
          userId: user.id,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate download link')
      }

      // Handle demo datasets with data URLs
      if (data.isDemo && data.downloadUrl.startsWith('data:')) {
        // Create a download link for the data URL
        const link = document.createElement('a')
        link.href = data.downloadUrl
        link.download = data.fileName || 'DEMO_README.txt'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        
        alert('📝 Demo dataset info downloaded! This is a sample to showcase how Setique works. Real datasets include actual data files.')
      } else {
        // For real datasets, open in new tab
        window.open(data.downloadUrl, '_blank')
        alert('Download started! Link expires in 24 hours.')
      }
      
      // Refresh download logs
      fetchDashboardData()
    } catch (error) {
      console.error('Download error:', error)
      alert('Error: ' + error.message)
    }
  }

  // Dataset management handlers
  const handleToggleActive = async (datasetId, currentStatus) => {
    setActionLoading(true)
    try {
      const { error } = await supabase
        .from('datasets')
        .update({ is_active: !currentStatus })
        .eq('id', datasetId)
        .eq('creator_id', user.id)
      
      if (error) throw error
      
      // Update local state
      setMyDatasets(prev => 
        prev.map(d => d.id === datasetId ? { ...d, is_active: !currentStatus } : d)
      )
      
      alert(`Dataset ${!currentStatus ? 'activated' : 'deactivated'} successfully!`)
    } catch (error) {
      console.error('Error toggling dataset:', error)
      alert('Failed to update dataset status')
    } finally {
      setActionLoading(false)
    }
  }

  const handleEditDataset = (dataset) => {
    setEditingDataset({
      id: dataset.id,
      title: dataset.title,
      description: dataset.description,
      price: dataset.price,
      modality: dataset.modality,
      tags: dataset.tags || []
    })
  }

  const handleSaveEdit = async () => {
    if (!editingDataset) return
    
    setActionLoading(true)
    try {
      const { error } = await supabase
        .from('datasets')
        .update({
          title: editingDataset.title,
          description: editingDataset.description,
          price: parseFloat(editingDataset.price),
          modality: editingDataset.modality,
          tags: editingDataset.tags,
        })
        .eq('id', editingDataset.id)
        .eq('creator_id', user.id)
      
      if (error) throw error
      
      // Update local state
      setMyDatasets(prev => 
        prev.map(d => d.id === editingDataset.id ? { ...d, ...editingDataset, price: parseFloat(editingDataset.price) } : d)
      )
      
      setEditingDataset(null)
      alert('Dataset updated successfully!')
    } catch (error) {
      console.error('Error updating dataset:', error)
      alert('Failed to update dataset')
    } finally {
      setActionLoading(false)
    }
  }

  const handleDeleteDataset = async (datasetId) => {
    try {
      // Check if dataset has purchases
      const { data: purchases, error: purchaseError } = await supabase
        .from('purchases')
        .select('id')
        .eq('dataset_id', datasetId)
        .eq('status', 'completed')
        .limit(1)
      
      if (purchaseError) throw purchaseError
      
      const hasPurchases = purchases && purchases.length > 0
      
      // Show confirmation dialog
      setConfirmDialog({
        isOpen: true,
        title: hasPurchases ? 'Delete Dataset with Purchases?' : 'Delete Dataset?',
        message: hasPurchases 
          ? '⚠️ This dataset has purchases! Deleting it will break download access for buyers. This action cannot be undone. Are you absolutely sure?'
          : 'Are you sure you want to delete this dataset? This action cannot be undone.',
        confirmText: 'Delete',
        variant: 'danger',
        onConfirm: async () => {
          setActionLoading(true)
          try {
            // Call Netlify function to delete (bypasses RLS)
            const response = await fetch('/.netlify/functions/delete-dataset', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                datasetId: datasetId,
                userId: user.id
              })
            })

            const data = await response.json()

            if (!response.ok) {
              throw new Error(data.error || 'Failed to delete dataset')
            }

            alert('✅ Dataset deleted successfully')
            await fetchDashboardData()
            setDeleteConfirm(null)
          } catch (error) {
            console.error('Error deleting dataset:', error)
            alert('Failed to delete dataset: ' + error.message)
          } finally {
            setActionLoading(false)
          }
        }
      })
    } catch (error) {
      console.error('Error checking dataset purchases:', error)
      alert('Failed to check dataset status: ' + error.message)
    }
  }

  const handleRequestDeletion = async (datasetId, reason) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      const response = await fetch('/.netlify/functions/request-deletion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          datasetId,
          reason
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit deletion request')
      }

      alert('Deletion request submitted! An admin will review your request.')
      
      // Refresh deletion requests
      await fetchDashboardData()
    } catch (error) {
      console.error('Error requesting deletion:', error)
      throw error
    }
  }

  const handleCreateBounty = async () => {
    if (!newBounty.title || !newBounty.description || !newBounty.budget_max) {
      alert('Please fill in all required fields')
      return
    }

    try {
      const { error } = await supabase.from('curation_requests').insert([
        {
          creator_id: user.id,
          title: newBounty.title,
          description: newBounty.description,
          modality: newBounty.modality,
          budget_min: parseFloat(newBounty.budget_min) || parseFloat(newBounty.budget_max) * 0.8,
          budget_max: parseFloat(newBounty.budget_max),
          status: 'open',
          target_quality: 'standard',
          specialties_needed: []
        }
      ])

      if (error) throw error

      alert(`Bounty "${newBounty.title}" posted successfully!`)
      setShowBountyModal(false)
      setNewBounty({
        title: '',
        description: '',
        modality: 'text',
        budget_min: '',
        budget_max: ''
      })
      await fetchDashboardData()
    } catch (error) {
      console.error('Error creating bounty:', error)
      alert('Failed to create bounty: ' + error.message)
    }
  }

  const handleCloseMyBounty = async (bountyId) => {
    if (!window.confirm('Close this bounty? No more proposals will be accepted.')) {
      return
    }

    try {
      const { error } = await supabase
        .from('curation_requests')
        .update({ status: 'closed' })
        .eq('id', bountyId)
        .eq('creator_id', user.id) // Only allow closing own bounties

      if (error) throw error

      alert('✅ Bounty closed successfully!')
      
      // Refresh bounties
      await fetchDashboardData()
    } catch (error) {
      console.error('Error closing bounty:', error)
      alert('Failed to close bounty: ' + error.message)
    }
  }

  const handleConnectStripe = async () => {
    setConnectingStripe(true)
    setConnectError(null)
    
    try {
      const returnUrl = `${window.location.origin}/dashboard?tab=earnings&onboarding=complete`
      const refreshUrl = `${window.location.origin}/dashboard?tab=earnings&onboarding=refresh`
      
      console.log('Creating Stripe onboarding with URLs:', { returnUrl, refreshUrl })
      
      const response = await fetch('/.netlify/functions/connect-onboarding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          creatorId: user.id,
          email: profile?.email || user.email,
          returnUrl,
          refreshUrl,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create Stripe Connect link')
      }

      // Redirect to Stripe onboarding
      window.location.href = data.url
    } catch (error) {
      console.error('Stripe Connect error:', error)
      setConnectError(error.message)
      setConnectingStripe(false)
    }
  }

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-300 via-pink-400 to-cyan-300 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-black mx-auto mb-4"></div>
          <p className="text-2xl font-extrabold text-black">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  const totalSpent = myPurchases.reduce((sum, p) => sum + parseFloat(p.amount), 0)

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-300 via-pink-400 to-cyan-300 text-black font-sans">
      {/* Header */}
      <header className="border-b-4 border-black bg-white/90 backdrop-blur sticky top-0 z-40">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-extrabold">
            <span className="bg-[linear-gradient(90deg,#ff00c3,#00ffff)] bg-clip-text text-transparent">
              Setique
            </span>
          </h1>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 font-bold text-black">
              {profile?.username || user.email}
            </div>
            <button
              onClick={() => navigate('/')}
              className="font-bold text-black hover:text-cyan-600 transition flex items-center gap-1"
            >
              <Home className="h-4 w-4" />
              Home
            </button>
            <button
              onClick={handleSignOut}
              className="font-bold text-black hover:text-pink-600 transition flex items-center gap-1"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </div>
        </nav>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-4xl font-extrabold mb-2">
                Welcome back, {profile?.username || 'there'}! 👋
              </h2>
              <p className="text-lg font-semibold text-black/70">
                Here&apos;s what&apos;s happening with your data economy
              </p>
            </div>
            <div className="flex gap-3">
              {profile?.username && (
                <a
                  href={`/profile/${profile.username}`}
                  className="bg-purple-400 text-black font-bold px-6 py-3 rounded-full border-2 border-black shadow-[4px_4px_0_#000] hover:scale-105 transition flex items-center gap-2"
                >
                  👤 View Profile
                </a>
              )}
              {isAdmin && (
                <a
                  href="/admin"
                  className="bg-red-500 text-white font-bold px-6 py-3 rounded-full border-2 border-black shadow-[4px_4px_0_#000] hover:scale-105 transition flex items-center gap-2"
                >
                  🔐 Admin Dashboard
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <div className="bg-yellow-200 border-4 border-black rounded-2xl shadow-[6px_6px_0_#000] p-6">
            <Database className="h-8 w-8 mb-2 text-pink-600" />
            <div className="text-3xl font-extrabold">{myDatasets.length}</div>
            <div className="text-sm font-bold">Datasets Created</div>
          </div>
          <div className="bg-cyan-200 border-4 border-black rounded-2xl shadow-[6px_6px_0_#000] p-6">
            <ShoppingBag className="h-8 w-8 mb-2 text-pink-600" />
            <div className="text-3xl font-extrabold">{myPurchases.length}</div>
            <div className="text-sm font-bold">Datasets Purchased</div>
          </div>
          <div className="bg-pink-200 border-4 border-black rounded-2xl shadow-[6px_6px_0_#000] p-6">
            <DollarSign className="h-8 w-8 mb-2 text-cyan-600" />
            <div className="text-3xl font-extrabold">${earnings?.total.toFixed(2) || '0.00'}</div>
            <div className="text-sm font-bold">Total Earned</div>
          </div>
          <div className="bg-white border-4 border-black rounded-2xl shadow-[6px_6px_0_#000] p-6">
            <TrendingUp className="h-8 w-8 mb-2 text-yellow-600" />
            <div className="text-3xl font-extrabold">${totalSpent.toFixed(2)}</div>
            <div className="text-sm font-bold">Total Spent</div>
          </div>
        </div>

        {/* Tabs - Accessible tab navigation with ARIA attributes */}
        <div className="flex gap-2 mb-6 overflow-x-auto" role="tablist" aria-label="Dashboard sections">
          <button
            onClick={() => setActiveTab('overview')}
            role="tab"
            aria-selected={activeTab === 'overview'}
            className={`px-6 py-3 rounded-full font-extrabold border-2 border-black transition ${
              activeTab === 'overview'
                ? 'bg-[linear-gradient(90deg,#ff00c3,#00ffff)] text-white'
                : 'bg-white text-black hover:bg-gray-100'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('datasets')}
            role="tab"
            aria-selected={activeTab === 'datasets'}
            className={`px-6 py-3 rounded-full font-extrabold border-2 border-black transition ${
              activeTab === 'datasets'
                ? 'bg-[linear-gradient(90deg,#ff00c3,#00ffff)] text-white'
                : 'bg-white text-black hover:bg-gray-100'
            }`}
          >
            My Datasets ({myDatasets.length})
          </button>
          <button
            onClick={() => setActiveTab('purchases')}
            role="tab"
            aria-selected={activeTab === 'purchases'}
            className={`px-6 py-3 rounded-full font-extrabold border-2 border-black transition ${
              activeTab === 'purchases'
                ? 'bg-[linear-gradient(90deg,#ff00c3,#00ffff)] text-white'
                : 'bg-white text-black hover:bg-gray-100'
            }`}
          >
            My Purchases ({myPurchases.length})
          </button>
          <button
            onClick={() => setActiveTab('earnings')}
            role="tab"
            aria-selected={activeTab === 'earnings'}
            className={`px-6 py-3 rounded-full font-extrabold border-2 border-black transition ${
              activeTab === 'earnings'
                ? 'bg-[linear-gradient(90deg,#ff00c3,#00ffff)] text-white'
                : 'bg-white text-black hover:bg-gray-100'
            }`}
          >
            Earnings
          </button>
          <button
            onClick={() => setActiveTab('bounties')}
            role="tab"
            aria-selected={activeTab === 'bounties'}
            className={`px-6 py-3 rounded-full font-extrabold border-2 border-black transition ${
              activeTab === 'bounties'
                ? 'bg-[linear-gradient(90deg,#ff00c3,#00ffff)] text-white'
                : 'bg-white text-black hover:bg-gray-100'
            }`}
          >
            My Bounties ({myBounties.length})
          </button>
          <button
            onClick={() => setActiveTab('submissions')}
            role="tab"
            aria-selected={activeTab === 'submissions'}
            className={`px-6 py-3 rounded-full font-extrabold border-2 border-black transition ${
              activeTab === 'submissions'
                ? 'bg-[linear-gradient(90deg,#ff00c3,#00ffff)] text-white'
                : 'bg-white text-black hover:bg-gray-100'
            }`}
          >
            My Submissions ({mySubmissions.length})
          </button>
          <button
            onClick={() => setActiveTab('curation-requests')}
            role="tab"
            aria-selected={activeTab === 'curation-requests'}
            className={`px-6 py-3 rounded-full font-extrabold border-2 border-black transition ${
              activeTab === 'curation-requests'
                ? 'bg-[linear-gradient(90deg,#ff00c3,#00ffff)] text-white'
                : 'bg-white text-black hover:bg-gray-100'
            }`}
          >
            My Requests ({myCurationRequests.length})
          </button>
          <button
            onClick={() => setActiveTab('pro-curator')}
            role="tab"
            aria-selected={activeTab === 'pro-curator'}
            className={`px-6 py-3 rounded-full font-extrabold border-2 border-black transition flex items-center gap-2 ${
              activeTab === 'pro-curator'
                ? 'bg-[linear-gradient(90deg,#ff00c3,#00ffff)] text-white'
                : 'bg-white text-black hover:bg-gray-100'
            }`}
          >
            <Star className="h-4 w-4 fill-current" />
            Pro Curator
          </button>
        </div>

        {/* Tab Content */}
        <div className="bg-white border-4 border-black rounded-3xl shadow-[8px_8px_0_#000] p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <h3 className="text-2xl font-extrabold">Recent Activity</h3>
              
              {/* Recent Purchases */}
              {myPurchases.length > 0 && (
                <div>
                  <h4 className="text-lg font-extrabold mb-3">Recent Purchases</h4>
                  <div className="space-y-2">
                    {myPurchases.slice(0, 3).map((purchase) => (
                      <div
                        key={purchase.id}
                        className="flex justify-between items-center p-3 bg-cyan-100 border-2 border-black rounded-lg"
                      >
                        <div>
                          <div className="font-bold">{purchase.datasets.title}</div>
                          <div className="text-sm text-black/60">
                            {new Date(purchase.purchased_at).toLocaleDateString()}
                          </div>
                        </div>
                        <button
                          onClick={() => handleDownload(purchase.dataset_id)}
                          className="bg-[linear-gradient(90deg,#ffea00,#00ffff)] text-black font-bold px-4 py-2 rounded-full border-2 border-black hover:scale-105 transition text-sm"
                        >
                          Download
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent Dataset Purchases */}
              {earnings && earnings.transactions.length > 0 && (
                <div>
                  <h4 className="text-lg font-extrabold mb-3">Recent Purchases from Your Datasets</h4>
                  <div className="space-y-2">
                    {earnings.transactions.slice(0, 3).map((transaction) => (
                      <div
                        key={transaction.id}
                        className="flex justify-between items-center p-3 bg-pink-100 border-2 border-black rounded-lg"
                      >
                        <div>
                          <div className="font-bold">Purchase #{transaction.id.substring(0, 8)}</div>
                          <div className="text-sm text-black/60">
                            {new Date(transaction.earned_at).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-extrabold text-lg">
                            +${parseFloat(transaction.creator_net).toFixed(2)}
                          </div>
                          <div className="text-xs font-bold text-black/60">
                            {transaction.status}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {myPurchases.length === 0 && myDatasets.length === 0 && (
                <div className="text-center py-12">
                  <Package className="h-16 w-16 mx-auto mb-4 text-black/30" />
                  <p className="font-bold text-black/60">
                    No activity yet. Start by creating a dataset or purchasing one!
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'datasets' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-2xl font-extrabold">My Datasets</h3>
                <button
                  onClick={() => setUploadModalOpen(true)}
                  className="bg-[linear-gradient(90deg,#ffea00,#00ffff)] text-black font-extrabold px-6 py-3 rounded-full border-2 border-black hover:scale-105 transition flex items-center gap-2"
                >
                  <Upload className="h-4 w-4" />
                  Upload New Dataset
                </button>
              </div>
              
              {myDatasets.length > 0 ? (
                <div className="space-y-4">
                  {myDatasets.map((dataset) => (
                    <div
                      key={dataset.id}
                      className="border-2 border-black rounded-xl p-6 bg-yellow-100 relative"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="text-xl font-extrabold">{dataset.title}</h4>
                            {dataset.dataset_partnerships?.[0]?.pro_curators && (
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold border-2 ${badgeColors[dataset.dataset_partnerships[0].pro_curators.badge_level] || badgeColors.verified}`}>
                                <Star className="w-3 h-3 mr-1 fill-current" />
                                PRO
                              </span>
                            )}
                            <button
                              onClick={() => handleToggleActive(dataset.id, dataset.is_active)}
                              disabled={actionLoading}
                              className={`px-3 py-1 rounded-full border-2 border-black font-bold text-xs flex items-center gap-1 transition hover:scale-105 ${
                                dataset.is_active 
                                  ? 'bg-green-300 hover:bg-green-400' 
                                  : 'bg-gray-300 hover:bg-gray-400'
                              }`}
                              title={dataset.is_active ? 'Click to deactivate' : 'Click to activate'}
                            >
                              {dataset.is_active ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                              {dataset.is_active ? 'Active' : 'Inactive'}
                            </button>
                          </div>
                          <p className="text-sm font-semibold text-black/70 mb-3">
                            {dataset.description}
                          </p>
                          <div className="flex flex-wrap gap-4 text-sm font-bold">
                            <span className="flex items-center gap-1">
                              💰 ${dataset.price}
                            </span>
                            <span className="flex items-center gap-1">
                              📦 {dataset.modality}
                            </span>
                            <span className="flex items-center gap-1">
                              🛒 {dataset.purchase_count || 0} purchases
                            </span>
                            <span className="flex items-center gap-1">
                              📅 {new Date(dataset.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          {dataset.tags && dataset.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2">
                              {dataset.tags.map((tag, idx) => (
                                <span
                                  key={idx}
                                  className="px-2 py-1 bg-white border border-black rounded-full text-xs font-bold"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2 ml-4">
                          <button
                            onClick={() => handleEditDataset(dataset)}
                            className="p-2 bg-blue-300 rounded-lg border-2 border-black hover:scale-110 transition"
                            title="Edit dataset"
                          >
                            <Edit className="h-5 w-5" />
                          </button>
                          
                          {/* Show delete button for admins, request deletion for regular users */}
                          {isAdmin ? (
                            <button
                              onClick={() => handleDeleteDataset(dataset.id)}
                              className={`p-2 rounded-lg border-2 border-black hover:scale-110 transition ${
                                deleteConfirm === dataset.id 
                                  ? 'bg-red-500 text-white' 
                                  : 'bg-red-300'
                              }`}
                              title={deleteConfirm === dataset.id ? 'Click again to confirm' : 'Delete dataset'}
                            >
                              <Trash className="h-5 w-5" />
                            </button>
                          ) : (
                            (() => {
                              const pendingRequest = deletionRequests.find(
                                req => req.dataset_id === dataset.id && req.status === 'pending'
                              )
                              const rejectedRequest = deletionRequests.find(
                                req => req.dataset_id === dataset.id && req.status === 'rejected'
                              )
                              
                              return (
                                <button
                                  onClick={() => {
                                    if (pendingRequest) {
                                      alert('Deletion request is pending admin review')
                                    } else {
                                      setDeletionModalDataset(dataset)
                                    }
                                  }}
                                  className={`p-2 rounded-lg border-2 border-black hover:scale-110 transition ${
                                    pendingRequest 
                                      ? 'bg-yellow-300 cursor-not-allowed' 
                                      : 'bg-red-300'
                                  }`}
                                  title={
                                    pendingRequest 
                                      ? 'Deletion request pending' 
                                      : rejectedRequest
                                        ? 'Previous request rejected - Request again'
                                        : 'Request deletion'
                                  }
                                >
                                  <Trash className="h-5 w-5" />
                                </button>
                              )
                            })()
                          )}
                        </div>
                      </div>
                      
                      {/* Show deletion request status */}
                      {(() => {
                        const pendingRequest = deletionRequests.find(
                          req => req.dataset_id === dataset.id && req.status === 'pending'
                        )
                        const rejectedRequest = deletionRequests.find(
                          req => req.dataset_id === dataset.id && req.status === 'rejected'
                        )
                        
                        if (pendingRequest) {
                          return (
                            <div className="mt-3 p-3 bg-yellow-100 border-2 border-yellow-500 rounded-lg">
                              <p className="font-bold text-sm text-yellow-700">
                                ⏳ Deletion request pending admin review
                              </p>
                              <p className="text-xs text-yellow-600 mt-1">
                                Requested: {new Date(pendingRequest.requested_at).toLocaleString()}
                              </p>
                            </div>
                          )
                        }
                        
                        if (rejectedRequest) {
                          return (
                            <div className="mt-3 p-3 bg-red-100 border-2 border-red-500 rounded-lg">
                              <p className="font-bold text-sm text-red-700">
                                ❌ Deletion request rejected
                              </p>
                              {rejectedRequest.admin_response && (
                                <p className="text-xs text-red-600 mt-1">
                                  Admin response: {rejectedRequest.admin_response}
                                </p>
                              )}
                            </div>
                          )
                        }
                        
                        return null
                      })()}
                      
                      {deleteConfirm === dataset.id && isAdmin && (
                        <div className="mt-3 p-3 bg-red-100 border-2 border-red-500 rounded-lg">
                          <p className="font-bold text-sm text-red-700">
                            ⚠️ Are you sure? Click delete again to confirm. This cannot be undone!
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Package className="h-16 w-16 mx-auto mb-4 text-black/30" />
                  <p className="font-bold text-black/60 mb-4">
                    You haven&apos;t created any datasets yet
                  </p>
                  <button
                    onClick={() => setUploadModalOpen(true)}
                    className="bg-[linear-gradient(90deg,#ffea00,#00ffff)] text-black font-extrabold px-6 py-3 rounded-full border-2 border-black hover:scale-105 transition"
                  >
                    Create Your First Dataset
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'purchases' && (
            <div>
              <h3 className="text-2xl font-extrabold mb-4">My Purchases</h3>
              {myPurchases.length > 0 ? (
                <div className="space-y-4">
                  {myPurchases.map((purchase) => (
                    <div
                      key={purchase.id}
                      className="border-2 border-black rounded-xl p-4 bg-cyan-100"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="text-xl font-extrabold">
                            {purchase.datasets.title}
                          </h4>
                          <p className="text-sm font-semibold text-black/70 mt-1">
                            {purchase.datasets.description}
                          </p>
                          <div className="flex gap-4 mt-2 text-sm font-bold">
                            <span>💰 ${purchase.amount}</span>
                            <span>
                              📅 {new Date(purchase.purchased_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDownload(purchase.dataset_id)}
                          className="ml-4 bg-[linear-gradient(90deg,#ffea00,#00ffff)] text-black font-extrabold px-6 py-3 rounded-full border-2 border-black hover:scale-105 transition flex items-center gap-2"
                        >
                          <Download className="h-4 w-4" />
                          Download
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <ShoppingBag className="h-16 w-16 mx-auto mb-4 text-black/30" />
                  <p className="font-bold text-black/60 mb-4">
                    You haven&apos;t purchased any datasets yet
                  </p>
                  <button
                    onClick={() => navigate('/#marketplace')}
                    className="bg-[linear-gradient(90deg,#ffea00,#00ffff)] text-black font-extrabold px-6 py-3 rounded-full border-2 border-black hover:scale-105 transition"
                  >
                    Browse Marketplace
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'earnings' && (
            <div>
              <h3 className="text-2xl font-extrabold mb-4">Earnings & Payouts</h3>
              
              {/* Earnings Summary */}
              <div className="grid md:grid-cols-3 gap-4 mb-6">
                <div className="bg-green-200 border-2 border-black rounded-xl p-4">
                  <div className="text-sm font-bold text-black/60 uppercase mb-1">
                    Total Earned
                  </div>
                  <div className="text-3xl font-extrabold">
                    ${earnings?.total.toFixed(2) || '0.00'}
                  </div>
                </div>
                <div className="bg-yellow-200 border-2 border-black rounded-xl p-4">
                  <div className="text-sm font-bold text-black/60 uppercase mb-1">
                    Pending
                  </div>
                  <div className="text-3xl font-extrabold">
                    ${earnings?.pending.toFixed(2) || '0.00'}
                  </div>
                </div>
                <div className="bg-blue-200 border-2 border-black rounded-xl p-4">
                  <div className="text-sm font-bold text-black/60 uppercase mb-1">
                    Paid Out
                  </div>
                  <div className="text-3xl font-extrabold">
                    ${earnings?.paid.toFixed(2) || '0.00'}
                  </div>
                </div>
              </div>

              {/* Payout Account Status */}
              {payoutAccount && payoutAccount.payouts_enabled ? (
                <div className="bg-white border-2 border-black rounded-xl p-4 mb-6">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-extrabold mb-2">Payout Account</h4>
                      <p className="text-sm font-semibold">
                        Status: <span className="font-extrabold">{payoutAccount.account_status}</span>
                      </p>
                      <p className="text-sm font-semibold">
                        Payouts {payoutAccount.payouts_enabled ? 'Enabled ✅' : 'Disabled ❌'}
                      </p>
                    </div>
                    <a
                      href="https://dashboard.stripe.com/dashboard"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-purple-200 text-black font-bold px-4 py-2 rounded-full border-2 border-black hover:scale-105 transition text-sm"
                    >
                      Manage on Stripe →
                    </a>
                  </div>
                  {payoutAccount.current_balance >= payoutAccount.minimum_payout_threshold && (
                    <button className="bg-green-300 text-black font-bold px-4 py-2 rounded-full border-2 border-black hover:scale-105 transition w-full">
                      Request Payout (${payoutAccount.current_balance.toFixed(2)} available)
                    </button>
                  )}
                </div>
              ) : (
                <div className="bg-yellow-100 border-2 border-black rounded-xl p-4 mb-6">
                  <h4 className="font-extrabold mb-2">⚠️ Setup Payout Account</h4>
                  <p className="text-sm font-semibold mb-3">
                    {payoutAccount ? 
                      'Complete your Stripe onboarding to enable payouts' : 
                      'Connect your Stripe account to receive payouts'
                    }
                  </p>
                  {connectError && (
                    <div className="bg-red-100 border-2 border-red-500 rounded-lg p-3 mb-3">
                      <p className="text-sm font-bold text-red-800">❌ {connectError}</p>
                    </div>
                  )}
                  <button 
                    onClick={handleConnectStripe}
                    disabled={connectingStripe}
                    className="bg-[linear-gradient(90deg,#ffea00,#00ffff)] text-black font-bold px-4 py-2 rounded-full border-2 border-black hover:scale-105 transition disabled:opacity-50 disabled:cursor-not-allowed w-full"
                  >
                    {connectingStripe ? 'Connecting...' : (payoutAccount ? 'Complete Stripe Onboarding' : 'Connect Stripe Account')}
                  </button>
                </div>
              )}

              {/* Transaction History */}
              {earnings && earnings.transactions.length > 0 ? (
                <div>
                  <h4 className="font-extrabold mb-3">Transaction History</h4>
                  <div className="space-y-2">
                    {earnings.transactions.map((transaction) => (
                      <div
                        key={transaction.id}
                        className="flex justify-between items-center p-3 border-2 border-black rounded-lg bg-gray-50"
                      >
                        <div>
                          <div className="font-bold">
                            Sale #{transaction.id.substring(0, 8)}
                          </div>
                          <div className="text-xs text-black/60">
                            {new Date(transaction.earned_at).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-extrabold">
                            ${parseFloat(transaction.creator_net).toFixed(2)}
                          </div>
                          <div className="text-xs font-bold text-black/60">
                            {transaction.status}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <DollarSign className="h-16 w-16 mx-auto mb-4 text-black/30" />
                  <p className="font-bold text-black/60">
                    No earnings yet. Create and sell datasets to start earning!
                  </p>
                </div>
              )}
            </div>
          )}

          {/* My Bounties Tab */}
          {activeTab === 'bounties' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-2xl font-extrabold mb-1">Bounties I Posted</h3>
                  <p className="text-sm text-black/70">
                    View submissions from creators responding to your bounties
                  </p>
                </div>
                {myBounties.length > 0 && (
                  <button
                    onClick={() => setShowBountyModal(true)}
                    className="bg-[linear-gradient(90deg,#00ffff,#ff00c3)] text-white font-bold px-6 py-3 rounded-full border-2 border-black hover:opacity-90"
                  >
                    + Post Bounty
                  </button>
                )}
              </div>

              {myBounties.length > 0 ? (
                <div className="space-y-4">
                  {myBounties.map((bounty) => (
                    <div
                      key={bounty.id}
                      className="bg-gradient-to-br from-yellow-100 via-pink-100 to-cyan-100 border-2 border-black rounded-xl p-4"
                    >
                      {/* Bounty Header */}
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <h4 className="font-extrabold text-lg mb-1">{bounty.title}</h4>
                          <div className="flex gap-3 text-sm font-semibold text-black/70">
                            <span className="bg-white border-2 border-black rounded-full px-3 py-1">
                              {bounty.modality}
                            </span>
                            <span className="bg-white border-2 border-black rounded-full px-3 py-1">
                              ${bounty.budget_min} - ${bounty.budget_max}
                            </span>
                            <span className="bg-white border-2 border-black rounded-full px-3 py-1">
                              {bounty.curator_proposals?.length || 0} proposals
                            </span>
                            <span className={`bg-white border-2 border-black rounded-full px-3 py-1 ${
                              bounty.status === 'open' ? 'text-green-700' :
                              bounty.status === 'assigned' ? 'text-yellow-700' :
                              'text-gray-700'
                            }`}>
                              {bounty.status}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {bounty.status === 'open' && (
                            <button
                              onClick={() => handleCloseMyBounty(bounty.id)}
                              className="bg-yellow-400 border-2 border-black rounded-lg px-4 py-2 font-bold hover:bg-yellow-300 transition text-sm"
                            >
                              🔒 Close Bounty
                            </button>
                          )}
                          <button
                            onClick={() => setExpandedBounty(expandedBounty === bounty.id ? null : bounty.id)}
                            className="bg-white border-2 border-black rounded-full px-4 py-2 font-bold hover:bg-gray-100 transition"
                          >
                            {expandedBounty === bounty.id ? 'Hide' : 'View'} Submissions
                          </button>
                        </div>
                      </div>

                      {/* Proposals (Expanded) */}
                      {expandedBounty === bounty.id && (
                        <div className="mt-4 space-y-3">
                          {bounty.curator_proposals && bounty.curator_proposals.length > 0 ? (
                            bounty.curator_proposals.map((proposal) => (
                              <div
                                key={proposal.id}
                                className="bg-white border-2 border-black rounded-xl p-4"
                              >
                                <div className="flex justify-between items-start mb-3">
                                  <div className="flex-1">
                                    <h5 className="font-extrabold text-base mb-1">
                                      Proposal from {proposal.pro_curators?.display_name || 'Curator'}
                                    </h5>
                                    <div className="flex gap-2 mb-2">
                                      <span className={`px-2 py-1 rounded text-xs font-bold ${
                                        proposal.status === 'pending' ? 'bg-yellow-200 text-yellow-800' :
                                        proposal.status === 'accepted' ? 'bg-green-200 text-green-800' :
                                        'bg-gray-200 text-gray-800'
                                      }`}>
                                        {proposal.status}
                                      </span>
                                      {proposal.pro_curators?.badge_level && (
                                        <span className="bg-purple-200 text-purple-800 px-2 py-1 rounded text-xs font-bold">
                                          {proposal.pro_curators.badge_level}
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-sm text-black/70 mb-2">
                                      💰 Suggested Price: ${proposal.suggested_price} | ⏱️ Est. {proposal.estimated_completion_days} days
                                    </p>
                                    {proposal.proposal_text && (
                                      <div className="bg-gray-50 border border-black/20 rounded-lg p-3 mb-3">
                                        <p className="text-sm">
                                          {proposal.proposal_text}
                                        </p>
                                      </div>
                                    )}
                                    <p className="text-xs text-black/50 font-semibold">
                                      Submitted {new Date(proposal.created_at).toLocaleDateString()}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="bg-white border-2 border-black rounded-xl p-6 text-center">
                              <p className="text-sm font-bold text-black/60">
                                No proposals yet. Share your bounty to get responses from Pro Curators!
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 max-w-xl mx-auto">
                  <Package className="h-16 w-16 mx-auto mb-4 text-black/30" />
                  <h4 className="text-xl font-extrabold text-black mb-2">
                    No bounties posted yet
                  </h4>
                  <p className="text-sm text-black/70 mb-3 leading-relaxed">
                    <strong>Bounties</strong> let you request custom datasets from professional curators. 
                    Set your budget and requirements, then review proposals from experts.
                  </p>
                  <div className="bg-cyan-50 border-2 border-cyan-200 rounded-lg p-4 mb-6 text-left">
                    <p className="text-sm font-bold text-cyan-900 mb-2">💡 How it works:</p>
                    <ol className="text-sm text-cyan-800 space-y-1 list-decimal list-inside">
                      <li>Post your dataset requirements and budget</li>
                      <li>Pro curators submit proposals with timelines</li>
                      <li>Choose the best curator and get your custom dataset</li>
                    </ol>
                  </div>
                  <button
                    onClick={() => setShowBountyModal(true)}
                    className="bg-[linear-gradient(90deg,#00ffff,#ff00c3)] text-white font-bold px-8 py-3 rounded-full border-2 border-black hover:opacity-90 hover:scale-105 transition"
                  >
                    🎯 Post Your First Bounty
                  </button>
                </div>
              )}
            </div>
          )}

          {/* My Submissions Tab */}
          {activeTab === 'submissions' && (
            <div>
              <h3 className="text-2xl font-extrabold mb-4">My Bounty Submissions</h3>
              <p className="text-sm text-black/70 mb-6">
                Track the status of datasets you&apos;ve submitted to bounties
              </p>

              {mySubmissions.length > 0 ? (
                <div className="space-y-4">
                  {mySubmissions.map((submission) => (
                    <div
                      key={submission.id}
                      className="bg-white border-2 border-black rounded-xl p-4"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-extrabold text-lg mb-1">
                            {submission.datasets?.title || 'Untitled Dataset'}
                          </h4>
                          <p className="text-sm font-semibold text-black/70 mb-2">
                            → Submitted to: <strong>{submission.curation_requests?.title}</strong>
                          </p>
                          <p className="text-sm text-black/60 mb-2">
                            Bounty Budget: ${submission.curation_requests?.budget_max} • Your Price: ${submission.datasets?.price}
                          </p>
                          {submission.notes && (
                            <div className="bg-gray-50 border border-black/20 rounded-lg p-3 mb-2">
                              <p className="text-sm italic">
                                &quot;{submission.notes}&quot;
                              </p>
                            </div>
                          )}
                          <p className="text-xs text-black/50 font-semibold">
                            Submitted {new Date(submission.submitted_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="ml-4">
                          {submission.status === 'pending' && (
                            <span className="bg-yellow-100 border-2 border-yellow-600 text-yellow-800 font-bold px-4 py-2 rounded-full text-sm whitespace-nowrap">
                              ⏳ Pending Review
                            </span>
                          )}
                          {submission.status === 'approved' && (
                            <span className="bg-green-100 border-2 border-green-600 text-green-800 font-bold px-4 py-2 rounded-full text-sm whitespace-nowrap">
                              ✓ Approved
                            </span>
                          )}
                          {submission.status === 'rejected' && (
                            <span className="bg-red-100 border-2 border-red-600 text-red-800 font-bold px-4 py-2 rounded-full text-sm whitespace-nowrap">
                              ✗ Rejected
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 max-w-xl mx-auto">
                  <Database className="h-16 w-16 mx-auto mb-4 text-black/30" />
                  <h4 className="text-xl font-extrabold text-black mb-2">
                    No submissions yet
                  </h4>
                  <p className="text-sm text-black/70 mb-4 leading-relaxed">
                    Submit your existing datasets to open bounties and earn rewards!
                    Each bounty lists specific requirements and budgets.
                  </p>
                  <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4 mb-6 text-left">
                    <p className="text-sm font-bold text-yellow-900 mb-2">💰 Earn money by:</p>
                    <ul className="text-sm text-yellow-800 space-y-1 list-disc list-inside">
                      <li>Finding bounties that match your datasets</li>
                      <li>Submitting high-quality data that meets requirements</li>
                      <li>Getting selected and receiving payment</li>
                    </ul>
                  </div>
                  <button
                    onClick={() => navigate('/')}
                    className="bg-[linear-gradient(90deg,#00ffff,#ff00c3)] text-white font-bold px-8 py-3 rounded-full border-2 border-black hover:opacity-90 hover:scale-105 transition"
                  >
                    🎯 Browse Open Bounties
                  </button>
                </div>
              )}
            </div>
          )}

          {/* My Curation Requests Tab */}
          {activeTab === 'curation-requests' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-2xl font-extrabold mb-2">My Curation Requests</h3>
                  <p className="text-sm text-black/70">
                    Track your posted requests and review proposals from Pro Curators
                  </p>
                </div>
                <button
                  onClick={() => setCurationRequestModalOpen(true)}
                  className="bg-[linear-gradient(90deg,#00ffff,#ff00c3)] text-white font-extrabold px-6 py-3 rounded-full border-2 border-black hover:opacity-90 transition"
                >
                  + New Request
                </button>
              </div>

              {myCurationRequests.length === 0 ? (
                <div className="text-center py-16 max-w-2xl mx-auto">
                  <h4 className="text-2xl font-extrabold text-black mb-3">
                    No curation requests yet
                  </h4>
                  <p className="text-sm text-black/70 mb-4 leading-relaxed">
                    Need help improving or expanding your datasets? <strong>Curation requests</strong> connect you 
                    with professional curators who can enhance your data quality.
                  </p>
                  <div className="grid md:grid-cols-3 gap-4 mb-6 text-left">
                    <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-4">
                      <p className="text-lg font-bold text-purple-900 mb-1">🎨 Curation</p>
                      <p className="text-xs text-purple-800">Get expert help organizing and cleaning your datasets</p>
                    </div>
                    <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
                      <p className="text-lg font-bold text-green-900 mb-1">✨ Enhancement</p>
                      <p className="text-xs text-green-800">Add metadata, tags, and improve data structure</p>
                    </div>
                    <div className="bg-pink-50 border-2 border-pink-200 rounded-lg p-4">
                      <p className="text-lg font-bold text-pink-900 mb-1">📈 Value</p>
                      <p className="text-xs text-pink-800">Increase your dataset's quality and market value</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setCurationRequestModalOpen(true)}
                    className="bg-[linear-gradient(90deg,#ff00c3,#00ffff)] text-white font-extrabold px-8 py-3 rounded-full border-2 border-black hover:opacity-90 hover:scale-105 transition"
                  >
                    🚀 Post Your First Request
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {myCurationRequests.map((request) => {
                    const proposals = request.curator_proposals || []
                    const pendingCount = proposals.filter(p => p.status === 'pending').length
                    const acceptedProposal = proposals.find(p => p.status === 'accepted')
                    
                    return (
                      <div
                        key={request.id}
                        className="bg-white border-2 border-black rounded-xl p-6 hover:shadow-[4px_4px_0_#000] transition"
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex-1">
                            <h4 className="text-xl font-extrabold mb-2">{request.title}</h4>
                            <p className="text-sm text-black/70 mb-3 line-clamp-2">
                              {request.description}
                            </p>
                            
                            <div className="flex flex-wrap gap-2 mb-3">
                              {/* Status Badge */}
                              <span className={`px-3 py-1 rounded-full text-xs font-bold border-2 border-black ${
                                request.status === 'open' ? 'bg-green-100 text-green-800' :
                                request.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                                request.status === 'completed' ? 'bg-purple-100 text-purple-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {request.status.replace('_', ' ').toUpperCase()}
                              </span>
                              
                              {/* Quality Badge */}
                              <span className="px-3 py-1 rounded-full text-xs font-bold border-2 border-black bg-yellow-100 text-yellow-800">
                                {request.target_quality.toUpperCase()}
                              </span>
                              
                              {/* Budget */}
                              {(request.budget_min || request.budget_max) && (
                                <span className="px-3 py-1 rounded-full text-xs font-bold border-2 border-black bg-indigo-100 text-indigo-800">
                                  ${request.budget_min || '0'} - ${request.budget_max || '∞'}
                                </span>
                              )}
                            </div>

                            {/* Specialties */}
                            {request.specialties_needed && request.specialties_needed.length > 0 && (
                              <div className="flex flex-wrap gap-1 mb-3">
                                {request.specialties_needed.map((spec, i) => (
                                  <span
                                    key={i}
                                    className="px-2 py-1 text-xs font-semibold bg-gray-100 rounded"
                                  >
                                    {spec.replace(/_/g, ' ')}
                                  </span>
                                ))}
                              </div>
                            )}

                            <p className="text-xs text-black/50">
                              Posted {new Date(request.created_at).toLocaleDateString()}
                            </p>
                          </div>

                          <div className="text-right ml-4">
                            <div className="text-3xl font-extrabold text-indigo-600 mb-1">
                              {proposals.length}
                            </div>
                            <div className="text-xs font-bold text-black/60">
                              Proposal{proposals.length !== 1 ? 's' : ''}
                            </div>
                            {pendingCount > 0 && (
                              <div className="text-xs font-bold text-green-600 mt-1">
                                {pendingCount} pending
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Accepted Curator Info */}
                        {acceptedProposal && (
                          <div className="bg-green-50 border-2 border-green-500 rounded-lg p-4 mb-4">
                            <div className="flex items-center gap-3">
                              <div className="bg-green-500 text-white rounded-full p-2">
                                <Star className="h-5 w-5 fill-current" />
                              </div>
                              <div>
                                <div className="font-extrabold text-green-900">
                                  Curator Assigned: {acceptedProposal.pro_curators?.display_name}
                                </div>
                                <div className="text-sm text-green-700">
                                  {acceptedProposal.estimated_completion_days} days • ${acceptedProposal.suggested_price}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Curator Submissions */}
                        {request.curator_submissions && request.curator_submissions.length > 0 && (
                          <div className="space-y-4 mb-4">
                            {request.curator_submissions
                              .sort((a, b) => b.submission_number - a.submission_number)
                              .map((submission) => (
                                <SubmissionReviewCard
                                  key={submission.id}
                                  submission={submission}
                                  request={request}
                                  onReviewComplete={fetchDashboardData}
                                />
                              ))}
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-2">
                          {proposals.length > 0 && (
                            <button
                              onClick={() => {
                                setSelectedRequest(request)
                                setProposalsModalOpen(true)
                              }}
                              className="flex-1 bg-[linear-gradient(90deg,#00ffff,#ff00c3)] text-white font-extrabold px-4 py-2 rounded-full border-2 border-black hover:opacity-90 transition"
                            >
                              View {proposals.length} Proposal{proposals.length !== 1 ? 's' : ''}
                            </button>
                          )}
                          
                          {request.status === 'open' && (
                            <button
                              onClick={async () => {
                                if (!confirm('Close this request? No new proposals will be accepted.')) return
                                try {
                                  const { error } = await supabase
                                    .from('curation_requests')
                                    .update({ status: 'cancelled' })
                                    .eq('id', request.id)
                                  
                                  if (error) throw error
                                  await fetchDashboardData()
                                } catch (error) {
                                  console.error('Error closing request:', error)
                                  alert('Failed to close request')
                                }
                              }}
                              className="px-4 py-2 bg-gray-200 text-black font-bold rounded-full border-2 border-black hover:bg-gray-300 transition"
                            >
                              Close Request
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* Pro Curator Tab */}
          {activeTab === 'pro-curator' && (
            <div className="space-y-8">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-2xl font-extrabold mb-2">Pro Curator Dashboard</h3>
                  <p className="text-sm text-black/70">
                    Apply for certification, manage partnerships, and browse curation requests
                  </p>
                </div>
                <button
                  onClick={() => setCurationRequestModalOpen(true)}
                  className="bg-[linear-gradient(90deg,#00ffff,#ff00c3)] text-white font-extrabold px-6 py-3 rounded-full border-2 border-black hover:opacity-90 transition"
                >
                  Request Curation Help
                </button>
              </div>

              {/* Open Curation Requests Marketplace */}
              {curatorProfile && curatorProfile.certification_status === 'approved' && (
                <>
                  {/* My Assigned Requests Section */}
                  {curatorAssignedRequests.length > 0 && (
                    <div className="mb-8">
                      <h4 className="text-xl font-extrabold mb-4">📋 My Assigned Requests</h4>
                      <div className="space-y-4">
                        {curatorAssignedRequests.map(request => (
                          <div
                            key={request.id}
                            className="bg-white border-4 border-black rounded-xl p-6 shadow-[8px_8px_0_#000]"
                          >
                            <div className="flex justify-between items-start mb-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <h5 className="text-xl font-extrabold">{request.title}</h5>
                                  <span className={`px-3 py-1 rounded-full text-xs font-bold border-2 border-black ${
                                    request.status === 'in_progress' ? 'bg-yellow-200' :
                                    request.status === 'completed' ? 'bg-green-200' :
                                    'bg-gray-200'
                                  }`}>
                                    {request.status === 'in_progress' ? '🔨 In Progress' :
                                     request.status === 'completed' ? '✅ Completed' :
                                     request.status}
                                  </span>
                                </div>
                                <p className="text-sm text-black/70 mb-3">
                                  Posted by <span className="font-bold">{request.requestor?.username || 'Anonymous'}</span>
                                </p>
                                <p className="text-black/80 mb-4">{request.description}</p>
                                
                                <div className="grid grid-cols-2 gap-3 text-sm">
                                  <div>
                                    <span className="font-bold">Quality Level:</span> {request.target_quality}
                                  </div>
                                  <div>
                                    <span className="font-bold">Dataset Type:</span> {request.dataset_type}
                                  </div>
                                  <div>
                                    <span className="font-bold">Price Offered:</span> ${request.price_range_min} - ${request.price_range_max}
                                  </div>
                                  <div>
                                    <span className="font-bold">Deadline:</span> {request.deadline ? new Date(request.deadline).toLocaleDateString() : 'Flexible'}
                                  </div>
                                </div>

                                {request.accepted_proposal && request.accepted_proposal.length > 0 && (
                                  <div className="mt-4 pt-4 border-t-2 border-black/10">
                                    <h6 className="font-bold text-sm mb-2">Your Accepted Proposal:</h6>
                                    <div className="bg-green-50 border-2 border-black rounded-lg p-3 text-sm space-y-1">
                                      <p><span className="font-bold">Timeline:</span> {request.accepted_proposal[0].estimated_completion_days} days</p>
                                      <p><span className="font-bold">Price:</span> ${request.accepted_proposal[0].suggested_price}</p>
                                      <p className="text-xs text-black/60 mt-2">{request.accepted_proposal[0].proposal_text}</p>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>

                            {request.status === 'in_progress' && (
                              <div className="flex gap-3 mt-4">
                                <button
                                  onClick={() => {
                                    setSelectedRequestForSubmission(request)
                                    setSubmissionModalOpen(true)
                                  }}
                                  className="px-4 py-2 bg-green-400 text-black font-bold rounded-full border-2 border-black hover:bg-green-500 transition"
                                >
                                  📤 Submit Completed Work
                                </button>
                                <button
                                  onClick={() => {
                                    alert('Contact feature coming soon! For now, please reach out through the platform messaging.')
                                  }}
                                  className="px-4 py-2 bg-blue-400 text-white font-bold rounded-full border-2 border-black hover:bg-blue-500 transition"
                                >
                                  💬 Contact Data Owner
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Open Requests Marketplace */}
                  <div>
                    <h4 className="text-xl font-extrabold mb-4">🔥 Open Curation Requests</h4>
                    {openCurationRequests.length === 0 ? (
                      <div className="text-center py-12 bg-gradient-to-br from-purple-50 to-cyan-50 border-2 border-black rounded-xl">
                        <div className="text-4xl mb-3">🎯</div>
                        <p className="text-lg font-extrabold text-black mb-2">
                          No open requests at the moment
                        </p>
                        <p className="text-sm text-black/70 mb-4">
                          All current curation requests have been claimed!
                        </p>
                        <p className="text-xs text-black/60 bg-white border border-black/20 rounded-lg px-4 py-2 inline-block">
                          💡 Tip: Check back regularly - new requests are posted daily
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {openCurationRequests.map(request => (
                          <div
                            key={request.id}
                            className="bg-white border-4 border-black rounded-xl p-6 shadow-[8px_8px_0_#000] hover:shadow-[12px_12px_0_#000] transition-all"
                          >
                            <h5 className="text-lg font-extrabold mb-2">{request.title}</h5>
                            <p className="text-sm text-black/70 mb-3">
                              Posted by <span className="font-bold">{request.requestor?.username || 'Anonymous'}</span>
                            </p>
                            <p className="text-black/80 mb-4 line-clamp-3">{request.description}</p>
                            
                            <div className="space-y-2 text-sm mb-4">
                              <div className="flex justify-between">
                                <span className="font-bold">Quality:</span>
                                <span>{request.target_quality}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="font-bold">Type:</span>
                                <span>{request.dataset_type}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="font-bold">Budget:</span>
                                <span>${request.price_range_min} - ${request.price_range_max}</span>
                              </div>
                            </div>

                            <button
                              onClick={() => {
                                setSelectedRequestForProposal(request)
                                setProposalSubmissionOpen(true)
                              }}
                              className="w-full bg-[linear-gradient(90deg,#00ffff,#ff00c3)] text-white font-extrabold px-4 py-2 rounded-full border-2 border-black hover:opacity-90 transition"
                            >
                              Submit Proposal
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}

              {(!curatorProfile || curatorProfile.certification_status !== 'approved') && (
                <div>
                  <h4 className="text-xl font-extrabold mb-4">🔥 Open Curation Requests</h4>
                  {openCurationRequests.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 border-2 border-black rounded-xl">
                      <p className="text-lg font-bold text-black/60">
                        No open requests at the moment
                      </p>
                      <p className="text-sm text-black/50 mt-2">
                        Check back later for new opportunities
                      </p>
                    </div>
                  ) : (
                    <div className="grid gap-4">
                      {openCurationRequests.slice(0, 5).map((request) => (
                        <div
                          key={request.id}
                          className="bg-white border-2 border-black rounded-xl p-6 hover:shadow-[4px_4px_0_#000] transition"
                        >
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex-1">
                              <h5 className="text-lg font-extrabold mb-2">{request.title}</h5>
                              <p className="text-sm text-black/70 line-clamp-2 mb-3">
                                {request.description}
                              </p>
                              
                              <div className="flex flex-wrap gap-2 mb-3">
                                <span className="px-3 py-1 rounded-full text-xs font-bold border-2 border-black bg-yellow-100 text-yellow-800">
                                  {request.target_quality.toUpperCase()}
                                </span>
                                {(request.budget_min || request.budget_max) && (
                                  <span className="px-3 py-1 rounded-full text-xs font-bold border-2 border-black bg-green-100 text-green-800">
                                    ${request.budget_min || '0'} - ${request.budget_max || '∞'}
                                  </span>
                                )}
                              </div>

                              {request.specialties_needed && request.specialties_needed.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  {request.specialties_needed.map((spec, i) => (
                                    <span
                                      key={i}
                                      className="px-2 py-0.5 text-xs font-semibold bg-gray-100 rounded"
                                    >
                                      {spec.replace(/_/g, ' ')}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>

                            <button
                              onClick={() => {
                                setSelectedRequestForProposal(request)
                                setProposalSubmissionOpen(true)
                              }}
                              className="ml-4 bg-[linear-gradient(90deg,#ff00c3,#00ffff)] text-white font-extrabold px-6 py-3 rounded-full border-2 border-black hover:opacity-90 transition whitespace-nowrap"
                            >
                              Submit Proposal
                            </button>
                          </div>

                          <p className="text-xs text-black/50 mt-2">
                            Posted {new Date(request.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {openCurationRequests.length > 5 && (
                    <p className="text-center text-sm text-black/60 mt-4">
                      Showing 5 of {openCurationRequests.length} open requests
                    </p>
                  )}
                </div>
              )}
              
              <ProCuratorProfile />
            </div>
          )}
        </div>
      </main>
      
      {/* Edit Dataset Modal */}
      {editingDataset && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border-4 border-black max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-extrabold">Edit Dataset</h3>
                <button
                  onClick={() => setEditingDataset(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block font-bold mb-2">Title</label>
                  <input
                    type="text"
                    value={editingDataset.title}
                    onChange={(e) => setEditingDataset(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-4 py-2 border-2 border-black rounded-lg font-semibold"
                    placeholder="Dataset title"
                  />
                </div>
                
                <div>
                  <label className="block font-bold mb-2">Description</label>
                  <textarea
                    value={editingDataset.description}
                    onChange={(e) => setEditingDataset(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-4 py-2 border-2 border-black rounded-lg font-semibold"
                    rows="4"
                    placeholder="Describe your dataset..."
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold mb-2">Price ($)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={editingDataset.price}
                      onChange={(e) => setEditingDataset(prev => ({ ...prev, price: e.target.value }))}
                      className="w-full px-4 py-2 border-2 border-black rounded-lg font-semibold"
                    />
                  </div>
                  
                  <div>
                    <label className="block font-bold mb-2">Modality</label>
                    <select
                      value={editingDataset.modality}
                      onChange={(e) => setEditingDataset(prev => ({ ...prev, modality: e.target.value }))}
                      className="w-full px-4 py-2 border-2 border-black rounded-lg font-semibold"
                    >
                      <option value="vision">Vision</option>
                      <option value="audio">Audio</option>
                      <option value="text">Text</option>
                      <option value="multimodal">Multimodal</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block font-bold mb-2">Tags (comma-separated)</label>
                  <input
                    type="text"
                    value={editingDataset.tags?.join(', ') || ''}
                    onChange={(e) => setEditingDataset(prev => ({ 
                      ...prev, 
                      tags: e.target.value.split(',').map(t => t.trim()).filter(t => t) 
                    }))}
                    className="w-full px-4 py-2 border-2 border-black rounded-lg font-semibold"
                    placeholder="machine-learning, computer-vision, nlp"
                  />
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleSaveEdit}
                  disabled={actionLoading}
                  className="flex-1 bg-[linear-gradient(90deg,#ffea00,#00ffff)] text-black font-extrabold px-6 py-3 rounded-full border-2 border-black hover:scale-105 transition disabled:opacity-50"
                >
                  {actionLoading ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  onClick={() => setEditingDataset(null)}
                  className="flex-1 bg-gray-200 text-black font-bold px-6 py-3 rounded-full border-2 border-black hover:bg-gray-300 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Upload Dataset Modal */}
      <DatasetUploadModal 
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        onSuccess={fetchDashboardData}
      />
      
      {/* Curation Request Modal */}
      <CurationRequestModal 
        isOpen={curationRequestModalOpen}
        onClose={() => setCurationRequestModalOpen(false)}
        onSuccess={fetchDashboardData}
      />
      
      {/* Proposals Modal */}
      <ProposalsModal 
        isOpen={proposalsModalOpen}
        onClose={() => {
          setProposalsModalOpen(false)
          setSelectedRequest(null)
        }}
        request={selectedRequest}
        onAccept={fetchDashboardData}
      />
      
      {/* Proposal Submission Modal */}
      <ProposalSubmissionModal 
        isOpen={proposalSubmissionOpen}
        onClose={() => {
          setProposalSubmissionOpen(false)
          setSelectedRequestForProposal(null)
        }}
        request={selectedRequestForProposal}
        curatorProfile={curatorProfile}
        onSuccess={fetchDashboardData}
      />

      {/* Curator Submission Modal */}
      <CuratorSubmissionModal
        isOpen={submissionModalOpen}
        onClose={() => {
          setSubmissionModalOpen(false)
          setSelectedRequestForSubmission(null)
        }}
        request={selectedRequestForSubmission}
        curatorProfile={curatorProfile}
        onSuccess={fetchDashboardData}
      />

      {/* Deletion Request Modal */}
      {deletionModalDataset && (
        <DeletionRequestModal
          dataset={deletionModalDataset}
          onClose={() => setDeletionModalDataset(null)}
          onSubmit={handleRequestDeletion}
        />
      )}

      {/* Bounty Creation Modal */}
      {showBountyModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-3xl font-black">Post a Bounty</h2>
              <button
                onClick={() => setShowBountyModal(false)}
                className="text-2xl font-bold hover:opacity-70"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block font-bold mb-2">Title *</label>
                <input
                  type="text"
                  value={newBounty.title}
                  onChange={(e) => setNewBounty({...newBounty, title: e.target.value})}
                  placeholder="e.g., High-quality audio of rain sounds"
                  className="w-full border-2 border-black rounded-lg px-4 py-3 font-semibold"
                />
              </div>

              <div>
                <label className="block font-bold mb-2">Description *</label>
                <textarea
                  value={newBounty.description}
                  onChange={(e) => setNewBounty({...newBounty, description: e.target.value})}
                  placeholder="Describe what you need in detail..."
                  rows={4}
                  className="w-full border-2 border-black rounded-lg px-4 py-3 font-semibold"
                />
              </div>

              <div>
                <label className="block font-bold mb-2">Data Type *</label>
                <select
                  value={newBounty.modality}
                  onChange={(e) => setNewBounty({...newBounty, modality: e.target.value})}
                  className="w-full border-2 border-black rounded-lg px-4 py-3 font-semibold"
                >
                  <option value="text">Text</option>
                  <option value="image">Image</option>
                  <option value="audio">Audio</option>
                  <option value="video">Video</option>
                  <option value="tabular">Tabular</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold mb-2">Min Budget</label>
                  <input
                    type="number"
                    value={newBounty.budget_min}
                    onChange={(e) => setNewBounty({...newBounty, budget_min: e.target.value})}
                    placeholder="100"
                    className="w-full border-2 border-black rounded-lg px-4 py-3 font-semibold"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-2">Max Budget *</label>
                  <input
                    type="number"
                    value={newBounty.budget_max}
                    onChange={(e) => setNewBounty({...newBounty, budget_max: e.target.value})}
                    placeholder="200"
                    className="w-full border-2 border-black rounded-lg px-4 py-3 font-semibold"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleCreateBounty}
                  className="flex-1 bg-purple-400 hover:bg-purple-500 border-4 border-black rounded-xl px-6 py-3 font-black text-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
                >
                  Post Bounty
                </button>
                <button
                  onClick={() => setShowBountyModal(false)}
                  className="px-6 py-3 border-4 border-black rounded-xl font-bold hover:bg-gray-100"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText={confirmDialog.confirmText}
        variant={confirmDialog.variant}
      />
    </div>
  )
}

export default DashboardPage
