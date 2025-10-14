import { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { MessageSquare, X } from 'lucide-react';
import { validateCommentContent } from '../../lib/commentService';

/**
 * CommentForm Component
 * Form for adding or editing comments
 * 
 * Features:
 * - Textarea with character counter
 * - Validation and error display
 * - Edit mode support
 * - Reply mode with parent comment context
 * - Cancel/submit buttons
 * - Auto-focus on mount
 * - Keyboard shortcuts (Ctrl+Enter to submit)
 */
function CommentForm({
  onSubmit,
  onCancel,
  editMode = false,
  initialContent = '',
  replyTo = null,
  isSubmitting = false,
  placeholder = 'Share your thoughts...',
}) {
  const [content, setContent] = useState(initialContent);
  const [error, setError] = useState(null);
  const textareaRef = useRef(null);

  const maxLength = 5000;
  const remainingChars = maxLength - content.length;

  // Auto-focus on mount
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
      // Move cursor to end if editing
      if (editMode && initialContent) {
        textareaRef.current.setSelectionRange(
          initialContent.length,
          initialContent.length
        );
      }
    }
  }, [editMode, initialContent]);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate
    const validation = validateCommentContent(content);
    if (!validation.valid) {
      setError(validation.error);
      return;
    }

    // Clear error and submit
    setError(null);
    if (onSubmit) {
      onSubmit(content);
    }
  };

  const handleCancel = () => {
    setContent('');
    setError(null);
    if (onCancel) onCancel();
  };

  const handleKeyDown = (e) => {
    // Ctrl+Enter or Cmd+Enter to submit
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      handleSubmit(e);
    }

    // Escape to cancel
    if (e.key === 'Escape') {
      handleCancel();
    }
  };

  return (
    <div className="bg-white border-4 border-black rounded-none shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
      <form onSubmit={handleSubmit} className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            <span className="font-black text-sm">
              {editMode ? 'Edit Comment' : replyTo ? `Reply to @${replyTo.username}` : 'Add Comment'}
            </span>
          </div>
          {(editMode || replyTo) && (
            <button
              type="button"
              onClick={handleCancel}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
              aria-label="Cancel"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Reply Context (if replying) */}
        {replyTo && (
          <div className="mb-3 p-3 bg-gray-50 border-2 border-gray-200">
            <div className="text-xs text-gray-600 mb-1">
              Replying to <span className="font-bold">@{replyTo.username}</span>
            </div>
            <div className="text-sm text-gray-700 line-clamp-2">
              {replyTo.content}
            </div>
          </div>
        )}

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={isSubmitting}
          className={`w-full min-h-[120px] p-3 border-2 border-black focus:outline-none focus:border-cyan-500 font-medium resize-y ${
            isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
          }`}
          maxLength={maxLength}
        />

        {/* Character Counter */}
        <div className="flex items-center justify-between mt-2">
          <div className="text-xs">
            <span className={remainingChars < 100 ? 'text-red-600 font-bold' : 'text-gray-500'}>
              {remainingChars} characters remaining
            </span>
          </div>

          {/* Keyboard Shortcut Hint */}
          <div className="text-xs text-gray-400">
            <span className="hidden sm:inline">
              Ctrl+Enter to submit • Esc to cancel
            </span>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mt-3 p-3 bg-red-100 border-2 border-red-500 text-red-700 text-sm font-bold">
            {error}
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-2 mt-4">
          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting || !content.trim()}
            className={`flex-1 px-6 py-3 font-black text-sm uppercase border-4 border-black transition-all ${
              isSubmitting || !content.trim()
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-cyan-400 to-purple-500 text-white hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-1 active:translate-y-1 active:shadow-none'
            }`}
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <span className="animate-spin">⏳</span>
                {editMode ? 'Updating...' : 'Posting...'}
              </span>
            ) : (
              <span>{editMode ? 'Update Comment' : 'Post Comment'}</span>
            )}
          </button>

          {/* Cancel Button (only show in edit/reply mode) */}
          {(editMode || replyTo) && (
            <button
              type="button"
              onClick={handleCancel}
              disabled={isSubmitting}
              className="px-6 py-3 bg-white text-black font-black text-sm uppercase border-4 border-black hover:bg-gray-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
          )}
        </div>

        {/* Edit Window Notice */}
        {editMode && (
          <div className="mt-3 text-xs text-gray-600 italic">
            💡 Comments can only be edited within 15 minutes of posting
          </div>
        )}
      </form>
    </div>
  );
}

CommentForm.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func,
  editMode: PropTypes.bool,
  initialContent: PropTypes.string,
  replyTo: PropTypes.shape({
    id: PropTypes.string,
    username: PropTypes.string,
    content: PropTypes.string,
  }),
  isSubmitting: PropTypes.bool,
  placeholder: PropTypes.string,
};

export default CommentForm;
