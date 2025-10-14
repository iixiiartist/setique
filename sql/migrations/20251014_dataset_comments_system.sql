-- ============================================================================
-- DATASET COMMENTS SYSTEM MIGRATION
-- Created: October 14, 2025
-- Purpose: Enable threaded comments on datasets with moderation capabilities
-- ============================================================================

-- Create dataset_comments table
-- Stores all comments and replies on datasets with nested threading support
CREATE TABLE IF NOT EXISTS dataset_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dataset_id UUID NOT NULL REFERENCES datasets(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    parent_comment_id UUID REFERENCES dataset_comments(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ,
    edited BOOLEAN DEFAULT false,
    
    -- Moderation
    is_deleted BOOLEAN DEFAULT false,
    is_flagged BOOLEAN DEFAULT false,
    flag_count INTEGER DEFAULT 0,
    deleted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    deleted_at TIMESTAMPTZ,
    
    -- Constraints
    CONSTRAINT content_length CHECK (char_length(content) >= 1 AND char_length(content) <= 5000),
    CONSTRAINT no_self_reply CHECK (
        parent_comment_id IS NULL OR 
        parent_comment_id != id
    )
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Primary lookup: Get all comments for a dataset (most recent first)
CREATE INDEX idx_comments_dataset_created 
ON dataset_comments(dataset_id, created_at DESC)
WHERE is_deleted = false;

-- User's comments lookup
CREATE INDEX idx_comments_user 
ON dataset_comments(user_id, created_at DESC)
WHERE is_deleted = false;

-- Parent comment lookup (for threading)
CREATE INDEX idx_comments_parent 
ON dataset_comments(parent_comment_id)
WHERE is_deleted = false AND parent_comment_id IS NOT NULL;

-- Moderation queue index (flagged comments)
CREATE INDEX idx_comments_flagged 
ON dataset_comments(is_flagged, flag_count DESC)
WHERE is_flagged = true AND is_deleted = false;

-- ============================================================================
-- COMMENT COUNT TRACKING
-- ============================================================================

-- Add comment_count column to datasets table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'datasets' AND column_name = 'comment_count'
    ) THEN
        ALTER TABLE datasets ADD COLUMN comment_count INTEGER DEFAULT 0;
    END IF;
END $$;

-- Create index on comment_count for trending/sorting
CREATE INDEX IF NOT EXISTS idx_datasets_comment_count 
ON datasets(comment_count DESC);

-- Function: Update dataset comment count
-- Automatically maintains accurate comment counts on datasets
CREATE OR REPLACE FUNCTION update_dataset_comment_count()
RETURNS TRIGGER AS $$
BEGIN
    -- On INSERT of a non-deleted comment
    IF TG_OP = 'INSERT' AND NEW.is_deleted = false THEN
        UPDATE datasets
        SET comment_count = comment_count + 1
        WHERE id = NEW.dataset_id;
        RETURN NEW;
    END IF;
    
    -- On UPDATE marking comment as deleted
    IF TG_OP = 'UPDATE' AND OLD.is_deleted = false AND NEW.is_deleted = true THEN
        UPDATE datasets
        SET comment_count = GREATEST(comment_count - 1, 0)
        WHERE id = NEW.dataset_id;
        RETURN NEW;
    END IF;
    
    -- On UPDATE restoring deleted comment
    IF TG_OP = 'UPDATE' AND OLD.is_deleted = true AND NEW.is_deleted = false THEN
        UPDATE datasets
        SET comment_count = comment_count + 1
        WHERE id = NEW.dataset_id;
        RETURN NEW;
    END IF;
    
    -- On DELETE (hard delete)
    IF TG_OP = 'DELETE' AND OLD.is_deleted = false THEN
        UPDATE datasets
        SET comment_count = GREATEST(comment_count - 1, 0)
        WHERE id = OLD.dataset_id;
        RETURN OLD;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: Automatically update comment counts
DROP TRIGGER IF EXISTS trigger_update_comment_count ON dataset_comments;
CREATE TRIGGER trigger_update_comment_count
    AFTER INSERT OR UPDATE OR DELETE ON dataset_comments
    FOR EACH ROW
    EXECUTE FUNCTION update_dataset_comment_count();

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Enable RLS
ALTER TABLE dataset_comments ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view non-deleted comments
CREATE POLICY "Anyone can view non-deleted comments"
ON dataset_comments
FOR SELECT
USING (is_deleted = false);

-- Policy: Authenticated users can insert comments
CREATE POLICY "Authenticated users can insert comments"
ON dataset_comments
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own comments (within 15 minutes)
CREATE POLICY "Users can update their own comments"
ON dataset_comments
FOR UPDATE
TO authenticated
USING (
    auth.uid() = user_id AND
    is_deleted = false AND
    created_at > NOW() - INTERVAL '15 minutes'
)
WITH CHECK (
    auth.uid() = user_id AND
    is_deleted = false
);

-- Policy: Users can soft-delete their own comments
CREATE POLICY "Users can delete their own comments"
ON dataset_comments
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (
    auth.uid() = user_id AND
    is_deleted = true -- Only allow updating to set is_deleted = true
);

-- Policy: Dataset owners can soft-delete comments on their datasets
CREATE POLICY "Dataset owners can delete comments on their datasets"
ON dataset_comments
FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM datasets
        WHERE datasets.id = dataset_comments.dataset_id
        AND datasets.creator_id = auth.uid()
    )
)
WITH CHECK (
    is_deleted = true OR is_flagged = true -- Can delete or flag
);

