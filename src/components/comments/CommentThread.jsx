import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { ChevronDown, ChevronUp } from 'lucide-react';
import CommentItem from './CommentItem';
import CommentForm from './CommentForm';
import { getCommentReplies, addComment, updateComment, deleteComment, flagComment } from '../../lib/commentService';
import { logCommentAdded } from '../../lib/activityTracking';

/**
 * CommentThread Component
 * Manages a comment and its nested replies
 * 
 * Features:
 * - Display parent comment
 * - Load and show replies
 * - Collapsible reply threads
 * - Reply form toggling
 * - Edit/delete reply handling
 * - Recursive nesting (up to max depth)
 */
function CommentThread({
  comment,
  datasetId,
  datasetOwnerId,
  datasetTitle = 'this dataset',
  currentUserId,
  isAdmin,
  onCommentUpdate,
  depth = 0,
  maxDepth = 3,
}) {
  const [replies, setReplies] = useState([]);
  const [showReplies, setShowReplies] = useState(false);
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [editingComment, setEditingComment] = useState(null);
  const [isLoadingReplies, setIsLoadingReplies] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const hasReplies = comment.reply_count > 0;
  const canNestDeeper = depth < maxDepth;

  // Load replies when expanded
  useEffect(() => {
    if (showReplies && hasReplies && replies.length === 0) {
      loadReplies();
    }
  }, [showReplies, hasReplies]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadReplies = async () => {
    setIsLoadingReplies(true);
    setError(null);

    const result = await getCommentReplies(comment.id);

    if (result.success) {
      setReplies(result.replies);
    } else {
      setError(result.error);
    }

    setIsLoadingReplies(false);
  };

  const handleReply = () => {
    if (!currentUserId) {
      alert('Please sign in to reply to comments');
      return;
    }
    setShowReplyForm(true);
    setShowReplies(true); // Auto-expand replies when replying
  };

  const handleEdit = (commentToEdit) => {
    setEditingComment(commentToEdit);
  };

  const handleDelete = async (commentId) => {
    if (!confirm('Are you sure you want to delete this comment?')) {
      return;
    }

    const result = await deleteComment(commentId);

    if (result.success) {
      // If deleting a reply, remove it from replies list
      if (commentId !== comment.id) {
        setReplies(replies.filter((r) => r.id !== commentId));
        // Update parent comment reply count
        if (onCommentUpdate) {
          onCommentUpdate({
            ...comment,
            reply_count: Math.max(0, (comment.reply_count || 0) - 1),
          });
        }
      } else {
        // If deleting parent comment, notify parent component
        if (onCommentUpdate) {
          onCommentUpdate({ ...comment, is_deleted: true });
        }
      }
    } else {
      alert(result.error || 'Failed to delete comment');
    }
  };

  const handleFlag = async (commentId) => {
    if (!currentUserId) {
      alert('Please sign in to report comments');
      return;
    }

    if (!confirm('Report this comment as inappropriate?')) {
      return;
    }

    const result = await flagComment(commentId);

    if (result.success) {
      alert('Comment has been reported. Thank you for helping keep our community safe!');
    } else {
      alert(result.error || 'Failed to report comment');
    }
  };

  const handleSubmitReply = async (content) => {
    setIsSubmitting(true);
    setError(null);

    const result = await addComment(datasetId, content, comment.id);

    if (result.success) {
      // Add new reply to list
      setReplies([result.comment, ...replies]);
      
      // Log activity for reply
      if (currentUserId) {
        await logCommentAdded(
          currentUserId,
          result.comment.id,
          datasetId,
          datasetTitle,
          comment.id // parent_comment_id for replies
        );
      }
      
      // Update parent comment reply count
      if (onCommentUpdate) {
        onCommentUpdate({
          ...comment,
          reply_count: (comment.reply_count || 0) + 1,
        });
      }
      
      // Reset form
      setShowReplyForm(false);
      setShowReplies(true); // Keep replies expanded
    } else {
      setError(result.error);
    }

    setIsSubmitting(false);
  };

  const handleSubmitEdit = async (content) => {
    if (!editingComment) return;

    setIsSubmitting(true);
    setError(null);

    const result = await updateComment(editingComment.id, content);

    if (result.success) {
      // Update comment in list
      if (editingComment.id === comment.id) {
        // Editing parent comment
        if (onCommentUpdate) {
          onCommentUpdate(result.comment);
        }
      } else {
        // Editing a reply
        setReplies(
          replies.map((r) => (r.id === editingComment.id ? { ...r, ...result.comment } : r))
        );
      }

      setEditingComment(null);
    } else {
      setError(result.error);
    }

    setIsSubmitting(false);
  };

  const handleReplyUpdate = (updatedReply) => {
    setReplies(replies.map((r) => (r.id === updatedReply.id ? updatedReply : r)));
  };

  return (
    <div>
      {/* Main Comment */}
      {!editingComment || editingComment.id !== comment.id ? (
        <CommentItem
          comment={comment}
          currentUserId={currentUserId}
          datasetOwnerId={datasetOwnerId}
          isAdmin={isAdmin}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onReply={handleReply}
          onFlag={handleFlag}
          showReplyButton={canNestDeeper}
          depth={depth}
        />
      ) : (
        <div className={depth > 0 ? 'ml-8' : ''}>
          <CommentForm
            onSubmit={handleSubmitEdit}
            onCancel={() => setEditingComment(null)}
            editMode={true}
            initialContent={editingComment.content}
            isSubmitting={isSubmitting}
          />
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="mt-2 ml-8 p-3 bg-red-100 border-2 border-red-500 text-red-700 text-sm font-bold">
          {error}
        </div>
      )}

      {/* Reply Form */}
      {showReplyForm && canNestDeeper && (
        <div className="mt-4 ml-8">
          <CommentForm
            onSubmit={handleSubmitReply}
            onCancel={() => setShowReplyForm(false)}
            replyTo={{
              id: comment.id,
              username: comment.username,
              content: comment.content,
            }}
            isSubmitting={isSubmitting}
            placeholder="Write your reply..."
          />
        </div>
      )}

      {/* Replies Section */}
      {hasReplies && (
        <div className="mt-4 ml-8">
          {/* Toggle Replies Button */}
          <button
            onClick={() => setShowReplies(!showReplies)}
            className="flex items-center gap-2 text-sm font-bold text-cyan-600 hover:text-cyan-700 mb-4 transition-colors"
          >
            {showReplies ? (
              <>
                <ChevronUp className="w-4 h-4" />
                Hide {comment.reply_count} {comment.reply_count === 1 ? 'reply' : 'replies'}
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4" />
                Show {comment.reply_count} {comment.reply_count === 1 ? 'reply' : 'replies'}
              </>
            )}
          </button>

          {/* Replies List */}
          {showReplies && (
            <div className="space-y-4">
              {isLoadingReplies ? (
                <div className="text-center py-8 text-gray-500">
                  <div className="animate-spin text-2xl mb-2">⏳</div>
                  <div className="text-sm font-bold">Loading replies...</div>
                </div>
              ) : replies.length > 0 ? (
                replies.map((reply) => (
                  <CommentThread
                    key={reply.id}
                    comment={reply}
                    datasetId={datasetId}
                    datasetOwnerId={datasetOwnerId}
                    datasetTitle={datasetTitle}
                    currentUserId={currentUserId}
                    isAdmin={isAdmin}
                    onCommentUpdate={handleReplyUpdate}
                    depth={depth + 1}
                    maxDepth={maxDepth}
                  />
                ))
              ) : (
                <div className="text-center py-4 text-gray-500 text-sm">
                  No replies yet
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

CommentThread.propTypes = {
  comment: PropTypes.shape({
    id: PropTypes.string.isRequired,
    content: PropTypes.string.isRequired,
    user_id: PropTypes.string.isRequired,
    username: PropTypes.string,
    reply_count: PropTypes.number,
  }).isRequired,
  datasetId: PropTypes.string.isRequired,
  datasetOwnerId: PropTypes.string,
  datasetTitle: PropTypes.string,
  currentUserId: PropTypes.string,
  isAdmin: PropTypes.bool,
  onCommentUpdate: PropTypes.func,
  depth: PropTypes.number,
  maxDepth: PropTypes.number,
};

export default CommentThread;
