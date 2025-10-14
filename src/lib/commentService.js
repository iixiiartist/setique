import { supabase } from './supabase';

/**
 * Comment Service
 * Handles all dataset comment operations
 * 
 * Features:
 * - Add/edit/delete comments
 * - Threaded replies
 * - Soft delete with moderation
 * - Flag inappropriate comments
 * - Real-time comment updates
 */

/**
 * Add a comment to a dataset
 * @param {string} datasetId - ID of the dataset
 * @param {string} content - Comment text (1-5000 characters)
 * @param {string|null} parentCommentId - ID of parent comment for replies
 * @returns {Promise<{success: boolean, comment: object|null, error: string|null}>}
 */
export async function addComment(datasetId, content, parentCommentId = null) {
  try {
    // Validate content
    if (!content || content.trim().length === 0) {
      return {
        success: false,
        comment: null,
        error: 'Comment cannot be empty',
      };
    }

    if (content.length > 5000) {
      return {
        success: false,
        comment: null,
        error: 'Comment cannot exceed 5000 characters',
      };
    }

    // Call RPC function to add comment
    const { data, error } = await supabase.rpc('add_dataset_comment', {
      p_dataset_id: datasetId,
      p_content: content.trim(),
      p_parent_comment_id: parentCommentId,
    });

    if (error) {
      console.error('Error adding comment:', error);
      return {
        success: false,
        comment: null,
        error: error.message || 'Failed to add comment',
      };
    }

    // RPC returns array, get first item
    const comment = Array.isArray(data) ? data[0] : data;

    return {
      success: true,
      comment: comment,
      error: null,
    };
  } catch (err) {
    console.error('Exception adding comment:', err);
    return {
      success: false,
      comment: null,
      error: 'An unexpected error occurred',
    };
  }
}

/**
 * Update a comment (within 15-minute edit window)
 * @param {string} commentId - ID of the comment to update
 * @param {string} content - New comment text
 * @returns {Promise<{success: boolean, comment: object|null, error: string|null}>}
 */
export async function updateComment(commentId, content) {
  try {
    // Validate content
    if (!content || content.trim().length === 0) {
      return {
        success: false,
        comment: null,
        error: 'Comment cannot be empty',
      };
    }

    if (content.length > 5000) {
      return {
        success: false,
        comment: null,
        error: 'Comment cannot exceed 5000 characters',
      };
    }

    // Call RPC function to update comment
    const { data, error } = await supabase.rpc('update_dataset_comment', {
      p_comment_id: commentId,
      p_content: content.trim(),
    });

    if (error) {
      console.error('Error updating comment:', error);
      
      // Provide user-friendly error messages
      if (error.message.includes('Edit window expired')) {
        return {
          success: false,
          comment: null,
          error: 'Comments can only be edited within 15 minutes of posting',
        };
      }
      
      return {
        success: false,
        comment: null,
        error: error.message || 'Failed to update comment',
      };
    }

    const comment = Array.isArray(data) ? data[0] : data;

    return {
      success: true,
      comment: comment,
      error: null,
    };
  } catch (err) {
    console.error('Exception updating comment:', err);
    return {
      success: false,
      comment: null,
      error: 'An unexpected error occurred',
    };
  }
}

/**
 * Delete a comment (soft delete)
 * Users can delete their own comments
 * Dataset owners can delete comments on their datasets
 * Admins can delete any comment
 * @param {string} commentId - ID of the comment to delete
 * @returns {Promise<{success: boolean, error: string|null}>}
 */
export async function deleteComment(commentId) {
  try {
    const { error } = await supabase.rpc('delete_dataset_comment', {
      p_comment_id: commentId,
    });

    if (error) {
      console.error('Error deleting comment:', error);
      return {
        success: false,
        error: error.message || 'Failed to delete comment',
      };
    }

    return {
      success: true,
      error: null,
    };
  } catch (err) {
    console.error('Exception deleting comment:', err);
    return {
      success: false,
      error: 'An unexpected error occurred',
    };
  }
}

/**
 * Flag a comment for moderation
 * Any authenticated user can flag inappropriate comments
 * Comments with 5+ flags are automatically hidden
 * @param {string} commentId - ID of the comment to flag
 * @param {string|null} reason - Optional reason for flagging
 * @returns {Promise<{success: boolean, error: string|null}>}
 */
export async function flagComment(commentId, reason = null) {
  try {
    const { error } = await supabase.rpc('flag_dataset_comment', {
      p_comment_id: commentId,
      p_reason: reason,
    });

    if (error) {
      console.error('Error flagging comment:', error);
      return {
        success: false,
        error: error.message || 'Failed to flag comment',
      };
    }

    return {
      success: true,
      error: null,
    };
  } catch (err) {
    console.error('Exception flagging comment:', err);
    return {
      success: false,
      error: 'An unexpected error occurred',
    };
  }
}

/**
 * Get all comments for a dataset
 * @param {string} datasetId - ID of the dataset
 * @param {number} limit - Maximum number of comments to return (default 50)
 * @param {number} offset - Offset for pagination (default 0)
 * @returns {Promise<{success: boolean, comments: array, error: string|null}>}
 */
