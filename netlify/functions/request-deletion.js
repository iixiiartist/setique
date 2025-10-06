// request-deletion.js
// Allows dataset creators to request deletion of their datasets
// Admin approval required before actual deletion

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function handler(event) {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    }
  }

  try {
    // Get auth token from header
    const authHeader = event.headers.authorization
    if (!authHeader) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'Missing authorization header' })
      }
    }

    const token = authHeader.replace('Bearer ', '')
    
    // Verify user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'Unauthorized' })
      }
    }

    // Parse request body
    const { datasetId, reason } = JSON.parse(event.body)

    // Validate inputs
    if (!datasetId || !reason) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required fields: datasetId, reason' })
      }
    }

    if (reason.length < 10 || reason.length > 1000) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Reason must be between 10 and 1000 characters' })
      }
    }

    // Verify user owns the dataset
    const { data: dataset, error: datasetError } = await supabase
      .from('datasets')
      .select('id, title, creator_id')
      .eq('id', datasetId)
      .single()

    if (datasetError || !dataset) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Dataset not found' })
      }
    }

    if (dataset.creator_id !== user.id) {
      return {
        statusCode: 403,
        body: JSON.stringify({ error: 'You can only request deletion of your own datasets' })
      }
    }

    // Check if there's already a pending request for this dataset
    const { data: existingRequest } = await supabase
      .from('deletion_requests')
      .select('id, status')
      .eq('dataset_id', datasetId)
      .eq('status', 'pending')
      .maybeSingle()

    if (existingRequest) {
      return {
        statusCode: 409,
        body: JSON.stringify({ 
          error: 'A deletion request is already pending for this dataset',
          requestId: existingRequest.id
        })
      }
    }

    // Create deletion request
    const { data: deletionRequest, error: createError } = await supabase
      .from('deletion_requests')
      .insert([
        {
          dataset_id: datasetId,
          requester_id: user.id,
          reason: reason,
          status: 'pending'
        }
      ])
      .select()
      .single()

    if (createError) {
      console.error('Error creating deletion request:', createError)
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Failed to create deletion request' })
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Deletion request submitted successfully',
        request: deletionRequest
      })
    }

  } catch (error) {
    console.error('Request deletion error:', error)
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' })
    }
  }
}
