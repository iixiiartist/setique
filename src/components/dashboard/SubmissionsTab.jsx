import { Link } from 'react-router-dom'
import { FileText, Calendar, Clock, CheckCircle, XCircle, AlertCircle } from '../Icons'

export default function SubmissionsTab({ submissions }) {
  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'rejected':
        return <XCircle className="w-5 h-5 text-red-600" />
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-600" />
      default:
        return <AlertCircle className="w-5 h-5 text-gray-600" />
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return 'bg-green-200 text-green-800 border-green-900'
      case 'rejected':
        return 'bg-red-200 text-red-800 border-red-900'
      case 'pending':
        return 'bg-yellow-200 text-yellow-800 border-yellow-900'
      default:
        return 'bg-gray-200 text-gray-800 border-gray-900'
    }
  }

  const getStatusMessage = (status) => {
    switch (status) {
      case 'approved':
        return 'Your submission was approved! The reward has been credited to your account.'
      case 'rejected':
        return 'Your submission did not meet the requirements.'
      case 'pending':
        return 'Your submission is under review. The bounty poster will review it shortly.'
      default:
        return 'Submission status unknown.'
    }
  }

  return (
    <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
      <div className="border-b-4 border-black p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-black flex items-center gap-2">
            <FileText className="w-6 h-6" />
            My Bounty Submissions
          </h3>
          <span className="px-3 py-1 bg-purple-200 border-2 border-black font-bold text-sm">
            {submissions.length} Total
          </span>
        </div>
      </div>
      
      <div className="p-6">
        {submissions.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500 mb-4">You haven&apos;t submitted to any bounties yet.</p>
            <Link
              to="/dashboard?tab=bounties"
              className="inline-block px-6 py-3 bg-purple-400 hover:bg-purple-500 border-3 border-black font-bold transition shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-1 active:translate-y-1"
            >
              Browse Available Bounties
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {submissions.map((submission) => (
              <div
                key={submission.id}
                className="border-4 border-black p-6 bg-gradient-to-br from-white to-gray-50 hover:from-gray-50 hover:to-gray-100 transition"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-3 flex-1">
                    {getStatusIcon(submission.status)}
                    <div className="flex-1">
                      <Link
                        to={`/bounties/${submission.bounty_id}`}
                        className="text-xl font-black hover:underline mb-1 block"
                      >
                        {submission.bounty_title}
                      </Link>
                      <span className={`inline-block px-2 py-1 border-2 text-xs font-bold ${getStatusColor(submission.status)}`}>
                        {submission.status.toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <Link
                    to={`/dashboard/submissions/${submission.id}`}
                    className="px-4 py-2 bg-cyan-400 hover:bg-cyan-500 border-3 border-black font-bold text-sm transition shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-1 active:translate-y-1 whitespace-nowrap"
                  >
                    View Details
                  </Link>
                </div>

                {/* Submission Details */}
                <div className="mb-4 p-4 bg-white border-2 border-black">
                  <p className="text-sm text-gray-700 mb-2">
                    <span className="font-bold">Your Submission:</span>
                  </p>
                  <p className="text-sm text-gray-600 line-clamp-2">{submission.description}</p>
                </div>

                {/* Status Message */}
                <div className={`p-3 border-2 border-black mb-4 ${
                  submission.status === 'approved' ? 'bg-green-100' :
                  submission.status === 'rejected' ? 'bg-red-100' :
                  'bg-yellow-100'
                }`}>
                  <p className="text-sm font-semibold">{getStatusMessage(submission.status)}</p>
                </div>

                {/* Feedback from Poster */}
                {submission.feedback && (
                  <div className="p-4 bg-purple-50 border-2 border-black mb-4">
                    <p className="text-xs font-bold mb-1 text-purple-900">Feedback from Bounty Poster:</p>
                    <p className="text-sm text-gray-700">{submission.feedback}</p>
                  </div>
                )}

                {/* Metadata */}
                <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    Submitted: {new Date(submission.created_at).toLocaleDateString()}
                  </span>
                  {submission.reviewed_at && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      Reviewed: {new Date(submission.reviewed_at).toLocaleDateString()}
                    </span>
                  )}
                  {submission.status === 'approved' && submission.reward_amount && (
                    <span className="font-bold text-green-600">
                      Reward: ${submission.reward_amount}
                    </span>
                  )}
                </div>

                {/* Attached Dataset Link */}
                {submission.dataset_id && (
                  <div className="mt-4 pt-4 border-t-2 border-black">
                    <Link
                      to={`/datasets/${submission.dataset_id}`}
                      className="text-sm font-bold text-purple-600 hover:text-purple-800 hover:underline flex items-center gap-1"
                    >
                      <FileText className="w-4 h-4" />
                      View Submitted Dataset
                    </Link>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
