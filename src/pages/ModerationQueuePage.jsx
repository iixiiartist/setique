import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function ModerationQueuePage() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [pendingDatasets, setPendingDatasets] = useState([]);
  const [flaggedDatasets, setFlaggedDatasets] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending'); // 'pending', 'flagged', 'reports'
  const [isAdmin, setIsAdmin] = useState(false);

  // Check if user has moderation access (admin table OR trust_level >= 3)
  useEffect(() => {
    async function checkModerationAccess() {
      if (!user) {
        navigate('/login');
        return;
      }

      try {
        // Check if user is in admins table
        const { data: adminData } = await supabase
          .from('admins')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        // Check if user has trust_level >= 3 (moderator/admin)
        const { data: profileData } = await supabase
          .from('profiles')
          .select('trust_level')
          .eq('id', user.id)
          .single();

        const hasAdminAccess = !!adminData;
        const hasModeratorAccess = profileData?.trust_level >= 3;

        if (hasAdminAccess || hasModeratorAccess) {
          setIsAdmin(true);
          fetchModerationData();
        } else {
          console.log('User does not have moderation access');
          setIsAdmin(false);
          setTimeout(() => navigate('/dashboard'), 2000);
        }
      } catch (error) {
        console.error('Error checking moderation access:', error);
        setIsAdmin(false);
        setTimeout(() => navigate('/dashboard'), 2000);
      }
    }

    checkModerationAccess();
  }, [user, navigate]);

  async function fetchModerationData() {
    try {
      setLoading(true);

      // Fetch pending datasets
      const { data: pending } = await supabase
        .from('datasets')
        .select(`
          *,
          creator:profiles!datasets_creator_id_fkey(username, display_name)
        `)
        .eq('moderation_status', 'pending')
        .order('created_at', { ascending: false });

      setPendingDatasets(pending || []);

      // Fetch flagged datasets
      const { data: flagged } = await supabase
        .from('datasets')
        .select(`
          *,
          creator:profiles!datasets_creator_id_fkey(username, display_name)
        `)
        .eq('moderation_status', 'flagged')
        .order('report_count', { ascending: false });

      setFlaggedDatasets(flagged || []);

      // Fetch unreviewed reports
      const { data: reportData } = await supabase
        .from('dataset_reports')
        .select(`
          *,
          dataset:datasets(id, title, creator_id),
          reporter:profiles!dataset_reports_reporter_id_fkey(username, display_name)
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      setReports(reportData || []);
    } catch (error) {
      console.error('Error fetching moderation data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove(datasetId) {
    try {
      const { error } = await supabase
        .from('datasets')
        .update({
          moderation_status: 'approved',
          is_published: true,
          moderated_at: new Date().toISOString(),
          moderated_by: user.id
        })
        .eq('id', datasetId);

      if (error) throw error;

      // Refresh data
      await fetchModerationData();
    } catch (error) {
      console.error('Error approving dataset:', error);
      alert('Failed to approve dataset');
    }
  }

  async function handleReject(datasetId, reason) {
    const notes = reason || prompt('Rejection reason (optional):');
    
    try {
      const { error } = await supabase
        .from('datasets')
        .update({
          moderation_status: 'rejected',
          is_published: false,
          moderation_notes: notes,
          moderated_at: new Date().toISOString(),
          moderated_by: user.id
        })
        .eq('id', datasetId);

      if (error) throw error;

      // Refresh data
      await fetchModerationData();
    } catch (error) {
      console.error('Error rejecting dataset:', error);
      alert('Failed to reject dataset');
    }
  }

  async function handleDismissReport(reportId) {
    try {
      const { error } = await supabase
        .from('dataset_reports')
        .update({
          status: 'dismissed',
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', reportId);

      if (error) throw error;

      // Refresh data
      await fetchModerationData();
    } catch (error) {
      console.error('Error dismissing report:', error);
      alert('Failed to dismiss report');
    }
  }

  async function handleResolveReport(reportId, datasetId, action) {
    try {
      // Update report status
      await supabase
        .from('dataset_reports')
        .update({
          status: 'reviewed',
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', reportId);

      // Take action on dataset if needed
      if (action === 'remove') {
        await supabase
          .from('datasets')
          .update({
            moderation_status: 'rejected',
            is_published: false,
            moderation_notes: 'Removed due to user report',
            moderated_at: new Date().toISOString(),
            moderated_by: user.id
          })
          .eq('id', datasetId);
      } else if (action === 'approve') {
        await supabase
          .from('datasets')
          .update({
            moderation_status: 'approved',
            is_published: true,
            report_count: 0, // Reset report count
            moderated_at: new Date().toISOString(),
            moderated_by: user.id
          })
          .eq('id', datasetId);
      }

      // Refresh data
      await fetchModerationData();
    } catch (error) {
      console.error('Error resolving report:', error);
      alert('Failed to resolve report');
    }
  }

  if (!isAdmin && !loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-red-100 border-4 border-red-500 p-8 max-w-md text-center">
          <h2 className="text-2xl font-black mb-2">🚫 Access Denied</h2>
          <p className="text-lg mb-4">You don&apos;t have permission to access the moderation queue.</p>
          <p className="text-sm text-gray-600">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  if (loading || !profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-lg">Loading moderation queue...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-black mb-2">Moderation Queue</h1>
          <p className="text-gray-600">Review pending datasets and user reports</p>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-6 flex gap-2 border-b-4 border-black">
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-6 py-3 font-bold transition-all ${
              activeTab === 'pending'
                ? 'bg-black text-white'
                : 'bg-white text-black hover:bg-gray-100'
            }`}
          >
            Pending ({pendingDatasets.length})
          </button>
          <button
            onClick={() => setActiveTab('flagged')}
            className={`px-6 py-3 font-bold transition-all ${
              activeTab === 'flagged'
                ? 'bg-black text-white'
                : 'bg-white text-black hover:bg-gray-100'
            }`}
          >
            Flagged ({flaggedDatasets.length})
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`px-6 py-3 font-bold transition-all ${
              activeTab === 'reports'
                ? 'bg-black text-white'
                : 'bg-white text-black hover:bg-gray-100'
            }`}
          >
            Reports ({reports.length})
          </button>
        </div>

        {/* Pending Datasets Tab */}
        {activeTab === 'pending' && (
          <div className="space-y-4">
            {pendingDatasets.length === 0 ? (
              <div className="bg-white p-8 border-4 border-black text-center">
                <p className="text-lg font-bold">No pending datasets! 🎉</p>
              </div>
            ) : (
              pendingDatasets.map((dataset) => (
                <div key={dataset.id} className="bg-white p-6 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-2xl font-black mb-1">{dataset.title}</h3>
                      <p className="text-sm text-gray-600 mb-2">
                        by {dataset.creator?.display_name || dataset.creator?.username}
                      </p>
                      <p className="text-gray-700 mb-2">{dataset.description}</p>
                      <div className="flex gap-2 flex-wrap">
                        {dataset.tags?.map((tag) => (
                          <span
                            key={tag}
                            className="px-3 py-1 bg-gray-100 border-2 border-black text-sm font-bold"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-black">${dataset.price}</p>
                      <p className="text-sm text-gray-600">{dataset.modality}</p>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 border-2 border-black mb-4">
                    <h4 className="font-bold mb-2">Schema:</h4>
                    <pre className="text-sm overflow-x-auto">
                      {JSON.stringify(dataset.schema_fields, null, 2)}
                    </pre>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => handleApprove(dataset.id)}
                      className="px-6 py-3 bg-green-400 border-4 border-black font-black hover:translate-x-1 hover:translate-y-1 hover:shadow-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
                    >
                      ✓ Approve
                    </button>
                    <button
                      onClick={() => handleReject(dataset.id)}
                      className="px-6 py-3 bg-red-400 border-4 border-black font-black hover:translate-x-1 hover:translate-y-1 hover:shadow-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
                    >
                      ✗ Reject
                    </button>
                    <a
                      href={dataset.download_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-6 py-3 bg-blue-400 border-4 border-black font-black hover:translate-x-1 hover:translate-y-1 hover:shadow-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
                    >
                      Preview File
                    </a>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Flagged Datasets Tab */}
        {activeTab === 'flagged' && (
          <div className="space-y-4">
            {flaggedDatasets.length === 0 ? (
              <div className="bg-white p-8 border-4 border-black text-center">
                <p className="text-lg font-bold">No flagged datasets!</p>
              </div>
            ) : (
              flaggedDatasets.map((dataset) => (
                <div key={dataset.id} className="bg-yellow-50 p-6 border-4 border-red-500 shadow-[8px_8px_0px_0px_rgba(239,68,68,1)]">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-3 py-1 bg-red-500 text-white font-black text-sm">
                          {dataset.report_count} REPORTS
                        </span>
                        <h3 className="text-2xl font-black">{dataset.title}</h3>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        by {dataset.creator?.display_name || dataset.creator?.username}
                      </p>
                      <p className="text-gray-700">{dataset.description}</p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => handleApprove(dataset.id)}
                      className="px-6 py-3 bg-green-400 border-4 border-black font-black hover:translate-x-1 hover:translate-y-1 hover:shadow-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
                    >
                      ✓ Approve (Clear Flags)
                    </button>
                    <button
                      onClick={() => handleReject(dataset.id, 'Flagged by community')}
                      className="px-6 py-3 bg-red-400 border-4 border-black font-black hover:translate-x-1 hover:translate-y-1 hover:shadow-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
                    >
                      ✗ Remove Dataset
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Reports Tab */}
        {activeTab === 'reports' && (
          <div className="space-y-4">
            {reports.length === 0 ? (
              <div className="bg-white p-8 border-4 border-black text-center">
                <p className="text-lg font-bold">No pending reports!</p>
              </div>
            ) : (
              reports.map((report) => (
                <div key={report.id} className="bg-white p-6 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                  <div className="mb-4">
                    <h3 className="text-xl font-black mb-1">
                      Report: {report.dataset?.title}
                    </h3>
                    <p className="text-sm text-gray-600 mb-3">
                      Reported by {report.reporter?.display_name || report.reporter?.username}
                    </p>
                    <div className="bg-gray-100 p-4 border-2 border-black">
                      <p className="font-bold mb-1">Reason: {report.reason}</p>
                      {report.details && <p className="text-sm">{report.details}</p>}
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => handleResolveReport(report.id, report.dataset.id, 'approve')}
                      className="px-6 py-3 bg-green-400 border-4 border-black font-black hover:translate-x-1 hover:translate-y-1 hover:shadow-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
                    >
                      ✓ Approve Dataset
                    </button>
                    <button
                      onClick={() => handleResolveReport(report.id, report.dataset.id, 'remove')}
                      className="px-6 py-3 bg-red-400 border-4 border-black font-black hover:translate-x-1 hover:translate-y-1 hover:shadow-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
                    >
                      ✗ Remove Dataset
                    </button>
                    <button
                      onClick={() => handleDismissReport(report.id)}
                      className="px-6 py-3 bg-gray-300 border-4 border-black font-black hover:translate-x-1 hover:translate-y-1 hover:shadow-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
                    >
                      Dismiss Report
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