export async function getDatasetComments(datasetId, limit = 50, offset = 0) {
  try {
    const { data, error } = await supabase.rpc('get_dataset_comments', {
      p_dataset_id: datasetId,
      p_limit: limit,
      p_offset: offset,
    });

    if (error) {
      console.error('Error fetching comments:', error);
      return {
        success: false,
        comments: [],
        error: error.message || 'Failed to fetch comments',
      };
    }

    return {
      success: true,
      comments: data || [],
      error: null,
    };
  } catch (err) {
    console.error('Exception fetching comments:', err);
    return {
      success: false,
      comments: [],
      error: 'An unexpected error occurred',
    };
  }
}

/**
 * Get replies to a specific comment
 * @param {string} parentCommentId - ID of the parent comment
 * @returns {Promise<{success: boolean, replies: array, error: string|null}>}
 */
export async function getCommentReplies(parentCommentId) {
  try {
    const { data, error } = await supabase.rpc('get_comment_replies', {
      p_parent_comment_id: parentCommentId,
    });

    if (error) {
      console.error('Error fetching replies:', error);
      return {
        success: false,
        replies: [],
        error: error.message || 'Failed to fetch replies',
      };
    }

    return {
      success: true,
      replies: data || [],
      error: null,
    };
  } catch (err) {
    console.error('Exception fetching replies:', err);
    return {
      success: false,
      replies: [],
      error: 'An unexpected error occurred',
    };
  }
}

/**
 * Subscribe to real-time comment updates for a dataset
 * @param {string} datasetId - ID of the dataset
 * @param {Function} onInsert - Callback when new comment is added
 * @param {Function} onUpdate - Callback when comment is updated
 * @param {Function} onDelete - Callback when comment is deleted
 * @returns {Object} Subscription object with unsubscribe method
 */
export function subscribeToComments(datasetId, onInsert, onUpdate, onDelete) {
  const subscription = supabase
    .channel(`dataset_comments:${datasetId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'dataset_comments',
        filter: `dataset_id=eq.${datasetId}`,
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
        table: 'dataset_comments',
        filter: `dataset_id=eq.${datasetId}`,
      },
      (payload) => {
        if (onUpdate) onUpdate(payload.new);
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'DELETE',
        schema: 'public',
        table: 'dataset_comments',
        filter: `dataset_id=eq.${datasetId}`,
      },
      (payload) => {
        if (onDelete) onDelete(payload.old);
      }
    )
    .subscribe();

  return {
    unsubscribe: () => {
      subscription.unsubscribe();
    },
  };
}

/**
 * Check if user can edit a comment
 * Comments can only be edited by their author within 15 minutes
 * @param {object} comment - Comment object with user_id and created_at
 * @param {string} currentUserId - ID of the current user
 * @returns {boolean} True if user can edit the comment
 */
export function canEditComment(comment, currentUserId) {
  if (!comment || !currentUserId) return false;
  
  // Must be comment author
  if (comment.user_id !== currentUserId) return false;
  
  // Check 15-minute window
  const createdAt = new Date(comment.created_at);
  const now = new Date();
  const minutesElapsed = (now - createdAt) / 1000 / 60;
  
  return minutesElapsed <= 15;
}

/**
 * Check if user can delete a comment
 * Users can delete their own comments
 * Dataset owners can delete comments on their datasets
 * Admins can delete any comment
 * @param {object} comment - Comment object with user_id
 * @param {string} currentUserId - ID of the current user
 * @param {string} datasetOwnerId - ID of the dataset owner
 * @param {boolean} isAdmin - Whether current user is an admin
 * @returns {boolean} True if user can delete the comment
 */
export function canDeleteComment(comment, currentUserId, datasetOwnerId, isAdmin = false) {
  if (!comment || !currentUserId) return false;
  
  // Comment author can delete
  if (comment.user_id === currentUserId) return true;
  
  // Dataset owner can delete comments on their dataset
  if (datasetOwnerId && currentUserId === datasetOwnerId) return true;
  
  // Admins can delete any comment
  if (isAdmin) return true;
  
  return false;
}

/**
 * Format comment timestamp for display
 * @param {string|Date} timestamp - Comment timestamp
 * @returns {string} Formatted time string (e.g., "2 hours ago", "Just now")
 */
export function formatCommentTime(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);
  
  if (seconds < 60) return 'Just now';
  
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
  
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} day${days !== 1 ? 's' : ''} ago`;
  
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} month${months !== 1 ? 's' : ''} ago`;
  
  const years = Math.floor(months / 12);
  return `${years} year${years !== 1 ? 's' : ''} ago`;
}

/**
 * Validate comment content
 * @param {string} content - Comment text to validate
 * @returns {{valid: boolean, error: string|null}}
 */
export function validateCommentContent(content) {
  if (!content || content.trim().length === 0) {
    return {
      valid: false,
      error: 'Comment cannot be empty',
    };
  }
  
  if (content.length > 5000) {
    return {
      valid: false,
      error: 'Comment cannot exceed 5000 characters',
    };
  }
  
  return {
    valid: true,
    error: null,
  };
}

export default {
  addComment,
  updateComment,
  deleteComment,
  flagComment,
  getDatasetComments,
  getCommentReplies,
  subscribeToComments,
  canEditComment,
  canDeleteComment,
  formatCommentTime,
  validateCommentContent,
};
