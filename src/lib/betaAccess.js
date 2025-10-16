/**
 * Beta access utility functions
 * Centralized logic for checking beta access status
 */

import { supabase } from './supabase'
import { handleSupabaseError } from './logger'

/**
 * Check if a user has beta access
 * @param {string} userId - The user's ID
 * @returns {Promise<boolean>} True if user has beta access
 */
export async function checkBetaAccess(userId) {
  if (!userId) return false
  
  try {
    const { data, error } = await supabase.rpc('has_beta_access', {
      user_id_param: userId
    })
    
    if (error) {
      handleSupabaseError(error, 'checkBetaAccess')
      return false
    }
    
    return !!data
  } catch (error) {
    handleSupabaseError(error, 'checkBetaAccess')
    return false
  }
}

/**
 * Get detailed beta access status for a user
 * @param {string} userId - The user's ID
 * @returns {Promise<object|null>} Beta status object or null
 */
export async function getBetaStatus(userId) {
  if (!userId) return null
  
  try {
    const { data, error } = await supabase
      .from('beta_access')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()
    
    if (error) throw error
    return data
  } catch (error) {
    handleSupabaseError(error, 'getBetaStatus')
    return null
  }
}
