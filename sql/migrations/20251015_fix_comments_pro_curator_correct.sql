-- ============================================================================
-- FIX: Comments System - Correct Pro Curator Check
-- Created: October 15, 2025
-- Purpose: Fix pro curator check to use user_id instead of id
-- ============================================================================

-- Drop existing functions first to avoid return type conflicts
DROP FUNCTION IF EXISTS add_dataset_comment(UUID, TEXT, UUID);
DROP FUNCTION IF EXISTS get_dataset_comments(UUID, INTEGER, INTEGER);
DROP FUNCTION IF EXISTS get_comment_replies(UUID);

-- Fix add_dataset_comment function
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
    -- FIXED: Check pro_curators.user_id instead of pro_curators.id
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
        EXISTS(
            SELECT 1 FROM pro_curators pc 
            WHERE pc.user_id = c.user_id 
            AND pc.certification_status = 'approved'
        ) as is_pro_curator
    FROM dataset_comments c
    LEFT JOIN profiles p ON c.user_id = p.id
    WHERE c.id = v_comment_id;
END;
$$;

-- Fix get_dataset_comments function
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
    is_deleted BOOLEAN,
    reply_count INTEGER,
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
    -- FIXED: Check pro_curators.user_id instead of pro_curators.id
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
        c.is_deleted,
        COALESCE(
            (SELECT COUNT(*)::INTEGER 
             FROM dataset_comments replies 
             WHERE replies.parent_comment_id = c.id 
             AND replies.is_deleted = false),
            0
        ) as reply_count,
        p.username,
        p.display_name,
        p.avatar_url,
        EXISTS(
            SELECT 1 FROM pro_curators pc 
            WHERE pc.user_id = c.user_id 
            AND pc.certification_status = 'approved'
        ) as is_pro_curator
    FROM dataset_comments c
    LEFT JOIN profiles p ON c.user_id = p.id
    WHERE c.dataset_id = p_dataset_id
    AND c.is_deleted = false
    ORDER BY c.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$;

-- Fix get_comment_replies function
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
    is_deleted BOOLEAN,
    reply_count INTEGER,
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
    -- FIXED: Check pro_curators.user_id instead of pro_curators.id
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
        c.is_deleted,
        COALESCE(
            (SELECT COUNT(*)::INTEGER 
             FROM dataset_comments replies 
             WHERE replies.parent_comment_id = c.id 
             AND replies.is_deleted = false),
            0
        ) as reply_count,
        p.username,
        p.display_name,
        p.avatar_url,
        EXISTS(
            SELECT 1 FROM pro_curators pc 
            WHERE pc.user_id = c.user_id 
            AND pc.certification_status = 'approved'
        ) as is_pro_curator
    FROM dataset_comments c
    LEFT JOIN profiles p ON c.user_id = p.id
    WHERE c.parent_comment_id = p_parent_comment_id
    AND c.is_deleted = false
    ORDER BY c.created_at ASC;
END;
$$;
