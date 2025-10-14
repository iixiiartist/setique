import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import PropTypes from 'prop-types';
import StarRating from './StarRating';

/**
 * ReviewForm Component
 * Form for writing or editing a review
 * 
 * Features:
 * - Interactive star rating selector (required)
 * - Review text textarea (optional, 10-2000 characters)
 * - Character counter with color indicators
 * - Submit and Cancel buttons
 * - Edit mode support
 * - Validation and error handling
 * - Loading states
 * - Neo-brutalist design
 * 
 * @param {object} initialReview - Existing review data (for edit mode)
 * @param {function} onSubmit - Callback when form submitted (rating, reviewText)
 * @param {function} onCancel - Callback when cancel clicked
 * @param {boolean} isLoading - Whether submission is in progress
 */
export default function ReviewForm({ 
  initialReview = null,
  onSubmit,
  onCancel,
  isLoading = false 
}) {
  const isEditMode = !!initialReview;
  
  const [rating, setRating] = useState(initialReview?.rating || 0);
  const [reviewText, setReviewText] = useState(initialReview?.review_text || '');
  const [errors, setErrors] = useState({});

  const minChars = 10;
  const maxChars = 2000;
  const charCount = reviewText.length;

  // Reset form when initialReview changes
  useEffect(() => {
    if (initialReview) {
      setRating(initialReview.rating);
      setReviewText(initialReview.review_text || '');
    }
  }, [initialReview]);

  // Validate form
  const validate = () => {
    const newErrors = {};

    if (!rating || rating < 1 || rating > 5) {
      newErrors.rating = 'Please select a rating from 1 to 5 stars';
    }

    if (reviewText.trim() && reviewText.length < minChars) {
      newErrors.reviewText = `Review must be at least ${minChars} characters`;
    }

    if (reviewText.length > maxChars) {
      newErrors.reviewText = `Review cannot exceed ${maxChars} characters`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle submit
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validate()) return;

    onSubmit?.({
      rating,
      reviewText: reviewText.trim()
    });
  };

  // Get character counter color
  const getCharCounterColor = () => {
    if (!reviewText.trim()) return 'text-gray-400';
    if (charCount < minChars) return 'text-orange-600';
    if (charCount > maxChars * 0.9) return 'text-red-600';
    return 'text-green-600';
  };

  return (
    <div className="border-4 border-black bg-white p-6 shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-black">
          {isEditMode ? 'Edit Your Review' : 'Write a Review'}
        </h3>
        {onCancel && (
          <button
            onClick={onCancel}
            className="p-2 hover:bg-gray-100 rounded transition-colors"
            aria-label="Close"
          >
            <X className="w-6 h-6" />
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Star rating selector */}
        <div>
          <label className="block font-bold mb-2">
            Rating <span className="text-red-600">*</span>
          </label>
          <div className="flex items-center gap-4">
            <StarRating 
              rating={rating}
              onRatingChange={setRating}
              size="lg"
            />
            {rating > 0 && (
              <span className="text-2xl font-bold text-gray-700">
                {rating}.0
              </span>
            )}
          </div>
          {errors.rating && (
            <p className="mt-2 text-sm text-red-600 font-medium">
              {errors.rating}
            </p>
          )}
          <p className="mt-2 text-sm text-gray-600">
            Click on the stars to rate (1 = Poor, 5 = Excellent)
          </p>
        </div>

        {/* Review text */}
        <div>
          <label htmlFor="review-text" className="block font-bold mb-2">
            Your Review (Optional)
          </label>
          <textarea
            id="review-text"
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
            placeholder="Share your experience with this dataset. What did you like? How did you use it? What could be improved?"
            rows={6}
            maxLength={maxChars}
            className={`
              w-full px-4 py-3 border-4 border-black rounded-none
              font-mono text-base resize-none
              focus:outline-none focus:ring-4 focus:ring-yellow-400
              ${errors.reviewText ? 'border-red-600' : ''}
            `}
          />
          
          {/* Character counter */}
          <div className="flex items-center justify-between mt-2">
            <div className="text-sm">
              {reviewText.trim() && charCount < minChars && (
                <span className="text-orange-600 font-medium">
                  {minChars - charCount} more characters needed
                </span>
              )}
              {errors.reviewText && (
                <span className="text-red-600 font-medium">
                  {errors.reviewText}
                </span>
              )}
            </div>
            <span className={`text-sm font-medium ${getCharCounterColor()}`}>
              {charCount} / {maxChars}
            </span>
          </div>

          <p className="mt-2 text-sm text-gray-600">
            {reviewText.trim() 
              ? `Minimum ${minChars} characters for a review` 
              : 'Optional: Add details about your experience'}
          </p>
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t-2 border-gray-200">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={isLoading}
              className="
                px-6 py-3 font-bold
                bg-gray-200 border-4 border-black
                hover:bg-gray-300 active:translate-y-1
                transition-all duration-150
                disabled:opacity-50 disabled:cursor-not-allowed
                shadow-[4px_4px_0_0_rgba(0,0,0,1)]
                active:shadow-none
              "
            >
              Cancel
            </button>
          )}
          
          <button
            type="submit"
            disabled={isLoading || !rating}
            className="
              px-8 py-3 font-bold
              bg-yellow-400 border-4 border-black
              hover:bg-yellow-500 active:translate-y-1
              transition-all duration-150
              disabled:opacity-50 disabled:cursor-not-allowed
              shadow-[4px_4px_0_0_rgba(0,0,0,1)]
              active:shadow-none
            "
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle 
                    className="opacity-25" 
                    cx="12" 
                    cy="12" 
                    r="10" 
                    stroke="currentColor" 
                    strokeWidth="4"
                    fill="none"
                  />
                  <path 
                    className="opacity-75" 
                    fill="currentColor" 
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                {isEditMode ? 'Updating...' : 'Submitting...'}
              </span>
            ) : (
              isEditMode ? 'Update Review' : 'Submit Review'
            )}
          </button>
        </div>
      </form>

      {/* Guidelines */}
      <div className="mt-6 pt-6 border-t-2 border-gray-200">
        <h4 className="font-bold mb-2">Review Guidelines</h4>
        <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
          <li>Be honest and constructive in your feedback</li>
          <li>Focus on the dataset quality, usability, and value</li>
          <li>Avoid personal attacks or inappropriate language</li>
          <li>You can edit your review within 30 days of posting</li>
        </ul>
      </div>
    </div>
  );
}

ReviewForm.propTypes = {
  initialReview: PropTypes.shape({
    rating: PropTypes.number,
    review_text: PropTypes.string,
  }),
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func,
  isLoading: PropTypes.bool,
};
