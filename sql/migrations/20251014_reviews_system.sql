-- ============================================================================
-- DATASET REVIEWS & RATINGS SYSTEM
-- Created: October 14, 2025
-- Purpose: Enable users to rate and review datasets they've purchased
-- ============================================================================

BEGIN;

-- ============================================================================
-- ADD RATING COLUMNS TO DATASETS TABLE
-- ============================================================================

-- Add average rating and review count to datasets
ALTER TABLE datasets 
ADD COLUMN IF NOT EXISTS average_rating DECIMAL(2,1) DEFAULT 0 CHECK (average_rating >= 0 AND average_rating <= 5),
ADD COLUMN IF NOT EXISTS review_count INTEGER DEFAULT 0 CHECK (review_count >= 0);

-- Create index for sorting by rating
CREATE INDEX IF NOT EXISTS idx_datasets_rating ON datasets(average_rating DESC, review_count DESC);

-- ============================================================================
-- CREATE DATASET_REVIEWS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS dataset_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dataset_id UUID NOT NULL REFERENCES datasets(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT,
    verified_purchase BOOLEAN DEFAULT FALSE,
    helpful_count INTEGER DEFAULT 0 CHECK (helpful_count >= 0),
    unhelpful_count INTEGER DEFAULT 0 CHECK (unhelpful_count >= 0),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ,
    edited BOOLEAN DEFAULT FALSE,
    
    -- One review per dataset per user
    UNIQUE(dataset_id, user_id)
);

-- Create indexes for performance
CREATE INDEX idx_reviews_dataset ON dataset_reviews(dataset_id, created_at DESC);
CREATE INDEX idx_reviews_user ON dataset_reviews(user_id, created_at DESC);
CREATE INDEX idx_reviews_rating ON dataset_reviews(dataset_id, rating DESC);
CREATE INDEX idx_reviews_helpful ON dataset_reviews(dataset_id, helpful_count DESC);

-- ============================================================================
-- CREATE REVIEW_VOTES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS review_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    review_id UUID NOT NULL REFERENCES dataset_reviews(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    is_helpful BOOLEAN NOT NULL, -- true = helpful, false = unhelpful
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- One vote per review per user
    UNIQUE(review_id, user_id)
);

-- Create index for vote lookups
CREATE INDEX idx_review_votes_review ON review_votes(review_id);
CREATE INDEX idx_review_votes_user ON review_votes(user_id);

-- ============================================================================
-- TRIGGERS TO UPDATE DATASET RATING STATS
-- ============================================================================

-- Function to recalculate dataset rating statistics
CREATE OR REPLACE FUNCTION update_dataset_rating_stats()
RETURNS TRIGGER AS $$
DECLARE
    v_dataset_id UUID;
BEGIN
    -- Determine which dataset to update
    IF TG_OP = 'DELETE' THEN
        v_dataset_id := OLD.dataset_id;
    ELSE
        v_dataset_id := NEW.dataset_id;
    END IF;

    -- Update dataset average_rating and review_count
    UPDATE datasets
    SET 
        average_rating = COALESCE(
            (SELECT ROUND(AVG(rating)::numeric, 1)
             FROM dataset_reviews
             WHERE dataset_id = v_dataset_id),
            0
        ),
        review_count = COALESCE(
            (SELECT COUNT(*)
             FROM dataset_reviews
             WHERE dataset_id = v_dataset_id),
            0
        )
    WHERE id = v_dataset_id;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on INSERT, UPDATE, DELETE of reviews
DROP TRIGGER IF EXISTS trigger_update_rating_stats ON dataset_reviews;
CREATE TRIGGER trigger_update_rating_stats
AFTER INSERT OR UPDATE OR DELETE ON dataset_reviews
FOR EACH ROW EXECUTE FUNCTION update_dataset_rating_stats();

-- ============================================================================
-- TRIGGER TO UPDATE REVIEW VOTE COUNTS
-- ============================================================================

-- Function to update helpful/unhelpful counts on reviews
CREATE OR REPLACE FUNCTION update_review_vote_counts()
RETURNS TRIGGER AS $$
DECLARE
    v_review_id UUID;
    v_helpful_count INTEGER;
    v_unhelpful_count INTEGER;
