import { createClient } from '@supabase/supabase-js'

// Initialize Supabase with service role key for elevated permissions
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // Service role key required!
)

export const handler = async (event) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    }
  }

  try {
    const { datasetId, userId } = JSON.parse(event.body)

    if (!datasetId || !userId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing datasetId or userId' })
      }
    }

    // 1. Verify user has purchased this dataset
    const { data: purchase, error: purchaseError } = await supabase
      .from('purchases')
      .select('id, status')
      .eq('user_id', userId)
      .eq('dataset_id', datasetId)
      .eq('status', 'completed')
      .single()

    if (purchaseError || !purchase) {
      console.error('Purchase verification failed:', purchaseError)
      
      // Log failed download attempt
      await supabase.from('download_logs').insert({
        user_id: userId,
        dataset_id: datasetId,
        purchase_id: purchase?.id || null,
        success: false,
        error_message: 'Purchase not found or not completed',
        ip_address: event.headers['x-forwarded-for'] || event.headers['client-ip'],
        user_agent: event.headers['user-agent']
      })

      return {
        statusCode: 403,
        body: JSON.stringify({ 
          error: 'You must purchase this dataset before downloading' 
        })
      }
    }

    // 2. Get dataset file path
    const { data: dataset, error: datasetError } = await supabase
      .from('datasets')
      .select('download_url, title')
      .eq('id', datasetId)
      .single()

    if (datasetError || !dataset || !dataset.download_url) {
      console.error('Dataset fetch failed:', datasetError)
      
      await supabase.from('download_logs').insert({
        user_id: userId,
        dataset_id: datasetId,
        purchase_id: purchase.id,
        success: false,
        error_message: 'Dataset file not found',
        ip_address: event.headers['x-forwarded-for'] || event.headers['client-ip'],
        user_agent: event.headers['user-agent']
      })

      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Dataset file not found' })
      }
    }

    // 3. Generate signed URL (24 hour expiry)
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from('datasets')
      .createSignedUrl(dataset.download_url, 86400) // 24 hours in seconds

    if (signedUrlError) {
      console.error('Signed URL generation failed:', signedUrlError)
      
      await supabase.from('download_logs').insert({
        user_id: userId,
        dataset_id: datasetId,
        purchase_id: purchase.id,
        success: false,
        error_message: signedUrlError.message,
        ip_address: event.headers['x-forwarded-for'] || event.headers['client-ip'],
        user_agent: event.headers['user-agent']
      })

      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Failed to generate download link' })
      }
    }

    // 4. Log successful download
    await supabase.from('download_logs').insert({
      user_id: userId,
      dataset_id: datasetId,
      purchase_id: purchase.id,
      success: true,
      ip_address: event.headers['x-forwarded-for'] || event.headers['client-ip'],
      user_agent: event.headers['user-agent']
    })

    // 5. Return signed URL
    return {
      statusCode: 200,
      body: JSON.stringify({
        downloadUrl: signedUrlData.signedUrl,
        expiresIn: 86400,
        fileName: dataset.title
      })
    }

  } catch (error) {
    console.error('Download generation error:', error)
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Internal server error',
        details: error.message 
      })
    }
  }
}
