import { Package } from '../../Icons'

const tierDisplayInfo = {
  newcomer: { label: 'Open to All', badge: '🌟', color: 'bg-gray-100 text-gray-800 border-gray-600' },
  verified: { label: 'Verified+', badge: '✓', color: 'bg-blue-100 text-blue-800 border-blue-600' },
  expert: { label: 'Expert+', badge: '✓✓', color: 'bg-purple-100 text-purple-800 border-purple-600' },
  master: { label: 'Master Only', badge: '⭐', color: 'bg-yellow-100 text-yellow-800 border-yellow-600' }
};

/**
 * BountiesTab - Display available bounties and bounties user has posted
 * 
 * @param {Object} props
 * @param {Array} props.openCurationRequests - Available bounties to submit to
 * @param {Array} props.myBounties - Bounties posted by the user
 * @param {Object} props.profile - User profile with trust_level
 * @param {Object} props.user - Current user
 * @param {string} props.expandedBounty - ID of currently expanded bounty
 * @param {Function} props.setExpandedBounty - Toggle bounty expansion
 * @param {Function} props.setShowBountyModal - Open bounty creation modal
 * @param {Function} props.handleCloseMyBounty - Close a bounty
 * @param {Object} props.bountySubmissionModal - Modal state for submissions
 * @param {Function} props.navigate - Navigation function
 */
export function BountiesTab({
  openCurationRequests,
  myBounties,
  profile,
  user,
  expandedBounty,
  setExpandedBounty,
  setShowBountyModal,
  handleCloseMyBounty,
  bountySubmissionModal,
  navigate
}) {
  return (
    <div className="space-y-8">
      {/* Available Bounties Section */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-2xl font-extrabold mb-1">Available Bounties</h3>
            <p className="text-sm text-black/70">
              Browse open bounties and submit proposals {profile && `(Your tier: ${['newcomer', 'verified', 'expert', 'master'][profile.trust_level || 0]})`}
            </p>
          </div>
        </div>

        {openCurationRequests && openCurationRequests.length > 0 ? (
          <div className="space-y-4 mb-8">
            {openCurationRequests.map((bounty) => {
              const tierInfo = tierDisplayInfo[bounty.minimum_curator_tier || 'newcomer'];
              // Map trust_level integer to tier string
              const trustLevelMap = ['newcomer', 'verified', 'expert', 'master'];
              const userTierString = trustLevelMap[profile?.trust_level || 0];
              const userTierInfo = tierDisplayInfo[userTierString];
              
              return (
                <div
                  key={bounty.id}
                  className="bg-gradient-to-br from-purple-100 via-pink-100 to-yellow-100 border-2 border-black rounded-xl p-4"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h4 className="font-extrabold text-lg mb-1">{bounty.title}</h4>
                      <div className="flex gap-3 text-sm font-semibold text-black/70 flex-wrap mb-2">
                        <span className="bg-white border-2 border-black rounded-full px-3 py-1">
                          💰 ${bounty.budget_min} - ${bounty.budget_max}
                        </span>
                        <span className={`border-2 rounded-full px-3 py-1 ${tierInfo.color}`}>
                          {tierInfo.badge} {tierInfo.label} Required
                        </span>
                        <span className={`border-2 rounded-full px-3 py-1 ${userTierInfo.color}`}>
                          ✨ Your Tier: {userTierInfo.label}
                        </span>
                      </div>
                      <p className="text-sm text-black/70 mb-2">
                        Posted by {bounty.profiles?.username || 'Anonymous'} • {new Date(bounty.created_at).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-black/80">
                        {bounty.description?.substring(0, 150)}{bounty.description?.length > 150 ? '...' : ''}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3 mt-3">
                    <button
                      onClick={() => {
                        if (!user) {
                          alert('Please sign in to submit to bounties')
                          navigate('/?auth=signin')
                          return
                        }
                        bountySubmissionModal.open(bounty)
                      }}
                      className="bg-[linear-gradient(90deg,#00ffff,#ff00c3)] text-white font-bold px-6 py-2 rounded-full border-2 border-black hover:opacity-90 transition"
                    >
                      📝 Submit Dataset
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white border-2 border-black rounded-xl p-8 text-center mb-8">
            <p className="text-sm font-bold text-black/60">
              No available bounties at the moment. Check back soon!
            </p>
          </div>
        )}
      </div>

      {/* Bounties I Posted Section */}
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
            {myBounties.map((bounty) => {
              const tierInfo = tierDisplayInfo[bounty.minimum_curator_tier || 'newcomer'];
              return (
                <div
                  key={bounty.id}
                  className="bg-gradient-to-br from-yellow-100 via-pink-100 to-cyan-100 border-2 border-black rounded-xl p-4"
                >
                  {/* Bounty Header */}
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h4 className="font-extrabold text-lg mb-1">{bounty.title}</h4>
                      <div className="flex gap-3 text-sm font-semibold text-black/70 flex-wrap">
                        <span className="bg-white border-2 border-black rounded-full px-3 py-1">
                          ${bounty.budget_min} - ${bounty.budget_max}
                        </span>
                        <span className={`border-2 rounded-full px-3 py-1 ${tierInfo.color}`}>
                          {tierInfo.badge} {tierInfo.label}
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
              );
            })}
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
    </div>
  )
}
