import ProCuratorProfile from '../../ProCuratorProfile'

/**
 * ProCuratorTab - Pro curator dashboard showing assigned requests and open marketplace
 * 
 * @param {Object} props
 * @param {Object} props.curatorProfile - Pro curator profile data
 * @param {Array} props.curatorAssignedRequests - Requests assigned to this curator
 * @param {Array} props.openCurationRequests - Open requests available to claim
 * @param {Function} props.curationRequestModal - Modal state for requesting curation
 * @param {Function} props.proposalSubmissionModal - Modal state for submitting proposals
 * @param {Function} props.curatorSubmissionModal - Modal state for submitting work
 */
export function ProCuratorTab({
  curatorProfile,
  curatorAssignedRequests,
  openCurationRequests,
  curationRequestModal,
  proposalSubmissionModal,
  curatorSubmissionModal
}) {
  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-2xl font-extrabold mb-2">Pro Curator Dashboard</h3>
          <p className="text-sm text-black/70">
            Apply for certification, manage partnerships, and browse curation requests
          </p>
        </div>
        <button
          onClick={() => curationRequestModal.open()}
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
                          onClick={() => curatorSubmissionModal.open(request)}
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
                      onClick={() => proposalSubmissionModal.open(request)}
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
                      onClick={() => proposalSubmissionModal.open(request)}
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
  )
}
