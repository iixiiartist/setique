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

  try {
    const { datasetId, userId, price, title, creatorId } = JSON.parse(event.body)

    // Validate inputs
    if (!datasetId || !userId || !price || !title) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required fields' }),
      }
    }

    // Check if user already purchased this dataset
    const { data: existingPurchase } = await supabase
      .from('purchases')
      .select('*')
      .eq('user_id', userId)
      .eq('dataset_id', datasetId)
      .single()

    if (existingPurchase) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'You already own this dataset' }),
      }
    }

    // Calculate platform fee (20%)
    const PLATFORM_FEE_PERCENTAGE = 0.20
    const platformFeeAmount = Math.round(price * 100 * PLATFORM_FEE_PERCENTAGE) // in cents
    
    // Get creator's Stripe Connect account if it exists
    let sessionConfig = {
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: title,
              description: 'Niche Dataset from Setique Marketplace',
            },
            unit_amount: Math.round(price * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.URL || 'http://localhost:3000'}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.URL || 'http://localhost:3000'}/#marketplace`,
      metadata: {
        datasetId,
        userId,
        creatorId: creatorId || '',
      },
    }

    // If creator has connected Stripe account, use destination charge
    if (creatorId) {
      const { data: payoutAccount } = await supabase
        .from('creator_payout_accounts')
        .select('stripe_connect_account_id, payouts_enabled')
        .eq('creator_id', creatorId)
        .single()

      if (payoutAccount && payoutAccount.stripe_connect_account_id && payoutAccount.payouts_enabled) {
        // Use destination charge - money goes to connected account, we take platform fee
        sessionConfig.payment_intent_data = {
          application_fee_amount: platformFeeAmount,
          transfer_data: {
            destination: payoutAccount.stripe_connect_account_id,
          },
        }
      }
    }

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create(sessionConfig)

    // Create pending purchase record
    await supabase.from('purchases').insert([
      {
        user_id: userId,
        dataset_id: datasetId,
        amount: price,
        stripe_session_id: session.id,
        status: 'pending',
      },
    ])

    return {
      statusCode: 200,
      body: JSON.stringify({ sessionId: session.id }),
    }
  } catch (error) {
    console.error('Error creating checkout session:', error)
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    }
  }
}
