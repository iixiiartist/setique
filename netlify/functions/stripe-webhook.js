const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
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

    try {
      // Update purchase status
      const { error: purchaseError } = await supabase
        .from('purchases')
        .update({
          status: 'completed',
          stripe_payment_intent_id: session.payment_intent,
        })
        .eq('stripe_session_id', session.id)

      if (purchaseError) throw purchaseError

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

  return {
    statusCode: 200,
    body: JSON.stringify({ received: true }),
  }
}
