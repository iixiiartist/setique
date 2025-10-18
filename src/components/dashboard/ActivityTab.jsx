import ActivityFeed from '../ActivityFeed'

export default function ActivityTab({ activities }) {
  return (
    <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
      <div className="border-b-4 border-black p-6">
        <h3 className="text-2xl font-black">Activity Feed</h3>
        <p className="text-sm text-gray-600 mt-1">Your recent activity and interactions on SETIQUE</p>
      </div>
      <div className="p-6">
        <ActivityFeed activities={activities} />
      </div>
    </div>
  )
}