BEGIN
    -- Determine which review to update
    IF TG_OP = 'DELETE' THEN
        v_review_id := OLD.review_id;
    ELSE
        v_review_id := NEW.review_id;
    END IF;

    -- Count helpful and unhelpful votes
    SELECT 
        COUNT(*) FILTER (WHERE is_helpful = true),
        COUNT(*) FILTER (WHERE is_helpful = false)
    INTO v_helpful_count, v_unhelpful_count
    FROM review_votes
    WHERE review_id = v_review_id;

    -- Update review
    UPDATE dataset_reviews
    SET 
        helpful_count = v_helpful_count,
        unhelpful_count = v_unhelpful_count
    WHERE id = v_review_id;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on INSERT, UPDATE, DELETE of votes
DROP TRIGGER IF EXISTS trigger_update_vote_counts ON review_votes;
CREATE TRIGGER trigger_update_vote_counts
AFTER INSERT OR UPDATE OR DELETE ON review_votes
FOR EACH ROW EXECUTE FUNCTION update_review_vote_counts();

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

-- Enable RLS
ALTER TABLE dataset_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_votes ENABLE ROW LEVEL SECURITY;

-- Reviews: Anyone can read
CREATE POLICY "Anyone can read reviews"
ON dataset_reviews FOR SELECT
TO authenticated, anon
USING (true);

-- Reviews: Authenticated users who purchased can create
CREATE POLICY "Purchasers can create reviews"
ON dataset_reviews FOR INSERT
TO authenticated
WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
        SELECT 1 FROM purchases
        WHERE purchases.user_id = auth.uid()
        AND purchases.dataset_id = dataset_reviews.dataset_id
        AND purchases.status = 'completed'
    )
);

-- Reviews: Users can update their own reviews (within 30 days)
CREATE POLICY "Users can update own reviews"
ON dataset_reviews FOR UPDATE
TO authenticated
USING (
    auth.uid() = user_id AND
    created_at > NOW() - INTERVAL '30 days'
)
WITH CHECK (auth.uid() = user_id);

-- Reviews: Users can delete their own reviews
CREATE POLICY "Users can delete own reviews"
ON dataset_reviews FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Reviews: Admins can manage all reviews
CREATE POLICY "Admins can manage all reviews"
ON dataset_reviews FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM admins
        WHERE admins.user_id = auth.uid()
    )
);

-- Vote Policies: Anyone can read votes
CREATE POLICY "Anyone can read votes"
ON review_votes FOR SELECT
TO authenticated, anon
USING (true);

-- Vote Policies: Authenticated users can vote
CREATE POLICY "Users can vote on reviews"
ON review_votes FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Vote Policies: Users can update their own votes
CREATE POLICY "Users can update own votes"
ON review_votes FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Vote Policies: Users can delete their own votes
CREATE POLICY "Users can delete own votes"
ON review_votes FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- ============================================================================
-- RPC FUNCTIONS
-- ============================================================================

