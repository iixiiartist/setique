import { useState } from 'react';
import { ThumbsUp, ThumbsDown, BadgeCheck, Edit2, Trash2, Flag, MoreVertical } from 'lucide-react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import StarRating from './StarRating';
import { formatDistanceToNow } from 'date-fns';

/**
 * ReviewCard Component
 * Displays a single review with user info, rating, text, and voting
 * 
 * Features:
 * - User avatar with fallback to initials
 * - Username with PRO curator badge
 * - Star rating display
 * - Verified purchase badge
 * - Review text with show more/less for long reviews
 * - Helpful/unhelpful voting
 * - Edit/delete for own reviews
 * - Report button for others' reviews
 * - Relative timestamp with edited indicator
 * 
 * @param {object} review - Review object with all fields
 * @param {object} currentUser - Current logged-in user
 * @param {function} onEdit - Callback when edit clicked
 * @param {function} onDelete - Callback when delete clicked
 * @param {function} onVote - Callback when voting (reviewId, isHelpful)
 * @param {function} onReport - Callback when report clicked
 */
export default function ReviewCard({ 
  review, 
  currentUser,
  onEdit,
  onDelete,
  onVote,
  onReport 
}) {
  const [showFullText, setShowFullText] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isVoting, setIsVoting] = useState(false);

  const isOwnReview = currentUser?.id === review.user_id;
  const reviewText = review.review_text || '';
  const isLongReview = reviewText.length > 300;
  const displayText = showFullText ? reviewText : reviewText.slice(0, 300);

  // User info from enriched data
  const username = review.user?.username || 'Unknown User';
  const userAvatar = review.user?.avatar_url;
  const isPro = review.user?.is_pro_curator;

  // Get initials for avatar fallback
  const initials = username
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  // Color for avatar background
  const avatarColor = username.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % 360;

  // Format timestamp
  const timeAgo = formatDistanceToNow(new Date(review.created_at), { addSuffix: true });

  // Handle vote
  const handleVote = async (isHelpful) => {
    if (isVoting || isOwnReview) return;
    
    setIsVoting(true);
    try {
      await onVote?.(review.id, isHelpful);
    } catch (error) {
      console.error('Error voting on review:', error);
    } finally {
      setIsVoting(false);
    }
  };

  return (
    <div className="border-4 border-black bg-white p-6 shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
      {/* Header: User info and actions */}
      <div className="flex items-start justify-between gap-4 mb-4">
        {/* User info */}
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <Link 
            to={`/profile/${username}`}
            className="flex-shrink-0"
          >
            {userAvatar ? (
              <img 
                src={userAvatar} 
                alt={username}
                className="w-12 h-12 rounded-full border-2 border-black object-cover hover:scale-105 transition-transform"
              />
            ) : (
              <div 
                className="w-12 h-12 rounded-full border-2 border-black flex items-center justify-center font-bold text-white hover:scale-105 transition-transform"
                style={{ backgroundColor: `hsl(${avatarColor}, 70%, 60%)` }}
              >
                {initials}
              </div>
            )}
          </Link>

          {/* Username and timestamp */}
          <div>
            <div className="flex items-center gap-2">
              <Link 
                to={`/profile/${username}`}
                className="font-bold text-gray-900 hover:underline"
              >
                {username}
              </Link>
              {isPro && (
                <BadgeCheck className="w-5 h-5 text-yellow-500 fill-yellow-500" />
              )}
              {review.verified_purchase && (
                <span className="px-2 py-0.5 bg-green-400 border-2 border-black text-xs font-bold">
                  VERIFIED PURCHASE
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>{timeAgo}</span>
              {review.edited && (
                <span className="text-gray-500">(edited)</span>
              )}
            </div>
          </div>
        </div>

        {/* Actions menu */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 hover:bg-gray-100 rounded transition-colors"
            aria-label="More options"
          >
            <MoreVertical className="w-5 h-5" />
          </button>

          {showMenu && (
            <>
              {/* Backdrop to close menu */}
              <div 
                className="fixed inset-0 z-10"
                onClick={() => setShowMenu(false)}
              />
              
              {/* Menu dropdown */}
              <div className="absolute right-0 top-full mt-2 w-48 bg-white border-4 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] z-20">
                {isOwnReview ? (
                  <>
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        onEdit?.(review);
                      }}
                      className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2 font-medium"
                    >
                      <Edit2 className="w-4 h-4" />
                      Edit Review
                    </button>
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        onDelete?.(review.id);
                      }}
                      className="w-full px-4 py-2 text-left hover:bg-red-50 text-red-600 flex items-center gap-2 font-medium"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete Review
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      onReport?.(review.id);
                    }}
                    className="w-full px-4 py-2 text-left hover:bg-red-50 text-red-600 flex items-center gap-2 font-medium"
                  >
                    <Flag className="w-4 h-4" />
                    Report Review
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Star rating */}
      <div className="mb-3">
        <StarRating rating={review.rating} readonly size="md" />
      </div>

      {/* Review text */}
      {reviewText && (
        <div className="mb-4">
          <p className="text-gray-700 whitespace-pre-wrap">
            {displayText}
            {isLongReview && !showFullText && '...'}
          </p>
          {isLongReview && (
            <button
              onClick={() => setShowFullText(!showFullText)}
              className="text-blue-600 hover:underline font-medium mt-2 text-sm"
            >
              {showFullText ? 'Show less' : 'Show more'}
            </button>
          )}
        </div>
      )}

      {/* Voting */}
      <div className="flex items-center gap-4 pt-4 border-t-2 border-gray-200">
        <span className="text-sm text-gray-600 font-medium">Was this helpful?</span>
        
        <div className="flex items-center gap-2">
          {/* Helpful button */}
          <button
            onClick={() => handleVote(true)}
            disabled={isVoting || isOwnReview}
            className={`
              flex items-center gap-1.5 px-3 py-1.5 rounded
              border-2 border-black font-medium text-sm
              transition-all duration-150
              ${review.user_vote === true 
                ? 'bg-green-400 text-black' 
                : 'bg-white hover:bg-green-100 text-gray-700'
              }
              ${isOwnReview ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 active:scale-95'}
              disabled:opacity-50 disabled:cursor-not-allowed
            `}
            aria-label="Helpful"
          >
            <ThumbsUp className="w-4 h-4" />
            <span>{review.helpful_count || 0}</span>
          </button>

          {/* Not helpful button */}
          <button
            onClick={() => handleVote(false)}
            disabled={isVoting || isOwnReview}
            className={`
              flex items-center gap-1.5 px-3 py-1.5 rounded
              border-2 border-black font-medium text-sm
              transition-all duration-150
              ${review.user_vote === false
                ? 'bg-red-400 text-black' 
                : 'bg-white hover:bg-red-100 text-gray-700'
              }
              ${isOwnReview ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 active:scale-95'}
              disabled:opacity-50 disabled:cursor-not-allowed
            `}
            aria-label="Not helpful"
          >
            <ThumbsDown className="w-4 h-4" />
            <span>{review.unhelpful_count || 0}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

ReviewCard.propTypes = {
  review: PropTypes.shape({
    id: PropTypes.string.isRequired,
    user_id: PropTypes.string.isRequired,
    rating: PropTypes.number.isRequired,
    review_text: PropTypes.string,
    verified_purchase: PropTypes.bool,
    helpful_count: PropTypes.number,
    unhelpful_count: PropTypes.number,
    created_at: PropTypes.string.isRequired,
    updated_at: PropTypes.string,
    edited: PropTypes.bool,
    user: PropTypes.shape({
      username: PropTypes.string,
      avatar_url: PropTypes.string,
      is_pro_curator: PropTypes.bool,
    }),
    user_vote: PropTypes.bool, // true = helpful, false = unhelpful, null = no vote
  }).isRequired,
  currentUser: PropTypes.object,
  onEdit: PropTypes.func,
  onDelete: PropTypes.func,
  onVote: PropTypes.func,
  onReport: PropTypes.func,
};
