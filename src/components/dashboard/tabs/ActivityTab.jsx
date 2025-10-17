import ActivityFeed from '../../ActivityFeed'

/**
 * ActivityTab - Display activity feed from followed users
 * 
 * Simple wrapper around ActivityFeed component
 */
export function ActivityTab() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-2xl font-extrabold">Activity Feed</h3>
        <p className="text-sm text-black/70">
          See what curators and buyers you follow are up to
        </p>
      </div>
      
      <ActivityFeed />
    </div>
  )
}