-- Function: Add or update a review
CREATE OR REPLACE FUNCTION add_dataset_review(
    p_dataset_id UUID,
    p_rating INTEGER,
    p_review_text TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_review_id UUID;
    v_is_verified BOOLEAN;
    v_dataset_owner_id UUID;
    v_dataset_title TEXT;
    v_reviewer_username TEXT;
BEGIN
    -- Verify dataset exists
    IF NOT EXISTS (SELECT 1 FROM datasets WHERE id = p_dataset_id) THEN
        RAISE EXCEPTION 'Dataset not found';
    END IF;
    
    -- Verify rating is valid
    IF p_rating < 1 OR p_rating > 5 THEN
        RAISE EXCEPTION 'Rating must be between 1 and 5';
    END IF;
    
    -- Check if user has purchased this dataset
    SELECT EXISTS (
        SELECT 1 FROM purchases
        WHERE user_id = auth.uid()
        AND dataset_id = p_dataset_id
        AND status = 'completed'
    ) INTO v_is_verified;
    
    IF NOT v_is_verified THEN
        RAISE EXCEPTION 'You must purchase this dataset before reviewing';
    END IF;
    
    -- Get dataset info for notification
    SELECT creator_id, title INTO v_dataset_owner_id, v_dataset_title
    FROM datasets
    WHERE id = p_dataset_id;
    
    -- Get reviewer username
    SELECT username INTO v_reviewer_username
    FROM profiles
    WHERE id = auth.uid();
    
    -- Insert or update review (upsert)
    INSERT INTO dataset_reviews (
        dataset_id,
        user_id,
        rating,
        review_text,
        verified_purchase
    ) VALUES (
        p_dataset_id,
        auth.uid(),
        p_rating,
        p_review_text,
        v_is_verified
    )
    ON CONFLICT (dataset_id, user_id) 
    DO UPDATE SET
        rating = EXCLUDED.rating,
        review_text = EXCLUDED.review_text,
        updated_at = NOW(),
        edited = true
    RETURNING id INTO v_review_id;
    
    -- Create notification for dataset owner (if not reviewing own dataset)
    IF v_dataset_owner_id != auth.uid() THEN
        PERFORM create_notification(
            v_dataset_owner_id,
            auth.uid(),
            'review_added',
            v_review_id,
            'review',
            v_reviewer_username || ' left a ' || p_rating || '-star review on ' || v_dataset_title
        );
    END IF;
    
    RETURN v_review_id;
END;
$$;

-- Function: Delete a review
CREATE OR REPLACE FUNCTION delete_dataset_review(p_review_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    DELETE FROM dataset_reviews
    WHERE id = p_review_id
    AND user_id = auth.uid();
    
    RETURN FOUND;
END;
$$;

-- Function: Vote on a review (helpful/unhelpful)
CREATE OR REPLACE FUNCTION vote_on_review(
    p_review_id UUID,
    p_is_helpful BOOLEAN
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Insert or update vote (upsert)
    INSERT INTO review_votes (
        review_id,
        user_id,
        is_helpful
    ) VALUES (
        p_review_id,
        auth.uid(),
        p_is_helpful
    )
    ON CONFLICT (review_id, user_id)
    DO UPDATE SET
        is_helpful = EXCLUDED.is_helpful;
    
    RETURN TRUE;
END;
$$;

-- Function: Remove a vote from a review
CREATE OR REPLACE FUNCTION remove_review_vote(p_review_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    DELETE FROM review_votes
    WHERE review_id = p_review_id
    AND user_id = auth.uid();
    
    RETURN FOUND;
END;
$$;

COMMIT;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '✅ Reviews & Ratings System created successfully!';
    RAISE NOTICE '';
    RAISE NOTICE 'Tables created:';
    RAISE NOTICE '  - dataset_reviews (with verified_purchase flag)';
    RAISE NOTICE '  - review_votes (helpful/unhelpful)';
    RAISE NOTICE '';
    RAISE NOTICE 'Columns added to datasets:';
    RAISE NOTICE '  - average_rating (0-5, 1 decimal)';
    RAISE NOTICE '  - review_count';
    RAISE NOTICE '';
    RAISE NOTICE 'RPC Functions:';
    RAISE NOTICE '  - add_dataset_review(dataset_id, rating, review_text)';
    RAISE NOTICE '  - delete_dataset_review(review_id)';
    RAISE NOTICE '  - vote_on_review(review_id, is_helpful)';
    RAISE NOTICE '  - remove_review_vote(review_id)';
    RAISE NOTICE '';
    RAISE NOTICE 'Features:';
    RAISE NOTICE '  ⭐ 1-5 star ratings';
    RAISE NOTICE '  ✅ Verified purchase badge';
    RAISE NOTICE '  👍 Helpful/unhelpful voting';
    RAISE NOTICE '  📊 Auto-calculated average ratings';
    RAISE NOTICE '  🔔 Notifications to dataset owners';
    RAISE NOTICE '  ✏️ Edit reviews within 30 days';
    RAISE NOTICE '';
    RAISE NOTICE 'Ready to implement UI components!';
END $$;
