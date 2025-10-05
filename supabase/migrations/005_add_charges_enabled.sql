-- Add charges_enabled column to track Stripe Connect account capability
ALTER TABLE creator_payout_accounts
ADD COLUMN IF NOT EXISTS charges_enabled BOOLEAN DEFAULT false;

-- Update existing records to match payouts_enabled status
UPDATE creator_payout_accounts
SET charges_enabled = payouts_enabled
WHERE charges_enabled IS NULL;
