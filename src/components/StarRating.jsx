import { Star } from 'lucide-react';
import PropTypes from 'prop-types';

/**
 * StarRating Component
 * Displays and allows interaction with star ratings
 * 
 * Features:
 * - Interactive mode for selecting ratings (1-5)
 * - Read-only mode for displaying ratings
 * - Half-star support for displaying averages
 * - Hover preview in interactive mode
 * - Keyboard accessible
 * - Neo-brutalist design
 * 
 * @param {number} rating - Current rating (0-5, supports decimals for display)
 * @param {function} onRatingChange - Callback when rating changes (interactive mode)
 * @param {boolean} readonly - Whether the rating is read-only
 * @param {string} size - Size variant: 'sm', 'md', 'lg'
 * @param {boolean} showValue - Whether to show numeric value
 */
export default function StarRating({ 
  rating = 0, 
  onRatingChange,
  readonly = false,
  size = 'md',
  showValue = false 
}) {
  const isInteractive = !readonly && typeof onRatingChange === 'function';
  const stars = [1, 2, 3, 4, 5];

  // Size variants
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  };

  // Get fill percentage for a star
  const getStarFill = (starNumber) => {
    const diff = rating - (starNumber - 1);
    if (diff >= 1) return 100; // Fully filled
    if (diff <= 0) return 0;   // Empty
    return diff * 100;          // Partially filled
  };

  // Handle star click
  const handleStarClick = (starNumber) => {
    if (isInteractive) {
      onRatingChange(starNumber);
    }
  };

  // Handle keyboard navigation
  const handleKeyDown = (e, starNumber) => {
    if (!isInteractive) return;

    switch (e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault();
        handleStarClick(starNumber);
        break;
      case 'ArrowRight':
      case 'ArrowUp':
        e.preventDefault();
        if (starNumber < 5) {
          handleStarClick(starNumber + 1);
        }
        break;
      case 'ArrowLeft':
      case 'ArrowDown':
        e.preventDefault();
        if (starNumber > 1) {
          handleStarClick(starNumber - 1);
        }
        break;
      default:
        break;
    }
  };

  return (
    <div className="inline-flex items-center gap-2">
      {/* Stars */}
      <div 
        className={`inline-flex ${isInteractive ? 'gap-1' : 'gap-0.5'}`}
        role={isInteractive ? 'radiogroup' : 'img'}
        aria-label={`Rating: ${rating} out of 5 stars`}
      >
        {stars.map((starNumber) => {
          const fillPercentage = getStarFill(starNumber);
          const isFilled = fillPercentage > 0;
          const isPartiallyFilled = fillPercentage > 0 && fillPercentage < 100;

          return (
            <button
              key={starNumber}
              type="button"
              onClick={() => handleStarClick(starNumber)}
              onKeyDown={(e) => handleKeyDown(e, starNumber)}
              disabled={!isInteractive}
              tabIndex={isInteractive ? 0 : -1}
              className={`
                relative inline-flex items-center justify-center
                ${isInteractive ? 'cursor-pointer hover:scale-110 active:scale-95' : 'cursor-default'}
                transition-all duration-150
                ${isInteractive ? 'focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 rounded' : ''}
              `}
              aria-label={`${starNumber} star${starNumber > 1 ? 's' : ''}`}
              aria-checked={isInteractive ? starNumber <= rating : undefined}
              role={isInteractive ? 'radio' : undefined}
            >
              {/* Star icon */}
              {isPartiallyFilled ? (
                // Partially filled star (for averages)
                <div className="relative">
                  {/* Background star (empty) */}
                  <Star 
                    className={`${sizeClasses[size]} text-gray-300`}
                    strokeWidth={2}
                  />
                  {/* Foreground star (filled portion) */}
                  <div 
                    className="absolute inset-0 overflow-hidden"
                    style={{ width: `${fillPercentage}%` }}
                  >
                    <Star 
                      className={`${sizeClasses[size]} text-yellow-400 fill-yellow-400`}
                      strokeWidth={2}
                    />
                  </div>
                </div>
              ) : (
                // Fully filled or empty star
                <Star 
                  className={`
                    ${sizeClasses[size]}
                    ${isFilled ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}
                    ${isInteractive && !isFilled ? 'hover:text-yellow-200 hover:fill-yellow-200' : ''}
                  `}
                  strokeWidth={2}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Numeric value */}
      {showValue && (
        <span className={`font-bold text-gray-700 ${textSizeClasses[size]}`}>
          {rating > 0 ? rating.toFixed(1) : '—'}
        </span>
      )}
    </div>
  );
}

StarRating.propTypes = {
  rating: PropTypes.number,
  onRatingChange: PropTypes.func,
  readonly: PropTypes.bool,
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  showValue: PropTypes.bool,
};
