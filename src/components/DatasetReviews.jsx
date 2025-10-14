import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Star as StarIcon } from 'lucide-react';
import PropTypes from 'prop-types';
import StarRating from './StarRating';
import ReviewCard from './ReviewCard';
import ReviewForm from './ReviewForm';
import * as reviewService from '../lib/reviewService';

/**
 * DatasetReviews Component
 * Main reviews section for a dataset
 * 
 * Features:
 * - Reviews list with pagination
 * - Sort options (Recent, Helpful, Rating High/Low)
 * - Filter by star rating
 * - Average rating display with breakdown
 * - Add review button (if purchased)
 * - Edit/delete own reviews
 * - Vote on reviews
 * - Empty states
 * - Real-time updates via Supabase subscriptions
 * 
 * @param {string} datasetId - ID of the dataset
 * @param {object} currentUser - Current logged-in user
 * @param {boolean} isOwner - Whether current user owns the dataset
 */
export default function DatasetReviews({ datasetId, currentUser, isOwner = false }) {
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalReviews, setTotalReviews] = useState(0);
  const pageSize = 5;
  const totalPages = Math.ceil(totalReviews / pageSize);
  
  // Filters
  const [sortBy, setSortBy] = useState('recent');
  const [filterRating, setFilterRating] = useState(null);
  
  // User state
  const [hasPurchased, setHasPurchased] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(false);
  const [userReview, setUserReview] = useState(null);
  
  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingReview, setEditingReview] = useState(null);

  // Load reviews
  const loadReviews = async () => {
    setLoading(true);
    const { data, count } = await reviewService.getDatasetReviews(
      datasetId, 
      sortBy, 
      filterRating, 
      currentPage, 
      pageSize
    );
    
    if (data) {
      setReviews(data);
      setTotalReviews(count || data.length);
    }
    setLoading(false);
  };

  // Load stats
  const loadStats = async () => {
    const { data } = await reviewService.getReviewStats(datasetId);
    if (data) {
      setStats(data);
    }
  };

  // Check user status
  const checkUserStatus = async () => {
    const [purchaseResult, reviewResult] = await Promise.all([
      reviewService.hasUserPurchased(datasetId),
      reviewService.getUserReviewForDataset(datasetId)
    ]);

    setHasPurchased(purchaseResult.data);
    setHasReviewed(!!reviewResult.data);
    setUserReview(reviewResult.data);
  };

  // Load initial data
  useEffect(() => {
    loadReviews();
    loadStats();
    if (currentUser && !isOwner) {
      checkUserStatus();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [datasetId, currentUser, sortBy, filterRating, currentPage]);

  // Subscribe to real-time updates
  useEffect(() => {
    const channel = reviewService.subscribeToReviews(datasetId, (payload) => {
      console.log('Review change:', payload);
      loadReviews();
      loadStats();
    });

    return () => {
      reviewService.unsubscribeFromReviews(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [datasetId]);

  // Handle add/update review
  const handleSubmitReview = async ({ rating, reviewText }) => {
    setSubmitting(true);
    
    let result;
    if (editingReview) {
      result = await reviewService.updateReview(editingReview.id, rating, reviewText);
    } else {
      result = await reviewService.addReview(datasetId, rating, reviewText);
    }

    if (result.error) {
      alert(`Error ${editingReview ? 'updating' : 'submitting'} review: ${result.error.message}`);
    } else {
      setShowForm(false);
      setEditingReview(null);
      loadReviews();
      loadStats();
      if (!editingReview) {
        setHasReviewed(true);
      }
    }

    setSubmitting(false);
  };

  // Handle delete review
  const handleDeleteReview = async (reviewId) => {
    if (!confirm('Are you sure you want to delete your review? This cannot be undone.')) {
      return;
    }

    const { error } = await reviewService.deleteReview(reviewId);
    
    if (error) {
      alert(`Error deleting review: ${error.message}`);
    } else {
      loadReviews();
      loadStats();
      setHasReviewed(false);
      setUserReview(null);
    }
  };

  // Handle vote
  const handleVote = async (reviewId, isHelpful) => {
    await reviewService.voteReview(reviewId, isHelpful);
    loadReviews(); // Refresh to get updated vote counts
  };

  // Handle report (placeholder)
  const handleReport = () => {
    alert('Report functionality coming soon. This review has been flagged for moderation.');
  };

  // Get percentage for rating breakdown
  const getRatingPercentage = (rating) => {
    if (!stats || stats.totalReviews === 0) return 0;
    return (stats.ratingBreakdown[rating] / stats.totalReviews) * 100;
  };

  return (
    <div className="space-y-6">
      {/* Rating Summary */}
      {stats && stats.totalReviews > 0 && (
        <div className="border-4 border-black bg-white p-6 shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
          <div className="flex items-start gap-8">
            {/* Overall rating */}
            <div className="text-center">
              <div className="text-5xl font-black mb-2">
                {stats.averageRating.toFixed(1)}
              </div>
              <StarRating rating={stats.averageRating} readonly size="lg" />
              <div className="mt-2 text-sm text-gray-600 font-medium">
                {stats.totalReviews} {stats.totalReviews === 1 ? 'review' : 'reviews'}
              </div>
            </div>

            {/* Rating breakdown */}
            <div className="flex-1 space-y-2">
              {[5, 4, 3, 2, 1].map(rating => (
                <button
                  key={rating}
                  onClick={() => setFilterRating(filterRating === rating ? null : rating)}
                  className={`
                    w-full flex items-center gap-3 px-3 py-2 rounded
                    transition-colors hover:bg-gray-100
                    ${filterRating === rating ? 'bg-yellow-100' : ''}
                  `}
                >
                  <span className="font-bold w-8 text-right">{rating}</span>
                  <StarIcon className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  
                  {/* Progress bar */}
                  <div className="flex-1 h-3 bg-gray-200 border-2 border-black relative overflow-hidden">
                    <div 
                      className="absolute inset-y-0 left-0 bg-yellow-400"
                      style={{ width: `${getRatingPercentage(rating)}%` }}
                    />
                  </div>
                  
                  <span className="font-medium w-12 text-right text-sm">
                    {stats.ratingBreakdown[rating]}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Clear filter button */}
          {filterRating && (
            <button
              onClick={() => setFilterRating(null)}
              className="mt-4 text-sm text-blue-600 hover:underline font-medium"
            >
              Show all reviews
            </button>
          )}
        </div>
      )}

      {/* Add Review Section */}
      {currentUser && !isOwner && (
        <div className="border-4 border-black bg-yellow-50 p-6 shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
          {!hasPurchased ? (
            <p className="text-gray-700 font-medium">
              Purchase this dataset to leave a review
            </p>
          ) : hasReviewed && !showForm ? (
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold mb-1">You&apos;ve already reviewed this dataset</p>
                <p className="text-sm text-gray-600">Want to update your review?</p>
              </div>
              <button
                onClick={() => {
                  setEditingReview(userReview);
                  setShowForm(true);
                }}
                className="
                  px-6 py-3 font-bold
                  bg-white border-4 border-black
                  hover:bg-gray-100 active:translate-y-1
                  transition-all duration-150
                  shadow-[4px_4px_0_0_rgba(0,0,0,1)]
                  active:shadow-none
                "
              >
                Edit Review
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowForm(true)}
              className="
                px-8 py-3 font-bold
                bg-yellow-400 border-4 border-black
                hover:bg-yellow-500 active:translate-y-1
                transition-all duration-150
                shadow-[4px_4px_0_0_rgba(0,0,0,1)]
                active:shadow-none
              "
            >
              Write a Review
            </button>
          )}
        </div>
      )}

      {/* Review Form */}
      {showForm && (
        <ReviewForm
          initialReview={editingReview}
          onSubmit={handleSubmitReview}
          onCancel={() => {
            setShowForm(false);
            setEditingReview(null);
          }}
          isLoading={submitting}
        />
      )}

      {/* Sort Options */}
      {reviews.length > 0 && (
        <div className="flex items-center gap-3">
          <span className="font-bold">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value);
              setCurrentPage(1);
            }}
            className="
              px-4 py-2 font-medium
              border-4 border-black
              focus:outline-none focus:ring-4 focus:ring-yellow-400
            "
          >
            <option value="recent">Most Recent</option>
            <option value="helpful">Most Helpful</option>
            <option value="rating_high">Highest Rating</option>
            <option value="rating_low">Lowest Rating</option>
          </select>
        </div>
      )}

      {/* Reviews List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-black border-t-transparent" />
          <p className="mt-4 font-medium">Loading reviews...</p>
        </div>
      ) : reviews.length === 0 ? (
        <div className="border-4 border-black bg-white p-12 text-center shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
          <StarIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-xl font-black mb-2">No reviews yet</h3>
          <p className="text-gray-600">
            {filterRating 
              ? `No ${filterRating}-star reviews found` 
              : 'Be the first to review this dataset!'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map(review => (
            <ReviewCard
              key={review.id}
              review={review}
              currentUser={currentUser}
              onEdit={(review) => {
                setEditingReview(review);
                setShowForm(true);
              }}
              onDelete={handleDeleteReview}
              onVote={handleVote}
              onReport={handleReport}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="
              p-2 border-4 border-black
              disabled:opacity-30 disabled:cursor-not-allowed
              hover:bg-gray-100 active:translate-y-1
              transition-all duration-150
              shadow-[4px_4px_0_0_rgba(0,0,0,1)]
              active:shadow-none
            "
            aria-label="Previous page"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          <span className="font-bold">
            Page {currentPage} of {totalPages}
          </span>

          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="
              p-2 border-4 border-black
              disabled:opacity-30 disabled:cursor-not-allowed
              hover:bg-gray-100 active:translate-y-1
              transition-all duration-150
              shadow-[4px_4px_0_0_rgba(0,0,0,1)]
              active:shadow-none
            "
            aria-label="Next page"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>
      )}
    </div>
  );
}

DatasetReviews.propTypes = {
  datasetId: PropTypes.string.isRequired,
  currentUser: PropTypes.object,
  isOwner: PropTypes.bool,
};
