import { Star } from '../../Icons'

/**
 * FavoritesTab - Display and manage favorite datasets
 * 
 * @param {Object} props
 * @param {Array} props.myFavorites - User's favorited datasets
 * @param {Function} props.navigate - Navigation function
 */
export function FavoritesTab({ myFavorites, navigate }) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-2xl font-extrabold">My Favorites</h3>
        <p className="text-sm text-black/70">
          {myFavorites.length} dataset{myFavorites.length !== 1 ? 's' : ''} bookmarked
        </p>
      </div>

      {myFavorites.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 border-2 border-black rounded-xl">
          <Star className="h-16 w-16 mx-auto mb-4 text-black/30" />
          <p className="text-lg font-bold text-black/60">
            No favorites yet!
          </p>
          <p className="text-sm text-black/50 mt-2">
            Browse datasets and click the heart icon to save them here
          </p>
          <button
            onClick={() => navigate('/')}
            className="mt-4 bg-[linear-gradient(90deg,#ff00c3,#00ffff)] text-white font-extrabold px-6 py-3 rounded-full border-2 border-black hover:scale-105 transition"
          >
            Browse Datasets
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {myFavorites.map(favorite => {
            const dataset = favorite.datasets;
            if (!dataset) return null;
            
            return (
              <div
                key={favorite.id}
                className="bg-white border-4 border-black rounded-xl p-6 shadow-[4px_4px_0_#000] hover:shadow-[8px_8px_0_#000] transition-all"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="text-xl font-extrabold">{dataset.title}</h4>
                      <span className="px-3 py-1 rounded-full text-xs font-bold border-2 border-black bg-yellow-100 text-yellow-800">
                        {dataset.modality}
                      </span>
                    </div>
                    
                    <p className="text-black/70 mb-4 line-clamp-2">
                      {dataset.description}
                    </p>
                    
                    <div className="flex items-center gap-4 text-sm">
                      <span className="font-bold text-lg text-purple-600">
                        ${dataset.price}
                      </span>
                      <span className="text-black/60">
                        by {dataset.profiles?.username || 'Unknown'}
                      </span>
                      <span className="text-black/60">
                        {dataset.purchase_count || 0} purchases
                      </span>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => navigate(`/datasets/${dataset.id}`)}
                    className="bg-[linear-gradient(90deg,#ff00c3,#00ffff)] text-white font-extrabold px-6 py-3 rounded-full border-2 border-black hover:scale-105 transition whitespace-nowrap"
                  >
                    View Details
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  )
}
