import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { CheckCircle, XCircle, Clock, ExternalLink } from './Icons'
import { CurationLevelBadge } from './CurationLevelBadge'

export function AdminReviewPanel() {
  const { user } = useAuth()
  const [pendingReviews, setPendingReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [reviewingId, setReviewingId] = useState(null)
  const [reviewNotes, setReviewNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    loadPendingReviews()
  }, [])

  async function loadPendingReviews() {
    try {
      setLoading(true)
      setError(null)

      // Query pending datasets with creator info
      const { data, error: queryError } = await supabase
        .from('datasets')
        .select(`
          *,
          creator:profiles!datasets_creator_id_fkey (
            id,
            username,
            avatar_url,
            trust_level
          )
        `)
        .eq('review_status', 'pending')
        .order('created_at', { ascending: true })

      if (queryError) throw queryError

      setPendingReviews(data || [])
    } catch (err) {
      console.error('Error loading pending reviews:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleReview(datasetId, action) {
    if (!reviewNotes.trim() && action === 'reject') {
      setError('Please provide review notes when rejecting a submission')
      return
    }

    try {
      setSubmitting(true)
      setError(null)

      const updates = {
        review_status: action === 'approve' ? 'approved' : 'rejected',
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
        review_notes: reviewNotes.trim() || null,
        is_active: action === 'approve', // Only approved datasets are publicly visible
      }

      const { error: updateError } = await supabase
        .from('datasets')
        .update(updates)
        .eq('id', datasetId)

      if (updateError) throw updateError

      // Send notification to creator
      const dataset = pendingReviews.find(d => d.id === datasetId)
      if (dataset) {
        await supabase.from('notifications').insert({
          user_id: dataset.creator_id,
          type: action === 'approve' ? 'dataset_approved' : 'dataset_rejected',
          title: action === 'approve' 
            ? 'Dataset Approved!' 
            : 'Dataset Needs Improvement',
          message: action === 'approve'
            ? `Your dataset "${dataset.title}" has been approved and is now live on the marketplace.`
            : `Your dataset "${dataset.title}" requires changes. Admin feedback: ${reviewNotes}`,
          action_url: `/datasets/${datasetId}`,
          metadata: {
            dataset_id: datasetId,
            dataset_title: dataset.title,
            review_notes: reviewNotes || null,
          }
        })
      }

      // Remove from pending list
      setPendingReviews(prev => prev.filter(d => d.id !== datasetId))
      setReviewingId(null)
      setReviewNotes('')
    } catch (err) {
      console.error('Error reviewing dataset:', err)
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  // Check if user is admin (trust_level >= 4)
  if (!user || user.trust_level < 4) {
    return (
      <div className="bg-red-100 border-4 border-red-500 rounded-xl p-6">
        <h2 className="text-2xl font-extrabold mb-2">⛔ Admin Access Required</h2>
        <p className="font-semibold">You must be an administrator to access this panel.</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="bg-white border-4 border-black rounded-xl p-8 text-center">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-300 rounded w-1/3 mx-auto mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3 mx-auto"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-100 border-4 border-red-500 rounded-xl p-6">
        <h2 className="text-xl font-extrabold mb-2">❌ Error Loading Reviews</h2>
        <p className="font-semibold mb-4">{error}</p>
        <button
          onClick={loadPendingReviews}
          className="px-6 py-2 bg-red-500 text-white font-bold rounded-full border-2 border-black hover:bg-red-600"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-100 via-purple-100 to-pink-100 border-4 border-black rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-extrabold mb-2">
              🔍 Pending Reviews
            </h2>
            <p className="font-semibold text-lg">
              {pendingReviews.length} {pendingReviews.length === 1 ? 'dataset' : 'datasets'} awaiting review
            </p>
          </div>
          <Clock className="h-16 w-16 text-blue-600" />
        </div>
      </div>

      {/* Empty State */}
      {pendingReviews.length === 0 && (
        <div className="bg-green-100 border-4 border-green-500 rounded-xl p-8 text-center">
          <h3 className="text-2xl font-extrabold mb-2">✨ All Caught Up!</h3>
          <p className="font-semibold text-lg">No datasets pending review at this time.</p>
        </div>
      )}

      {/* Review Cards */}
      {pendingReviews.map((dataset) => (
        <div
          key={dataset.id}
          className="bg-white border-4 border-black rounded-xl shadow-[8px_8px_0_#000] overflow-hidden"
        >
          {/* Dataset Header */}
          <div className="bg-gradient-to-r from-yellow-100 to-orange-100 p-6 border-b-4 border-black">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-2xl font-extrabold">{dataset.title}</h3>
                  <CurationLevelBadge level={dataset.curation_level} size="sm" />
                </div>
                <p className="font-semibold text-black/70 mb-3">{dataset.description}</p>
                
                {/* Creator Info */}
                <div className="flex items-center gap-3">
                  {dataset.creator.avatar_url && (
                    <img
                      src={dataset.creator.avatar_url}
                      alt={dataset.creator.username}
                      className="w-10 h-10 rounded-full border-2 border-black"
                    />
                  )}
                  <div>
                    <p className="font-bold">
                      Submitted by: {dataset.creator.username}
                    </p>
                    <p className="text-sm font-semibold text-black/60">
                      Trust Level: {dataset.creator.trust_level} • 
                      Submitted: {new Date(dataset.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Dataset Details Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-white border-2 border-black rounded-lg p-3">
                <p className="text-xs font-bold text-black/60 mb-1">Price</p>
                <p className="text-lg font-extrabold">${dataset.price}</p>
              </div>
              <div className="bg-white border-2 border-black rounded-lg p-3">
                <p className="text-xs font-bold text-black/60 mb-1">Format</p>
                <p className="text-lg font-extrabold">{dataset.format}</p>
              </div>
              <div className="bg-white border-2 border-black rounded-lg p-3">
                <p className="text-xs font-bold text-black/60 mb-1">Modality</p>
                <p className="text-lg font-extrabold">{dataset.modality}</p>
              </div>
              <div className="bg-white border-2 border-black rounded-lg p-3">
                <p className="text-xs font-bold text-black/60 mb-1">License</p>
                <p className="text-lg font-extrabold">{dataset.license}</p>
              </div>
            </div>
          </div>

          {/* Sample Previews */}
          {dataset.sample_preview_urls && dataset.sample_preview_urls.length > 0 && (
            <div className="p-6 border-b-4 border-black bg-gray-50">
              <h4 className="font-extrabold text-lg mb-3">
                📎 Sample Previews ({dataset.sample_preview_urls.length})
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {dataset.sample_preview_urls.slice(0, 8).map((url, index) => (
                  <a
                    key={index}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative aspect-square bg-white border-2 border-black rounded-lg overflow-hidden hover:shadow-[4px_4px_0_#000] transition-all"
                  >
                    {url.match(/\.(jpg|jpeg|png|gif|svg|webp)$/i) ? (
                      <img
                        src={url}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ExternalLink className="h-8 w-8 text-black/40" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                      <ExternalLink className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </a>
                ))}
              </div>
              {dataset.sample_preview_urls.length > 8 && (
                <p className="text-sm font-semibold text-black/60 mt-2">
                  + {dataset.sample_preview_urls.length - 8} more preview(s)
                </p>
              )}
            </div>
          )}

          {/* README Content */}
          {dataset.readme_content && (
            <div className="p-6 border-b-4 border-black bg-orange-50">
              <h4 className="font-extrabold text-lg mb-3">📖 README Documentation</h4>
              <div className="bg-white border-2 border-black rounded-lg p-4 font-mono text-sm whitespace-pre-wrap max-h-64 overflow-y-auto">
                {dataset.readme_content}
              </div>
            </div>
          )}

          {/* Metadata Completeness */}
          {dataset.curation_level === 'partial' && (
            <div className="p-6 border-b-4 border-black bg-yellow-50">
              <h4 className="font-extrabold text-lg mb-3">📊 Metadata Completeness</h4>
              <div className="flex items-center gap-4">
                <div className="flex-1 bg-gray-300 rounded-full h-6 border-2 border-black overflow-hidden">
                  <div
                    className="bg-yellow-400 h-full flex items-center justify-center font-bold text-sm"
                    style={{ width: `${dataset.metadata_completeness}%` }}
                  >
                    {dataset.metadata_completeness}%
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tags */}
          {dataset.tags && dataset.tags.length > 0 && (
            <div className="p-6 border-b-4 border-black">
              <h4 className="font-extrabold text-lg mb-3">🏷️ Tags</h4>
              <div className="flex flex-wrap gap-2">
                {dataset.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-cyan-200 border-2 border-black rounded-full text-sm font-bold"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Review Actions */}
          <div className="p-6 bg-gray-50">
            {reviewingId === dataset.id ? (
              <div className="space-y-4">
                <div>
                  <label className="block font-bold mb-2">
                    Review Notes {reviewNotes.trim() ? '(Optional)' : '(Required for rejection)'}
                  </label>
                  <textarea
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    disabled={submitting}
                    className="w-full px-4 py-3 border-2 border-black rounded-lg disabled:bg-gray-100"
                    rows="4"
                    placeholder="Provide feedback to the creator about quality, formatting, metadata, etc..."
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => handleReview(dataset.id, 'approve')}
                    disabled={submitting}
                    className="flex-1 px-6 py-3 bg-green-400 text-black font-extrabold rounded-full border-2 border-black hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-[4px_4px_0_#000] hover:shadow-[2px_2px_0_#000] transition-all flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="h-5 w-5" />
                    {submitting ? 'Approving...' : 'Approve & Publish'}
                  </button>

                  <button
                    onClick={() => handleReview(dataset.id, 'reject')}
                    disabled={submitting || !reviewNotes.trim()}
                    className="flex-1 px-6 py-3 bg-red-400 text-black font-extrabold rounded-full border-2 border-black hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-[4px_4px_0_#000] hover:shadow-[2px_2px_0_#000] transition-all flex items-center justify-center gap-2"
                  >
                    <XCircle className="h-5 w-5" />
                    {submitting ? 'Rejecting...' : 'Reject'}
                  </button>

                  <button
                    onClick={() => {
                      setReviewingId(null)
                      setReviewNotes('')
                    }}
                    disabled={submitting}
                    className="px-6 py-3 bg-gray-200 text-black font-bold rounded-full border-2 border-black hover:bg-gray-300 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setReviewingId(dataset.id)}
                className="w-full px-6 py-3 bg-blue-400 text-black font-extrabold rounded-full border-2 border-black hover:bg-blue-500 shadow-[4px_4px_0_#000] hover:shadow-[2px_2px_0_#000] transition-all"
              >
                Review This Dataset
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
