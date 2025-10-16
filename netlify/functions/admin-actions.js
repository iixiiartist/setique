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
            profiles!datasets_creator_id_fkey(username, email)
          `)
          .order('created_at', { ascending: false })
        
        // Get purchase counts separately since it's a separate table
        if (result.data) {
          for (const dataset of result.data) {
            const { count } = await supabase
              .from('purchases')
              .select('*', { count: 'exact', head: true })
              .eq('dataset_id', dataset.id)
            dataset.purchase_count = count || 0
          }
        }
        break

      case 'get_revenue_stats':
        // Get all purchases with dataset info (using 'purchases' table, not 'dataset_purchases')
        const { data: purchases } = await supabase
          .from('purchases')
          .select('amount, status')
          .eq('status', 'succeeded')
        
        let totalRevenue = 0
        let platformRevenue = 0
        let creatorRevenue = 0

        purchases?.forEach(purchase => {
          const amount = parseFloat(purchase.amount) || 0
          totalRevenue += amount
          platformRevenue += amount * 0.2  // 20% platform fee
          creatorRevenue += amount * 0.8   // 80% to creator
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

      case 'delete_dataset':
        // Admin can delete any dataset
        // First check if dataset has any purchases
        const { count: purchaseCount } = await supabase
          .from('purchases')
          .select('*', { count: 'exact', head: true })
          .eq('dataset_id', targetId)
        
        // If dataset has purchases, use soft delete (mark as inactive)
        if (purchaseCount > 0) {
          result = await supabase
            .from('datasets')
            .update({ 
              is_active: false,
              title: `[DELETED] ${(await supabase.from('datasets').select('title').eq('id', targetId).single()).data?.title || 'Dataset'}`
            })
            .eq('id', targetId)
          
          // Return success with soft delete message
          result.softDeleted = true
          result.purchaseCount = purchaseCount
        } else {
          // No purchases exist, safe to hard delete
          // Step 1: Clear published_dataset_id references in curation_requests
          await supabase
            .from('curation_requests')
            .update({ published_dataset_id: null })
            .eq('published_dataset_id', targetId)
          
          // Step 2: Delete related partnerships (if any)
          await supabase
            .from('dataset_partnerships')
            .delete()
            .eq('dataset_id', targetId)
          
          // Step 3: Delete reviews
          await supabase
            .from('dataset_reviews')
            .delete()
            .eq('dataset_id', targetId)
          
          // Step 4: Delete comments
          await supabase
            .from('comments')
            .delete()
            .eq('dataset_id', targetId)
          
          // Step 5: Delete favorites
          await supabase
            .from('favorites')
            .delete()
            .eq('dataset_id', targetId)
          
          // Step 6: Delete the dataset
          result = await supabase
            .from('datasets')
            .delete()
            .eq('id', targetId)
          
          result.hardDeleted = true
        }
        break

      case 'get_user_details':
        // Get user profile with their datasets and purchases
        const { data: userProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', targetId)
          .single()
        
        const { data: userDatasets } = await supabase
          .from('datasets')
          .select('*')
          .eq('creator_id', targetId)
        
        const { data: userPurchases } = await supabase
          .from('purchases')
          .select('*, datasets(title, price)')
          .eq('user_id', targetId)
        
        result = {
          data: {
            profile: userProfile,
            datasets: userDatasets,
            purchases: userPurchases
          }
        }
        break

      case 'approve_deletion_request':
        // Approve deletion request and delete the dataset
        // Step 1: Get the deletion request
        const { data: deletionRequest, error: requestError } = await supabase
          .from('deletion_requests')
          .select('*, datasets(*)')
          .eq('id', targetId)
          .single()
        
        if (requestError || !deletionRequest) {
          return {
            statusCode: 404,
            body: JSON.stringify({ error: 'Deletion request not found' })
          }
        }
        
        // Step 2: Check if dataset has any purchases
        const { count: requestPurchaseCount } = await supabase
          .from('purchases')
          .select('*', { count: 'exact', head: true })
          .eq('dataset_id', deletionRequest.dataset_id)
        
        let deletionType = 'hard'
        
        // If dataset has purchases, use soft delete (mark as inactive)
        if (requestPurchaseCount > 0) {
          const { error: softDeleteError } = await supabase
            .from('datasets')
            .update({ 
              is_active: false,
              title: `[DELETED] ${deletionRequest.datasets?.title || 'Dataset'}`
            })
            .eq('id', deletionRequest.dataset_id)
          
          if (softDeleteError) throw softDeleteError
          deletionType = 'soft'
        } else {
          // No purchases exist, safe to hard delete
          // Step 3: Clear published_dataset_id references in curation_requests
          await supabase
            .from('curation_requests')
            .update({ published_dataset_id: null })
            .eq('published_dataset_id', deletionRequest.dataset_id)
          
          // Step 4: Delete related partnerships (if any)
          await supabase
            .from('dataset_partnerships')
            .delete()
            .eq('dataset_id', deletionRequest.dataset_id)
          
          // Step 5: Delete reviews
          await supabase
            .from('dataset_reviews')
            .delete()
            .eq('dataset_id', deletionRequest.dataset_id)
          
          // Step 6: Delete comments
          await supabase
            .from('comments')
            .delete()
            .eq('dataset_id', deletionRequest.dataset_id)
          
          // Step 7: Delete favorites
          await supabase
            .from('favorites')
            .delete()
            .eq('dataset_id', deletionRequest.dataset_id)
          
          // Step 8: Delete the dataset
          const { error: deleteError } = await supabase
            .from('datasets')
            .delete()
            .eq('id', deletionRequest.dataset_id)
          
          if (deleteError) throw deleteError
        }
        
        // Step 9: Update the deletion request status
        result = await supabase
          .from('deletion_requests')
          .update({
            status: 'approved',
            reviewed_by: userId,
            reviewed_at: new Date().toISOString(),
            admin_response: details?.adminResponse || `Deletion request approved (${deletionType} delete - ${requestPurchaseCount} purchases)`
          })
          .eq('id', targetId)
        break

      case 'reject_deletion_request':
        // Reject deletion request with reason
        if (!details?.adminResponse) {
          return {
            statusCode: 400,
            body: JSON.stringify({ error: 'Admin response required for rejection' })
          }
        }
        
        result = await supabase
          .from('deletion_requests')
          .update({
            status: 'rejected',
            reviewed_by: userId,
            reviewed_at: new Date().toISOString(),
            admin_response: details.adminResponse
          })
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
