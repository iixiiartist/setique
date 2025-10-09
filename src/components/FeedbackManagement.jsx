import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export default function FeedbackManagement() {
  const { user } = useAuth()
  const [feedbackList, setFeedbackList] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // all, new, in_review, responded, resolved, archived
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [selectedFeedback, setSelectedFeedback] = useState(null)
  const [responseText, setResponseText] = useState('')
  const [stats, setStats] = useState({ new: 0, in_review: 0, responded: 0, resolved: 0, total: 0 })

  const fetchFeedback = useCallback(async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('user_feedback')
        .select('*, profiles:user_id(username, display_name)')
        .order('created_at', { ascending: false })

      if (filter !== 'all') {
        query = query.eq('status', filter)
      }

      if (categoryFilter !== 'all') {
        query = query.eq('category', categoryFilter)
      }

      if (priorityFilter !== 'all') {
        query = query.eq('priority', priorityFilter)
      }

      const { data, error } = await query

      if (error) throw error
      setFeedbackList(data || [])

      // Calculate stats
      const allFeedback = await supabase
        .from('user_feedback')
        .select('status')
      
      if (allFeedback.data) {
        const statsData = allFeedback.data.reduce((acc, item) => {
          acc[item.status] = (acc[item.status] || 0) + 1
          acc.total++
          return acc
        }, { new: 0, in_review: 0, responded: 0, resolved: 0, archived: 0, total: 0 })
        setStats(statsData)
      }
    } catch (error) {
      console.error('Error fetching feedback:', error)
    } finally {
      setLoading(false)
    }
  }, [filter, categoryFilter, priorityFilter])

  useEffect(() => {
    fetchFeedback()
  }, [fetchFeedback])

  const updateFeedbackStatus = async (feedbackId, newStatus, priority = null) => {
    try {
      const updates = { status: newStatus }
      if (priority) updates.priority = priority

      const { error } = await supabase
        .from('user_feedback')
        .update(updates)
        .eq('id', feedbackId)

      if (error) throw error
      
      alert('✅ Status updated successfully')
      fetchFeedback()
      setSelectedFeedback(null)
    } catch (error) {
      console.error('Error updating status:', error)
      alert('Failed to update status')
    }
  }

  const submitResponse = async (feedbackId) => {
    if (!responseText.trim()) {
      alert('Please enter a response')
      return
    }

    try {
      const { error } = await supabase
        .from('user_feedback')
        .update({
          admin_response: responseText,
          responded_by: user.id,
          responded_at: new Date().toISOString(),
          status: 'responded'
        })
        .eq('id', feedbackId)

      if (error) throw error
      
      alert('✅ Response submitted successfully')
      setResponseText('')
      fetchFeedback()
      setSelectedFeedback(null)
    } catch (error) {
      console.error('Error submitting response:', error)
      alert('Failed to submit response')
    }
  }

  const categoryLabels = {
    bug: '🐛 Bug',
    feature: '✨ Feature',
    improvement: '🚀 Improvement',
    question: '❓ Question',
    other: '💬 Other'
  }

  const statusColors = {
    new: 'bg-yellow-100 border-yellow-500 text-yellow-900',
    in_review: 'bg-blue-100 border-blue-500 text-blue-900',
    responded: 'bg-green-100 border-green-500 text-green-900',
    resolved: 'bg-gray-100 border-gray-500 text-gray-900',
    archived: 'bg-gray-50 border-gray-400 text-gray-600'
  }

  const priorityColors = {
    low: 'bg-gray-200 text-gray-700',
    medium: 'bg-blue-200 text-blue-700',
    high: 'bg-orange-200 text-orange-700',
    urgent: 'bg-red-200 text-red-700'
  }

  if (loading && feedbackList.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-3 border-black mx-auto"></div>
        <p className="mt-4 font-bold text-gray-600">Loading feedback...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-yellow-100 border-3 border-black rounded-lg p-4">
          <div className="text-2xl font-extrabold">{stats.new}</div>
          <div className="text-sm font-bold text-gray-700">New</div>
        </div>
        <div className="bg-blue-100 border-3 border-black rounded-lg p-4">
          <div className="text-2xl font-extrabold">{stats.in_review}</div>
          <div className="text-sm font-bold text-gray-700">In Review</div>
        </div>
        <div className="bg-green-100 border-3 border-black rounded-lg p-4">
          <div className="text-2xl font-extrabold">{stats.responded}</div>
          <div className="text-sm font-bold text-gray-700">Responded</div>
        </div>
        <div className="bg-gray-100 border-3 border-black rounded-lg p-4">
          <div className="text-2xl font-extrabold">{stats.resolved}</div>
          <div className="text-sm font-bold text-gray-700">Resolved</div>
        </div>
        <div className="bg-white border-3 border-black rounded-lg p-4">
          <div className="text-2xl font-extrabold">{stats.total}</div>
          <div className="text-sm font-bold text-gray-700">Total</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border-3 border-black rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Status Filter */}
          <div>
            <label className="block text-sm font-bold mb-2">Status</label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full px-4 py-2 border-2 border-black rounded-lg font-bold"
            >
              <option value="all">All Status</option>
              <option value="new">New</option>
              <option value="in_review">In Review</option>
              <option value="responded">Responded</option>
              <option value="resolved">Resolved</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <label className="block text-sm font-bold mb-2">Category</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-4 py-2 border-2 border-black rounded-lg font-bold"
            >
              <option value="all">All Categories</option>
              <option value="bug">🐛 Bug Report</option>
              <option value="feature">✨ Feature Request</option>
              <option value="improvement">🚀 Improvement</option>
              <option value="question">❓ Question</option>
              <option value="other">💬 Other</option>
            </select>
          </div>

          {/* Priority Filter */}
          <div>
            <label className="block text-sm font-bold mb-2">Priority</label>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="w-full px-4 py-2 border-2 border-black rounded-lg font-bold"
            >
              <option value="all">All Priorities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">🔥 Urgent</option>
            </select>
          </div>
        </div>
      </div>

      {/* Feedback List */}
      <div className="space-y-4">
        {feedbackList.length === 0 ? (
          <div className="bg-white border-3 border-black rounded-lg p-12 text-center">
            <p className="text-2xl font-bold text-gray-400">No feedback found</p>
            <p className="text-gray-600 mt-2">Try adjusting your filters</p>
          </div>
        ) : (
          feedbackList.map((feedback) => (
            <div
              key={feedback.id}
              className="bg-white border-3 border-black rounded-lg overflow-hidden"
            >
              {/* Header */}
              <div className="p-4 border-b-3 border-black bg-gray-50 flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    <span className="font-extrabold text-lg">
                      {feedback.name}
                    </span>
                    <span className="text-sm text-gray-600">
                      ({feedback.email})
                    </span>
                    {feedback.profiles?.username && (
                      <span className="text-xs bg-purple-100 border-2 border-black px-2 py-1 rounded font-bold">
                        @{feedback.profiles.username}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-xs font-bold px-3 py-1 rounded-full border-2 ${statusColors[feedback.status]}`}>
                      {feedback.status.replace('_', ' ').toUpperCase()}
                    </span>
                    <span className="text-xs font-bold px-3 py-1 rounded-full border-2 border-black bg-white">
                      {categoryLabels[feedback.category]}
                    </span>
                    <span className={`text-xs font-bold px-3 py-1 rounded-full ${priorityColors[feedback.priority]}`}>
                      {feedback.priority.toUpperCase()}
                    </span>
                    <span className="text-xs text-gray-600">
                      {new Date(feedback.created_at).toLocaleDateString()} at {new Date(feedback.created_at).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-4">
                <p className="text-gray-800 whitespace-pre-wrap font-semibold">
                  {feedback.message}
                </p>

                {/* Admin Response */}
                {feedback.admin_response && (
                  <div className="mt-4 p-4 bg-green-50 border-2 border-green-500 rounded-lg">
                    <div className="font-bold text-green-900 mb-2">
                      ✅ Admin Response {feedback.responded_at && `(${new Date(feedback.responded_at).toLocaleDateString()})`}
                    </div>
                    <p className="text-green-800 whitespace-pre-wrap">
                      {feedback.admin_response}
                    </p>
                  </div>
                )}

                {/* Actions */}
                <div className="mt-4 flex gap-2 flex-wrap">
                  {/* Response Form */}
                  {selectedFeedback === feedback.id ? (
                    <div className="w-full space-y-3">
                      <textarea
                        value={responseText}
                        onChange={(e) => setResponseText(e.target.value)}
                        rows={4}
                        className="w-full px-4 py-3 border-3 border-black rounded-lg font-semibold"
                        placeholder="Type your response..."
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => submitResponse(feedback.id)}
                          className="bg-green-500 text-white font-bold px-4 py-2 rounded-lg border-2 border-black hover:bg-green-600 transition"
                        >
                          Send Response
                        </button>
                        <button
                          onClick={() => {
                            setSelectedFeedback(null)
                            setResponseText('')
                          }}
                          className="bg-gray-200 text-black font-bold px-4 py-2 rounded-lg border-2 border-black hover:bg-gray-300 transition"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {!feedback.admin_response && (
                        <button
                          onClick={() => setSelectedFeedback(feedback.id)}
                          className="bg-cyan-400 text-black font-bold px-4 py-2 rounded-lg border-2 border-black hover:bg-cyan-500 transition"
                        >
                          📝 Respond
                        </button>
                      )}
                      
                      {/* Status Change Buttons */}
                      {feedback.status === 'new' && (
                        <button
                          onClick={() => updateFeedbackStatus(feedback.id, 'in_review')}
                          className="bg-blue-400 text-white font-bold px-4 py-2 rounded-lg border-2 border-black hover:bg-blue-500 transition"
                        >
                          👀 Mark In Review
                        </button>
                      )}
                      
                      {(feedback.status === 'responded' || feedback.status === 'in_review') && (
                        <button
                          onClick={() => updateFeedbackStatus(feedback.id, 'resolved')}
                          className="bg-green-400 text-white font-bold px-4 py-2 rounded-lg border-2 border-black hover:bg-green-500 transition"
                        >
                          ✅ Mark Resolved
                        </button>
                      )}
                      
                      {feedback.status !== 'archived' && (
                        <button
                          onClick={() => updateFeedbackStatus(feedback.id, 'archived')}
                          className="bg-gray-400 text-white font-bold px-4 py-2 rounded-lg border-2 border-black hover:bg-gray-500 transition"
                        >
                          📁 Archive
                        </button>
                      )}

                      {/* Priority Change */}
                      <select
                        value={feedback.priority}
                        onChange={(e) => updateFeedbackStatus(feedback.id, feedback.status, e.target.value)}
                        className="px-4 py-2 border-2 border-black rounded-lg font-bold"
                      >
                        <option value="low">Low Priority</option>
                        <option value="medium">Medium Priority</option>
                        <option value="high">High Priority</option>
                        <option value="urgent">🔥 Urgent</option>
                      </select>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
