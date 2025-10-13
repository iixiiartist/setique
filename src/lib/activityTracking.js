import { supabase } from './supabase';

/**
 * Activity Tracking Utilities
 * Helper functions to log user activities for the activity feed
 */

/**
 * Activity Types:
 * - dataset_published: User published a new dataset
 * - dataset_purchased: User purchased a dataset
 * - user_followed: User followed another user
 * - bounty_created: User created a bounty
 * - bounty_submission: User submitted to a bounty
 * - proposal_submitted: Pro curator submitted a proposal
 * - dataset_favorited: User favorited a dataset
 * - curator_certified: User became a pro curator
 */

/**
 * Log a user activity
 * @param {string} userId - The user performing the activity
 * @param {string} activityType - Type of activity
 * @param {string} targetId - ID of the target entity (optional)
 * @param {string} targetType - Type of target entity (optional)
 * @param {object} metadata - Additional data (optional)
 * @returns {Promise<string|null>} - Activity ID or null on error
 */
export async function logActivity(userId, activityType, targetId = null, targetType = null, metadata = {}) {
  if (!userId || !activityType) {
    console.warn('logActivity: Missing required parameters', { userId, activityType });
    return null;
  }

  try {
    const { data, error } = await supabase.rpc('log_user_activity', {
      p_user_id: userId,
      p_activity_type: activityType,
      p_target_id: targetId,
      p_target_type: targetType,
      p_metadata: metadata
    });

    if (error) {
      console.error('Error logging activity:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Exception logging activity:', error);
    return null;
  }
}

/**
 * Log dataset publication activity
 */
export async function logDatasetPublished(userId, datasetId, datasetTitle, price, modality) {
  return logActivity(
    userId,
    'dataset_published',
    datasetId,
    'dataset',
    { title: datasetTitle, price, modality }
  );
}

/**
 * Log dataset purchase activity
 */
export async function logDatasetPurchased(userId, datasetId, datasetTitle, price) {
  return logActivity(
    userId,
    'dataset_purchased',
    datasetId,
    'dataset',
    { title: datasetTitle, price }
  );
}

/**
 * Log user follow activity
 */
export async function logUserFollowed(userId, followedUserId, followedUsername) {
  return logActivity(
    userId,
    'user_followed',
    followedUserId,
    'user',
    { username: followedUsername }
  );
}

/**
 * Log bounty creation activity
 */
export async function logBountyCreated(userId, bountyId, bountyTitle, budgetMax) {
  return logActivity(
    userId,
    'bounty_created',
    bountyId,
    'bounty',
    { title: bountyTitle, budget_max: budgetMax }
  );
}

/**
 * Log bounty submission activity
 */
export async function logBountySubmission(userId, submissionId, bountyId, bountyTitle, datasetTitle) {
  return logActivity(
    userId,
    'bounty_submission',
    submissionId,
    'submission',
    { bounty_id: bountyId, bounty_title: bountyTitle, dataset_title: datasetTitle }
  );
}

/**
 * Log proposal submission activity
 */
export async function logProposalSubmitted(userId, proposalId, bountyId, bountyTitle) {
  return logActivity(
    userId,
    'proposal_submitted',
    proposalId,
    'proposal',
    { bounty_id: bountyId, bounty_title: bountyTitle }
  );
}

/**
 * Log dataset favorite activity
 */
export async function logDatasetFavorited(userId, datasetId, datasetTitle) {
  return logActivity(
    userId,
    'dataset_favorited',
    datasetId,
    'dataset',
    { title: datasetTitle }
  );
}

/**
 * Log curator certification activity
 */
export async function logCuratorCertified(userId, badgeLevel) {
  return logActivity(
    userId,
    'curator_certified',
    userId,
    'user',
    { badge_level: badgeLevel }
  );
}

/**
 * Get activity feed for a user
 * @param {string} userId - The user whose feed to fetch
 * @param {number} limit - Number of activities to fetch
 * @param {number} offset - Pagination offset
 * @returns {Promise<Array>} - Array of activities
 */
export async function getActivityFeed(userId, limit = 50, offset = 0) {
  if (!userId) {
    console.warn('getActivityFeed: Missing userId');
    return [];
  }

  try {
    const { data, error } = await supabase.rpc('get_activity_feed', {
      p_user_id: userId,
      p_limit: limit,
      p_offset: offset
    });

    if (error) {
      console.error('Error fetching activity feed:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Exception fetching activity feed:', error);
    return [];
  }
}

/**
 * Fetch activities with full details (manual query for more control)
 * @param {string} userId - The user whose feed to fetch
 * @param {number} limit - Number of activities to fetch
 * @returns {Promise<Array>} - Array of activities with full details
 */
export async function getDetailedActivityFeed(userId, limit = 50) {
  if (!userId) return [];

  try {
    // Get IDs of users the current user follows
    const { data: followingData } = await supabase
      .from('user_follows')
      .select('following_id')
      .eq('follower_id', userId);

    const followingIds = followingData?.map(f => f.following_id) || [];
    
    // Include the user's own activities
    followingIds.push(userId);

    // Fetch activities from followed users
    const { data, error } = await supabase
      .from('user_activities')
      .select(`
        *,
        profiles:user_id (
          id,
          username,
          display_name,
          avatar_url
        )
      `)
      .in('user_id', followingIds)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching detailed activity feed:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Exception fetching detailed activity feed:', error);
    return [];
  }
}
