import { Star } from '../../Icons'
import SubmissionReviewCard from '../../SubmissionReviewCard'
import { supabase } from '../../../lib/supabase'
import { handleSupabaseError } from '../../../lib/logger'
import { ERROR_MESSAGES } from '../../../lib/errorMessages'

/**
 * CurationRequestsTab - Display and manage user's curation requests
 * 
 * @param {Object} props
 * @param {Array} props.myCurationRequests - User's curation requests
 * @param {Function} props.curationRequestModal - Modal state for creating requests
 * @param {Function} props.proposalsModal - Modal state for viewing proposals
 * @param {Function} props.fetchDashboardData - Refresh dashboard data
 * @param {Function} props.setError - Set error message
 */
export function CurationRequestsTab({
  myCurationRequests,
  curationRequestModal,
  proposalsModal,
  fetchDashboardData,
  setError
}) {
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-2xl font-extrabold mb-2">My Curation Requests</h3>
          <p className="text-sm text-black/70">
            Track your posted requests and review proposals from Pro Curators
          </p>
        </div>
        <button
          onClick={() => curationRequestModal.open()}
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
              <p className="text-xs text-pink-800">Increase your dataset&apos;s quality and market value</p>
            </div>
          </div>
          <button
            onClick={() => curationRequestModal.open()}
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
                      onClick={() => proposalsModal.open(request)}
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
                          handleSupabaseError(error, 'closeCurationRequest')
                          setError(ERROR_MESSAGES.CLOSE_CURATION_REQUEST)
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
  )
}
