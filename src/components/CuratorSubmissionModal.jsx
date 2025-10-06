import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { X, Upload, FileText } from './Icons';

export default function CuratorSubmissionModal({ 
  isOpen, 
  onClose, 
  request, 
  curatorProfile,
  onSuccess 
}) {
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  // Form state
  const [datasetFile, setDatasetFile] = useState(null);
  const [completionNotes, setCompletionNotes] = useState('');
  const [changesMade, setChangesMade] = useState('');
  const [uploadError, setUploadError] = useState('');

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file size (max 500MB)
      if (file.size > 500 * 1024 * 1024) {
        setUploadError('File too large. Maximum size is 500MB.');
        return;
      }
      setDatasetFile(file);
      setUploadError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!datasetFile) {
      alert('Please select a dataset file to upload');
      return;
    }

    if (!completionNotes.trim()) {
      alert('Please add completion notes describing your work');
      return;
    }

    setSubmitting(true);
    setUploadError('');

    try {
      // 1. Upload file to storage
      const fileExt = datasetFile.name.split('.').pop();
      const fileName = `${request.id}-${Date.now()}.${fileExt}`;
      const filePath = `curator-submissions/${request.id}/${fileName}`;

      console.log('📤 Uploading file:', fileName);
      
      const { error: uploadError } = await supabase.storage
        .from('datasets')
        .upload(filePath, datasetFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      console.log('✅ File uploaded successfully');

      // 2. Get current submission number (for tracking revisions)
      const { data: existingSubmissions } = await supabase
        .from('curator_submissions')
        .select('submission_number')
        .eq('request_id', request.id)
        .order('submission_number', { ascending: false })
        .limit(1);

      const submissionNumber = existingSubmissions && existingSubmissions.length > 0
        ? existingSubmissions[0].submission_number + 1
        : 1;

      // 3. Create submission record
      const { error: submissionError } = await supabase
        .from('curator_submissions')
        .insert([{
          request_id: request.id,
          curator_id: curatorProfile.id,
          submission_number: submissionNumber,
          file_name: datasetFile.name,
          file_size: datasetFile.size,
          file_path: filePath,
          completion_notes: completionNotes,
          changes_made: changesMade || null,
          status: 'pending_review'
        }]);

      if (submissionError) throw submissionError;

      // 4. Update request status
      const { error: requestError } = await supabase
        .from('curation_requests')
        .update({ 
          status: 'pending_review',
          submitted_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', request.id);

      if (requestError) throw requestError;

      // 5. Send notification message
      await supabase
        .from('request_messages')
        .insert([{
          request_id: request.id,
          sender_id: user.id,
          sender_role: 'curator',
          message_text: `Work submitted for review${submissionNumber > 1 ? ` (Revision ${submissionNumber - 1})` : ''}`
        }]);

      alert('✅ Work submitted successfully! The data owner will review your submission.');
      resetForm();
      onSuccess?.();
      onClose();
      
    } catch (error) {
      console.error('Error submitting work:', error);
      setUploadError(error.message || 'Failed to submit work. Please try again.');
    } finally {
      setSubmitting(false);
      setUploadProgress(0);
    }
  };

  const resetForm = () => {
    setDatasetFile(null);
    setCompletionNotes('');
    setChangesMade('');
    setUploadError('');
  };

  if (!isOpen) return null;

  const isRevision = request.revision_count > 0;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white border-4 border-black rounded-3xl shadow-[16px_16px_0_#000] max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-green-300 to-blue-300 border-b-4 border-black p-6 flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-extrabold text-black">
              {isRevision ? '🔄 Submit Revised Work' : '✅ Submit Completed Work'}
            </h2>
            <p className="text-sm font-bold text-black/70 mt-1">
              Request: {request.title}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-black/10 rounded-full transition"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Revision Notice */}
          {isRevision && (
            <div className="bg-yellow-100 border-2 border-yellow-500 rounded-xl p-4">
              <p className="font-bold text-yellow-900">
                📝 This is revision #{request.revision_count}
              </p>
              <p className="text-sm text-yellow-800 mt-1">
                Please address the feedback from the previous review
              </p>
            </div>
          )}

          {/* File Upload */}
          <div>
            <label className="block text-sm font-extrabold mb-2">
              Curated Dataset File *
            </label>
            <div className="border-4 border-dashed border-black rounded-xl p-8 text-center hover:bg-gray-50 transition">
              <input
                type="file"
                onChange={handleFileChange}
                accept=".csv,.json,.zip,.parquet,.jsonl,.txt,.xlsx,.xls,.pdf,.mp3,.wav,.mp4,.avi,.mov,.png,.jpg,.jpeg,.gif,.webp,.svg,.tar,.gz,.7z,.rar"
                className="hidden"
                id="dataset-upload"
                disabled={submitting}
              />
              <label htmlFor="dataset-upload" className="cursor-pointer">
                <Upload className="h-12 w-12 mx-auto mb-4 text-black/50" />
                {datasetFile ? (
                  <div className="space-y-2">
                    <p className="font-bold text-green-600">✓ {datasetFile.name}</p>
                    <p className="text-xs text-black/60">
                      {(datasetFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                    <button
                      type="button"
                      onClick={() => setDatasetFile(null)}
                      className="text-xs text-red-600 hover:underline"
                    >
                      Remove file
                    </button>
                  </div>
                ) : (
                  <div>
                    <p className="font-bold mb-2">Click to upload curated dataset</p>
                    <p className="text-xs text-black/60">
                      Supports: CSV, JSON, ZIP, Excel, PDF, Images, Audio, Video, Archives (Max 500MB)
                    </p>
                  </div>
                )}
              </label>
            </div>
            {uploadError && (
              <p className="text-red-600 text-sm mt-2">{uploadError}</p>
            )}
          </div>

          {/* Completion Notes */}
          <div>
            <label className="block text-sm font-extrabold mb-2">
              Completion Notes *
            </label>
            <textarea
              value={completionNotes}
              onChange={(e) => setCompletionNotes(e.target.value)}
              rows={5}
              placeholder="Describe the work you've completed, the curation process, quality checks performed, and any important details about the dataset..."
              className="w-full border-2 border-black rounded-xl p-4 font-medium focus:outline-none focus:ring-4 focus:ring-blue-300"
              disabled={submitting}
              required
            />
            <p className="text-xs text-black/60 mt-1">
              Help the data owner understand what you&apos;ve done
            </p>
          </div>

          {/* Changes Made (for revisions) */}
          {isRevision && (
            <div>
              <label className="block text-sm font-extrabold mb-2">
                Changes Made (Based on Feedback)
              </label>
              <textarea
                value={changesMade}
                onChange={(e) => setChangesMade(e.target.value)}
                rows={4}
                placeholder="List the specific changes you made based on the reviewer's feedback..."
                className="w-full border-2 border-black rounded-xl p-4 font-medium focus:outline-none focus:ring-4 focus:ring-blue-300"
                disabled={submitting}
              />
            </div>
          )}

          {/* Upload Progress */}
          {submitting && uploadProgress > 0 && (
            <div className="bg-blue-50 border-2 border-blue-500 rounded-xl p-4">
              <p className="font-bold text-blue-900 mb-2">Uploading... {uploadProgress}%</p>
              <div className="w-full bg-blue-200 rounded-full h-4 border-2 border-blue-500">
                <div
                  className="bg-blue-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Info Box */}
          <div className="bg-gray-50 border-2 border-black rounded-xl p-4">
            <div className="flex items-start gap-3">
              <FileText className="h-5 w-5 mt-1 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-bold mb-2">What happens next:</p>
                <ul className="space-y-1 text-black/70">
                  <li>• The data owner will be notified of your submission</li>
                  <li>• They&apos;ll review your work and provide feedback</li>
                  <li>• They can approve, request revisions, or reject</li>
                  <li>• Upon approval, the dataset will be published and partnerships created</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="flex-1 px-6 py-3 border-2 border-black rounded-full font-bold hover:bg-gray-100 transition disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !datasetFile}
              className="flex-1 bg-gradient-to-r from-green-400 to-blue-400 text-white font-extrabold px-6 py-3 rounded-full border-2 border-black hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Submitting...' : isRevision ? 'Submit Revision' : 'Submit for Review'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
