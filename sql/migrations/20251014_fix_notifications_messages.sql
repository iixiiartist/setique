-- ============================================================================
-- FIX: Improve notification messages to include usernames
-- Created: October 14, 2025
-- Purpose: Update add_dataset_comment function to include username in notifications
-- ============================================================================

-- This fixes two issues:
-- 1. Notification messages now include the actor's username
-- 2. Message generation is more helpful and specific

BEGIN;

-- Update the add_dataset_comment function to include username in notification messages
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
    v_actor_username TEXT;
    v_dataset_title TEXT;
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
    
    -- Get actor username and dataset title for better notification messages
    SELECT p.username, d.title 
    INTO v_actor_username, v_dataset_title
    FROM profiles p
    CROSS JOIN datasets d
    WHERE p.id = auth.uid() 
    AND d.id = p_dataset_id;
    
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
            v_actor_username || ' commented on ' || v_dataset_title
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
                    v_actor_username || ' replied to your comment on ' || v_dataset_title
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

COMMIT;

-- Verification
DO $$
BEGIN
  RAISE NOTICE '✅ Notification messages updated successfully!';
  RAISE NOTICE 'Comments will now show: "[username] commented on [dataset]"';
  RAISE NOTICE 'Replies will now show: "[username] replied to your comment on [dataset]"';
END $$;
