import { Database } from '../../Icons'

/**
 * SubmissionsTab - Display and manage bounty submissions
 * 
 * @param {Object} props
 * @param {Array} props.mySubmissions - User's bounty submissions
 * @param {Function} props.handleDeleteBountySubmission - Delete a submission
 * @param {Function} props.navigate - Navigation function
 */
export function SubmissionsTab({ 
  mySubmissions,
  handleDeleteBountySubmission,
  navigate
}) {
  return (
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
                <div className="ml-4 flex flex-col gap-2">
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
                  <button
                    onClick={() => handleDeleteBountySubmission(submission.id, submission.datasets?.title)}
                    className="bg-red-500 hover:bg-red-600 text-white font-bold px-4 py-2 rounded-full text-sm border-2 border-black transition whitespace-nowrap"
                  >
                    🗑️ Delete
                  </button>
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
  )
}
