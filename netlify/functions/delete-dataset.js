import { createClient } from '@supabase/supabase-js'

// Initialize Supabase with service role key for elevated permissions
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export const handler = async (event) => {
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

    // Verify user owns this dataset
    const { data: dataset, error: datasetError } = await supabase
      .from('datasets')
      .select('creator_id, download_url')
      .eq('id', datasetId)
      .single()

    if (datasetError || !dataset) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Dataset not found' })
      }
    }

    if (dataset.creator_id !== userId) {
      return {
        statusCode: 403,
        body: JSON.stringify({ error: 'You do not own this dataset' })
      }
    }

    // Delete all purchases for this dataset (bypasses RLS with service role)
    const { error: purchaseDeleteError } = await supabase
      .from('purchases')
      .delete()
      .eq('dataset_id', datasetId)

    if (purchaseDeleteError) {
      console.error('Purchase deletion failed:', purchaseDeleteError)
      throw purchaseDeleteError
    }

    // Delete the dataset
    const { error: deleteError } = await supabase
      .from('datasets')
      .delete()
      .eq('id', datasetId)

    if (deleteError) {
      console.error('Dataset deletion failed:', deleteError)
      throw deleteError
    }

    // Delete storage file if it exists
    if (dataset.download_url) {
      const { error: storageError } = await supabase.storage
        .from('datasets')
        .remove([dataset.download_url])

      if (storageError) {
        console.error('Storage deletion failed:', storageError)
        // Don't throw - storage deletion is not critical
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true })
    }

  } catch (error) {
    console.error('Delete dataset error:', error)
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Failed to delete dataset',
        details: error.message 
      })
    }
  }
}
