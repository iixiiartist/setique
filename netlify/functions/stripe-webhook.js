const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // Use service role for elevated permissions
)

exports.handler = async (event) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    }
  }

  const sig = event.headers['stripe-signature']
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  let stripeEvent

  try {
    stripeEvent = stripe.webhooks.constructEvent(
      event.body,
      sig,
      webhookSecret
    )
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message)
    return {
      statusCode: 400,
      body: JSON.stringify({ error: `Webhook Error: ${err.message}` }),
    }
  }

  // Handle the checkout.session.completed event
  if (stripeEvent.type === 'checkout.session.completed') {
    const session = stripeEvent.data.object

    const { datasetId, userId } = session.metadata
    const PLATFORM_FEE_PERCENTAGE = 0.20 // 20% platform fee

    try {
      // Get purchase record
      const { data: purchase, error: purchaseSelectError } = await supabase
        .from('purchases')
        .select('*, datasets!inner(creator_id)')
        .eq('stripe_session_id', session.id)
        .single()

      if (purchaseSelectError) throw purchaseSelectError

      // Update purchase status
      const { error: purchaseError } = await supabase
        .from('purchases')
        .update({
          status: 'completed',
          stripe_payment_intent_id: session.payment_intent,
        })
        .eq('stripe_session_id', session.id)

      if (purchaseError) throw purchaseError

      // Calculate creator earnings
      const totalAmount = parseFloat(purchase.amount)
      const platformFee = totalAmount * PLATFORM_FEE_PERCENTAGE
      const creatorNet = totalAmount - platformFee
      const creatorId = purchase.datasets.creator_id

      // Record creator earnings
      const { error: earningsError } = await supabase
        .from('creator_earnings')
        .insert([{
          creator_id: creatorId,
          dataset_id: datasetId,
          purchase_id: purchase.id,
          amount: totalAmount,
          platform_fee: platformFee,
          creator_net: creatorNet,
          status: 'pending'
        }])

      if (earningsError) throw earningsError

      // Create or update creator payout account
      const { data: existingAccount } = await supabase
        .from('creator_payout_accounts')
        .select('*')
        .eq('creator_id', creatorId)
        .single()

      if (!existingAccount) {
        // Create new payout account
        await supabase
          .from('creator_payout_accounts')
          .insert([{
            creator_id: creatorId,
            current_balance: creatorNet,
            total_earned: creatorNet
          }])
      } else {
        // Update existing account
        await supabase
          .from('creator_payout_accounts')
          .update({
            current_balance: parseFloat(existingAccount.current_balance) + creatorNet,
            total_earned: parseFloat(existingAccount.total_earned) + creatorNet
          })
          .eq('creator_id', creatorId)
      }

      // Increment purchase count for the dataset
      const { data: dataset } = await supabase
        .from('datasets')
        .select('purchase_count')
        .eq('id', datasetId)
        .single()

      if (dataset) {
        await supabase
          .from('datasets')
          .update({ purchase_count: (dataset.purchase_count || 0) + 1 })
          .eq('id', datasetId)
      }

      console.log('Purchase completed:', { datasetId, userId })
    } catch (error) {
      console.error('Error updating purchase:', error)
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Failed to update purchase' }),
      }
    }
  }

  // Handle Stripe Connect account updates
  if (stripeEvent.type === 'account.updated') {
    const account = stripeEvent.data.object
    const creatorId = account.metadata?.creator_id

    if (creatorId) {
      try {
        // Update payout account status
        const { error: updateError } = await supabase
          .from('creator_payout_accounts')
          .update({
            account_status: account.charges_enabled && account.payouts_enabled ? 'active' : 'incomplete',
            onboarding_completed: account.details_submitted || false,
            payouts_enabled: account.payouts_enabled || false,
            charges_enabled: account.charges_enabled || false,
          })
          .eq('stripe_connect_account_id', account.id)

        if (updateError) throw updateError

        console.log('Connect account updated:', { accountId: account.id, creatorId })
      } catch (error) {
        console.error('Error updating connect account:', error)
        return {
          statusCode: 500,
          body: JSON.stringify({ error: 'Failed to update connect account' }),
        }
      }
    }
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ received: true }),
  }
}