-- Policy: Admins can update/delete any comment
CREATE POLICY "Admins can manage all comments"
ON dataset_comments
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM admins
        WHERE admins.user_id = auth.uid()
    )
);

-- ============================================================================
-- RPC FUNCTIONS
-- ============================================================================

-- Function: Add a comment to a dataset
-- Returns the created comment with user profile information
CREATE OR REPLACE FUNCTION add_dataset_comment(
    p_dataset_id UUID,
    p_content TEXT,
    p_parent_comment_id UUID DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    dataset_id UUID,
    user_id UUID,
    parent_comment_id UUID,
    content TEXT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    edited BOOLEAN,
    username TEXT,
    display_name TEXT,
    avatar_url TEXT,
    is_pro_curator BOOLEAN
) 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    v_comment_id UUID;
    v_dataset_owner_id UUID;
BEGIN
    -- Verify dataset exists
    IF NOT EXISTS (SELECT 1 FROM datasets WHERE datasets.id = p_dataset_id) THEN
        RAISE EXCEPTION 'Dataset not found';
    END IF;
    
    -- Verify parent comment exists if provided
    IF p_parent_comment_id IS NOT NULL THEN
        IF NOT EXISTS (
            SELECT 1 FROM dataset_comments 
            WHERE dataset_comments.id = p_parent_comment_id 
            AND dataset_comments.dataset_id = p_dataset_id
            AND is_deleted = false
        ) THEN
            RAISE EXCEPTION 'Parent comment not found or deleted';
        END IF;
    END IF;
    
    -- Verify content length
    IF char_length(p_content) < 1 OR char_length(p_content) > 5000 THEN
        RAISE EXCEPTION 'Comment must be between 1 and 5000 characters';
    END IF;
    
    -- Insert the comment
    INSERT INTO dataset_comments (
        dataset_id,
        user_id,
        parent_comment_id,
        content
    ) VALUES (
        p_dataset_id,
        auth.uid(),
        p_parent_comment_id,
        p_content
    )
    RETURNING dataset_comments.id INTO v_comment_id;
    
    -- Get dataset owner for notification
    SELECT datasets.creator_id INTO v_dataset_owner_id
    FROM datasets
    WHERE datasets.id = p_dataset_id;
    
    -- Create notification for dataset owner (if not commenting on own dataset)
    IF v_dataset_owner_id != auth.uid() THEN
        PERFORM create_notification(
            v_dataset_owner_id,
            auth.uid(),
            'comment_added',
            v_comment_id,
            'comment',
            'commented on your dataset'
        );
    END IF;
    
    -- If this is a reply, notify the parent comment author
    IF p_parent_comment_id IS NOT NULL THEN
        DECLARE
            v_parent_author_id UUID;
        BEGIN
            SELECT dataset_comments.user_id INTO v_parent_author_id
            FROM dataset_comments
            WHERE dataset_comments.id = p_parent_comment_id;
            
            -- Only notify if not replying to yourself and not the dataset owner (already notified)
            IF v_parent_author_id != auth.uid() AND v_parent_author_id != v_dataset_owner_id THEN
                PERFORM create_notification(
                    v_parent_author_id,
                    auth.uid(),
                    'comment_reply',
                    v_comment_id,
                    'comment',
                    'replied to your comment'
                );
            END IF;
        END;
    END IF;
    
    -- Return the comment with user profile data
    RETURN QUERY
    SELECT 
        c.id,
        c.dataset_id,
        c.user_id,
        c.parent_comment_id,
        c.content,
        c.created_at,
        c.updated_at,
        c.edited,
        p.username,
        p.display_name,
        p.avatar_url,
        p.is_pro_curator
    FROM dataset_comments c
    LEFT JOIN profiles p ON c.user_id = p.id
    WHERE c.id = v_comment_id;
