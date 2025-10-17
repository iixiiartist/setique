import { supabase } from '../lib/supabase'

/**
 * Bounty Service
 * Centralizes bounty/curation request operations
 * Pure functions that interact with Supabase and return data or throw errors
 */

/**
 * Create a new curation request (bounty)
 * @param {Object} bountyData - Bounty creation data
 * @param {string} bountyData.creatorId - Creator user ID
 * @param {string} bountyData.title - Bounty title
 * @param {string} bountyData.description - Bounty description
 * @param {number} bountyData.budget - Bounty budget
 * @param {string} bountyData.deadline - Deadline (ISO string)
 * @param {Array<string>} bountyData.requirements - Array of requirements
 * @returns {Promise<Object>} Created bounty record
 * @throws {Error} If creation fails
 */
export async function createCurationRequest(bountyData) {
  const { data, error } = await supabase
    .from('curation_requests')
    .insert({
      creator_id: bountyData.creatorId,
      title: bountyData.title,
      description: bountyData.description,
      budget: bountyData.budget,
      deadline: bountyData.deadline,
      requirements: bountyData.requirements,
      status: 'open'
    })
    .select()
    .single()
  
  if (error) throw error
  return data
}

/**
 * Close a curation request (bounty)
 * @param {string} bountyId - Bounty ID
 * @param {string} creatorId - Creator user ID (for authorization check)
 * @returns {Promise<void>}
 * @throws {Error} If update fails
 */
export async function closeCurationRequest(bountyId, creatorId) {
  const { error } = await supabase
    .from('curation_requests')
    .update({ status: 'closed' })
    .eq('id', bountyId)
    .eq('creator_id', creatorId)
  
  if (error) throw error
}

/**
 * Delete a bounty submission
 * @param {string} submissionId - Submission ID
 * @param {string} creatorId - Creator user ID (for authorization check)
 * @returns {Promise<void>}
 * @throws {Error} If deletion fails
 */
export async function deleteBountySubmission(submissionId, creatorId) {
  const { error } = await supabase
    .from('bounty_submissions')
    .delete()
    .eq('id', submissionId)
    .eq('creator_id', creatorId)
  
  if (error) throw error
}

/**
 * Log activity for a bounty
 * @param {string} bountyId - Bounty ID
 * @param {string} activityType - Type of activity (e.g., 'created', 'closed')
 * @param {Object} metadata - Additional metadata
 * @returns {Promise<void>}
 * @throws {Error} If logging fails
 */
export async function logBountyActivity(bountyId, activityType, metadata = {}) {
  const { error } = await supabase
    .from('activity_logs')
    .insert({
      bounty_id: bountyId,
      activity_type: activityType,
      metadata
    })
  
  if (error) throw error
}
