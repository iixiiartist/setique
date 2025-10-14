import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Check, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import {
  getAllNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  subscribeToNotifications,
} from '../lib/notificationService';
import { useAuth } from '../contexts/AuthContext';

/**
 * NotificationsPage Component
 * Full page view of all user notifications
 * Features:
 * - Filter tabs (All/Unread)
 * - Notification list with activity icons
 * - Mark individual notifications as read
 * - Mark all as read
 * - Delete notifications
 * - Pagination
 * - Real-time updates
 */
export default function NotificationsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState('all'); // 'all' or 'unread'
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const pageSize = 20;

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    const { notifications: notifs, total: totalCount } = await getAllNotifications(
      page,
      pageSize,
      filter === 'unread'
    );

    setNotifications(notifs);
    setTotal(totalCount);
    setLoading(false);
  }, [user, page, filter]);

  // Initial fetch
  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user, fetchNotifications]);

  // Real-time subscription
  useEffect(() => {
    if (!user) return;

    const unsubscribe = subscribeToNotifications(
      user.id,
      // onInsert: New notification received
      (newNotification) => {
        setNotifications((prev) => [newNotification, ...prev]);
        setTotal((prev) => prev + 1);
      },
      // onUpdate: Notification updated
      (updatedNotification) => {
        setNotifications((prev) =>
          prev.map((n) => (n.id === updatedNotification.id ? updatedNotification : n))
        );
      }
    );

    return () => unsubscribe();
  }, [user]);

  // Handle notification click
  const handleNotificationClick = async (notification) => {
    // Mark as read
    if (!notification.read) {
      await markAsRead(notification.id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notification.id ? { ...n, read: true } : n))
      );
    }

    // Navigate based on activity type and target
    switch (notification.activity_type) {
      case 'comment_added':
      case 'comment_reply':
        // Navigate to dataset page with comment highlighted
        if (notification.dataset?.id) {
          navigate(`/datasets?id=${notification.dataset.id}`);
        } else if (notification.target_type === 'dataset' && notification.target_id) {
          navigate(`/datasets?id=${notification.target_id}`);
        }
        break;
      case 'dataset_purchased':
      case 'dataset_favorited':
        if (notification.target_id) {
          navigate(`/datasets?id=${notification.target_id}`);
        }
        break;
      case 'bounty_submission':
      case 'proposal_submitted':
        if (notification.target_id) {
          navigate(`/bounties/${notification.target_id}`);
        }
        break;
      case 'user_followed':
        // Navigate to actor's profile using their username
        if (notification.actor?.username) {
          navigate(`/profile/${notification.actor.username}`);
        } else if (notification.actor_id) {
          // Fallback: fetch username if not in enriched data
          const { data: actorProfile } = await supabase
            .from('profiles')
            .select('username')
            .eq('id', notification.actor_id)
            .single();
          
          if (actorProfile?.username) {
            navigate(`/profile/${actorProfile.username}`);
          }
        }
        break;
      case 'review_added':
        // Navigate to dataset reviews tab
        if (notification.dataset?.id) {
          navigate(`/datasets?id=${notification.dataset.id}&tab=reviews`);
        } else if (notification.target_type === 'review' && notification.target_id) {
          // Fetch dataset_id from review
          const { data: review } = await supabase
            .from('dataset_reviews')
            .select('dataset_id')
            .eq('id', notification.target_id)
            .single();
          
          if (review?.dataset_id) {
            navigate(`/datasets?id=${review.dataset_id}&tab=reviews`);
          }
        } else if (notification.target_type === 'dataset' && notification.target_id) {
          navigate(`/datasets?id=${notification.target_id}&tab=reviews`);
        }
        break;
      default:
        break;
    }
  };

  // Handle mark all as read
  const handleMarkAllRead = async () => {
    await markAllAsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  // Handle delete notification
  const handleDelete = async (notificationId, event) => {
    event.stopPropagation();
    await deleteNotification(notificationId);
    setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
    setTotal((prev) => prev - 1);
  };

  // Get icon and color for activity type
  const getActivityStyle = (activityType) => {
    switch (activityType) {
      case 'dataset_purchased':
        return { icon: '💰', color: 'bg-green-100 text-green-600' };
      case 'dataset_favorited':
        return { icon: '❤️', color: 'bg-pink-100 text-pink-600' };
      case 'user_followed':
        return { icon: '👤', color: 'bg-blue-100 text-blue-600' };
      case 'bounty_submission':
        return { icon: '📝', color: 'bg-purple-100 text-purple-600' };
      case 'proposal_submitted':
        return { icon: '💡', color: 'bg-yellow-100 text-yellow-600' };
      case 'comment_added':
        return { icon: '💬', color: 'bg-indigo-100 text-indigo-600' };
      case 'review_added':
        return { icon: '⭐', color: 'bg-amber-100 text-amber-600' };
      default:
        return { icon: '🔔', color: 'bg-gray-100 text-gray-600' };
    }
  };

  // Format time ago
  const formatTimeAgo = (timestamp) => {
    const seconds = Math.floor((new Date() - new Date(timestamp)) / 1000);
    
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  // Calculate pagination
  const totalPages = Math.ceil(total / pageSize);
  const unreadCount = notifications.filter((n) => !n.read).length;

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white border-4 border-black rounded-lg shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-8 text-center">
            <p className="text-xl font-bold">Please log in to view notifications</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-black mb-2">Notifications</h1>
          <p className="text-gray-600 font-bold">
            Stay updated with your activity and interactions
          </p>
        </div>

        {/* Filters and Actions */}
        <div className="bg-white border-4 border-black rounded-lg shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] mb-8">
          <div className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            {/* Filter Tabs */}
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setFilter('all');
                  setPage(0);
                }}
                className={`px-6 py-2 font-bold border-4 border-black rounded-lg transition-all ${
                  filter === 'all'
                    ? 'bg-black text-white'
                    : 'bg-white hover:bg-gray-100'
                }`}
              >
                All ({total})
              </button>
              <button
                onClick={() => {
                  setFilter('unread');
                  setPage(0);
                }}
                className={`px-6 py-2 font-bold border-4 border-black rounded-lg transition-all ${
                  filter === 'unread'
                    ? 'bg-black text-white'
                    : 'bg-white hover:bg-gray-100'
                }`}
              >
                Unread ({unreadCount})
              </button>
            </div>

            {/* Mark All Read Button */}
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="flex items-center gap-2 px-6 py-2 font-bold text-blue-600 border-4 border-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
              >
                <Check className="w-5 h-5" />
                Mark all as read
              </button>
            )}
          </div>
        </div>

        {/* Notifications List */}
        <div className="bg-white border-4 border-black rounded-lg shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          {loading ? (
            <div className="p-12 text-center text-gray-500">
              <Bell className="w-16 h-16 mx-auto mb-4 text-gray-300 animate-pulse" />
              <p className="font-bold">Loading notifications...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <Bell className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-xl font-bold mb-2">
                {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
              </p>
              <p className="text-sm">
                {filter === 'unread'
                  ? 'All caught up! Check back later.'
                  : "We'll notify you when something happens"}
              </p>
            </div>
          ) : (
            <>
              {notifications.map((notification, index) => {
                const style = getActivityStyle(notification.activity_type);
                const isLast = index === notifications.length - 1;

                return (
                  <div
                    key={notification.id}
                    className={`relative ${!isLast ? 'border-b-4 border-black' : ''}`}
                  >
                    <button
                      onClick={() => handleNotificationClick(notification)}
                      className={`w-full p-6 text-left hover:bg-gray-50 transition-colors ${
                        !notification.read ? 'bg-blue-50' : ''
                      }`}
                    >
                      <div className="flex gap-4">
                        {/* User Avatar */}
                        <div className="flex-shrink-0">
                          {notification.actor?.avatar_url ? (
                            <img
                              src={notification.actor.avatar_url}
                              alt={notification.actor.username}
                              className="w-14 h-14 rounded-full border-4 border-black object-cover"
                            />
                          ) : (
                            <div className="w-14 h-14 rounded-full border-4 border-black bg-gradient-to-br from-purple-400 via-blue-400 to-pink-400 flex items-center justify-center">
                              <span className="text-2xl font-bold text-white">
                                {notification.actor?.username?.[0]?.toUpperCase() || '?'}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start gap-3 mb-2">
                            {/* Activity Icon Badge */}
                            <div
                              className={`flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full ${style.color} border-2 border-black`}
                            >
                              <span className="text-base">{style.icon}</span>
                            </div>

                            {/* Message with enhanced formatting */}
                            <div className="flex-1">
                              <p className="text-base font-bold text-gray-900">
                                {notification.actor?.username && (
                                  <span className="text-blue-600 hover:underline mr-1">
                                    @{notification.actor.username}
                                    {notification.actor.is_pro_curator && (
                                      <span className="ml-1 text-xs bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-2 py-0.5 rounded-full border-2 border-black">
                                        PRO
                                      </span>
                                    )}
                                  </span>
                                )}
                                <span className="text-gray-700">
                                  {notification.activity_type === 'comment_added' && ' commented on '}
                                  {notification.activity_type === 'comment_reply' && ' replied to your comment on '}
                                  {notification.activity_type === 'dataset_purchased' && ' purchased '}
                                  {notification.activity_type === 'dataset_favorited' && ' favorited '}
                                  {notification.activity_type === 'user_followed' && ' followed you'}
                                  {notification.activity_type === 'bounty_submission' && ' submitted to '}
                                  {notification.activity_type === 'review_added' && ' reviewed '}
                                </span>
                                {notification.dataset?.title && (
                                  <span className="text-purple-600 hover:underline font-bold">
                                    {notification.dataset.title}
                                  </span>
                                )}
                              </p>
                              
                              {/* Timestamp and activity type label */}
                              <div className="flex items-center gap-2 mt-1">
                                <p className="text-sm text-gray-500 font-medium">
                                  {formatTimeAgo(notification.created_at)}
                                </p>
                                <span className="text-gray-300">•</span>
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">
                                  {notification.activity_type.replace(/_/g, ' ')}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex-shrink-0 flex items-start gap-2 pt-1">
                          {/* Unread Indicator */}
                          {!notification.read && (
                            <div className="w-3 h-3 bg-blue-600 rounded-full animate-pulse" />
                          )}

                          {/* Delete Button */}
                          <button
                            onClick={(e) => handleDelete(notification.id, e)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            aria-label="Delete notification"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </button>
                  </div>
                );
              })}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="p-6 border-t-4 border-black flex items-center justify-between">
                  <button
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={page === 0}
                    className="px-6 py-2 font-bold border-4 border-black rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
                  >
                    Previous
                  </button>
                  <span className="font-bold text-gray-600">
                    Page {page + 1} of {totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                    disabled={page >= totalPages - 1}
                    className="px-6 py-2 font-bold border-4 border-black rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
