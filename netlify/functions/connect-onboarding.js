const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // Use service role for elevated permissions
)

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    }
  }

  try {
    const { creatorId, email, returnUrl, refreshUrl } = JSON.parse(event.body)

    if (!creatorId || !email) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Creator ID and email required' }),
      }
    }

    // Check if account already exists
    const { data: existingAccount } = await supabase
      .from('creator_payout_accounts')
      .select('*')
      .eq('creator_id', creatorId)
      .single()

    let accountId = existingAccount?.stripe_connect_account_id

    // Create Stripe Connect account if doesn't exist
    if (!accountId) {
      const account = await stripe.accounts.create({
        type: 'express',
        country: 'US',
        email: email,
        capabilities: {
          transfers: { requested: true },
        },
        business_type: 'individual',
        metadata: {
          creator_id: creatorId
        }
      })

      accountId = account.id

      // Save to database
      const { error: insertError } = await supabase
        .from('creator_payout_accounts')
        .insert([{
          creator_id: creatorId,
          stripe_connect_account_id: accountId,
          account_status: 'incomplete',
          onboarding_completed: false,
          payouts_enabled: false
        }])

      if (insertError) throw insertError
    }

    // Create account link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: refreshUrl || `${process.env.URL}/creator-dashboard?refresh=true`,
      return_url: returnUrl || `${process.env.URL}/creator-dashboard?onboarding=complete`,
      type: 'account_onboarding',
    })

    return {
      statusCode: 200,
      body: JSON.stringify({
        url: accountLink.url,
        accountId: accountId
      }),
    }

  } catch (error) {
    console.error('Connect onboarding error:', error)
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Failed to create onboarding link: ' + error.message 
      }),
    }
  }
}
