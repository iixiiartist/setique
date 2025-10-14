import { supabase } from './supabase';

/**
 * Review Service
 * Handles all review-related operations with Supabase
 */

/**
 * Add a new review for a dataset
 * Uses the add_dataset_review RPC function which handles notifications
 */
export async function addReview(datasetId, rating, reviewText = '') {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Must be logged in to review');

    const { data, error } = await supabase.rpc('add_dataset_review', {
      p_dataset_id: datasetId,
      p_rating: rating,
      p_review_text: reviewText.trim() || null
    });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error adding review:', error);
    return { data: null, error };
  }
}

/**
 * Update an existing review
 * Can only be done within 30 days of creation (enforced by RLS)
 */
export async function updateReview(reviewId, rating, reviewText = '') {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Must be logged in to update review');

    const { data, error } = await supabase
      .from('dataset_reviews')
      .update({
        rating,
        review_text: reviewText.trim() || null,
        updated_at: new Date().toISOString(),
        edited: true
      })
      .eq('id', reviewId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error updating review:', error);
    return { data: null, error };
  }
}

/**
 * Delete a review
 * Uses the delete_dataset_review RPC function which updates dataset stats
 */
export async function deleteReview(reviewId) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Must be logged in to delete review');

    const { data, error } = await supabase.rpc('delete_dataset_review', {
      p_review_id: reviewId
    });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error deleting review:', error);
    return { data: null, error };
  }
}

/**
 * Vote on a review (helpful/unhelpful)
 * Uses the vote_on_review RPC function which handles upserts
 */
export async function voteReview(reviewId, isHelpful) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Must be logged in to vote');

    const { data, error } = await supabase.rpc('vote_on_review', {
      p_review_id: reviewId,
      p_is_helpful: isHelpful
    });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error voting on review:', error);
    return { data: null, error };
  }
}

/**
 * Remove a vote on a review
 * Uses the remove_review_vote RPC function
 */
export async function removeVote(reviewId) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Must be logged in to remove vote');

    const { data, error } = await supabase.rpc('remove_review_vote', {
      p_review_id: reviewId
    });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error removing vote:', error);
    return { data: null, error };
  }
}

/**
 * Get reviews for a dataset with enriched user data and vote status
 */
export async function getDatasetReviews(datasetId, sortBy = 'recent', filterRating = null, page = 1, pageSize = 10) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    let query = supabase
      .from('dataset_reviews')
      .select('*')
      .eq('dataset_id', datasetId);

    // Filter by rating if specified
    if (filterRating) {
      query = query.eq('rating', filterRating);
    }

    // Sort
    switch (sortBy) {
      case 'helpful':
        query = query.order('helpful_count', { ascending: false });
        break;
      case 'rating_high':
        query = query.order('rating', { ascending: false });
        break;
      case 'rating_low':
        query = query.order('rating', { ascending: true });
        break;
      case 'recent':
      default:
        query = query.order('created_at', { ascending: false });
        break;
    }

    // Pagination
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    const { data: reviews, error, count } = await query;

    if (error) throw error;

    // Fetch user profiles for all reviews
    if (reviews && reviews.length > 0) {
      const userIds = [...new Set(reviews.map(r => r.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username, avatar_url, is_pro_curator')
        .in('id', userIds);

      // Map profiles to reviews
      const profileMap = {};
      profiles?.forEach(profile => {
        profileMap[profile.id] = profile;
      });

      reviews.forEach(review => {
        review.user = profileMap[review.user_id] || { username: 'Unknown User' };
      });
    }

    // Enrich with user vote status if logged in
    if (user && reviews && reviews.length > 0) {
      const reviewIds = reviews.map(r => r.id);
      const { data: votes } = await supabase
        .from('review_votes')
        .select('review_id, is_helpful')
        .eq('user_id', user.id)
        .in('review_id', reviewIds);

      // Map votes to reviews
      const voteMap = {};
      votes?.forEach(vote => {
        voteMap[vote.review_id] = vote.is_helpful;
      });

      reviews.forEach(review => {
        review.user_vote = voteMap[review.id] !== undefined ? voteMap[review.id] : null;
      });
    }

    return { data: reviews || [], error: null, count };
  } catch (error) {
    console.error('Error getting dataset reviews:', error);
    return { data: null, error, count: 0 };
  }
}

/**
 * Get all reviews by a specific user
 */
export async function getUserReviews(userId, page = 1, pageSize = 10) {
  try {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, error, count } = await supabase
      .from('dataset_reviews')
      .select(`
        *,
        dataset:datasets!dataset_id(id, title, creator_id)
      `, { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;
    return { data, error: null, count };
  } catch (error) {
    console.error('Error getting user reviews:', error);
    return { data: null, error, count: 0 };
  }
}

/**
 * Get review statistics for a dataset
 */
export async function getReviewStats(datasetId) {
  try {
    // Get rating breakdown
    const { data: reviews, error } = await supabase
      .from('dataset_reviews')
      .select('rating')
      .eq('dataset_id', datasetId);

    if (error) throw error;

    const stats = {
      totalReviews: reviews.length,
      averageRating: 0,
      ratingBreakdown: {
        5: 0,
        4: 0,
        3: 0,
        2: 0,
        1: 0
      }
    };

    if (reviews.length > 0) {
      // Calculate average
      const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
      stats.averageRating = sum / reviews.length;

      // Count by rating
      reviews.forEach(r => {
        stats.ratingBreakdown[r.rating]++;
      });
    }

    return { data: stats, error: null };
  } catch (error) {
    console.error('Error getting review stats:', error);
    return { data: null, error };
  }
}

/**
 * Check if current user has reviewed a dataset
 */
export async function hasUserReviewed(datasetId) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: false, error: null };

    const { data, error } = await supabase
      .from('dataset_reviews')
      .select('id')
      .eq('dataset_id', datasetId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) throw error;
    return { data: !!data, error: null, reviewId: data?.id };
  } catch (error) {
    console.error('Error checking user review:', error);
    return { data: false, error };
  }
}

/**
 * Check if current user has purchased a dataset
 * This checks the purchases table
 */
export async function hasUserPurchased(datasetId) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: false, error: null };

    const { data, error } = await supabase
      .from('purchases')
      .select('id')
      .eq('user_id', user.id)
      .eq('dataset_id', datasetId)
      .eq('status', 'completed')
      .maybeSingle();

    if (error) throw error;
    return { data: !!data, error: null };
  } catch (error) {
    console.error('Error checking user purchase:', error);
    return { data: false, error };
  }
}

/**
 * Get user's review for a specific dataset (if exists)
 */
export async function getUserReviewForDataset(datasetId) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: null, error: null };

    const { data, error } = await supabase
      .from('dataset_reviews')
      .select('*')
      .eq('dataset_id', datasetId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error getting user review:', error);
    return { data: null, error };
  }
}

/**
 * Subscribe to real-time review changes for a dataset
 */
export function subscribeToReviews(datasetId, callback) {
  const channel = supabase
    .channel(`reviews:${datasetId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'dataset_reviews',
        filter: `dataset_id=eq.${datasetId}`
      },
      callback
    )
    .subscribe();

  return channel;
}

/**
 * Unsubscribe from review changes
 */
export function unsubscribeFromReviews(channel) {
  if (channel) {
    supabase.removeChannel(channel);
  }
}
