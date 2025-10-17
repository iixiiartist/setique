import { supabase } from '../lib/supabase'

/**
 * Dataset Service
 * Centralizes dataset management operations
 * Pure functions that interact with Supabase/Netlify and return data or throw errors
 */

/**
 * Update dataset active status
 * @param {string} datasetId - Dataset ID
 * @param {boolean} isActive - New active status
 * @returns {Promise<void>}
 * @throws {Error} If update fails
 */
export async function updateDatasetActiveStatus(datasetId, isActive) {
  const { error } = await supabase
    .from('datasets')
    .update({ is_active: isActive })
    .eq('id', datasetId)
  
  if (error) throw error
}

/**
 * Update dataset details
 * @param {string} datasetId - Dataset ID
 * @param {Object} updates - Dataset fields to update
 * @returns {Promise<void>}
 * @throws {Error} If update fails
 */
export async function updateDataset(datasetId, updates) {
  const { error } = await supabase
    .from('datasets')
    .update(updates)
    .eq('id', datasetId)
  
  if (error) throw error
}

/**
 * Check if a dataset has any completed purchases
 * @param {string} datasetId - Dataset ID
 * @returns {Promise<boolean>} Whether dataset has purchases
 * @throws {Error} If query fails
 */
export async function datasetHasPurchases(datasetId) {
  const { data, error } = await supabase
    .from('purchases')
    .select('id')
    .eq('dataset_id', datasetId)
    .eq('status', 'completed')
    .limit(1)
  
  if (error) throw error
  return data && data.length > 0
}

/**
 * Delete a dataset (via Netlify function to bypass RLS)
 * @param {string} datasetId - Dataset ID
 * @param {string} userId - User ID (for authorization)
 * @returns {Promise<Object>} Deletion result
 * @throws {Error} If deletion fails
 */
export async function deleteDatasetViaFunction(datasetId, userId) {
  const response = await fetch('/.netlify/functions/delete-dataset', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ datasetId, userId })
  })
  
  const data = await response.json()
  
  if (!response.ok) {
    throw new Error(data.error || 'Failed to delete dataset')
  }
  
  return data
}

/**
 * Request dataset deletion (via Netlify function)
 * @param {string} datasetId - Dataset ID
 * @param {string} reason - Reason for deletion
 * @param {string} accessToken - User's access token
 * @returns {Promise<Object>} Request result
 * @throws {Error} If request fails
 */
export async function requestDatasetDeletion(datasetId, reason, accessToken) {
  const response = await fetch('/.netlify/functions/request-deletion', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`
    },
    body: JSON.stringify({ datasetId, reason })
  })
  
  const data = await response.json()
  
  if (!response.ok) {
    throw new Error(data.error || 'Failed to submit deletion request')
  }
  
  return data
}

/**
 * Delete a dataset
 * @param {string} datasetId - Dataset ID
 * @returns {Promise<void>}
 * @throws {Error} If deletion fails
 */
export async function deleteDataset(datasetId) {
  const { error } = await supabase
    .from('datasets')
    .delete()
    .eq('id', datasetId)
  
  if (error) throw error
}

/**
 * Create a deletion request for a dataset
 * @param {string} datasetId - Dataset ID
 * @param {string} requesterId - User requesting deletion
 * @param {string} reason - Reason for deletion request
 * @returns {Promise<void>}
 * @throws {Error} If creation fails
 */
export async function createDeletionRequest(datasetId, requesterId, reason) {
  const { error } = await supabase
    .from('deletion_requests')
    .insert({
      dataset_id: datasetId,
      requester_id: requesterId,
      reason,
      status: 'pending'
    })
  
  if (error) throw error
}

/**
 * Trigger dataset download via Netlify function
 * @param {string} datasetId - Dataset ID
 * @returns {Promise<Object>} Download result with URL
 * @throws {Error} If download fails
 */
export async function triggerDatasetDownload(datasetId) {
  const response = await fetch('/.netlify/functions/download-dataset', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ datasetId })
  })
  
  const data = await response.json()
  
  if (!response.ok) {
    throw new Error(data.error || 'Failed to download dataset')
  }
  
  return data
}

/**
 * Log activity for a dataset
 * @param {string} datasetId - Dataset ID
 * @param {string} activityType - Type of activity (e.g., 'download', 'view')
 * @param {Object} metadata - Additional metadata
 * @returns {Promise<void>}
 * @throws {Error} If logging fails
 */
export async function logDatasetActivity(datasetId, activityType, metadata = {}) {
  const { error } = await supabase
    .from('activity_logs')
    .insert({
      dataset_id: datasetId,
      activity_type: activityType,
      metadata
    })
  
  if (error) throw error
}
