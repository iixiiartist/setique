import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { MessageSquare, RefreshCw, AlertCircle } from 'lucide-react';
import CommentThread from './CommentThread';
import CommentForm from './CommentForm';
import { getDatasetComments, addComment, subscribeToComments } from '../../lib/commentService';
import { logCommentAdded } from '../../lib/activityTracking';

/**
 * DatasetComments Component
 * Main container for dataset comments section
 * 
 * Features:
 * - Load and display all top-level comments
 * - Add new comment form
 * - Real-time updates via Supabase subscriptions
 * - Pagination/load more
 * - Empty states
 * - Loading states
 * - Error handling
 * - Automatic refresh on new comments
 */
function DatasetComments({
  datasetId,
  datasetOwnerId,
  currentUserId,
  isAdmin = false,
  initialCommentCount = 0,
  datasetTitle = 'this dataset',
}) {
  const [comments, setComments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(0);
  
  const COMMENTS_PER_PAGE = 20;

  // Load initial comments
  useEffect(() => {
    loadComments(0);
  }, [datasetId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Set up real-time subscription
  useEffect(() => {
    const subscription = subscribeToComments(
      datasetId,
      (newComment) => {
        // Only add if it's a top-level comment (no parent)
        if (!newComment.parent_comment_id) {
          // Check if comment already exists (avoid duplicates)
          setComments((prev) => {
            if (prev.some((c) => c.id === newComment.id)) {
              return prev;
            }
            return [newComment, ...prev];
          });
        }
      },
      (updatedComment) => {
        setComments((prev) =>
          prev.map((c) => (c.id === updatedComment.id ? { ...c, ...updatedComment } : c))
        );
      },
      (deletedComment) => {
        setComments((prev) => prev.filter((c) => c.id !== deletedComment.id));
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [datasetId]);

  const loadComments = async (pageNum) => {
    setIsLoading(true);
    setError(null);

    const offset = pageNum * COMMENTS_PER_PAGE;
    const result = await getDatasetComments(datasetId, COMMENTS_PER_PAGE, offset);

    if (result.success) {
      // Filter for top-level comments only
      const topLevelComments = result.comments.filter((c) => !c.parent_comment_id);
      
      if (pageNum === 0) {
        setComments(topLevelComments);
      } else {
        setComments((prev) => [...prev, ...topLevelComments]);
      }

      setHasMore(topLevelComments.length === COMMENTS_PER_PAGE);
      setPage(pageNum);
    } else {
      setError(result.error);
    }

    setIsLoading(false);
  };

  const handleSubmitComment = async (content) => {
    if (!currentUserId) {
      alert('Please sign in to comment');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const result = await addComment(datasetId, content);

    if (result.success) {
      // Add new comment to top of list (real-time subscription will handle duplicates)
      setComments((prev) => [result.comment, ...prev]);
      
      // Log activity for activity feed
      await logCommentAdded(
        currentUserId,
        result.comment.id,
        datasetId,
        datasetTitle,
        null // parent_comment_id
      );
    } else {
      setError(result.error);
    }

    setIsSubmitting(false);
  };

  const handleLoadMore = () => {
    loadComments(page + 1);
  };

  const handleRefresh = () => {
    loadComments(0);
  };

  const handleCommentUpdate = (updatedComment) => {
    setComments((prev) =>
      prev.map((c) => (c.id === updatedComment.id ? updatedComment : c))
    );
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          <h3 className="font-black text-lg">
            Comments
            {initialCommentCount > 0 && (
              <span className="ml-2 text-gray-500 text-sm">({initialCommentCount})</span>
            )}
          </h3>
        </div>

        {/* Refresh Button */}
        <button
          onClick={handleRefresh}
          disabled={isLoading}
          className="p-1.5 hover:bg-gray-100 rounded transition-colors disabled:opacity-50"
          aria-label="Refresh comments"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Add Comment Form */}
      {currentUserId ? (
        <CommentForm
          onSubmit={handleSubmitComment}
          isSubmitting={isSubmitting}
          placeholder="Share your thoughts about this dataset..."
        />
      ) : (
        <div className="bg-gray-50 border-4 border-black p-6 text-center">
          <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-400" />
          <p className="font-bold text-gray-700 mb-2">Sign in to join the conversation</p>
          <p className="text-sm text-gray-600">
            Create an account or sign in to comment on this dataset
          </p>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-100 border-4 border-red-500 p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <div className="font-bold text-red-800">Failed to load comments</div>
            <div className="text-sm text-red-700 mt-1">{error}</div>
          </div>
        </div>
      )}

      {/* Comments List */}
      {isLoading && comments.length === 0 ? (
        <div className="text-center py-8">
          <div className="animate-spin text-2xl mb-2">⏳</div>
          <div className="font-bold text-gray-600 text-sm">Loading comments...</div>
        </div>
      ) : comments.length > 0 ? (
        <div className="space-y-4">
          {comments.map((comment) => (
            <CommentThread
              key={comment.id}
              comment={comment}
              datasetId={datasetId}
              datasetOwnerId={datasetOwnerId}
              datasetTitle={datasetTitle}
              currentUserId={currentUserId}
              isAdmin={isAdmin}
              onCommentUpdate={handleCommentUpdate}
              depth={0}
            />
          ))}

          {/* Load More Button */}
          {hasMore && (
            <div className="text-center pt-4">
              <button
                onClick={handleLoadMore}
                disabled={isLoading}
                className="px-8 py-3 bg-white text-black font-black text-sm uppercase border-4 border-black hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin">⏳</span>
                    Loading...
                  </span>
                ) : (
                  'Load More Comments'
                )}
              </button>
            </div>
          )}
        </div>
      ) : (
        !isLoading && (
          <div className="bg-gray-50 border-2 border-black p-6 text-center rounded-lg">
            <MessageSquare className="w-10 h-10 mx-auto mb-2 text-gray-300" />
            <h4 className="font-black text-sm text-gray-700 mb-1">No comments yet</h4>
            <p className="text-gray-600 text-xs mb-2">
              Be the first to share your thoughts!
            </p>
            {!currentUserId && (
              <p className="text-xs text-gray-500 italic">
                Sign in to start the conversation
              </p>
            )}
          </div>
        )
      )}

      {/* Comment Count Summary (bottom) */}
      {comments.length > 0 && !hasMore && (
        <div className="text-center pt-4 pb-2 text-sm text-gray-500">
          Showing all {comments.length} {comments.length === 1 ? 'comment' : 'comments'}
        </div>
      )}
    </div>
  );
}

DatasetComments.propTypes = {
  datasetId: PropTypes.string.isRequired,
  datasetOwnerId: PropTypes.string,
  currentUserId: PropTypes.string,
  isAdmin: PropTypes.bool,
  initialCommentCount: PropTypes.number,
  datasetTitle: PropTypes.string,
};

export default DatasetComments;
