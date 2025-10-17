import { supabase } from '../lib/supabase'
import { dashboardCache } from '../lib/cache'

/**
 * Dashboard Service
 * Centralizes all dashboard data fetching operations
 * Pure functions that interact with Supabase and return data or throw errors
 * Implements caching layer to reduce redundant API calls
 */

/**
 * Fetch user's created datasets with partnership info
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Array of datasets with partnerships
 * @throws {Error} If query fails
 */
export async function fetchUserDatasets(userId) {
  const cacheKey = `datasets:${userId}`
  
  // Check cache first
  const cached = dashboardCache.get(cacheKey)
  if (cached) return cached
  
  const { data, error } = await supabase
    .from('datasets')
    .select(`
      *,
      dataset_partnerships (
        id,
        status,
        curator_user_id,
        pro_curators (
          display_name,
          badge_level
        )
      )
    `)
    .eq('creator_id', userId)
    .order('created_at', { ascending: false })
  
  if (error) throw error
  
  const result = data || []
  dashboardCache.set(cacheKey, result)
  return result
}

/**
 * Fetch purchase counts for multiple datasets
 * @param {Array<string>} datasetIds - Array of dataset IDs
 * @returns {Promise<Object>} Map of dataset ID to purchase count
 * @throws {Error} If query fails
 */
export async function fetchDatasetPurchaseCounts(datasetIds) {
  if (!datasetIds || datasetIds.length === 0) {
    return {}
  }
  
  const cacheKey = `purchase-counts:${datasetIds.sort().join(',')}`
  
  // Check cache first
  const cached = dashboardCache.get(cacheKey)
  if (cached) return cached
  
  const { data, error } = await supabase
    .from('purchases')
    .select('dataset_id')
    .in('dataset_id', datasetIds)
    .eq('status', 'completed')
  
  if (error) throw error
  
  // Count purchases per dataset
  const countMap = {}
  data?.forEach(p => {
    countMap[p.dataset_id] = (countMap[p.dataset_id] || 0) + 1
  })
  
  // Cache the result
  dashboardCache.set(cacheKey, countMap)
  return countMap
}

/**
 * Fetch user's earnings summary
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Array of earnings transactions
 * @throws {Error} If query fails
 */
export async function fetchEarnings(userId) {
  const cacheKey = `earnings:${userId}`
  
  // Check cache first
  const cached = dashboardCache.get(cacheKey)
  if (cached) return cached
  
  const { data, error } = await supabase
    .from('creator_earnings')
    .select('*')
    .eq('creator_id', userId)
    .order('earned_at', { ascending: false })
  
  if (error) throw error
  
  const result = data || []
  dashboardCache.set(cacheKey, result)
  return result
}

/**
 * Fetch user's payout account
 * @param {string} userId - User ID
 * @returns {Promise<Object|null}> Payout account or null if not found
 * @throws {Error} If query fails
 */
export async function fetchPayoutAccount(userId) {
  const cacheKey = `payout:${userId}`
  
  // Check cache first
  const cached = dashboardCache.get(cacheKey)
  if (cached !== null && cached !== undefined) return cached
  
  const { data, error } = await supabase
    .from('creator_payout_accounts')
    .select('*')
    .eq('creator_id', userId)
    .maybeSingle()
  
  if (error) throw error
  
  dashboardCache.set(cacheKey, data)
  return data
}

/**
 * Fetch user's completed purchases
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Array of purchases with dataset info
 * @throws {Error} If query fails
 */
export async function fetchUserPurchases(userId) {
  const { data, error } = await supabase
    .from('purchases')
    .select(`
      *,
      datasets (*)
    `)
    .eq('user_id', userId)
    .eq('status', 'completed')
    .order('purchased_at', { ascending: false })
  
  if (error) throw error
  return data || []
}

/**
 * Check if user is an admin
 * @param {string} userId - User ID
 * @returns {Promise<Object|null>} Admin record or null if not admin
 * @throws {Error} If query fails
 */
export async function checkAdminStatus(userId) {
  const { data, error } = await supabase
    .from('admins')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()
  
  if (error) throw error
  return data
}

/**
 * Fetch user's favorited datasets
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Array of favorites with dataset info
 * @throws {Error} If query fails
 */
