// Netlify Function: Approve Curator Submission
// Creates dataset, partnerships, publishes to marketplace, updates request status
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // Use service role for admin operations
);

export async function handler(event) {
  // Only allow POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { submissionId, requestId, userId } = JSON.parse(event.body);

    if (!submissionId || !requestId || !userId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required parameters' })
      };
    }

    console.log('📋 Starting approval workflow:', { submissionId, requestId, userId });

    // 1. Fetch submission details
    const { data: submission, error: submissionError } = await supabase
      .from('curator_submissions')
      .select('*')
      .eq('id', submissionId)
      .single();

    if (submissionError || !submission) {
      throw new Error('Submission not found');
    }

    // 2. Fetch request details (includes pricing, etc.)
    const { data: request, error: requestError } = await supabase
      .from('curation_requests')
      .select(`
        *,
        curator_proposals!inner (
          suggested_price,
          curator_id
        )
      `)
      .eq('id', requestId)
      .single();

    if (requestError || !request) {
      throw new Error('Request not found');
    }

    const acceptedProposal = request.curator_proposals?.find(p => p.status === 'accepted') || request.curator_proposals[0];
    if (!acceptedProposal) {
      throw new Error('No accepted proposal found');
    }

    // 3. Get creator profile for dataset metadata
    const { data: creatorProfile } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', request.creator_id)
      .single();

    // 4. Get curator profile
    const { data: curatorProfile } = await supabase
      .from('pro_curators')
      .select('user_id, display_name')
      .eq('id', acceptedProposal.curator_id)
      .single();

    console.log('✅ Retrieved all related data');

    // 5. Create dataset record
    const datasetPrice = acceptedProposal.suggested_price || 0;
    const { data: newDataset, error: datasetError } = await supabase
      .from('datasets')
      .insert([{
        creator_id: request.creator_id,
        title: request.title,
        description: request.description || submission.completion_notes,
        tags: request.specialties_needed || [],
        price: datasetPrice,
        modality: request.target_quality === 'professional' ? 'vision' : 'other', // Default, can be updated
        accent_color: 'bg-blue-200',
        download_url: submission.file_path,
        file_size: submission.file_size,
        purchase_count: 0,
        is_active: true,
        is_featured: false
      }])
      .select()
      .single();

    if (datasetError) {
      console.error('Error creating dataset:', datasetError);
      throw new Error('Failed to create dataset');
    }

    console.log('✅ Created dataset:', newDataset.id);

    // 6. Create partnership record (40% owner, 40% curator, 20% platform)
    const { error: partnershipError } = await supabase
      .from('dataset_partnerships')
      .insert([{
        dataset_id: newDataset.id,
        owner_id: request.creator_id,
        curator_id: acceptedProposal.curator_id,
        curator_user_id: curatorProfile.user_id,
        split_percentage: 40.00, // Curator gets 40%
        agreement_terms: `Partnership created from curation request. Revenue split: 40% Data Owner, 40% Curator, 20% Platform`,
        status: 'active',
        total_sales: 0,
        total_revenue: 0,
        owner_earnings: 0,
        curator_earnings: 0
      }]);

    if (partnershipError) {
      console.error('Error creating partnership:', partnershipError);
      // Don't fail the whole operation, log and continue
      console.warn('⚠️ Partnership creation failed, but dataset was created');
    } else {
      console.log('✅ Created partnership');
    }

    // 7. Update submission status to approved
    const { error: updateSubmissionError } = await supabase
      .from('curator_submissions')
      .update({ 
        status: 'approved',
        reviewed_at: new Date().toISOString()
      })
      .eq('id', submissionId);

    if (updateSubmissionError) {
      console.error('Error updating submission:', updateSubmissionError);
    }

    // 8. Update request status to completed
    const { error: updateRequestError } = await supabase
      .from('curation_requests')
      .update({ 
        status: 'completed',
        published_dataset_id: newDataset.id,
        reviewed_at: new Date().toISOString()
      })
      .eq('id', requestId);

    if (updateRequestError) {
      console.error('Error updating request:', updateRequestError);
    }

    console.log('✅ Approval workflow completed successfully');

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        datasetId: newDataset.id,
        message: 'Dataset published and partnership created successfully'
      })
    };

  } catch (error) {
    console.error('❌ Approval workflow error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: error.message || 'Failed to complete approval workflow' 
      })
    };
  }
}
