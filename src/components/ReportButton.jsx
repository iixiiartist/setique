import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export default function ReportButton({ datasetId, datasetTitle }) {
  const { user } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const reportReasons = [
    'Inappropriate content',
    'Spam or misleading',
    'Copyright violation',
    'Low quality data',
    'Malicious content',
    'Other'
  ];

  async function handleSubmitReport(e) {
    e.preventDefault();
    
    if (!reason) {
      alert('Please select a reason');
      return;
    }

    try {
      setLoading(true);

      const { error } = await supabase
        .from('dataset_reports')
        .insert({
          dataset_id: datasetId,
          reporter_id: user.id,
          reason,
          details
        });

      if (error) {
        if (error.code === '23505') {
          alert('You have already reported this dataset');
        } else {
          throw error;
        }
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        setShowModal(false);
        setSuccess(false);
        setReason('');
        setDetails('');
      }, 2000);
    } catch (error) {
      console.error('Error submitting report:', error);
      alert('Failed to submit report');
    } finally {
      setLoading(false);
    }
  }

  if (!user) {
    return null;
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="px-4 py-2 bg-red-100 border-2 border-black text-sm font-bold hover:bg-red-200 transition-colors"
        title="Report this dataset"
      >
        🚩 Report
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-2xl font-black">Report Dataset</h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-2xl font-bold hover:bg-gray-100 px-2"
                >
                  ×
                </button>
              </div>

              {success ? (
                <div className="bg-green-100 border-2 border-black p-6 text-center">
                  <p className="text-xl font-bold mb-2">✓ Report Submitted</p>
                  <p className="text-sm">Our moderation team will review this dataset.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmitReport} className="space-y-4">
                  <div>
                    <p className="text-sm font-bold mb-2">Dataset: {datasetTitle}</p>
                  </div>

                  <div>
                    <label className="block font-bold mb-2">Reason *</label>
                    <select
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      className="w-full px-4 py-3 border-4 border-black font-mono text-lg focus:outline-none focus:ring-4 focus:ring-yellow-400"
                      required
                    >
                      <option value="">Select a reason...</option>
                      {reportReasons.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold mb-2">Additional Details (Optional)</label>
                    <textarea
                      value={details}
                      onChange={(e) => setDetails(e.target.value)}
                      className="w-full px-4 py-3 border-4 border-black font-mono text-lg focus:outline-none focus:ring-4 focus:ring-yellow-400 min-h-[100px]"
                      placeholder="Provide more context about this report..."
                      maxLength={500}
                    />
                    <p className="text-xs text-gray-600 mt-1">
                      {details.length}/500 characters
                    </p>
                  </div>

                  <div className="bg-yellow-100 border-2 border-black p-4">
                    <p className="text-sm font-bold mb-1">⚠️ False Reports</p>
                    <p className="text-xs">
                      Submitting false reports may affect your account standing.
                      Only report content that violates our guidelines.
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 px-6 py-3 bg-red-400 border-4 border-black font-black hover:translate-x-1 hover:translate-y-1 hover:shadow-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? 'Submitting...' : 'Submit Report'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="px-6 py-3 bg-gray-300 border-4 border-black font-black hover:translate-x-1 hover:translate-y-1 hover:shadow-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
