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

    // 1. Get dataset info first to check if user is the creator
    const { data: datasetInfo, error: datasetCheckError } = await supabase
      .from('datasets')
      .select('creator_id, download_url, title, description, schema_fields, sample_data, notes')
      .eq('id', datasetId)
      .single()

    if (datasetCheckError || !datasetInfo) {
      console.error('Dataset check failed:', datasetCheckError)
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Dataset not found' })
      }
    }

    // Allow creators to download their own datasets without purchasing
    const isCreator = datasetInfo.creator_id === userId
    let purchase = null

    if (!isCreator) {
      // 2. Verify user has purchased this dataset
      const { data: purchaseData, error: purchaseError } = await supabase
        .from('purchases')
        .select('id, status')
        .eq('user_id', userId)
        .eq('dataset_id', datasetId)
        .eq('status', 'completed')
        .single()

      if (purchaseError || !purchaseData) {
        console.error('Purchase verification failed:', purchaseError)
        
        // Log failed download attempt
        await supabase.from('download_logs').insert({
          user_id: userId,
          dataset_id: datasetId,
          purchase_id: null,
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
      
      purchase = purchaseData
    }

    // 3. Use dataset info (already fetched above)
    const dataset = datasetInfo

    // Check if this is a demo dataset
    const isDemoDataset = dataset.title.includes('(DEMO)')

    if (isDemoDataset) {
      // Generate a sample README as data URL for demo datasets
      const readmeContent = `
# ${dataset.title}
## Demo Dataset Sample

Thank you for trying out Setique! 🎉

This is a **DEMO dataset** to showcase our platform's functionality. If this were a real dataset purchase, you would receive the actual data files here.

---

### About This Dataset
${dataset.description}

### What Would Be Included (If Real):
${dataset.schema_fields ? `
**Data Schema:**
${dataset.schema_fields.map(field => `- ${field}`).join('\n')}
` : ''}
${dataset.sample_data ? `
**Sample Data Format:**
\`\`\`
${dataset.sample_data}
\`\`\`
` : ''}
${dataset.notes ? `
**Additional Notes:**
${dataset.notes}
` : ''}

---

### How Setique Works:

1. **Browse**: Discover unique, niche datasets curated by experts
2. **Purchase**: Securely buy datasets that fit your needs
3. **Download**: Get instant access to high-quality data files
4. **Build**: Train better AI models with specialized data

### Ready to Create Real Datasets?

Become a data curator and earn by sharing your unique datasets with the AI community!

- **20% Platform Fee**: Keep 80% of your earnings
- **Instant Payouts**: Via Stripe Connect
- **Full Control**: Set your own prices
- **Global Reach**: Sell to AI researchers and developers worldwide

Visit **setique.com** to start creating and selling real datasets today!

---

### Need Help?

- 📧 Email: info@setique.com
- 🌐 Website: https://setique.com
- 💬 Feedback: Click the beta feedback button on our site

---

*This is a sample file for demonstration purposes. Real dataset purchases include actual data files in formats like CSV, JSON, ZIP, audio files, video files, or image archives depending on the dataset type.*

© ${new Date().getFullYear()} Setique - The Niche Data Economy
`.trim()

      // Encode as base64 data URL
      const base64Content = Buffer.from(readmeContent).toString('base64')
      const dataUrl = `data:text/plain;base64,${base64Content}`

      // Log successful demo download
      await supabase.from('download_logs').insert({
        user_id: userId,
        dataset_id: datasetId,
        purchase_id: purchase?.id || null,
        success: true,
        ip_address: event.headers['x-forwarded-for'] || event.headers['client-ip'],
        user_agent: event.headers['user-agent']
      })

      return {
        statusCode: 200,
        body: JSON.stringify({
          downloadUrl: dataUrl,
          expiresIn: 86400,
          fileName: `${dataset.title.replace(/[^a-z0-9]/gi, '_')}_DEMO_README.txt`,
          isDemo: true
        })
      }
    }

    // For real datasets, continue with normal flow
    if (!dataset.download_url) {
      await supabase.from('download_logs').insert({
        user_id: userId,
        dataset_id: datasetId,
        purchase_id: purchase?.id || null,
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
        purchase_id: purchase?.id || null,
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
      purchase_id: purchase?.id || null,
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
