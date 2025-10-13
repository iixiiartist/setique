import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Package, 
  ShoppingCart, 
  UserPlus, 
  Target, 
  FileText, 
  Heart,
  Award,
  Upload
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getDetailedActivityFeed } from '../lib/activityTracking';

/**
 * ActivityFeed - Displays recent activities from followed users
 * Shows: dataset publications, purchases, follows, bounties, favorites, etc.
 */
export default function ActivityFeed() {
  const { user } = useAuth();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchActivities = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await getDetailedActivityFeed(user.id, 50);
      setActivities(data);
      setError(null);
    } catch (err) {
      console.error('Error loading activity feed:', err);
      setError('Failed to load activity feed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Activity icon and color mapping
  const getActivityDisplay = (activity) => {
    const displays = {
      dataset_published: {
        icon: Package,
        color: 'bg-blue-400',
        text: 'published a new dataset',
        link: `/dataset/${activity.target_id}`
      },
      dataset_purchased: {
        icon: ShoppingCart,
        color: 'bg-green-400',
        text: 'purchased a dataset',
        link: `/dataset/${activity.target_id}`
      },
      user_followed: {
        icon: UserPlus,
        color: 'bg-purple-400',
        text: 'followed',
        link: `/profile/${activity.metadata?.username}`
      },
      bounty_created: {
        icon: Target,
        color: 'bg-orange-400',
        text: 'created a bounty',
        link: `/dashboard` // Could link to bounty detail if we had a bounty page
      },
      bounty_submission: {
        icon: Upload,
        color: 'bg-cyan-400',
        text: 'submitted to a bounty',
        link: `/dashboard`
      },
      proposal_submitted: {
        icon: FileText,
        color: 'bg-yellow-400',
        text: 'submitted a proposal',
        link: `/dashboard`
      },
      dataset_favorited: {
        icon: Heart,
        color: 'bg-red-400',
        text: 'favorited a dataset',
        link: `/dataset/${activity.target_id}`
      },
      curator_certified: {
        icon: Award,
        color: 'bg-pink-400',
        text: 'became a pro curator',
        link: `/profile/${activity.profiles?.username}`
      }
    };

    return displays[activity.activity_type] || {
      icon: Package,
      color: 'bg-gray-400',
      text: 'did something',
      link: '#'
    };
  };

  // Group activities by date
  const groupActivitiesByDate = () => {
    const groups = {};
    
    activities.forEach(activity => {
      const date = new Date(activity.created_at);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      let dateKey;
      if (date.toDateString() === today.toDateString()) {
        dateKey = 'Today';
      } else if (date.toDateString() === yesterday.toDateString()) {
        dateKey = 'Yesterday';
      } else {
        dateKey = date.toLocaleDateString('en-US', { 
          month: 'long', 
          day: 'numeric',
          year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
        });
      }

      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(activity);
    });

    return groups;
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border-4 border-red-600 p-6 text-center">
        <p className="font-bold text-red-800">{error}</p>
        <button
          onClick={fetchActivities}
          className="mt-4 bg-red-400 hover:bg-red-500 border-2 border-black px-4 py-2 font-bold"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="bg-white border-4 border-black p-12 text-center">
        <Package className="w-16 h-16 mx-auto mb-4 text-gray-400" />
        <h3 className="text-2xl font-black mb-2">No activities yet</h3>
        <p className="text-gray-600 mb-6">
          Follow other users to see their activities here!
        </p>
        <Link
          to="/discover"
          className="inline-block bg-purple-400 hover:bg-purple-500 border-4 border-black px-6 py-3 font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
        >
          Discover Users
        </Link>
      </div>
    );
  }

  const groupedActivities = groupActivitiesByDate();

  return (
    <div className="space-y-6">
      {Object.entries(groupedActivities).map(([dateKey, dateActivities]) => (
        <div key={dateKey}>
          <h3 className="text-xl font-black mb-4 sticky top-0 bg-gradient-to-br from-purple-50 to-blue-50 py-2 z-10">
            {dateKey}
          </h3>
          <div className="space-y-3">
            {dateActivities.map((activity) => {
              const display = getActivityDisplay(activity);
              const Icon = display.icon;
              const profile = activity.profiles;

              return (
                <div
                  key={activity.id}
                  className="bg-white border-4 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
                >
                  <div className="flex items-start gap-4">
                    {/* Activity Icon */}
                    <div className={`${display.color} border-2 border-black p-2 flex-shrink-0`}>
                      <Icon className="w-5 h-5" />
                    </div>

                    {/* Activity Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Link
                            to={`/profile/${profile?.username}`}
                            className="font-bold hover:underline"
                          >
                            {profile?.display_name || profile?.username}
                          </Link>
                          <span className="text-gray-600">{display.text}</span>
                          {activity.metadata?.username && activity.activity_type === 'user_followed' && (
                            <Link
                              to={`/profile/${activity.metadata.username}`}
                              className="font-bold hover:underline text-purple-600"
                            >
                              @{activity.metadata.username}
                            </Link>
                          )}
                        </div>
                        <span className="text-xs text-gray-500 whitespace-nowrap">
                          {formatTime(activity.created_at)}
                        </span>
                      </div>

                      {/* Activity Details */}
                      {activity.metadata?.title && (
                        <Link
                          to={display.link}
                          className="block text-lg font-bold hover:underline mb-1"
                        >
                          {activity.metadata.title}
                        </Link>
                      )}
                      
                      {activity.metadata?.price && (
                        <span className="inline-block bg-yellow-200 border-2 border-black px-2 py-1 text-sm font-bold">
                          💰 ${activity.metadata.price}
                        </span>
                      )}
                      
                      {activity.metadata?.budget_max && (
                        <span className="inline-block bg-green-200 border-2 border-black px-2 py-1 text-sm font-bold">
                          🎯 Budget: ${activity.metadata.budget_max}
                        </span>
                      )}
                      
                      {activity.metadata?.badge_level && (
                        <span className="inline-block bg-pink-200 border-2 border-black px-2 py-1 text-sm font-bold">
                          ⭐ {activity.metadata.badge_level}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
