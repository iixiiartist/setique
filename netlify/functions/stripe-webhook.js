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
        .select('*, datasets!inner(creator_id, title)')
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

      // Log activity for social feed and send notification
      try {
        // Log the activity
        await supabase.rpc('log_user_activity', {
          p_user_id: userId,
          p_activity_type: 'dataset_purchased',
          p_target_id: datasetId,
          p_target_type: 'dataset',
          p_metadata: {
            title: purchase.datasets.title,
            price: parseFloat(purchase.amount)
          }
        })

        // Send notification to dataset owner
        const datasetOwnerId = purchase.datasets.user_id
        if (datasetOwnerId && datasetOwnerId !== userId) {
          // Get purchaser's username
          const { data: profileData } = await supabase
            .from('profiles')
            .select('username')
            .eq('id', userId)
            .single()

          const username = profileData?.username || 'Someone'
          const message = `${username} purchased your dataset "${purchase.datasets.title}"`

          await supabase.rpc('create_notification', {
            p_user_id: datasetOwnerId,
            p_actor_id: userId,
            p_activity_type: 'dataset_purchased',
            p_target_id: datasetId,
            p_target_type: 'dataset',
            p_message: message
          })
        }
      } catch (activityError) {
        // Don't fail the webhook if activity logging fails
        console.error('Failed to log purchase activity:', activityError)
      }

      // Calculate creator earnings
      const totalAmount = parseFloat(purchase.amount)
      const platformFee = totalAmount * PLATFORM_FEE_PERCENTAGE
      const creatorNet = totalAmount - platformFee
      const creatorId = purchase.datasets.creator_id

      // Check for active partnership
      const { data: partnership } = await supabase
        .from('dataset_partnerships')
        .select('*')
        .eq('dataset_id', datasetId)
        .eq('status', 'active')
        .single()

      if (partnership) {
        // Split earnings 50/50 between owner and curator
        const splitPercentage = partnership.split_percentage / 100 // Default 50%
        const ownerNet = creatorNet * splitPercentage
        const curatorNet = creatorNet * (1 - splitPercentage)

        // Record owner earnings
        const { error: ownerEarningsError } = await supabase
          .from('creator_earnings')
          .insert([{
            creator_id: partnership.owner_id,
            dataset_id: datasetId,
            purchase_id: purchase.id,
            amount: totalAmount,
            platform_fee: platformFee,
            creator_net: ownerNet,
            status: 'pending',
            partnership_id: partnership.id,
            is_partnership_split: true,
            split_role: 'owner'
          }])

        if (ownerEarningsError) throw ownerEarningsError

        // Record curator earnings
        const { error: curatorEarningsError } = await supabase
          .from('creator_earnings')
          .insert([{
            creator_id: partnership.curator_user_id,
            dataset_id: datasetId,
            purchase_id: purchase.id,
            amount: totalAmount,
            platform_fee: platformFee,
            creator_net: curatorNet,
            status: 'pending',
            partnership_id: partnership.id,
            is_partnership_split: true,
            split_role: 'curator'
          }])

        if (curatorEarningsError) throw curatorEarningsError

        // Update owner payout account
        const { data: ownerAccount } = await supabase
          .from('creator_payout_accounts')
          .select('*')
          .eq('creator_id', partnership.owner_id)
          .single()

        if (!ownerAccount) {
          await supabase
            .from('creator_payout_accounts')
            .insert([{
              creator_id: partnership.owner_id,
              current_balance: ownerNet,
              total_earned: ownerNet
            }])
        } else {
          await supabase
            .from('creator_payout_accounts')
            .update({
              current_balance: parseFloat(ownerAccount.current_balance) + ownerNet,
              total_earned: parseFloat(ownerAccount.total_earned) + ownerNet
            })
            .eq('creator_id', partnership.owner_id)
        }

        // Update curator payout account
        const { data: curatorAccount } = await supabase
          .from('creator_payout_accounts')
          .select('*')
          .eq('creator_id', partnership.curator_user_id)
          .single()

        if (!curatorAccount) {
          await supabase
            .from('creator_payout_accounts')
            .insert([{
              creator_id: partnership.curator_user_id,
              current_balance: curatorNet,
              total_earned: curatorNet
            }])
        } else {
          await supabase
            .from('creator_payout_accounts')
            .update({
              current_balance: parseFloat(curatorAccount.current_balance) + curatorNet,
              total_earned: parseFloat(curatorAccount.total_earned) + curatorNet
            })
            .eq('creator_id', partnership.curator_user_id)
        }

        // Update partnership earnings stats
        await supabase
          .from('dataset_partnerships')
          .update({
            total_sales: (partnership.total_sales || 0) + 1,
            owner_earnings: parseFloat(partnership.owner_earnings || 0) + ownerNet,
            curator_earnings: parseFloat(partnership.curator_earnings || 0) + curatorNet
          })
          .eq('id', partnership.id)

      } else {
        // No partnership - original flow (single creator gets full 80%)
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
