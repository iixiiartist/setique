import { supabase } from '../lib/supabase'

/**
 * Stripe Service
 * Centralizes Stripe Connect operations
 * Pure functions that interact with Netlify functions and return data or throw errors
 */

/**
 * Create Stripe Connect onboarding link
 * @param {Object} options - Onboarding options
 * @param {string} options.creatorId - Creator user ID
 * @param {string} options.email - Creator email
 * @param {string} options.returnUrl - URL to return to after onboarding
 * @param {string} options.refreshUrl - URL to refresh onboarding
 * @returns {Promise<Object>} Object with onboarding URL
 * @throws {Error} If creation fails
 */
export async function createStripeOnboardingLink({ creatorId, email, returnUrl, refreshUrl }) {
  const response = await fetch('/.netlify/functions/connect-onboarding', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ creatorId, email, returnUrl, refreshUrl })
  })
  
  const data = await response.json()
  
  if (!response.ok) {
    throw new Error(data.error || 'Failed to create Stripe Connect link')
  }
  
  return data
}

/**
 * Create Stripe Connect account link
 * @param {string} creatorId - Creator user ID
 * @returns {Promise<Object>} Object with account link URL
 * @throws {Error} If creation fails
 */
export async function createStripeAccountLink(creatorId) {
  const response = await fetch('/.netlify/functions/create-stripe-account', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ creatorId })
  })
  
  const data = await response.json()
  
  if (!response.ok) {
    throw new Error(data.error || 'Failed to create Stripe account')
  }
  
  return data
}

/**
 * Get Stripe account status
 * @param {string} stripeAccountId - Stripe account ID
 * @returns {Promise<Object>} Account status information
 * @throws {Error} If retrieval fails
 */
export async function getStripeAccountStatus(stripeAccountId) {
  const response = await fetch('/.netlify/functions/get-stripe-account-status', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ stripeAccountId })
  })
  
  const data = await response.json()
  
  if (!response.ok) {
    throw new Error(data.error || 'Failed to get Stripe account status')
  }
  
  return data
}

/**
 * Update creator's Stripe account ID
 * @param {string} creatorId - Creator user ID
 * @param {string} stripeAccountId - Stripe account ID
 * @returns {Promise<void>}
 * @throws {Error} If update fails
 */
export async function updateCreatorStripeAccount(creatorId, stripeAccountId) {
  const { error } = await supabase
    .from('creator_payout_accounts')
    .upsert({
      creator_id: creatorId,
      stripe_account_id: stripeAccountId,
      updated_at: new Date().toISOString()
    })
  
  if (error) throw error
}
