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
