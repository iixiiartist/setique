import { supabase } from './supabase';
import { createNotification, generateNotificationMessage } from './notificationService';

/**
 * Activity Tracking Utilities
 * Helper functions to log user activities for the activity feed
 * Also creates notifications for relevant users
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
 * Also notifies the dataset owner
 */
export async function logDatasetPurchased(userId, datasetId, datasetTitle, price, ownerId = null) {
  const activityId = await logActivity(
    userId,
    'dataset_purchased',
    datasetId,
    'dataset',
    { title: datasetTitle, price }
  );

  // Notify the dataset owner if ownerId is provided
  if (ownerId && ownerId !== userId) {
    // Get purchaser's username
    const { data: profileData } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', userId)
      .single();

    const username = profileData?.username || 'Someone';
    const message = generateNotificationMessage('dataset_purchased', username, { datasetName: datasetTitle });
    
    await createNotification(
      ownerId,
      userId,
      'dataset_purchased',
      datasetId,
      'dataset',
      message
    );
  }

  return activityId;
}

/**
 * Log user follow activity
 * Also notifies the followed user
 */
export async function logUserFollowed(userId, followedUserId, followedUsername) {
  const activityId = await logActivity(
    userId,
    'user_followed',
    followedUserId,
    'user',
    { username: followedUsername }
  );

  // Notify the followed user
  if (followedUserId !== userId) {
    // Get follower's username
    const { data: profileData } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', userId)
      .single();

    const username = profileData?.username || 'Someone';
    const message = generateNotificationMessage('user_followed', username);
    
    await createNotification(
      followedUserId,
      userId,
      'user_followed',
      userId,
      'user',
      message
    );
  }

  return activityId;
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
 * Also notifies the bounty creator
 */
export async function logBountySubmission(userId, submissionId, bountyId, bountyTitle, datasetTitle, bountyCreatorId = null) {
  const activityId = await logActivity(
    userId,
    'bounty_submission',
    submissionId,
    'submission',
    { bounty_id: bountyId, bounty_title: bountyTitle, dataset_title: datasetTitle }
  );

  // Notify the bounty creator if provided
  if (bountyCreatorId && bountyCreatorId !== userId) {
    // Get submitter's username
    const { data: profileData } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', userId)
      .single();

    const username = profileData?.username || 'Someone';
    const message = generateNotificationMessage('bounty_submission', username, { bountyTitle });
    
    await createNotification(
      bountyCreatorId,
      userId,
      'bounty_submission',
      bountyId,
      'bounty',
      message
    );
  }

  return activityId;
}

/**
 * Log proposal submission activity
 * Also notifies the bounty creator
 */
export async function logProposalSubmitted(userId, proposalId, bountyId, bountyTitle, bountyCreatorId = null) {
  const activityId = await logActivity(
    userId,
    'proposal_submitted',
    proposalId,
    'proposal',
    { bounty_id: bountyId, bounty_title: bountyTitle }
  );

  // Notify the bounty creator if provided
  if (bountyCreatorId && bountyCreatorId !== userId) {
    // Get proposer's username
    const { data: profileData } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', userId)
      .single();

    const username = profileData?.username || 'Someone';
    const message = generateNotificationMessage('proposal_submitted', username, { bountyTitle });
    
    await createNotification(
      bountyCreatorId,
      userId,
      'proposal_submitted',
      bountyId,
      'bounty',
      message
    );
  }

  return activityId;
}

/**
 * Log dataset favorite activity
 * Also notifies the dataset owner
 */
export async function logDatasetFavorited(userId, datasetId, datasetTitle, ownerId = null) {
  const activityId = await logActivity(
    userId,
    'dataset_favorited',
    datasetId,
    'dataset',
    { title: datasetTitle }
  );

  // Notify the dataset owner if provided
  if (ownerId && ownerId !== userId) {
    // Get user's username
    const { data: profileData } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', userId)
      .single();

    const username = profileData?.username || 'Someone';
    const message = generateNotificationMessage('dataset_favorited', username, { datasetName: datasetTitle });
    
    await createNotification(
      ownerId,
      userId,
      'dataset_favorited',
      datasetId,
      'dataset',
      message
    );
  }

  return activityId;
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
