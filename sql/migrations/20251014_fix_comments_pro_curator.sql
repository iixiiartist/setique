-- ============================================================================
-- FIX: Comments System - Pro Curator Badge Display
-- Created: October 14, 2025
-- Purpose: Fix is_pro_curator check to use pro_curators table instead of profiles column
-- ============================================================================

-- Drop and recreate the add_dataset_comment function with correct pro curator check
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
        EXISTS(SELECT 1 FROM pro_curators pc WHERE pc.id = c.user_id) as is_pro_curator
    FROM dataset_comments c
    LEFT JOIN profiles p ON c.user_id = p.id
    WHERE c.id = v_comment_id;
END;
$$;

-- Drop and recreate the get_dataset_comments function with correct pro curator check
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
        EXISTS(SELECT 1 FROM pro_curators pc WHERE pc.id = c.user_id) as is_pro_curator,
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
    AND c.parent_comment_id IS NULL
    ORDER BY c.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$;

-- Drop and recreate the get_comment_replies function with correct pro curator check
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
        EXISTS(SELECT 1 FROM pro_curators pc WHERE pc.id = c.user_id) as is_pro_curator
    FROM dataset_comments c
    LEFT JOIN profiles p ON c.user_id = p.id
    WHERE c.parent_comment_id = p_parent_comment_id
    AND c.is_deleted = false
    ORDER BY c.created_at ASC; -- Replies show oldest first
END;
$$;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Test query to verify the fix works:
-- SELECT * FROM get_dataset_comments('some-dataset-id', 10, 0);

-- ============================================================================
-- NOTES
-- ============================================================================
-- 
-- This migration fixes the "column p.is_pro_curator does not exist" error by:
-- 1. Using EXISTS subquery to check pro_curators table
-- 2. Updating all 3 RPC functions that return comment data
-- 
-- To apply:
-- 1. Open Supabase SQL Editor
-- 2. Paste and run this entire file
-- 3. Verify no errors
-- 4. Test comments on frontend
