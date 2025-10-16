/**
 * Purchase-related utility functions
 * Centralized logic for fetching and managing user purchases
 */

import { supabase } from './supabase'
import { handleSupabaseError } from './logger'

/**
 * Fetch all completed purchases for a user
 * @param {string} userId - The user's ID
 * @returns {Promise<string[]>} Array of dataset IDs the user owns
 */
export async function fetchUserPurchases(userId) {
  if (!userId) return []
  
  try {
    const { data, error } = await supabase
      .from('purchases')
      .select('dataset_id')
      .eq('user_id', userId)
      .eq('status', 'completed')
    
    if (error) throw error
    return data ? data.map(p => p.dataset_id) : []
  } catch (error) {
    handleSupabaseError(error, 'fetchUserPurchases')
    return []
  }
}

/**
 * Check if a user owns a specific dataset
 * @param {string} userId - The user's ID
 * @param {string} datasetId - The dataset ID to check
 * @returns {Promise<boolean>} True if user owns the dataset
 */
export async function userOwnsDataset(userId, datasetId) {
  if (!userId || !datasetId) return false
  
  try {
    const { data, error } = await supabase
      .from('purchases')
      .select('id')
      .eq('user_id', userId)
      .eq('dataset_id', datasetId)
      .eq('status', 'completed')
      .maybeSingle()
    
    if (error) throw error
    return !!data
  } catch (error) {
    handleSupabaseError(error, 'userOwnsDataset')
    return false
  }
}

/**
 * Check if a purchase already exists (prevent duplicates)
 * @param {string} userId - The user's ID
 * @param {string} datasetId - The dataset ID to check
 * @returns {Promise<boolean>} True if purchase exists
 */
export async function purchaseExists(userId, datasetId) {
  return await userOwnsDataset(userId, datasetId)
}
