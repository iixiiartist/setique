import { useState } from 'react'
import { handleSupabaseError } from '../logger'
import { ERROR_MESSAGES } from '../errorMessages'
import * as stripeService from '../../services/stripeService'

/**
 * Custom hook for managing Stripe Connect onboarding flow
 * Handles creating onboarding links and managing connection state
 * 
 * @param {Object} options - Hook configuration options
 * @param {Object} options.user - Authenticated user object
 * @param {Object} options.profile - User profile object with email
 * @param {Function} options.setError - State setter for error messages
 * @returns {Object} Stripe Connect state and handler
 * 
 * @example
 * const { connectingStripe, connectError, handleConnectStripe } = useStripeConnect({
 *   user,
 *   profile,
 *   setError
 * });
 */
export const useStripeConnect = ({
  user,
  profile,
  setError,
}) => {
  const [connectingStripe, setConnectingStripe] = useState(false)
  const [connectError, setConnectError] = useState(null)

  /**
   * Initiate Stripe Connect onboarding flow
   * Creates onboarding link via service layer and redirects to Stripe
   */
  const handleConnectStripe = async () => {
    setConnectingStripe(true)
    setConnectError(null)
    
    try {
      const returnUrl = `${window.location.origin}/dashboard?tab=earnings&onboarding=complete`
      const refreshUrl = `${window.location.origin}/dashboard?tab=earnings&onboarding=refresh`
      
      const data = await stripeService.createStripeOnboardingLink({
        creatorId: user.id,
        email: profile?.email || user.email,
        returnUrl,
        refreshUrl,
      })

      // Redirect to Stripe onboarding
      window.location.href = data.url
    } catch (error) {
      handleSupabaseError(error, 'handleStripeConnect')
      setError(ERROR_MESSAGES.STRIPE_CONNECT)
      setConnectError(error.message)
      setConnectingStripe(false)
    }
  }

  return {
    connectingStripe,
    connectError,
    handleConnectStripe,
  }
}