export async function fetchUserFavorites(userId) {
  const { data, error} = await supabase
    .from('dataset_favorites')
    .select(`
      *,
      datasets (*)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  
  if (error) throw error
  return data || []
}

/**
 * Fetch user's curation requests/bounties
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Array of curation requests
 * @throws {Error} If query fails
 */
export async function fetchUserBounties(userId) {
  const { data, error } = await supabase
    .from('curation_requests')
    .select('*')
    .eq('creator_id', userId)
    .order('created_at', { ascending: false })
  
  if (error) throw error
  return data || []
}

/**
 * Fetch user's bounty submissions
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Array of submissions with request and dataset info
 * @throws {Error} If query fails
 */
export async function fetchBountySubmissions(userId) {
  const { data, error } = await supabase
    .from('bounty_submissions')
    .select('*, curation_requests!request_id (*), datasets (*)')
    .eq('creator_id', userId)
    .order('submitted_at', { ascending: false })
  
  if (error) throw error
  return data || []
}

/**
 * Fetch curation requests with proposals and submissions
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Array of curation requests with full details
 * @throws {Error} If query fails
 */
export async function fetchCurationRequests(userId) {
  const { data, error } = await supabase
    .from('curation_requests')
    .select(`
      *, 
      curator_proposals (
        id, status, curator_id, proposal_text, 
        estimated_completion_days, suggested_price, created_at, 
        pro_curators (
          id, display_name, badge_level, rating, 
          total_projects, specialties
        )
      ), 
      curator_submissions (
        id, submission_number, file_name, file_size, file_path, 
        completion_notes, changes_made, status, reviewer_feedback, 
        created_at, reviewed_at
      )
    `)
    .eq('creator_id', userId)
    .order('created_at', { ascending: false })
  
  if (error) throw error
  return data || []
}

/**
 * Fetch open curation requests for marketplace
 * @param {number} limit - Maximum number of requests to fetch
 * @returns {Promise<Array>} Array of open curation requests
 * @throws {Error} If query fails
 */
export async function fetchOpenCurationRequests(limit = 20) {
  const { data, error } = await supabase
    .from('curation_requests')
    .select('*')
    .eq('status', 'open')
    .order('created_at', { ascending: false })
    .limit(limit)
  
  if (error) throw error
  return data || []
}

/**
 * Fetch pro curator profile for user
 * @param {string} userId - User ID
 * @returns {Promise<Object|null>} Curator profile or null if not a curator
 * @throws {Error} If query fails
 */
export async function fetchCuratorProfile(userId) {
  const { data, error } = await supabase
    .from('pro_curators')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()
  
  if (error) throw error
  return data
}

/**
 * Fetch deletion requests for user
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Array of deletion requests with dataset info
 * @throws {Error} If query fails
 */
export async function fetchDeletionRequests(userId) {
  const { data, error } = await supabase
    .from('deletion_requests')
    .select('*, datasets (id, title, description)')
    .eq('requester_id', userId)
    .order('requested_at', { ascending: false })
  
  if (error) throw error
  return data || []
}

/**
 * Fetch curator proposals for multiple requests
 * @param {Array<string>} requestIds - Array of request IDs
 * @returns {Promise<Array>} Array of proposals
 * @throws {Error} If query fails
 */
export async function fetchBountyProposals(requestIds) {
  if (!requestIds || requestIds.length === 0) {
    return []
  }
  
  const { data, error } = await supabase
    .from('curator_proposals')
    .select('*')
    .in('request_id', requestIds)
  
  if (error) throw error
  return data || []
}

/**
 * Fetch pro curators info (for matching with proposals)
 * @returns {Promise<Array>} Array of curator profiles
 * @throws {Error} If query fails
 */
export async function fetchProCurators() {
  const { data, error } = await supabase
    .from('pro_curators')
    .select('id, display_name, badge_level')
  
  if (error) throw error
  return data || []
}

/**
 * Fetch curation requests assigned to a curator
 * @param {string} curatorId - Curator ID
 * @returns {Promise<Array>} Array of assigned requests
 * @throws {Error} If query fails
 */
export async function fetchAssignedRequests(curatorId) {
  const { data, error } = await supabase
    .from('curation_requests')
    .select('*')
    .eq('assigned_curator_id', curatorId)
    .order('created_at', { ascending: false })
  
  if (error) throw error
  return data || []
}

/**
 * Fetch proposals for assigned requests
 * @param {Array<string>} requestIds - Array of request IDs
 * @returns {Promise<Array>} Array of proposals
 * @throws {Error} If query fails
 */
export async function fetchProposalsForRequests(requestIds) {
  if (!requestIds || requestIds.length === 0) {
    return []
  }
  
  const { data, error } = await supabase
    .from('curator_proposals')
    .select('*')
    .in('request_id', requestIds)
  
  if (error) throw error
  return data || []
}

/**
 * Fetch creator profiles for multiple users
 * @param {Array<string>} creatorIds - Array of creator IDs
 * @returns {Promise<Array>} Array of profile data
 * @throws {Error} If query fails
 */
export async function fetchCreatorProfiles(creatorIds) {
  if (!creatorIds || creatorIds.length === 0) {
    return []
  }
  
  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, avatar_url')
    .in('id', creatorIds)
  
  if (error) throw error
  return data || []
}

/**
 * Verify Stripe account status (background check)
 * @param {string} creatorId - Creator user ID
 * @returns {Promise<Object>} Verification result
 */
export async function verifyStripeAccount(creatorId) {
  const response = await fetch('/.netlify/functions/verify-stripe-account', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ creatorId })
  })
  
  const data = await response.json()
  
  if (!response.ok) {
    throw new Error(data.error || 'Failed to verify Stripe account')
  }
  
  return data
}

/**
 * Check moderation access for user
 * @param {boolean} isAdmin - Whether user is admin
 * @param {number} trustLevel - User's trust level
 * @returns {boolean} Whether user has moderation access
 */
export function checkModerationAccess(isAdmin, trustLevel) {
  return isAdmin || (trustLevel >= 3)
}
