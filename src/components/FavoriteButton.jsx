import { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import PropTypes from 'prop-types';

/**
 * FavoriteButton - Allows users to favorite/unfavorite datasets
 * Features:
 * - Optimistic UI updates
 * - Heart icon that fills when favorited
 * - Shows favorite count
 * - Handles authentication
 */
export default function FavoriteButton({ datasetId, initialCount = 0, size = 'md', showCount = true }) {
  const { user } = useAuth();
  const [isFavorited, setIsFavorited] = useState(false);
  const [favoriteCount, setFavoriteCount] = useState(initialCount);
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  // Size variants
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  const buttonSizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-2 text-sm',
    lg: 'px-4 py-2 text-base'
  };

  // Check if user has favorited this dataset
  useEffect(() => {
    const checkFavoriteStatus = async () => {
      if (!user) {
        setIsChecking(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('dataset_favorites')
          .select('id')
          .eq('dataset_id', datasetId)
          .eq('user_id', user.id)
          .maybeSingle();

        if (!error) {
          setIsFavorited(!!data);
        }
      } catch (error) {
        console.error('Error checking favorite status:', error);
      } finally {
        setIsChecking(false);
      }
    };

    checkFavoriteStatus();
  }, [user, datasetId]);

  const handleToggleFavorite = async (e) => {
    e.preventDefault(); // Prevent navigation if button is in a link
    e.stopPropagation(); // Prevent event bubbling

    if (!user) {
      alert('Please sign in to favorite datasets');
      return;
    }

    if (isLoading) return;

    setIsLoading(true);

    // Optimistic update
    const wasFavorited = isFavorited;
    const oldCount = favoriteCount;
    setIsFavorited(!isFavorited);
    setFavoriteCount(prev => wasFavorited ? Math.max(0, prev - 1) : prev + 1);

    try {
      if (isFavorited) {
        // Unfavorite
        const { error } = await supabase
          .from('dataset_favorites')
          .delete()
          .eq('dataset_id', datasetId)
          .eq('user_id', user.id);

        if (error) throw error;

        // Log activity (unfavorite doesn't need to be logged)
      } else {
        // Favorite
        const { error } = await supabase
          .from('dataset_favorites')
          .insert({
            dataset_id: datasetId,
            user_id: user.id
          });

        if (error) throw error;

        // Log activity
        try {
          await supabase.rpc('log_user_activity', {
            p_user_id: user.id,
            p_activity_type: 'dataset_favorited',
            p_target_id: datasetId,
            p_target_type: 'dataset'
          });
        } catch (activityError) {
          console.warn('Failed to log activity:', activityError);
        }
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      
      // Revert optimistic update on error
      setIsFavorited(wasFavorited);
      setFavoriteCount(oldCount);
      
      if (error.code === '23505') {
        alert('You already favorited this dataset');
      } else {
        alert('Failed to update favorite. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isChecking && user) {
    return (
      <button
        disabled
        className={`inline-flex items-center gap-2 font-bold border-2 border-black bg-gray-100 cursor-not-allowed ${buttonSizeClasses[size]}`}
      >
        <Heart className={sizeClasses[size]} />
        {showCount && <span>...</span>}
      </button>
    );
  }

  return (
    <button
      onClick={handleToggleFavorite}
      disabled={isLoading}
      className={`inline-flex items-center gap-2 font-bold border-2 border-black transition-all hover:translate-x-[2px] hover:translate-y-[2px] ${
        isFavorited
          ? 'bg-red-400 hover:bg-red-500 text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
          : 'bg-white hover:bg-gray-50 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
      } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''} ${buttonSizeClasses[size]}`}
      aria-label={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
      aria-pressed={isFavorited}
    >
      <Heart
        className={`${sizeClasses[size]} ${isFavorited ? 'fill-current' : ''}`}
      />
      {showCount && (
        <span>
          {favoriteCount}
        </span>
      )}
    </button>
  );
}

FavoriteButton.propTypes = {
  datasetId: PropTypes.string.isRequired,
  initialCount: PropTypes.number,
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  showCount: PropTypes.bool
};
