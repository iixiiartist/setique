const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    }
  }

  try {
    const { creatorId } = JSON.parse(event.body)

    if (!creatorId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Creator ID required' }),
      }
    }

    console.log('Verifying Stripe account for creator:', creatorId)

    // Get the account from database
    const { data: account, error: dbError } = await supabase
      .from('creator_payout_accounts')
      .select('stripe_connect_account_id')
      .eq('creator_id', creatorId)
      .single()

    if (dbError) {
      console.error('Database error:', dbError)
      return {
        statusCode: 404,
        body: JSON.stringify({ 
          success: false,
          message: 'No Stripe account found. Please try completing onboarding again.',
          error: dbError.message 
        }),
      }
    }

    if (!account || !account.stripe_connect_account_id) {
      console.error('No account or stripe_connect_account_id found')
      return {
        statusCode: 404,
        body: JSON.stringify({ 
          success: false,
          message: 'No Stripe account connected. Please complete onboarding first.' 
        }),
      }
    }

    console.log('Found Stripe account:', account.stripe_connect_account_id)

    console.log('Found Stripe account:', account.stripe_connect_account_id)

    // Fetch account status from Stripe
    const stripeAccount = await stripe.accounts.retrieve(account.stripe_connect_account_id)
    
    console.log('Stripe account status:', {
      charges_enabled: stripeAccount.charges_enabled,
      details_submitted: stripeAccount.details_submitted,
      payouts_enabled: stripeAccount.payouts_enabled
    })

    // Update database with current status
    const { error: updateError } = await supabase
      .from('creator_payout_accounts')
      .update({
        account_status: stripeAccount.charges_enabled ? 'active' : 'incomplete',
        onboarding_completed: stripeAccount.details_submitted,
        payouts_enabled: stripeAccount.charges_enabled,
        charges_enabled: stripeAccount.charges_enabled,
        details_submitted: stripeAccount.details_submitted,
        updated_at: new Date().toISOString()
      })
      .eq('creator_id', creatorId)

    if (updateError) {
      console.error('Update error:', updateError)
      throw updateError
    }

    console.log('Successfully updated account status')

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: stripeAccount.charges_enabled 
          ? 'Account fully verified and ready to receive payments!'
          : 'Account created but additional information needed.',
        account: {
          charges_enabled: stripeAccount.charges_enabled,
          details_submitted: stripeAccount.details_submitted,
          payouts_enabled: stripeAccount.charges_enabled
        }
      }),
    }

  } catch (error) {
    console.error('Verify account error:', error)
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        success: false,
        message: 'Failed to verify account status. Please try again.',
        error: error.message 
      }),
    }
  }
}
