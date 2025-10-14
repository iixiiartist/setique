import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { supabase } from '../lib/supabase';
import {
  getRecentNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  subscribeToNotifications,
} from '../lib/notificationService';
import { useAuth } from '../contexts/AuthContext';

/**
 * NotificationBell Component
 * Displays bell icon with unread count badge and dropdown panel
 * Features:
 * - Real-time updates via Supabase subscriptions
 * - Unread count badge
 * - Dropdown panel with recent 10 notifications
 * - Click notification to mark as read and navigate
 * - "View All" link to full notifications page
 * - "Mark All Read" button
 */
export default function NotificationBell() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const dropdownRef = useRef(null);

  // Fetch notifications and unread count
  const fetchNotifications = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    const [notifs, count] = await Promise.all([
      getRecentNotifications(10),
      getUnreadCount(),
    ]);

    setNotifications(notifs);
    setUnreadCount(count);
    setLoading(false);
  }, [user]);

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
      async (newNotification) => {
        setNotifications((prev) => [newNotification, ...prev.slice(0, 9)]);
        setUnreadCount((prev) => prev + 1);
      },
      // onUpdate: Notification marked as read
      (updatedNotification) => {
        setNotifications((prev) =>
          prev.map((n) => (n.id === updatedNotification.id ? updatedNotification : n))
        );
        if (updatedNotification.read) {
          setUnreadCount((prev) => Math.max(0, prev - 1));
        }
      }
    );

    return () => unsubscribe();
  }, [user]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle notification click
  const handleNotificationClick = async (notification) => {
    // Mark as read
    if (!notification.read) {
      await markAsRead(notification.id);
    }

    // Close dropdown
    setIsOpen(false);

    // Navigate based on activity type and target
    switch (notification.activity_type) {
      case 'comment_added':
      case 'comment_reply':
        // Navigate to dataset page - need to get dataset ID
        if (notification.target_type === 'comment') {
          // Fetch the comment to get dataset_id
          const { data: comment } = await supabase
            .from('dataset_comments')
            .select('dataset_id')
            .eq('id', notification.target_id)
            .single();
          
          if (comment?.dataset_id) {
            navigate(`/datasets?id=${comment.dataset_id}`);
          }
        } else if (notification.target_type === 'dataset') {
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
        // Need to fetch username from actor_id
        if (notification.actor_id) {
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
      default:
        // Just close dropdown
        break;
    }
  };

  // Handle mark all as read
  const handleMarkAllRead = async () => {
    await markAllAsRead();
    setUnreadCount(0);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
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

  if (!user) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Icon Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-6 h-6 text-gray-700" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full border-2 border-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white border-4 border-black rounded-lg shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] z-50">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b-4 border-black">
            <h3 className="text-xl font-black">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="max-h-[400px] overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center text-gray-500">
                Loading notifications...
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Bell className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p className="font-bold">No notifications yet</p>
                <p className="text-sm">We&apos;ll notify you when something happens</p>
              </div>
            ) : (
              notifications.map((notification) => {
                const style = getActivityStyle(notification.activity_type);
                return (
                  <button
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`w-full p-4 text-left border-b-2 border-gray-200 hover:bg-gray-50 transition-colors ${
                      !notification.read ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex gap-3">
                      {/* Activity Icon */}
                      <div
                        className={`flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full ${style.color}`}
                      >
                        <span className="text-xl">{style.icon}</span>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-900 mb-1">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatTimeAgo(notification.created_at)}
                        </p>
                      </div>

                      {/* Unread Indicator */}
                      {!notification.read && (
                        <div className="flex-shrink-0 w-2 h-2 bg-blue-600 rounded-full mt-2" />
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-4 border-t-4 border-black">
              <button
                onClick={() => {
                  setIsOpen(false);
                  navigate('/notifications');
                }}
                className="w-full text-center text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors"
              >
                View all notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
