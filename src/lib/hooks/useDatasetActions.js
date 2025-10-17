import { useState } from 'react'
import { supabase } from '../supabase'
import { handleSupabaseError } from '../logger'
import { ERROR_MESSAGES } from '../errorMessages'

/**
 * Custom hook for managing dataset actions (CRUD operations)
 * Centralizes all dataset operation handlers for better maintainability
 * 
 * @param {Object} options - Hook configuration options
 * @param {Object} options.user - Authenticated user object
 * @param {Function} options.setMyDatasets - State setter for datasets array
 * @param {Function} options.setError - State setter for error messages
 * @param {Function} options.fetchDashboardData - Function to refetch all dashboard data
 * @param {Object} options.confirmDialogModal - Modal state for confirmation dialogs
 * @param {Object} options.editDatasetModal - Modal state for editing datasets
 * @returns {Object} Dataset action handlers and loading state
 * 
 * @example
 * const { actionLoading, handleDownload, handleToggleActive, ... } = useDatasetActions({
 *   user,
 *   setMyDatasets,
 *   setError,
 *   fetchDashboardData: refetch,
 *   confirmDialogModal,
 *   editDatasetModal
 * });
 */
export const useDatasetActions = ({
  user,
  setMyDatasets,
  setError,
  fetchDashboardData,
  confirmDialogModal,
  editDatasetModal,
}) => {
  const [actionLoading, setActionLoading] = useState(false)

  /**
   * Download a dataset
   * Generates a secure download link via Netlify function
   * Handles both demo datasets and real datasets
   */
  const handleDownload = async (datasetId) => {
    try {
      const response = await fetch('/.netlify/functions/generate-download', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          datasetId: datasetId,
          userId: user.id,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate download link')
      }

      // Handle demo datasets with data URLs
      if (data.isDemo && data.downloadUrl.startsWith('data:')) {
        // Create a download link for the data URL
        const link = document.createElement('a')
        link.href = data.downloadUrl
        link.download = data.fileName || 'DEMO_README.txt'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        
        alert('📝 Demo dataset info downloaded! This is a sample to showcase how Setique works. Real datasets include actual data files.')
      } else {
        // For real datasets, open in new tab
        window.open(data.downloadUrl, '_blank')
        alert('Download started! Link expires in 24 hours.')
      }
      
      // Refresh download logs
      fetchDashboardData()
    } catch (error) {
      handleSupabaseError(error, 'downloadDataset')
      setError(ERROR_MESSAGES.DOWNLOAD_DATASET)
      alert('Error: ' + error.message)
    }
  }

  /**
   * Toggle dataset active/inactive status
   * Updates database and local state optimistically
   */
  const handleToggleActive = async (datasetId, currentStatus) => {
    setActionLoading(true)
    try {
      const { error } = await supabase
        .from('datasets')
        .update({ is_active: !currentStatus })
        .eq('id', datasetId)
        .eq('creator_id', user.id)
      
      if (error) throw error
      
      // Update local state
      setMyDatasets(prev => 
        prev.map(d => d.id === datasetId ? { ...d, is_active: !currentStatus } : d)
      )
      
      alert(`Dataset ${!currentStatus ? 'activated' : 'deactivated'} successfully!`)
    } catch (error) {
      handleSupabaseError(error, 'toggleDataset')
      setError(ERROR_MESSAGES.TOGGLE_DATASET)
      alert('Failed to update dataset status')
    } finally {
      setActionLoading(false)
    }
  }

  /**
   * Open edit modal with dataset data
   * Prepares modal state for editing
   */
  const handleEditDataset = (dataset) => {
    editDatasetModal.open({
      id: dataset.id,
      title: dataset.title,
      description: dataset.description,
      price: dataset.price,
      modality: dataset.modality,
      tags: dataset.tags || []
    })
  }

  /**
   * Save dataset edits to database
   * Updates database and local state
   */
  const handleSaveEdit = async () => {
    if (!editDatasetModal.data) return
    
    setActionLoading(true)
    try {
      const editData = editDatasetModal.data
      const { error } = await supabase
        .from('datasets')
        .update({
          title: editData.title,
          description: editData.description,
          price: parseFloat(editData.price),
          modality: editData.modality,
          tags: editData.tags,
        })
        .eq('id', editData.id)
        .eq('creator_id', user.id)
      
      if (error) throw error
      
      // Update local state
      setMyDatasets(prev => 
        prev.map(d => d.id === editData.id ? { ...d, ...editData, price: parseFloat(editData.price) } : d)
      )
      
      editDatasetModal.close()
      alert('Dataset updated successfully!')
    } catch (error) {
      handleSupabaseError(error, 'updateDataset')
      setError(ERROR_MESSAGES.UPDATE_DATASET)
      alert('Failed to update dataset')
    } finally {
      setActionLoading(false)
    }
  }

  /**
   * Delete a dataset
   * Checks for purchases first, shows confirmation, then deletes via Netlify function
   */
  const handleDeleteDataset = async (datasetId) => {
    try {
      // Check if dataset has purchases
      const { data: purchases, error: purchaseError } = await supabase
        .from('purchases')
        .select('id')
        .eq('dataset_id', datasetId)
        .eq('status', 'completed')
        .limit(1)
      
      if (purchaseError) throw purchaseError
      
      const hasPurchases = purchases && purchases.length > 0
      
      // Show confirmation dialog
      confirmDialogModal.show({
        title: hasPurchases ? 'Delete Dataset with Purchases?' : 'Delete Dataset?',
        message: hasPurchases 
          ? '⚠️ This dataset has purchases! Deleting it will break download access for buyers. This action cannot be undone. Are you absolutely sure?'
          : 'Are you sure you want to delete this dataset? This action cannot be undone.',
        onConfirm: async () => {
          setActionLoading(true)
          try {
            // Call Netlify function to delete (bypasses RLS)
            const response = await fetch('/.netlify/functions/delete-dataset', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                datasetId: datasetId,
                userId: user.id
              })
            })

            const data = await response.json()

            if (!response.ok) {
              throw new Error(data.error || 'Failed to delete dataset')
            }

            alert('✅ Dataset deleted successfully')
            await fetchDashboardData()
          } catch (error) {
            handleSupabaseError(error, 'deleteDataset')
            setError(ERROR_MESSAGES.DELETE_DATASET)
            alert('Failed to delete dataset: ' + error.message)
          } finally {
            setActionLoading(false)
          }
        }
      })
    } catch (error) {
      handleSupabaseError(error, 'checkDatasetPurchases')
      setError(ERROR_MESSAGES.DELETE_DATASET)
      alert('Failed to check dataset status: ' + error.message)
    }
  }

  /**
   * Request dataset deletion via admin approval
   * Submits deletion request through Netlify function
   */
  const handleRequestDeletion = async (datasetId, reason) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      const response = await fetch('/.netlify/functions/request-deletion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          datasetId,
          reason
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit deletion request')
      }

      alert('Deletion request submitted! An admin will review your request.')
      
      // Refresh deletion requests
      await fetchDashboardData()
    } catch (error) {
      handleSupabaseError(error, 'requestDeletion')
      setError(ERROR_MESSAGES.REQUEST_DELETION)
      throw error
    }
  }

  return {
    actionLoading,
    handleDownload,
    handleToggleActive,
    handleEditDataset,
    handleSaveEdit,
    handleDeleteDataset,
    handleRequestDeletion,
  }
}
