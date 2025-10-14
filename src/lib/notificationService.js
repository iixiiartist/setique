import { supabase } from './supabase';

/**
 * Notification Service
 * Handles all notification-related operations
 * 
 * Activity Types:
 * - dataset_purchased: Someone bought your dataset
 * - dataset_favorited: Someone favorited your dataset
 * - user_followed: Someone followed you
 * - bounty_submission: Someone submitted to your bounty
 * - proposal_submitted: Someone submitted a proposal
 * - comment_added: Someone commented on your content
 * - review_added: Someone reviewed your dataset
 */

/**
 * Create a notification for a user
 * @param {string} userId - The user to notify
 * @param {string} actorId - The user who triggered the notification
 * @param {string} activityType - Type of activity
 * @param {string} targetId - ID of the target (dataset, bounty, etc.)
 * @param {string} targetType - Type of target (dataset, bounty, user, etc.)
 * @param {string} message - Notification message
 * @returns {Promise<string|null>} Notification ID or null if failed
 */
export async function createNotification(
  userId,
  actorId,
  activityType,
  targetId,
  targetType,
  message
) {
  try {
    // Call RPC function to create notification
    const { data, error } = await supabase.rpc('create_notification', {
      p_user_id: userId,
      p_actor_id: actorId,
      p_activity_type: activityType,
      p_target_id: targetId,
      p_target_type: targetType,
      p_message: message,
    });

    if (error) {
      console.error('Error creating notification:', error);
      return null;
    }

    return data;
  } catch (err) {
    console.error('Exception creating notification:', err);
    return null;
  }
}

/**
 * Mark a notification as read
 * @param {string} notificationId - ID of the notification
 * @returns {Promise<boolean>} Success status
 */
export async function markAsRead(notificationId) {
  try {
    const { data, error } = await supabase.rpc('mark_notification_read', {
      p_notification_id: notificationId,
    });

    if (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }

    return data;
  } catch (err) {
    console.error('Exception marking notification as read:', err);
    return false;
  }
}

/**
 * Mark all notifications as read for current user
 * @returns {Promise<number>} Number of notifications marked as read
 */
export async function markAllAsRead() {
  try {
    const { data, error } = await supabase.rpc('mark_all_notifications_read');

    if (error) {
      console.error('Error marking all notifications as read:', error);
      return 0;
    }

    return data || 0;
  } catch (err) {
    console.error('Exception marking all notifications as read:', err);
    return 0;
  }
}

/**
 * Get unread notification count for current user
 * @returns {Promise<number>} Count of unread notifications
 */
export async function getUnreadCount() {
  try {
    const { data, error } = await supabase.rpc('get_unread_notification_count');

    if (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }

    return data || 0;
  } catch (err) {
    console.error('Exception getting unread count:', err);
    return 0;
  }
}

/**
 * Get recent notifications for current user
 * @param {number} limit - Number of notifications to fetch (default: 10)
 * @returns {Promise<Array>} Array of notification objects
 */
export async function getRecentNotifications(limit = 10) {
  try {
    const { data, error } = await supabase.rpc('get_recent_notifications', {
      p_limit: limit,
    });

    if (error) {
      console.error('Error getting recent notifications:', error);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error('Exception getting recent notifications:', err);
    return [];
  }
}

/**
 * Get all notifications with pagination
 * @param {number} page - Page number (0-indexed)
 * @param {number} pageSize - Items per page
 * @param {boolean} unreadOnly - Only show unread notifications
 * @returns {Promise<{notifications: Array, total: number}>}
 */
export async function getAllNotifications(
  page = 0,
  pageSize = 20,
  unreadOnly = false
) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { notifications: [], total: 0 };

    let query = supabase
      .from('notifications')
      .select(`
        id,
        actor_id,
        activity_type,
        target_id,
        target_type,
        message,
        read,
        created_at
      `, { count: 'exact' })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(page * pageSize, (page + 1) * pageSize - 1);

    if (unreadOnly) {
      query = query.eq('read', false);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('Error getting all notifications:', error);
      return { notifications: [], total: 0 };
    }

    // Enrich notifications with actor profile and target details
    const enrichedNotifications = await Promise.all(
      (data || []).map(async (notification) => {
        const enriched = { ...notification };

        // Fetch actor profile if actor_id exists
        if (notification.actor_id) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('username, display_name, avatar_url, is_pro_curator')
            .eq('id', notification.actor_id)
            .single();
          
          if (profile) {
            enriched.actor = profile;
          }
        }

        // Fetch target details based on target_type
        if (notification.target_id) {
          if (notification.target_type === 'dataset') {
            const { data: dataset } = await supabase
              .from('datasets')
              .select('id, title, creator_id')
              .eq('id', notification.target_id)
              .single();
            
            if (dataset) {
              enriched.dataset = dataset;
            }
          } else if (notification.target_type === 'comment') {
            // For comment notifications, get the comment and its dataset
            const { data: comment } = await supabase
              .from('dataset_comments')
              .select('id, dataset_id, datasets:dataset_id(id, title)')
              .eq('id', notification.target_id)
              .single();
            
            if (comment?.datasets) {
              enriched.dataset = {
                id: comment.dataset_id,
                title: comment.datasets.title
              };
            }
          }
        }

        return enriched;
      })
    );

    return {
      notifications: enrichedNotifications,
      total: count || 0,
    };
  } catch (err) {
    console.error('Exception getting all notifications:', err);
    return { notifications: [], total: 0 };
  }
}

/**
 * Delete a notification
 * @param {string} notificationId - ID of the notification to delete
 * @returns {Promise<boolean>} Success status
 */
export async function deleteNotification(notificationId) {
  try {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId);

    if (error) {
      console.error('Error deleting notification:', error);
      return false;
    }

    return true;
  } catch (err) {
    console.error('Exception deleting notification:', err);
    return false;
  }
}

/**
 * Subscribe to real-time notification updates
 * @param {string} userId - User ID to subscribe to
 * @param {Function} onInsert - Callback when new notification is inserted
 * @param {Function} onUpdate - Callback when notification is updated
 * @returns {Function} Unsubscribe function
 */
export function subscribeToNotifications(userId, onInsert, onUpdate) {
  const channel = supabase
    .channel(`notifications:${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        if (onInsert) onInsert(payload.new);
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        if (onUpdate) onUpdate(payload.new);
      }
    )
    .subscribe();

  // Return unsubscribe function
  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Helper: Generate notification message based on activity type
 * @param {string} activityType - Type of activity
 * @param {string} actorUsername - Username of the actor
 * @param {object} metadata - Additional metadata (dataset name, bounty title, etc.)
 * @returns {string} Formatted notification message
 */
export function generateNotificationMessage(activityType, actorUsername, metadata = {}) {
  switch (activityType) {
    case 'dataset_purchased':
      return `${actorUsername} purchased your dataset "${metadata.datasetName || 'a dataset'}"`;
    case 'dataset_favorited':
      return `${actorUsername} favorited your dataset "${metadata.datasetName || 'a dataset'}"`;
    case 'user_followed':
      return `${actorUsername} started following you`;
    case 'bounty_submission':
      return `${actorUsername} submitted to your bounty "${metadata.bountyTitle || 'a bounty'}"`;
    case 'proposal_submitted':
      return `${actorUsername} submitted a proposal`;
    case 'comment_added':
      return `${actorUsername} commented on your ${metadata.targetType || 'post'}`;
    case 'review_added':
      return `${actorUsername} reviewed your dataset "${metadata.datasetName || 'a dataset'}"`;
    default:
      return `${actorUsername} interacted with your content`;
  }
}
