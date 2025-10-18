import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Target, Calendar, DollarSign, Users, Clock, CheckCircle } from '../Icons'

export default function BountiesTab({ availableBounties, myPostedBounties, onClaimBounty }) {
  const [claimingBountyId, setClaimingBountyId] = useState(null)

  const handleClaim = async (bountyId) => {
    setClaimingBountyId(bountyId)
    await onClaimBounty(bountyId)
    setClaimingBountyId(null)
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-200 text-green-800 border-green-900'
      case 'in_progress':
        return 'bg-yellow-200 text-yellow-800 border-yellow-900'
      case 'completed':
        return 'bg-blue-200 text-blue-800 border-blue-900'
      case 'cancelled':
        return 'bg-gray-200 text-gray-800 border-gray-900'
      default:
        return 'bg-gray-200 text-gray-800 border-gray-900'
    }
  }

  return (
    <div className="space-y-8">
      {/* Available Bounties */}
      <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <div className="border-b-4 border-black p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-black flex items-center gap-2">
              <Target className="w-6 h-6" />
              Available Bounties
            </h3>
            <span className="px-3 py-1 bg-cyan-200 border-2 border-black font-bold text-sm">
              {availableBounties.length} Active
            </span>
          </div>
        </div>
        <div className="p-6">
          {availableBounties.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No active bounties available. Check back later!</p>
          ) : (
            <div className="space-y-4">
              {availableBounties.map((bounty) => (
                <div
                  key={bounty.id}
                  className="border-4 border-black p-6 bg-gradient-to-br from-cyan-50 to-purple-50 hover:from-cyan-100 hover:to-purple-100 transition"
                >
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div className="flex-1">
                      <h4 className="text-xl font-black mb-2">{bounty.title}</h4>
                      <p className="text-sm text-gray-700 mb-3">{bounty.description}</p>
                      
                      <div className="flex flex-wrap gap-3 text-sm">
                        <span className="flex items-center gap-1 text-gray-600">
                          <DollarSign className="w-4 h-4" />
                          <span className="font-bold">${bounty.reward_amount}</span>
                        </span>
                        <span className="flex items-center gap-1 text-gray-600">
                          <Calendar className="w-4 h-4" />
                          Expires {new Date(bounty.expiry_date).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1 text-gray-600">
                          <Users className="w-4 h-4" />
                          {bounty.submission_count || 0} submissions
                        </span>
                      </div>

                      {bounty.requirements && (
                        <div className="mt-3 p-3 bg-white border-2 border-black">
                          <p className="text-xs font-bold mb-1">Requirements:</p>
                          <p className="text-xs text-gray-700">{bounty.requirements}</p>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-2">
                      <Link
                        to={`/bounties/${bounty.id}`}
                        className="px-4 py-2 bg-purple-400 hover:bg-purple-500 border-3 border-black font-bold text-center transition shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-1 active:translate-y-1 whitespace-nowrap"
                      >
                        View Details
                      </Link>
                      <button
                        onClick={() => handleClaim(bounty.id)}
                        disabled={claimingBountyId === bounty.id}
                        className="px-4 py-2 bg-green-400 hover:bg-green-500 border-3 border-black font-bold transition shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-1 active:translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                      >
                        {claimingBountyId === bounty.id ? 'Claiming...' : 'Claim Bounty'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bounties I Posted */}
      <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <div className="border-b-4 border-black p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-black">Bounties I Posted</h3>
            <Link
              to="/bounties/create"
              className="px-4 py-2 bg-yellow-400 hover:bg-yellow-500 border-3 border-black font-bold text-sm transition shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-1 active:translate-y-1"
            >
              Post New Bounty
            </Link>
          </div>
        </div>
        <div className="p-6">
          {myPostedBounties.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">You haven&apos;t posted any bounties yet.</p>
              <Link
                to="/bounties/create"
                className="inline-block px-6 py-3 bg-cyan-400 hover:bg-cyan-500 border-3 border-black font-bold transition shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-1 active:translate-y-1"
              >
                Post Your First Bounty
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {myPostedBounties.map((bounty) => (
                <div
                  key={bounty.id}
                  className="border-4 border-black p-6 bg-white hover:bg-gray-50 transition"
                >
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="text-xl font-black">{bounty.title}</h4>
                        <span className={`px-2 py-1 border-2 text-xs font-bold ${getStatusColor(bounty.status)}`}>
                          {bounty.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                      
                      <p className="text-sm text-gray-700 mb-3">{bounty.description}</p>
                      
                      <div className="flex flex-wrap gap-3 text-sm">
                        <span className="flex items-center gap-1 text-gray-600">
                          <DollarSign className="w-4 h-4" />
                          <span className="font-bold">${bounty.reward_amount}</span>
                        </span>
                        <span className="flex items-center gap-1 text-gray-600">
                          <Clock className="w-4 h-4" />
                          Posted {new Date(bounty.created_at).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1 text-gray-600">
                          <Users className="w-4 h-4" />
                          {bounty.submission_count || 0} submissions
                        </span>
                        {bounty.status === 'completed' && (
                          <span className="flex items-center gap-1 text-green-600 font-bold">
                            <CheckCircle className="w-4 h-4" />
                            Completed
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <Link
                        to={`/dashboard/bounties/${bounty.id}`}
                        className="px-4 py-2 bg-purple-400 hover:bg-purple-500 border-3 border-black font-bold text-center transition shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-1 active:translate-y-1 whitespace-nowrap"
                      >
                        Manage Bounty
                      </Link>
                      {bounty.submission_count > 0 && (
                        <Link
                          to={`/dashboard/bounties/${bounty.id}/submissions`}
                          className="px-4 py-2 bg-cyan-400 hover:bg-cyan-500 border-3 border-black font-bold text-center transition shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-1 active:translate-y-1 whitespace-nowrap"
                        >
                          View Submissions
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
