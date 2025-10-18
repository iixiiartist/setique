import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Heart, Calendar, Trash2, Download, DollarSign } from '../Icons'

export default function FavoritesTab({ favorites, onRemoveFavorite }) {
  const [removingId, setRemovingId] = useState(null)

  const handleRemove = async (favoriteId) => {
    setRemovingId(favoriteId)
    await onRemoveFavorite(favoriteId)
    setRemovingId(null)
  }

  return (
    <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
      <div className="border-b-4 border-black p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-black flex items-center gap-2">
              <Heart className="w-6 h-6 text-pink-500" />
              My Favorites
            </h3>
            <p className="text-sm text-gray-600 mt-1">Datasets you&apos;ve saved for later</p>
          </div>
          <span className="px-3 py-1 bg-pink-200 border-2 border-black font-bold text-sm">
            {favorites.length} Saved
          </span>
        </div>
      </div>
      
      <div className="p-6">
        {favorites.length === 0 ? (
          <div className="text-center py-12">
            <Heart className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500 mb-2">No favorites yet!</p>
            <p className="text-sm text-gray-400 mb-6">
              Start exploring and save datasets you&apos;re interested in for quick access later.
            </p>
            <Link
              to="/datasets"
              className="inline-block px-6 py-3 bg-pink-400 hover:bg-pink-500 border-3 border-black font-bold transition shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-1 active:translate-y-1"
            >
              Browse Datasets
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {favorites.map((favorite) => (
              <div
                key={favorite.id}
                className="border-4 border-black bg-gradient-to-br from-white to-pink-50 hover:from-pink-50 hover:to-pink-100 transition overflow-hidden"
              >
                {/* Dataset Preview Image */}
                {favorite.dataset?.preview_image_url && (
                  <div className="border-b-4 border-black">
                    <img
                      src={favorite.dataset.preview_image_url}
                      alt={favorite.dataset.title}
                      className="w-full h-48 object-cover"
                    />
                  </div>
                )}

                <div className="p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <Link
                      to={`/datasets/${favorite.dataset_id}`}
                      className="flex-1"
                    >
                      <h4 className="text-xl font-black hover:underline mb-1">
                        {favorite.dataset?.title || 'Untitled Dataset'}
                      </h4>
                      <p className="text-sm text-gray-600">
                        by {favorite.dataset?.creator_username || 'Anonymous'}
                      </p>
                    </Link>
                    <button
                      onClick={() => handleRemove(favorite.id)}
                      disabled={removingId === favorite.id}
                      className="p-2 bg-red-200 hover:bg-red-300 border-2 border-black transition disabled:opacity-50"
                      title="Remove from favorites"
                    >
                      <Trash2 className="w-4 h-4 text-red-800" />
                    </button>
                  </div>

                  {/* Description */}
                  {favorite.dataset?.description && (
                    <p className="text-sm text-gray-700 mb-4 line-clamp-2">
                      {favorite.dataset.description}
                    </p>
                  )}

                  {/* Metadata */}
                  <div className="flex flex-wrap gap-3 text-sm mb-4">
                    {favorite.dataset?.price !== undefined && (
                      <span className="flex items-center gap-1 px-2 py-1 bg-green-200 border-2 border-black font-bold">
                        <DollarSign className="w-4 h-4" />
                        ${favorite.dataset.price}
                      </span>
                    )}
                    {favorite.dataset?.download_count !== undefined && (
                      <span className="flex items-center gap-1 px-2 py-1 bg-blue-200 border-2 border-black font-bold">
                        <Download className="w-4 h-4" />
                        {favorite.dataset.download_count}
                      </span>
                    )}
                  </div>

                  {/* Saved Date */}
                  <div className="flex items-center gap-1 text-xs text-gray-500 mb-4">
                    <Calendar className="w-3 h-3" />
                    Saved {new Date(favorite.created_at).toLocaleDateString()}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Link
                      to={`/datasets/${favorite.dataset_id}`}
                      className="flex-1 px-4 py-2 bg-purple-400 hover:bg-purple-500 border-3 border-black font-bold text-center transition shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-1 active:translate-y-1"
                    >
                      View Dataset
                    </Link>
                    {favorite.dataset?.is_purchased && (
                      <Link
                        to={`/datasets/${favorite.dataset_id}/download`}
                        className="px-4 py-2 bg-green-400 hover:bg-green-500 border-3 border-black font-bold transition shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-1 active:translate-y-1"
                        title="Download"
                      >
                        <Download className="w-5 h-5" />
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
  )
}
