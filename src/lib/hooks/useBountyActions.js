import { supabase } from '../supabase'
import { handleSupabaseError } from '../logger'
import { ERROR_MESSAGES } from '../errorMessages'
import { logBountyCreated } from '../activityTracking'

/**
 * Custom hook for managing bounty/curation request actions
 * Centralizes bounty creation, closing, and submission deletion
 * 
 * @param {Object} options - Hook configuration options
 * @param {Object} options.user - Authenticated user object
 * @param {Function} options.fetchDashboardData - Function to refetch all dashboard data
 * @param {Function} options.setError - State setter for error messages
 * @returns {Object} Bounty action handlers
 * 
 * @example
 * const { handleCreateBounty, handleCloseMyBounty, handleDeleteBountySubmission } = useBountyActions({
 *   user,
 *   fetchDashboardData: refetch,
 *   setError
 * });
 */
export const useBountyActions = ({
  user,
  fetchDashboardData,
  setError,
}) => {
  /**
   * Create a new bounty/curation request
   * Validates fields, inserts into database, logs activity
   * 
   * @param {Object} newBounty - Bounty data object
   * @param {string} newBounty.title - Bounty title
   * @param {string} newBounty.description - Bounty description
   * @param {string} newBounty.budget_min - Minimum budget
   * @param {string} newBounty.budget_max - Maximum budget (required)
   * @param {string} newBounty.minimum_curator_tier - Minimum curator tier ('verified', 'pro', etc.)
   */
  const handleCreateBounty = async (newBounty) => {
    if (!newBounty.title || !newBounty.description || !newBounty.budget_max) {
      alert('Please fill in all required fields')
      return
    }

    try {
      const { data: createdBounty, error } = await supabase.from('curation_requests').insert([
        {
          creator_id: user.id,
          title: newBounty.title,
          description: newBounty.description,
          budget_min: parseFloat(newBounty.budget_min) || parseFloat(newBounty.budget_max) * 0.8,
          budget_max: parseFloat(newBounty.budget_max),
          status: 'open',
          target_quality: 'standard',
          specialties_needed: [],
          minimum_curator_tier: newBounty.minimum_curator_tier
        }
      ]).select()

      if (error) throw error

      // Log activity for social feed
      if (createdBounty && createdBounty[0]) {
        await logBountyCreated(
          user.id,
          createdBounty[0].id,
          newBounty.title,
          parseFloat(newBounty.budget_max)
        )
      }

      alert(`Bounty "${newBounty.title}" posted successfully!`)
      
      await fetchDashboardData()
      
      return { success: true, bounty: createdBounty[0] }
    } catch (error) {
      handleSupabaseError(error, 'createBounty')
      setError(ERROR_MESSAGES.CREATE_BOUNTY)
      alert('Failed to create bounty: ' + error.message)
      return { success: false, error }
    }
  }

  /**
   * Close a bounty (prevent new proposals)
   * Confirms with user before closing
   * 
   * @param {string} bountyId - ID of the bounty to close
   */
  const handleCloseMyBounty = async (bountyId) => {
    if (!window.confirm('Close this bounty? No more proposals will be accepted.')) {
      return
    }

    try {
      const { error } = await supabase
        .from('curation_requests')
        .update({ status: 'closed' })
        .eq('id', bountyId)
        .eq('creator_id', user.id) // Only allow closing own bounties

      if (error) throw error

      alert('✅ Bounty closed successfully!')
      
      // Refresh bounties
      await fetchDashboardData()
    } catch (error) {
      handleSupabaseError(error, 'closeBounty')
      setError(ERROR_MESSAGES.CLOSE_BOUNTY)
      alert('Failed to close bounty: ' + error.message)
    }
  }

  /**
   * Delete a bounty submission
   * Confirms with user before deletion
   * 
   * @param {string} submissionId - ID of the submission to delete
   * @param {string} datasetTitle - Title of the dataset (for confirmation message)
   */
  const handleDeleteBountySubmission = async (submissionId, datasetTitle) => {
    if (!window.confirm(`Delete your submission "${datasetTitle}"? This cannot be undone.`)) {
      return
    }

    try {
      const { data, error } = await supabase
        .from('bounty_submissions')
        .delete()
        .eq('id', submissionId)
        .eq('creator_id', user.id) // Only allow deleting own submissions
        .select() // Return deleted row to confirm

      if (error) {
        handleSupabaseError(error, 'deleteBountySubmission')
        throw error
      }

      if (!data || data.length === 0) {
        handleSupabaseError(new Error('No rows deleted - RLS policy issue'), 'deleteBountySubmission')
        alert('⚠️ Could not delete submission. You may not have permission or the submission may already be deleted.')
        return
      }

      alert('✅ Submission deleted successfully!')
      
      // Refresh submissions
      await fetchDashboardData()
    } catch (error) {
      handleSupabaseError(error, 'deleteBountySubmission')
      setError(ERROR_MESSAGES.DELETE_BOUNTY_SUBMISSION)
      alert('Failed to delete submission: ' + error.message)
    }
  }

  return {
    handleCreateBounty,
    handleCloseMyBounty,
    handleDeleteBountySubmission,
  }
}
