import { handleSupabaseError } from '../logger'
import { ERROR_MESSAGES } from '../errorMessages'
import { logBountyCreated } from '../activityTracking'
import * as bountyService from '../../services/bountyService'

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
   * Validates fields, uses service layer to insert, logs activity
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
      const createdBounty = await bountyService.createCurationRequest({
        creatorId: user.id,
        title: newBounty.title,
        description: newBounty.description,
        budget: parseFloat(newBounty.budget_max),
        deadline: null, // Add deadline support if needed
        requirements: [] // Add requirements support if needed
      })

      // Log activity for social feed
      if (createdBounty) {
        await logBountyCreated(
          user.id,
          createdBounty.id,
          newBounty.title,
          parseFloat(newBounty.budget_max)
        )
      }

      alert(`Bounty "${newBounty.title}" posted successfully!`)
      
      await fetchDashboardData()
      
      return { success: true, bounty: createdBounty }
    } catch (error) {
      handleSupabaseError(error, 'createBounty')
      setError(ERROR_MESSAGES.CREATE_BOUNTY)
      alert('Failed to create bounty: ' + error.message)
      return { success: false, error }
    }
  }

  /**
   * Close a bounty (prevent new proposals)
   * Confirms with user before closing using service layer
   * 
   * @param {string} bountyId - ID of the bounty to close
   */
  const handleCloseMyBounty = async (bountyId) => {
    if (!window.confirm('Close this bounty? No more proposals will be accepted.')) {
      return
    }

    try {
      await bountyService.closeCurationRequest(bountyId, user.id)
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
   * Confirms with user before deletion using service layer
   * 
   * @param {string} submissionId - ID of the submission to delete
   * @param {string} datasetTitle - Title of the dataset (for confirmation message)
   */
  const handleDeleteBountySubmission = async (submissionId, datasetTitle) => {
    if (!window.confirm(`Delete your submission "${datasetTitle}"? This cannot be undone.`)) {
      return
    }

    try {
      await bountyService.deleteBountySubmission(submissionId, user.id)
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
