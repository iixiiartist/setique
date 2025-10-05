const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // Use service role to bypass RLS
)

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    }
  }

  try {
    const { userId, action, targetId, targetType, details } = JSON.parse(event.body)

    if (!userId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'User ID required' }),
      }
    }

    // Verify user is an admin (using service role, no RLS recursion)
    const { data: adminData, error: adminError } = await supabase
      .from('admins')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (adminError || !adminData) {
      return {
        statusCode: 403,
        body: JSON.stringify({ error: 'Unauthorized: Not an admin' }),
      }
    }

    let result = null

    // Handle different admin actions
    switch (action) {
      case 'approve_curator':
        result = await supabase
          .from('pro_curators')
          .update({ certification_status: 'approved' })
          .eq('id', targetId)
        break

      case 'reject_curator':
        result = await supabase
          .from('pro_curators')
          .update({ certification_status: 'rejected' })
          .eq('id', targetId)
        break

      case 'suspend_curator':
        result = await supabase
          .from('pro_curators')
          .update({ certification_status: 'suspended' })
          .eq('id', targetId)
        break

      case 'get_pending_curators':
        result = await supabase
          .from('pro_curators')
          .select('*')
          .order('created_at', { ascending: false })
        break

      case 'get_all_curators':
        result = await supabase
          .from('pro_curators')
          .select('*')
          .order('created_at', { ascending: false })
        break

      case 'get_activity_log':
        result = await supabase
          .from('admin_activity_log')
          .select('*, admins!inner(user_id)')
          .order('created_at', { ascending: false })
          .limit(100)
        break

      case 'get_all_users':
        result = await supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false })
        break

      case 'get_all_datasets':
        result = await supabase
          .from('datasets')
          .select(`
            *,
            profiles:creator_id(username, email),
            purchases:dataset_purchases(count)
          `)
          .order('created_at', { ascending: false })
        break

      case 'get_revenue_stats':
        // Get all purchases with dataset info
        const { data: purchases } = await supabase
          .from('dataset_purchases')
          .select('*, datasets(price)')
        
        let totalRevenue = 0
        let platformRevenue = 0
        let creatorRevenue = 0

        purchases?.forEach(purchase => {
          const price = purchase.datasets?.price || 0
          totalRevenue += price
          platformRevenue += price * 0.2  // 20% platform fee
          creatorRevenue += price * 0.8   // 80% to creator
        })

        result = {
          data: {
            totalRevenue: totalRevenue.toFixed(2),
            platformRevenue: platformRevenue.toFixed(2),
            creatorRevenue: creatorRevenue.toFixed(2),
            totalTransactions: purchases?.length || 0
          }
        }
        break

      case 'toggle_dataset_featured':
        const { data: dataset } = await supabase
          .from('datasets')
          .select('is_featured')
          .eq('id', targetId)
          .single()
        
        result = await supabase
          .from('datasets')
          .update({ is_featured: !dataset.is_featured })
          .eq('id', targetId)
        break

      default:
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'Invalid action' }),
        }
    }

    if (result.error) throw result.error

    // Log the admin action
    await supabase
      .from('admin_activity_log')
      .insert([{
        admin_id: userId,
        action_type: action,
        target_id: targetId,
        target_type: targetType,
        details: details || {}
      }])

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        data: result.data
      }),
    }

  } catch (error) {
    console.error('Admin action error:', error)
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Failed to perform admin action: ' + error.message
      }),
    }
  }
}