END;
$$;

-- Function: Update a comment
-- Users can edit their own comments within 15 minutes
CREATE OR REPLACE FUNCTION update_dataset_comment(
    p_comment_id UUID,
    p_content TEXT
)
RETURNS TABLE (
    id UUID,
    dataset_id UUID,
    user_id UUID,
    parent_comment_id UUID,
    content TEXT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    edited BOOLEAN
) 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    -- Verify comment exists and user owns it
    IF NOT EXISTS (
        SELECT 1 FROM dataset_comments 
        WHERE dataset_comments.id = p_comment_id 
        AND user_id = auth.uid()
        AND is_deleted = false
    ) THEN
        RAISE EXCEPTION 'Comment not found or you do not have permission to edit it';
    END IF;
    
    -- Verify edit window (15 minutes)
    IF NOT EXISTS (
        SELECT 1 FROM dataset_comments 
        WHERE dataset_comments.id = p_comment_id 
        AND created_at > NOW() - INTERVAL '15 minutes'
    ) THEN
        RAISE EXCEPTION 'Edit window expired (15 minutes after posting)';
    END IF;
    
    -- Verify content length
    IF char_length(p_content) < 1 OR char_length(p_content) > 5000 THEN
        RAISE EXCEPTION 'Comment must be between 1 and 5000 characters';
    END IF;
    
    -- Update the comment
    UPDATE dataset_comments
    SET 
        content = p_content,
        updated_at = NOW(),
        edited = true
    WHERE dataset_comments.id = p_comment_id;
    
    -- Return updated comment
    RETURN QUERY
    SELECT 
        c.id,
        c.dataset_id,
        c.user_id,
        c.parent_comment_id,
        c.content,
        c.created_at,
        c.updated_at,
        c.edited
    FROM dataset_comments c
    WHERE c.id = p_comment_id;
END;
$$;

-- Function: Delete a comment (soft delete)
-- Users can delete their own comments, dataset owners can delete comments on their datasets
CREATE OR REPLACE FUNCTION delete_dataset_comment(
    p_comment_id UUID
)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    v_user_id UUID;
    v_dataset_id UUID;
    v_dataset_owner_id UUID;
BEGIN
    -- Get comment details
    SELECT user_id, dataset_id INTO v_user_id, v_dataset_id
    FROM dataset_comments
    WHERE id = p_comment_id;
    
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Comment not found';
    END IF;
    
    -- Get dataset owner
    SELECT creator_id INTO v_dataset_owner_id
    FROM datasets
    WHERE id = v_dataset_id;
    
    -- Check permissions: owner of comment, owner of dataset, or admin
    IF auth.uid() != v_user_id 
       AND auth.uid() != v_dataset_owner_id 
       AND NOT EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid())
    THEN
        RAISE EXCEPTION 'You do not have permission to delete this comment';
    END IF;
    
    -- Soft delete the comment
    UPDATE dataset_comments
    SET 
        is_deleted = true,
        deleted_by = auth.uid(),
        deleted_at = NOW()
    WHERE id = p_comment_id;
    
    RETURN true;
END;
$$;

-- Function: Flag a comment for moderation
-- Any authenticated user can flag inappropriate comments
CREATE OR REPLACE FUNCTION flag_dataset_comment(
    p_comment_id UUID,
    p_reason TEXT DEFAULT NULL
)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    -- Verify comment exists
    IF NOT EXISTS (
        SELECT 1 FROM dataset_comments 
        WHERE id = p_comment_id 
        AND is_deleted = false
    ) THEN
        RAISE EXCEPTION 'Comment not found';
    END IF;
    
    -- Increment flag count and mark as flagged
    UPDATE dataset_comments
    SET 
        is_flagged = true,
        flag_count = flag_count + 1
    WHERE id = p_comment_id;
    
    -- TODO: In future, store flag reasons in separate moderation_flags table
    -- For now, auto-hide if flag_count >= 5
    UPDATE dataset_comments
    SET is_deleted = true
    WHERE id = p_comment_id AND flag_count >= 5;
    
    RETURN true;
END;
$$;

