import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState('curators');
  
  // Curator applications
  const [pendingCurators, setPendingCurators] = useState([]);
  const [allCurators, setAllCurators] = useState([]);
  
  // Activity log
  const [activityLog, setActivityLog] = useState([]);
  
  // Stats
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalDatasets: 0,
    totalCurators: 0,
    pendingCurators: 0,
    totalRevenue: 0
  });

  useEffect(() => {
    if (user) {
      checkAdminStatus();
    }
  }, [user]);

  const checkAdminStatus = async () => {
    try {
      const { data, error } = await supabase
        .from('admins')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Not an admin:', error);
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      if (data) {
        setIsAdmin(true);
        await fetchAdminData();
      }
    } catch (error) {
      console.error('Error checking admin status:', error);
      setIsAdmin(false);
    } finally {
      setLoading(false);
    }
  };

  const fetchAdminData = async () => {
    try {
      // Use admin function to fetch curator data (bypasses RLS)
      const response = await fetch('/.netlify/functions/admin-actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          action: 'get_all_curators'
        })
      });

      const { data: curators } = await response.json();

      setAllCurators(curators || []);
      setPendingCurators(curators?.filter(c => c.certification_status === 'pending') || []);

      // Fetch stats
      const { count: userCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      const { count: datasetCount } = await supabase
        .from('datasets')
        .select('*', { count: 'exact', head: true });

      setStats({
        totalUsers: userCount || 0,
        totalDatasets: datasetCount || 0,
        totalCurators: curators?.length || 0,
        pendingCurators: pendingCurators.length,
        totalRevenue: 0
      });

    } catch (error) {
      console.error('Error fetching admin data:', error);
    }
  };

  const handleApproveCurator = async (curatorId) => {
    if (!confirm('Approve this curator application?')) return;

    try {
      const response = await fetch('/.netlify/functions/admin-actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          action: 'approve_curator',
          targetId: curatorId,
          targetType: 'pro_curator',
          details: { status: 'approved' }
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to approve curator');
      }

      alert('✅ Curator approved!');
      await fetchAdminData();
    } catch (error) {
      console.error('Error approving curator:', error);
      alert('Failed to approve curator: ' + error.message);
    }
  };

  const handleRejectCurator = async (curatorId) => {
    const reason = prompt('Reason for rejection (optional):');
    if (reason === null) return; // User cancelled

    try {
      const response = await fetch('/.netlify/functions/admin-actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          action: 'reject_curator',
          targetId: curatorId,
          targetType: 'pro_curator',
          details: { status: 'rejected', reason }
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to reject curator');
      }

      alert('❌ Curator application rejected.');
      await fetchAdminData();
    } catch (error) {
      console.error('Error rejecting curator:', error);
      alert('Failed to reject curator: ' + error.message);
    }
  };

  const handleSuspendCurator = async (curatorId) => {
    if (!confirm('Suspend this curator? They will be unable to accept new partnerships.')) return;

    try {
      const response = await fetch('/.netlify/functions/admin-actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          action: 'suspend_curator',
          targetId: curatorId,
          targetType: 'pro_curator',
          details: { status: 'suspended' }
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to suspend curator');
      }

      alert('⚠️ Curator suspended.');
      await fetchAdminData();
    } catch (error) {
      console.error('Error suspending curator:', error);
      alert('Failed to suspend curator: ' + error.message);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="max-w-2xl mx-auto mt-20 p-8 bg-red-100 border-2 border-red-500 rounded-xl">
        <h2 className="text-2xl font-bold text-red-800 mb-2">🚫 Access Denied</h2>
        <p className="text-red-700">You don't have permission to access the admin dashboard.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-extrabold mb-2">🔐 Admin Dashboard</h1>
          <p className="text-gray-600">Manage curator applications, users, and platform operations</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white border-2 border-black rounded-xl p-4">
            <div className="text-sm font-bold text-gray-600 mb-1">Total Users</div>
            <div className="text-3xl font-extrabold">{stats.totalUsers}</div>
          </div>
          <div className="bg-white border-2 border-black rounded-xl p-4">
            <div className="text-sm font-bold text-gray-600 mb-1">Total Datasets</div>
            <div className="text-3xl font-extrabold">{stats.totalDatasets}</div>
          </div>
          <div className="bg-white border-2 border-black rounded-xl p-4">
            <div className="text-sm font-bold text-gray-600 mb-1">Pro Curators</div>
            <div className="text-3xl font-extrabold">{stats.totalCurators}</div>
          </div>
          <div className="bg-yellow-100 border-2 border-yellow-600 rounded-xl p-4">
            <div className="text-sm font-bold text-yellow-800 mb-1">Pending Applications</div>
            <div className="text-3xl font-extrabold text-yellow-800">{stats.pendingCurators}</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white border-2 border-black rounded-xl overflow-hidden">
          <div className="flex border-b-2 border-black">
            <button
              onClick={() => setActiveTab('curators')}
              className={`flex-1 px-6 py-4 font-bold transition ${
                activeTab === 'curators' 
                  ? 'bg-yellow-300 border-r-2 border-black' 
                  : 'bg-white hover:bg-gray-50 border-r-2 border-black'
              }`}
            >
              Pro Curator Applications
              {pendingCurators.length > 0 && (
                <span className="ml-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                  {pendingCurators.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('activity')}
              className={`flex-1 px-6 py-4 font-bold transition ${
                activeTab === 'activity' 
                  ? 'bg-yellow-300' 
                  : 'bg-white hover:bg-gray-50'
              }`}
            >
              Activity Log
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {activeTab === 'curators' && (
              <div>
                {pendingCurators.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <p className="text-xl font-bold mb-2">✅ All caught up!</p>
                    <p>No pending curator applications to review.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pendingCurators.map((curator) => (
                      <div key={curator.id} className="border-2 border-black rounded-xl p-6 bg-white">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="text-2xl font-extrabold mb-1">{curator.display_name}</h3>
                            <p className="text-sm text-gray-600">
                              Applied: {new Date(curator.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <span className="bg-yellow-200 text-yellow-800 px-3 py-1 rounded-full text-sm font-bold">
                            PENDING
                          </span>
                        </div>

                        <div className="mb-4">
                          <h4 className="font-bold mb-2">Bio:</h4>
                          <p className="text-gray-700">{curator.bio}</p>
                        </div>

                        <div className="mb-4">
                          <h4 className="font-bold mb-2">Specialties:</h4>
                          <div className="flex flex-wrap gap-2">
                            {curator.specialties?.map((specialty, idx) => (
                              <span key={idx} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold">
                                {specialty.replace(/_/g, ' ')}
                              </span>
                            ))}
                          </div>
                        </div>

                        {curator.portfolio_samples && curator.portfolio_samples.length > 0 && (
                          <div className="mb-4">
                            <h4 className="font-bold mb-2">Portfolio:</h4>
                            <div className="space-y-1">
                              {curator.portfolio_samples.map((url, idx) => (
                                <a 
                                  key={idx} 
                                  href={url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="block text-blue-600 hover:underline text-sm"
                                >
                                  {url}
                                </a>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="flex gap-3 pt-4 border-t-2 border-gray-200">
                          <button
                            onClick={() => handleApproveCurator(curator.id)}
                            className="flex-1 bg-green-400 text-black font-bold px-6 py-3 rounded-full border-2 border-black hover:scale-105 transition"
                          >
                            ✅ Approve
                          </button>
                          <button
                            onClick={() => handleRejectCurator(curator.id)}
                            className="flex-1 bg-red-400 text-black font-bold px-6 py-3 rounded-full border-2 border-black hover:scale-105 transition"
                          >
                            ❌ Reject
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* All Curators Section */}
                <div className="mt-12">
                  <h3 className="text-2xl font-extrabold mb-4">All Curators</h3>
                  <div className="space-y-3">
                    {allCurators.map((curator) => (
                      <div key={curator.id} className="border border-gray-300 rounded-lg p-4 flex justify-between items-center">
                        <div>
                          <div className="font-bold">{curator.display_name}</div>
                          <div className="text-sm text-gray-600">
                            {curator.specialties?.slice(0, 3).map(s => s.replace(/_/g, ' ')).join(', ')}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                            curator.certification_status === 'approved' ? 'bg-green-100 text-green-800' :
                            curator.certification_status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            curator.certification_status === 'rejected' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {curator.certification_status.toUpperCase()}
                          </span>
                          {curator.certification_status === 'approved' && (
                            <button
                              onClick={() => handleSuspendCurator(curator.id)}
                              className="text-sm text-red-600 hover:text-red-800 font-bold"
                            >
                              Suspend
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'activity' && (
              <div>
                {activityLog.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <p>No activity logged yet.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {activityLog.map((log) => (
                      <div key={log.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-bold">{log.action_type.replace(/_/g, ' ').toUpperCase()}</div>
                            <div className="text-sm text-gray-600">
                              {new Date(log.created_at).toLocaleString()}
                            </div>
                          </div>
                          {log.details && (
                            <div className="text-xs text-gray-500">
                              {JSON.stringify(log.details)}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
