const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
)

// Platform fee percentage (20% = 0.20)
const PLATFORM_FEE_PERCENTAGE = 0.20
const MINIMUM_PAYOUT_THRESHOLD = 50.00

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    }
  }

  try {
    const { creatorId, amount } = JSON.parse(event.body)

    if (!creatorId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Creator ID required' }),
      }
    }

    // Get creator's payout account
    const { data: payoutAccount, error: accountError } = await supabase
      .from('creator_payout_accounts')
      .select('*')
      .eq('creator_id', creatorId)
      .single()

    if (accountError || !payoutAccount) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Payout account not found. Please connect your Stripe account first.' }),
      }
    }

    // Check if account is active
    if (payoutAccount.account_status !== 'active' || !payoutAccount.payouts_enabled) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Payout account not yet active. Please complete Stripe onboarding.' }),
      }
    }

    // Get current balance
    const currentBalance = parseFloat(payoutAccount.current_balance)
    const requestedAmount = amount ? parseFloat(amount) : currentBalance

    // Check minimum threshold
    if (requestedAmount < MINIMUM_PAYOUT_THRESHOLD) {
      return {
        statusCode: 400,
        body: JSON.stringify({ 
          error: `Minimum payout is $${MINIMUM_PAYOUT_THRESHOLD}. Your current balance is $${currentBalance.toFixed(2)}.` 
        }),
      }
    }

    // Check if requested amount exceeds balance
    if (requestedAmount > currentBalance) {
      return {
        statusCode: 400,
        body: JSON.stringify({ 
          error: `Insufficient balance. Available: $${currentBalance.toFixed(2)}, Requested: $${requestedAmount.toFixed(2)}` 
        }),
      }
    }

    // Create payout request record
    const { data: payoutRequest, error: requestError } = await supabase
      .from('payout_requests')
      .insert([{
        creator_id: creatorId,
        amount: requestedAmount,
        status: 'processing'
      }])
      .select()
      .single()

    if (requestError) throw requestError

    try {
      // Create Stripe transfer to connected account
      const transfer = await stripe.transfers.create({
        amount: Math.round(requestedAmount * 100), // Convert to cents
        currency: 'usd',
        destination: payoutAccount.stripe_connect_account_id,
        metadata: {
          creator_id: creatorId,
          payout_request_id: payoutRequest.id
        }
      })

      // Mark earnings as paid
      const { error: updateError } = await supabase
        .from('creator_earnings')
        .update({ 
          status: 'paid',
          paid_at: new Date().toISOString(),
          stripe_transfer_id: transfer.id
        })
        .eq('creator_id', creatorId)
        .eq('status', 'pending')
        .lte('creator_net', requestedAmount)

      if (updateError) throw updateError

      // Update payout request as completed
      await supabase
        .from('payout_requests')
        .update({ 
          status: 'completed',
          stripe_payout_id: transfer.id,
          completed_at: new Date().toISOString()
        })
        .eq('id', payoutRequest.id)

      // Update account totals
      await supabase
        .from('creator_payout_accounts')
        .update({
          current_balance: currentBalance - requestedAmount,
          total_paid: payoutAccount.total_paid + requestedAmount
        })
        .eq('creator_id', creatorId)

      return {
        statusCode: 200,
        body: JSON.stringify({
          success: true,
          message: `Payout of $${requestedAmount.toFixed(2)} initiated successfully!`,
          transfer_id: transfer.id,
          new_balance: (currentBalance - requestedAmount).toFixed(2)
        }),
      }

    } catch (stripeError) {
      // Mark payout request as failed
      await supabase
        .from('payout_requests')
        .update({ 
          status: 'failed',
          error_message: stripeError.message,
          failure_reason: stripeError.code || 'unknown'
        })
        .eq('id', payoutRequest.id)

      throw stripeError
    }

  } catch (error) {
    console.error('Payout error:', error)
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Payout failed: ' + error.message 
      }),
    }
  }
}
