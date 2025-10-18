import { Link } from 'react-router-dom'
import { Sparkles, Calendar, Clock, CheckCircle, XCircle, DollarSign } from '../Icons'

export default function CurationRequestsTab({ requests }) {
  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'rejected':
        return <XCircle className="w-5 h-5 text-red-600" />
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-600" />
      default:
        return <Sparkles className="w-5 h-5 text-gray-600" />
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
        return 'Your dataset has been approved for pro curation! You can now earn revenue from curation partnerships.'
      case 'rejected':
        return 'Your curation request was not approved. Please review the feedback and try again.'
      case 'pending':
        return 'Your request is under review by the SETIQUE curation team. We\'ll notify you once it\'s reviewed.'
      default:
        return 'Request status unknown.'
    }
  }

  return (
    <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
      <div className="border-b-4 border-black p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-black flex items-center gap-2">
            <Sparkles className="w-6 h-6" />
            My Curation Requests
          </h3>
          <span className="px-3 py-1 bg-purple-200 border-2 border-black font-bold text-sm">
            {requests.length} Total
          </span>
        </div>
      </div>
      
      <div className="p-6">
        {requests.length === 0 ? (
          <div className="text-center py-12">
            <Sparkles className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500 mb-2">You haven&apos;t submitted any curation requests yet.</p>
            <p className="text-sm text-gray-400 mb-6">Apply for pro curation to unlock revenue sharing opportunities!</p>
            <Link
              to="/curation/apply"
              className="inline-block px-6 py-3 bg-purple-400 hover:bg-purple-500 border-3 border-black font-bold transition shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-1 active:translate-y-1"
            >
              Apply for Pro Curation
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((request) => (
              <div
                key={request.id}
                className="border-4 border-black p-6 bg-gradient-to-br from-white to-purple-50 hover:from-purple-50 hover:to-purple-100 transition"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-3 flex-1">
                    {getStatusIcon(request.status)}
                    <div className="flex-1">
                      <Link
                        to={`/datasets/${request.dataset_id}`}
                        className="text-xl font-black hover:underline mb-1 block"
                      >
                        {request.dataset_title}
                      </Link>
                      <span className={`inline-block px-2 py-1 border-2 text-xs font-bold ${getStatusColor(request.status)}`}>
                        {request.status.toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <Link
                    to={`/datasets/${request.dataset_id}`}
                    className="px-4 py-2 bg-cyan-400 hover:bg-cyan-500 border-3 border-black font-bold text-sm transition shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-1 active:translate-y-1 whitespace-nowrap"
                  >
                    View Dataset
                  </Link>
                </div>

                {/* Status Message */}
                <div className={`p-3 border-2 border-black mb-4 ${
                  request.status === 'approved' ? 'bg-green-100' :
                  request.status === 'rejected' ? 'bg-red-100' :
                  'bg-yellow-100'
                }`}>
                  <p className="text-sm font-semibold">{getStatusMessage(request.status)}</p>
                </div>

                {/* Application Details */}
                {request.application_notes && (
                  <div className="mb-4 p-4 bg-white border-2 border-black">
                    <p className="text-sm font-bold mb-2">Your Application:</p>
                    <p className="text-sm text-gray-700">{request.application_notes}</p>
                  </div>
                )}

                {/* Admin Feedback */}
                {request.admin_feedback && (
                  <div className="p-4 bg-purple-100 border-2 border-black mb-4">
                    <p className="text-xs font-bold mb-1 text-purple-900">Feedback from Curation Team:</p>
                    <p className="text-sm text-gray-700">{request.admin_feedback}</p>
                  </div>
                )}

                {/* Metadata */}
                <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    Applied: {new Date(request.created_at).toLocaleDateString()}
                  </span>
                  {request.reviewed_at && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      Reviewed: {new Date(request.reviewed_at).toLocaleDateString()}
                    </span>
                  )}
                  {request.status === 'approved' && request.revenue_share_percentage && (
                    <span className="flex items-center gap-1 font-bold text-green-600">
                      <DollarSign className="w-4 h-4" />
                      Revenue Share: {request.revenue_share_percentage}%
                    </span>
                  )}
                </div>

                {/* Approved Actions */}
                {request.status === 'approved' && (
                  <div className="mt-4 pt-4 border-t-2 border-black">
                    <div className="flex gap-3">
                      <Link
                        to={`/dashboard/curation/${request.id}/partnerships`}
                        className="px-4 py-2 bg-green-400 hover:bg-green-500 border-3 border-black font-bold text-sm transition shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-1 active:translate-y-1"
                      >
                        View Partnerships
                      </Link>
                      <Link
                        to={`/dashboard/curation/${request.id}/analytics`}
                        className="px-4 py-2 bg-cyan-400 hover:bg-cyan-500 border-3 border-black font-bold text-sm transition shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-1 active:translate-y-1"
                      >
                        View Analytics
                      </Link>
                    </div>
                  </div>
                )}

                {/* Rejected - Reapply Option */}
                {request.status === 'rejected' && (
                  <div className="mt-4 pt-4 border-t-2 border-black">
                    <Link
                      to={`/curation/reapply?dataset=${request.dataset_id}`}
                      className="inline-block px-4 py-2 bg-yellow-400 hover:bg-yellow-500 border-3 border-black font-bold text-sm transition shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-1 active:translate-y-1"
                    >
                      Reapply for Curation
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
