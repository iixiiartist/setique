import { Upload, Edit, Trash, Eye, EyeOff, Package, Star } from '../../Icons'

const badgeColors = {
  verified: 'bg-blue-100 text-blue-800 border-blue-800',
  expert: 'bg-purple-100 text-purple-800 border-purple-800',
  master: 'bg-yellow-100 text-yellow-800 border-yellow-800'
};

/**
 * DatasetsTab - Manage user's datasets with CRUD operations
 * 
 * @param {Object} props
 * @param {Array} props.myDatasets - User's datasets
 * @param {Array} props.deletionRequests - Pending/rejected deletion requests
 * @param {boolean} props.isAdmin - Whether user is admin
 * @param {boolean} props.actionLoading - Whether an action is in progress
 * @param {Function} props.handleToggleActive - Toggle dataset active status
 * @param {Function} props.handleEditDataset - Open edit modal with dataset
 * @param {Function} props.handleDeleteDataset - Delete dataset (admin only)
 * @param {Function} props.setDeletionModalDataset - Open deletion request modal
 * @param {Object} props.uploadModal - Modal state for upload modal
 */
export function DatasetsTab({
  myDatasets,
  deletionRequests,
  isAdmin,
  actionLoading,
  handleToggleActive,
  handleEditDataset,
  handleDeleteDataset,
  setDeletionModalDataset,
  uploadModal
}) {
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-2xl font-extrabold">My Datasets</h3>
        <button
          onClick={() => uploadModal.open()}
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
                      className="p-2 rounded-lg border-2 border-black hover:scale-110 transition bg-red-300"
                      title="Delete dataset"
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
            onClick={() => uploadModal.open()}
            className="bg-[linear-gradient(90deg,#ffea00,#00ffff)] text-black font-extrabold px-6 py-3 rounded-full border-2 border-black hover:scale-105 transition"
          >
            Create Your First Dataset
          </button>
        </div>
      )}
    </div>
  )
}
