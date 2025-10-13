-- ============================================================================
-- NOTIFICATIONS SYSTEM MIGRATION
-- Created: October 12, 2025
-- Purpose: Enable real-time user notifications for social activities
-- ============================================================================

-- Create notifications table
-- Stores all user notifications with activity context
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    activity_type TEXT NOT NULL,
    target_id UUID,
    target_type TEXT,
    message TEXT NOT NULL,
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_activity_type CHECK (
        activity_type IN (
            'dataset_purchased',
            'dataset_favorited',
            'user_followed',
            'bounty_submission',
            'proposal_submitted',
            'comment_added',
            'review_added'
        )
    ),
    CONSTRAINT valid_target_type CHECK (
        target_type IN ('dataset', 'bounty', 'user', 'comment', 'review') OR target_type IS NULL
    )
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Primary lookup index (user's notifications, most recent first)
CREATE INDEX idx_notifications_user_created 
ON notifications(user_id, created_at DESC);

-- Unread notifications index (for badge counts)
CREATE INDEX idx_notifications_user_unread 
ON notifications(user_id, read) 
WHERE read = false;

-- Activity type index (for filtering by notification type)
CREATE INDEX idx_notifications_activity_type 
ON notifications(activity_type);

-- Actor lookup index (who triggered the notification)
CREATE INDEX idx_notifications_actor 
ON notifications(actor_id);

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own notifications
CREATE POLICY "Users can view their own notifications"
ON notifications
FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Users can update their own notifications (mark as read)
CREATE POLICY "Users can update their own notifications"
ON notifications
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy: System can insert notifications for any user
-- Note: This will be called via RPC function with service role key
CREATE POLICY "Service role can insert notifications"
ON notifications
FOR INSERT
WITH CHECK (true);

-- Policy: Users can delete their own notifications
CREATE POLICY "Users can delete their own notifications"
ON notifications
FOR DELETE
USING (auth.uid() = user_id);

-- ============================================================================
-- RPC FUNCTIONS
-- ============================================================================

-- Function: Create a notification for a user
-- Called by backend when activities occur
CREATE OR REPLACE FUNCTION create_notification(
    p_user_id UUID,
    p_actor_id UUID,
    p_activity_type TEXT,
    p_target_id UUID,
    p_target_type TEXT,
    p_message TEXT
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_notification_id UUID;
BEGIN
    -- Don't notify users about their own actions
    IF p_user_id = p_actor_id THEN
        RETURN NULL;
    END IF;

    -- Insert notification
    INSERT INTO notifications (
        user_id,
        actor_id,
        activity_type,
        target_id,
        target_type,
        message
    ) VALUES (
        p_user_id,
        p_actor_id,
        p_activity_type,
        p_target_id,
        p_target_type,
        p_message
    ) RETURNING id INTO v_notification_id;

    RETURN v_notification_id;
END;
$$;

-- Function: Mark a notification as read
CREATE OR REPLACE FUNCTION mark_notification_read(p_notification_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE notifications
    SET read = true
    WHERE id = p_notification_id
    AND user_id = auth.uid();
    
    RETURN FOUND;
END;
$$;

-- Function: Mark all notifications as read for a user
CREATE OR REPLACE FUNCTION mark_all_notifications_read()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_count INTEGER;
BEGIN
    UPDATE notifications
    SET read = true
    WHERE user_id = auth.uid()
    AND read = false;
    
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RETURN v_count;
END;
$$;

-- Function: Get unread notification count for current user
CREATE OR REPLACE FUNCTION get_unread_notification_count()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT COUNT(*)
    INTO v_count
    FROM notifications
    WHERE user_id = auth.uid()
    AND read = false;
    
    RETURN v_count;
END;
$$;

-- Function: Get recent notifications for current user
CREATE OR REPLACE FUNCTION get_recent_notifications(p_limit INTEGER DEFAULT 10)
RETURNS TABLE (
    id UUID,
    actor_id UUID,
    actor_username TEXT,
    actor_avatar TEXT,
    activity_type TEXT,
    target_id UUID,
    target_type TEXT,
    message TEXT,
    read BOOLEAN,
    created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        n.id,
        n.actor_id,
        p.username,
        p.avatar_url,
        n.activity_type,
        n.target_id,
        n.target_type,
        n.message,
        n.read,
        n.created_at
    FROM notifications n
    LEFT JOIN profiles p ON p.id = n.actor_id
    WHERE n.user_id = auth.uid()
    ORDER BY n.created_at DESC
    LIMIT p_limit;
END;
$$;

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

-- Grant execute permissions on RPC functions
GRANT EXECUTE ON FUNCTION create_notification TO authenticated;
GRANT EXECUTE ON FUNCTION mark_notification_read TO authenticated;
GRANT EXECUTE ON FUNCTION mark_all_notifications_read TO authenticated;
GRANT EXECUTE ON FUNCTION get_unread_notification_count TO authenticated;
GRANT EXECUTE ON FUNCTION get_recent_notifications TO authenticated;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Verification query (run this after migration to verify setup)
-- SELECT 
--     tablename, 
--     indexname, 
--     indexdef 
-- FROM pg_indexes 
-- WHERE tablename = 'notifications';

-- Expected result: Should show 4 indexes on notifications table
