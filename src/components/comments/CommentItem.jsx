import { useState } from 'react';
import PropTypes from 'prop-types';
import { MessageSquare, Edit2, Trash2, Flag, MoreVertical, X } from 'lucide-react';
import { formatCommentTime, canEditComment, canDeleteComment } from '../../lib/commentService';

/**
 * CommentItem Component
 * Displays an individual comment with neobrutalist styling
 * 
 * Features:
 * - Shows comment content and metadata
 * - Edit/delete buttons (with permission checks)
 * - Reply button for threading
 * - Flag/report button for moderation
 * - Pro Curator badge display
 * - Edited indicator
 * - Dropdown menu for actions
 */
function CommentItem({
  comment,
  currentUserId,
  datasetOwnerId,
  isAdmin,
  onEdit,
  onDelete,
  onReply,
  onFlag,
  showReplyButton = true,
  depth = 0,
}) {
  const [showActions, setShowActions] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Permission checks
  const canEdit = canEditComment(comment, currentUserId);
  const canDelete = canDeleteComment(comment, currentUserId, datasetOwnerId, isAdmin);

  // Format display name
  const displayName = comment.display_name || comment.username || 'Anonymous';
  
  // Calculate indentation for nested comments
  const indentClass = depth > 0 ? 'ml-8' : '';
  const maxDepth = 3; // Limit nesting to prevent UI issues
  const isMaxDepth = depth >= maxDepth;

  const handleEdit = () => {
    setShowActions(false);
    if (onEdit) onEdit(comment);
  };

  const handleDelete = () => {
    if (confirmDelete) {
      setShowActions(false);
      setConfirmDelete(false);
      if (onDelete) onDelete(comment.id);
    } else {
      setConfirmDelete(true);
      // Auto-reset after 3 seconds
      setTimeout(() => setConfirmDelete(false), 3000);
    }
  };

  const handleReply = () => {
    setShowActions(false);
    if (onReply) onReply(comment);
  };

  const handleFlag = () => {
    setShowActions(false);
    if (onFlag) onFlag(comment.id);
  };

  return (
    <div className={`${indentClass} mb-3`}>
      {/* Comment Card */}
      <div className="bg-white border-2 border-black rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all">
        <div className="p-3">
          {/* Header: User info and actions */}
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              {/* Avatar */}
              {comment.avatar_url ? (
                <img
                  src={comment.avatar_url}
                  alt={displayName}
                  className="w-8 h-8 border-2 border-black rounded-full object-cover"
                />
              ) : (
                <div className="w-8 h-8 bg-gradient-to-br from-cyan-400 to-purple-500 border-2 border-black rounded-full flex items-center justify-center text-white font-black text-xs">
                  {displayName.charAt(0).toUpperCase()}
                </div>
              )}

              {/* User info */}
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-black text-xs">{displayName}</span>
                  {comment.username && (
                    <span className="text-[10px] text-gray-500">@{comment.username}</span>
                  )}
                  {comment.is_pro_curator && (
                    <span className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black text-[10px] font-black px-1.5 py-0.5 border border-black rounded">
                      PRO
                    </span>
                  )}
                </div>
                <div className="text-[10px] text-gray-600">
                  {formatCommentTime(comment.created_at)}
                  {comment.edited && (
                    <span className="ml-1 italic text-gray-500">(edited)</span>
                  )}
                </div>
              </div>
            </div>

            {/* Actions Menu */}
            <div className="relative">
              <button
                onClick={() => setShowActions(!showActions)}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
                aria-label="Comment actions"
              >
                <MoreVertical className="w-5 h-5" />
              </button>

              {/* Actions Dropdown */}
              {showActions && (
                <div className="absolute right-0 top-8 bg-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] z-10 min-w-[160px]">
                  {/* Edit */}
                  {canEdit && (
                    <button
                      onClick={handleEdit}
                      className="w-full text-left px-4 py-2 hover:bg-yellow-100 transition-colors flex items-center gap-2 font-bold text-sm"
                    >
                      <Edit2 className="w-4 h-4" />
                      Edit
                    </button>
                  )}

                  {/* Reply */}
                  {showReplyButton && !isMaxDepth && (
                    <button
                      onClick={handleReply}
                      className="w-full text-left px-4 py-2 hover:bg-cyan-100 transition-colors flex items-center gap-2 font-bold text-sm"
                    >
                      <MessageSquare className="w-4 h-4" />
                      Reply
                    </button>
                  )}

                  {/* Flag */}
                  {!canDelete && currentUserId && (
                    <button
                      onClick={handleFlag}
                      className="w-full text-left px-4 py-2 hover:bg-red-100 transition-colors flex items-center gap-2 font-bold text-sm text-red-600"
                    >
                      <Flag className="w-4 h-4" />
                      Report
                    </button>
                  )}

                  {/* Delete */}
                  {canDelete && (
                    <button
                      onClick={handleDelete}
                      className={`w-full text-left px-4 py-2 transition-colors flex items-center gap-2 font-bold text-sm ${
                        confirmDelete
                          ? 'bg-red-500 text-white hover:bg-red-600'
                          : 'text-red-600 hover:bg-red-100'
                      }`}
                    >
                      {confirmDelete ? (
                        <>
                          <X className="w-4 h-4" />
                          Confirm Delete?
                        </>
                      ) : (
                        <>
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </>
                      )}
                    </button>
                  )}

                  {/* Close */}
                  <button
                    onClick={() => setShowActions(false)}
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors flex items-center gap-2 font-bold text-sm text-gray-600 border-t-2 border-black"
                  >
                    <X className="w-4 h-4" />
                    Close
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Comment Content */}
          <div className="text-xs leading-relaxed whitespace-pre-wrap break-words">
            {comment.content}
          </div>

          {/* Reply Count Indicator */}
          {comment.reply_count > 0 && (
            <div className="mt-3 pt-3 border-t-2 border-gray-200">
              <button
                onClick={handleReply}
                className="text-xs font-bold text-cyan-600 hover:text-cyan-700 flex items-center gap-1"
              >
                <MessageSquare className="w-3 h-3" />
                {comment.reply_count} {comment.reply_count === 1 ? 'reply' : 'replies'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Max Depth Notice */}
      {isMaxDepth && showReplyButton && (
        <div className="mt-2 ml-8 text-xs text-gray-500 italic">
          Maximum nesting depth reached. Start a new thread to continue the conversation.
        </div>
      )}
    </div>
  );
}

CommentItem.propTypes = {
  comment: PropTypes.shape({
    id: PropTypes.string.isRequired,
    user_id: PropTypes.string.isRequired,
    content: PropTypes.string.isRequired,
    created_at: PropTypes.string.isRequired,
    updated_at: PropTypes.string,
    edited: PropTypes.bool,
    username: PropTypes.string,
    display_name: PropTypes.string,
    avatar_url: PropTypes.string,
    is_pro_curator: PropTypes.bool,
    reply_count: PropTypes.number,
  }).isRequired,
  currentUserId: PropTypes.string,
  datasetOwnerId: PropTypes.string,
  isAdmin: PropTypes.bool,
  onEdit: PropTypes.func,
  onDelete: PropTypes.func,
  onReply: PropTypes.func,
  onFlag: PropTypes.func,
  showReplyButton: PropTypes.bool,
  depth: PropTypes.number,
};

export default CommentItem;
