import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Download, CheckCircle, XCircle, AlertCircle } from './Icons';

export default function SubmissionReviewCard({ 
  submission, 
  request,
  onReviewComplete 
}) {
  const [reviewing, setReviewing] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewAction, setReviewAction] = useState(''); // 'approve', 'revision', 'reject'
  const [feedback, setFeedback] = useState('');
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const { data, error } = await supabase.storage
        .from('datasets')
        .download(submission.file_path);

      if (error) throw error;

      // Create download link
      const url = window.URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = submission.file_name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading file:', error);
      alert('Failed to download file');
    } finally {
      setDownloading(false);
    }
  };

  const handleReview = async () => {
    if (!reviewAction) {
      alert('Please select an action');
      return;
    }

    if ((reviewAction === 'revision' || reviewAction === 'reject') && !feedback.trim()) {
      alert('Please provide feedback');
      return;
    }

    setReviewing(true);
    try {
      if (reviewAction === 'approve') {
        // Call approval workflow function
        const response = await fetch('/.netlify/functions/approve-curator-submission', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            submissionId: submission.id,
            requestId: request.id,
            userId: request.creator_id
          })
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Failed to approve submission');
        }

        // Send approval message
        await supabase
          .from('request_messages')
          .insert([{
            request_id: request.id,
            sender_role: 'owner',
            message_text: `Work approved and published! Dataset ID: ${result.datasetId}. ${feedback || ''}`
          }]);

        alert('✅ Work approved! The dataset has been published to the marketplace and partnerships have been created.');
        
      } else if (reviewAction === 'revision') {
        // Request revisions
        const { error: submissionError } = await supabase
          .from('curator_submissions')
          .update({ 
            status: 'revision_requested',
            reviewer_feedback: feedback,
            reviewed_at: new Date().toISOString()
          })
          .eq('id', submission.id);

        if (submissionError) throw submissionError;

        // Update request status
        const { error: requestError } = await supabase
          .from('curation_requests')
          .update({ 
            status: 'revision_requested',
            revision_count: (request.revision_count || 0) + 1,
            reviewed_at: new Date().toISOString()
          })
          .eq('id', request.id);

        if (requestError) throw requestError;

        // Send message
        await supabase
          .from('request_messages')
          .insert([{
            request_id: request.id,
            sender_role: 'owner',
            message_text: `Revision requested: ${feedback}`
          }]);

        alert('📝 Revision requested. The curator will be notified.');
        
      } else if (reviewAction === 'reject') {
        // Reject submission
        const { error: submissionError } = await supabase
          .from('curator_submissions')
          .update({ 
            status: 'rejected',
            reviewer_feedback: feedback,
            reviewed_at: new Date().toISOString()
          })
          .eq('id', submission.id);

        if (submissionError) throw submissionError;

        // Update request status back to open
        const { error: requestError } = await supabase
          .from('curation_requests')
          .update({ 
            status: 'open',
            assigned_curator_id: null,
            reviewed_at: new Date().toISOString()
          })
          .eq('id', request.id);

        if (requestError) throw requestError;

        // Send message
        await supabase
          .from('request_messages')
          .insert([{
            request_id: request.id,
            sender_role: 'owner',
            message_text: `Work rejected: ${feedback}`
          }]);

        alert('❌ Work rejected. The request has been reopened.');
      }

      setShowReviewForm(false);
      setReviewAction('');
      setFeedback('');
      onReviewComplete?.();
      
    } catch (error) {
      console.error('Error reviewing submission:', error);
      alert('Failed to submit review');
    } finally {
      setReviewing(false);
    }
  };

  const getStatusBadge = () => {
    switch (submission.status) {
      case 'pending_review':
        return <span className="px-3 py-1 rounded-full text-xs font-bold border-2 border-black bg-yellow-100 text-yellow-800">
          ⏳ PENDING REVIEW
        </span>;
      case 'approved':
        return <span className="px-3 py-1 rounded-full text-xs font-bold border-2 border-black bg-green-100 text-green-800">
          ✓ APPROVED
        </span>;
      case 'revision_requested':
        return <span className="px-3 py-1 rounded-full text-xs font-bold border-2 border-black bg-orange-100 text-orange-800">
          🔄 REVISION REQUESTED
        </span>;
      case 'rejected':
        return <span className="px-3 py-1 rounded-full text-xs font-bold border-2 border-black bg-red-100 text-red-800">
          ✗ REJECTED
        </span>;
      default:
        return null;
    }
  };

  return (
    <div className="bg-blue-50 border-2 border-blue-500 rounded-xl p-6 space-y-4">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h5 className="text-lg font-extrabold text-blue-900">
              📤 Submission #{submission.submission_number}
              {submission.submission_number > 1 && ' (Revision)'}
            </h5>
            {getStatusBadge()}
          </div>
          <p className="text-sm text-blue-800">
            Submitted {new Date(submission.created_at).toLocaleDateString()} at {new Date(submission.created_at).toLocaleTimeString()}
          </p>
        </div>
      </div>

      {/* File Info */}
      <div className="bg-white border-2 border-blue-500 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-bold text-blue-900">{submission.file_name}</p>
            <p className="text-sm text-blue-700">
              {(submission.file_size / 1024 / 1024).toFixed(2)} MB
            </p>
          </div>
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white font-bold rounded-full border-2 border-black hover:bg-blue-600 transition disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            {downloading ? 'Downloading...' : 'Download'}
          </button>
        </div>
      </div>

      {/* Completion Notes */}
      <div>
        <p className="font-bold text-blue-900 mb-2">📝 Completion Notes:</p>
        <div className="bg-white border-2 border-blue-500 rounded-lg p-4">
          <p className="text-sm text-blue-800 whitespace-pre-wrap">
            {submission.completion_notes}
          </p>
        </div>
      </div>

      {/* Changes Made (for revisions) */}
      {submission.changes_made && (
        <div>
          <p className="font-bold text-blue-900 mb-2">🔄 Changes Made:</p>
          <div className="bg-white border-2 border-blue-500 rounded-lg p-4">
            <p className="text-sm text-blue-800 whitespace-pre-wrap">
              {submission.changes_made}
            </p>
          </div>
        </div>
      )}

      {/* Previous Feedback (if this is a revision) */}
      {submission.submission_number > 1 && submission.reviewer_feedback && (
        <div>
          <p className="font-bold text-orange-900 mb-2">💬 Previous Feedback:</p>
          <div className="bg-orange-50 border-2 border-orange-500 rounded-lg p-4">
            <p className="text-sm text-orange-800 whitespace-pre-wrap">
              {submission.reviewer_feedback}
            </p>
          </div>
        </div>
      )}

      {/* Review Actions (only show for pending_review status) */}
      {submission.status === 'pending_review' && (
        <div className="pt-4 border-t-2 border-blue-300">
          {!showReviewForm ? (
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setReviewAction('approve');
                  setShowReviewForm(true);
                }}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-400 text-black font-bold rounded-full border-2 border-black hover:bg-green-500 transition"
              >
                <CheckCircle className="h-5 w-5" />
                Approve
              </button>
              <button
                onClick={() => {
                  setReviewAction('revision');
                  setShowReviewForm(true);
                }}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-orange-400 text-white font-bold rounded-full border-2 border-black hover:bg-orange-500 transition"
              >
                <AlertCircle className="h-5 w-5" />
                Request Changes
              </button>
              <button
                onClick={() => {
                  setReviewAction('reject');
                  setShowReviewForm(true);
                }}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-400 text-white font-bold rounded-full border-2 border-black hover:bg-red-500 transition"
              >
                <XCircle className="h-5 w-5" />
                Reject
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-blue-900 mb-2">
                  {reviewAction === 'approve' ? 'Approval Message (Optional)' : 'Feedback *'}
                </label>
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  rows={4}
                  placeholder={
                    reviewAction === 'approve' 
                      ? 'Add any final comments...'
                      : reviewAction === 'revision'
                      ? 'Explain what needs to be changed...'
                      : 'Explain why this work is being rejected...'
                  }
                  className="w-full border-2 border-blue-500 rounded-lg p-3 font-medium focus:outline-none focus:ring-4 focus:ring-blue-300"
                  required={reviewAction !== 'approve'}
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowReviewForm(false);
                    setReviewAction('');
                    setFeedback('');
                  }}
                  disabled={reviewing}
                  className="flex-1 px-4 py-2 border-2 border-black rounded-full font-bold hover:bg-gray-100 transition disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReview}
                  disabled={reviewing}
                  className={`flex-1 px-4 py-2 font-bold rounded-full border-2 border-black transition disabled:opacity-50 ${
                    reviewAction === 'approve' 
                      ? 'bg-green-400 text-black hover:bg-green-500'
                      : reviewAction === 'revision'
                      ? 'bg-orange-400 text-white hover:bg-orange-500'
                      : 'bg-red-400 text-white hover:bg-red-500'
                  }`}
                >
                  {reviewing ? 'Processing...' : `Confirm ${reviewAction === 'approve' ? 'Approval' : reviewAction === 'revision' ? 'Revision Request' : 'Rejection'}`}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
