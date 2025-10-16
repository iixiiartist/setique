import { supabase } from './supabase'
import { stripePromise } from './stripe'
import { logDatasetPurchased } from './activityTracking'
import { handleSupabaseError } from './logger'

/**
 * Shared checkout logic for dataset purchases
 * Handles both free and paid datasets with validation and error handling
 */

/**
 * Process dataset checkout
 * @param {Object} params - Checkout parameters
 * @param {Object} params.user - Current user object
 * @param {Object} params.dataset - Dataset being purchased
 * @param {boolean} params.hasBetaAccess - Whether user has beta access
 * @param {Function} params.fetchUserPurchases - Function to refresh user purchases
 * @param {Function} params.onNavigate - Navigation callback for beta access redirect
 * @returns {Promise<Object>} - Result object with success status and optional message
 */
export async function handleDatasetCheckout({
  user,
  dataset,
  hasBetaAccess,
  fetchUserPurchases,
  onNavigate
}) {
  // Validate required parameters
  if (!user) {
    return { 
      success: false, 
      requiresAuth: true,
      message: 'Please sign in to purchase datasets' 
    }
  }

  if (!dataset) {
    return { 
      success: false, 
      message: 'Dataset not found' 
    }
  }

  // Check beta access
  if (!hasBetaAccess) {
    if (onNavigate) {
      onNavigate('/dashboard')
    }
    return {
      success: false,
      message: 'You need to be approved for beta access to purchase datasets. Check your email for your access code!'
    }
  }

  try {
    // Prevent self-purchase
    if (dataset.creator_id === user.id) {
      return {
        success: false,
        message: '❌ You cannot purchase your own dataset!'
      }
    }

    // Check if user already owns this dataset
    const { data: existingPurchase, error: checkError } = await supabase
      .from('purchases')
      .select('id')
      .eq('user_id', user.id)
      .eq('dataset_id', dataset.id)
      .maybeSingle()

    if (checkError) {
      handleSupabaseError(checkError, 'handleDatasetCheckout - check existing purchase')
      throw checkError
    }

    if (existingPurchase) {
      return {
        success: false,
        alreadyOwned: true,
        message: 'You already own this dataset! Check your dashboard to download it.'
      }
    }

    // Handle free datasets
    if (dataset.price === 0) {
      return await handleFreeDatasetCheckout({
        user,
        dataset,
        fetchUserPurchases
      })
    }

    // Handle paid datasets with Stripe
    return await handlePaidDatasetCheckout({
      user,
      dataset
    })

  } catch (error) {
    handleSupabaseError(error, 'handleDatasetCheckout')
    return {
      success: false,
      message: `Error processing payment: ${error.message}`
    }
  }
}

/**
 * Handle free dataset checkout
 * @private
 */
async function handleFreeDatasetCheckout({ user, dataset, fetchUserPurchases }) {
  try {
    // Create purchase record directly for free datasets
    const { error: purchaseError } = await supabase
      .from('purchases')
      .insert([
        {
          user_id: user.id,
          dataset_id: dataset.id,
          amount: 0,
          status: 'completed',
        },
      ])

    if (purchaseError) {
      // Handle duplicate purchase error specifically
      if (purchaseError.code === '23505') {
        return {
          success: false,
          alreadyOwned: true,
          message: 'You already own this dataset! Check your dashboard to download it.'
        }
      }
      handleSupabaseError(purchaseError, 'handleFreeDatasetCheckout')
      throw new Error(purchaseError.message)
    }

    // Log activity for social feed and send notification
    await logDatasetPurchased(user.id, dataset.id, dataset.title, 0, dataset.user_id)

    // Refresh user purchases to update UI
    if (fetchUserPurchases) {
      await fetchUserPurchases()
    }

    return {
      success: true,
      isFree: true,
      message: `✅ ${dataset.title} added to your library!`,
      shouldRefreshDatasets: true
    }

  } catch (error) {
    handleSupabaseError(error, 'handleFreeDatasetCheckout')
    throw error
  }
}

/**
 * Handle paid dataset checkout with Stripe
 * @private
 */
async function handlePaidDatasetCheckout({ user, dataset }) {
  try {
    // Create Stripe checkout session
    const response = await fetch('/.netlify/functions/create-checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        datasetId: dataset.id,
        userId: user.id,
        price: dataset.price,
        title: dataset.title,
        creatorId: dataset.creator_id,
      }),
    })

    const { sessionId, error } = await response.json()

    if (error) {
      throw new Error(error)
    }

    // Redirect to Stripe Checkout
    const stripe = await stripePromise
    const { error: stripeError } = await stripe.redirectToCheckout({
      sessionId,
    })

    if (stripeError) {
      throw stripeError
    }

    // If we reach here, redirect was successful (though user will leave page)
    return {
      success: true,
      redirected: true
    }

  } catch (error) {
    handleSupabaseError(error, 'handlePaidDatasetCheckout')
    throw error
  }
}

/**
 * Refresh datasets list after purchase
 * @param {Function} setDatasets - State setter for datasets
 * @returns {Promise<void>}
 */
export async function refreshDatasetsAfterPurchase(setDatasets) {
  try {
    const { data: newDatasets } = await supabase
      .from('datasets')
      .select('*, profiles(username)')
      .order('created_at', { ascending: false })
    
    if (newDatasets && setDatasets) {
      setDatasets(newDatasets)
    }
  } catch (error) {
    handleSupabaseError(error, 'refreshDatasetsAfterPurchase')
    // Non-critical error, don't throw
  }
}
