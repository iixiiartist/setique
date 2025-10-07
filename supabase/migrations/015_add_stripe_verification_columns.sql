-- Migration 015: Add Stripe Account Verification Columns
-- Purpose: Add columns to track detailed Stripe Connect account status
-- Date: 2025-10-06

BEGIN;

-- Add charges_enabled if it doesn't exist (from migration 005)
ALTER TABLE creator_payout_accounts
ADD COLUMN IF NOT EXISTS charges_enabled BOOLEAN DEFAULT false;

-- Add details_submitted to track if all required info is provided
ALTER TABLE creator_payout_accounts
ADD COLUMN IF NOT EXISTS details_submitted BOOLEAN DEFAULT false;

-- Update existing records where onboarding is marked complete
UPDATE creator_payout_accounts
SET 
  charges_enabled = payouts_enabled,
  details_submitted = onboarding_completed
WHERE charges_enabled IS NULL OR details_submitted IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN creator_payout_accounts.charges_enabled IS 'Stripe Connect account can accept payments';
COMMENT ON COLUMN creator_payout_accounts.details_submitted IS 'All required business information submitted to Stripe';

COMMIT;