-- Function: Get comments for a dataset with threading
-- Returns comments with user profiles, ordered for display
CREATE OR REPLACE FUNCTION get_dataset_comments(
    p_dataset_id UUID,
    p_limit INTEGER DEFAULT 50,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    dataset_id UUID,
    user_id UUID,
    parent_comment_id UUID,
    content TEXT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    edited BOOLEAN,
    username TEXT,
    display_name TEXT,
    avatar_url TEXT,
    is_pro_curator BOOLEAN,
    reply_count INTEGER
) 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.dataset_id,
        c.user_id,
        c.parent_comment_id,
        c.content,
        c.created_at,
        c.updated_at,
        c.edited,
        p.username,
        p.display_name,
        p.avatar_url,
        p.is_pro_curator,
        (
            SELECT COUNT(*)::INTEGER
            FROM dataset_comments replies
            WHERE replies.parent_comment_id = c.id
            AND replies.is_deleted = false
        ) as reply_count
    FROM dataset_comments c
    LEFT JOIN profiles p ON c.user_id = p.id
    WHERE c.dataset_id = p_dataset_id
    AND c.is_deleted = false
    ORDER BY c.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$;

-- Function: Get comment replies (for a specific parent comment)
CREATE OR REPLACE FUNCTION get_comment_replies(
    p_parent_comment_id UUID
)
RETURNS TABLE (
    id UUID,
    dataset_id UUID,
    user_id UUID,
    parent_comment_id UUID,
    content TEXT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    edited BOOLEAN,
    username TEXT,
    display_name TEXT,
    avatar_url TEXT,
    is_pro_curator BOOLEAN
) 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.dataset_id,
        c.user_id,
        c.parent_comment_id,
        c.content,
        c.created_at,
        c.updated_at,
        c.edited,
        p.username,
        p.display_name,
        p.avatar_url,
        p.is_pro_curator
    FROM dataset_comments c
    LEFT JOIN profiles p ON c.user_id = p.id
    WHERE c.parent_comment_id = p_parent_comment_id
    AND c.is_deleted = false
    ORDER BY c.created_at ASC; -- Replies show oldest first
END;
$$;

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

-- Grant execute permissions on RPC functions to authenticated users
GRANT EXECUTE ON FUNCTION add_dataset_comment TO authenticated;
GRANT EXECUTE ON FUNCTION update_dataset_comment TO authenticated;
GRANT EXECUTE ON FUNCTION delete_dataset_comment TO authenticated;
GRANT EXECUTE ON FUNCTION flag_dataset_comment TO authenticated;
GRANT EXECUTE ON FUNCTION get_dataset_comments TO authenticated;
GRANT EXECUTE ON FUNCTION get_comment_replies TO authenticated;

-- Grant execute on create_notification (needed for comment notifications)
GRANT EXECUTE ON FUNCTION create_notification TO authenticated;

-- ============================================================================
-- INITIAL DATA SYNC
-- ============================================================================

-- Populate initial comment counts for existing datasets
UPDATE datasets
SET comment_count = (
    SELECT COUNT(*)
    FROM dataset_comments
    WHERE dataset_comments.dataset_id = datasets.id
    AND dataset_comments.is_deleted = false
)
WHERE comment_count = 0;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Migration verification query:
-- SELECT 
--     'dataset_comments table' as object,
--     EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'dataset_comments') as exists
-- UNION ALL
-- SELECT 
--     'comment_count column' as object,
--     EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'datasets' AND column_name = 'comment_count') as exists
-- UNION ALL
-- SELECT 
--     'add_dataset_comment function' as object,
--     EXISTS(SELECT 1 FROM pg_proc WHERE proname = 'add_dataset_comment') as exists
-- UNION ALL
-- SELECT 
--     'get_dataset_comments function' as object,
--     EXISTS(SELECT 1 FROM pg_proc WHERE proname = 'get_dataset_comments') as exists;

-- ============================================================================
-- NOTES
-- ============================================================================
-- 
-- Features:
-- ✅ Threaded comments with parent_comment_id
-- ✅ Soft delete (is_deleted flag)
-- ✅ Edit tracking (edited flag, updated_at)
-- ✅ 15-minute edit window
-- ✅ Automatic comment count tracking on datasets
-- ✅ Comment flagging/moderation
-- ✅ Auto-hide at 5+ flags
-- ✅ Notifications for comment_added and comment_reply
-- ✅ RLS policies for security
-- ✅ Dataset owner can delete comments on their datasets
-- ✅ Comprehensive RPC functions for all operations
-- 
-- To apply this migration:
-- 1. Connect to your Supabase database
-- 2. Run this SQL file
-- 3. Verify with the verification query above
-- 4. Test RPC functions via Supabase dashboard or API
-- 
-- Next steps:
-- - Build commentService.js frontend library
-- - Create comment React components
-- - Integrate into dataset detail pages
-- - Add comment activity tracking
-- - Build admin moderation UI
-- 
-- ============================================================================
