import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Curator applications
  const [pendingCurators, setPendingCurators] = useState([]);
  const [allCurators, setAllCurators] = useState([]);
  
  // Users
  const [allUsers, setAllUsers] = useState([]);
  
  // Datasets
  const [allDatasets, setAllDatasets] = useState([]);
  
  // Activity log
  const [activityLog, setActivityLog] = useState([]);
  
  // Stats
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalDatasets: 0,
    totalCurators: 0,
    pendingCurators: 0,
    totalRevenue: 0,
    platformRevenue: 0,
    creatorRevenue: 0,
    totalTransactions: 0
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
      // Use admin function to fetch all data (bypasses RLS)
      const [curatorsRes, usersRes, datasetsRes, revenueRes, activityRes] = await Promise.all([
        fetch('/.netlify/functions/admin-actions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id, action: 'get_all_curators' })
        }),
        fetch('/.netlify/functions/admin-actions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id, action: 'get_all_users' })
        }),
        fetch('/.netlify/functions/admin-actions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id, action: 'get_all_datasets' })
        }),
        fetch('/.netlify/functions/admin-actions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id, action: 'get_revenue_stats' })
        }),
        fetch('/.netlify/functions/admin-actions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id, action: 'get_activity_log' })
        })
      ]);

      const curators = await curatorsRes.json();
      const users = await usersRes.json();
      const datasets = await datasetsRes.json();
      const revenue = await revenueRes.json();
      const activity = await activityRes.json();

      console.log('Admin data loaded:', {
        curators: curators.data?.length || 0,
        users: users.data?.length || 0,
        datasets: datasets.data?.length || 0,
        revenue: revenue.data,
        activity: activity.data?.length || 0
      });

      // Log any errors
      if (!curatorsRes.ok) console.error('Curators error:', curators);
      if (!usersRes.ok) console.error('Users error:', users);
      if (!datasetsRes.ok) console.error('Datasets error:', datasets);
      if (!revenueRes.ok) console.error('Revenue error:', revenue);
      if (!activityRes.ok) console.error('Activity error:', activity);

      setAllCurators(curators.data || []);
      setPendingCurators(curators.data?.filter(c => c.certification_status === 'pending') || []);
      setAllUsers(users.data || []);
      setAllDatasets(datasets.data || []);
      setActivityLog(activity.data || []);

      setStats({
        totalUsers: users.data?.length || 0,
        totalDatasets: datasets.data?.length || 0,
        totalCurators: curators.data?.length || 0,
        pendingCurators: curators.data?.filter(c => c.certification_status === 'pending').length || 0,
        totalRevenue: revenue.data?.totalRevenue || 0,
        platformRevenue: revenue.data?.platformRevenue || 0,
        creatorRevenue: revenue.data?.creatorRevenue || 0,
        totalTransactions: revenue.data?.totalTransactions || 0
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

  const handleToggleFeatured = async (datasetId) => {
    try {
      const response = await fetch('/.netlify/functions/admin-actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          action: 'toggle_dataset_featured',
          targetId: datasetId,
          targetType: 'dataset',
          details: { action: 'toggle_featured' }
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to toggle featured status');
      }

      alert('✅ Featured status updated!');
      await fetchAdminData();
    } catch (error) {
      console.error('Error toggling featured status:', error);
      alert('Failed to update featured status: ' + error.message);
    }
  };

  const handleViewUserDetails = (userId) => {
    // Open user's datasets in a new window or navigate
    const userDatasets = allDatasets.filter(d => d.creator_id === userId);
    alert(`User has ${userDatasets.length} dataset(s).\n\nUser ID: ${userId}\n\nImplement full user detail view as needed.`);
  };

  const handleViewDataset = (datasetId) => {
    // Navigate to dataset detail or open in marketplace
    window.open(`/?dataset=${datasetId}`, '_blank');
  };

  const handleDeleteDataset = async (datasetId, datasetTitle) => {
    if (!confirm(`⚠️ Are you sure you want to DELETE "${datasetTitle}"?\n\nThis action cannot be undone and will remove all associated data.`)) {
      return;
    }

    const confirmAgain = prompt(`Type "DELETE" to confirm deletion of "${datasetTitle}"`);
    if (confirmAgain !== 'DELETE') {
      alert('Deletion cancelled.');
      return;
    }

    try {
      const response = await fetch('/.netlify/functions/admin-actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          action: 'delete_dataset',
          targetId: datasetId,
          targetType: 'dataset',
          details: { datasetTitle, action: 'delete' }
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete dataset');
      }

      alert('✅ Dataset deleted successfully!');
      await fetchAdminData();
    } catch (error) {
      console.error('Error deleting dataset:', error);
      alert('Failed to delete dataset: ' + error.message);
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
        <p className="text-red-700">You do not have permission to access the admin dashboard.</p>
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
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
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
            <div className="text-sm font-bold text-yellow-800 mb-1">Pending Apps</div>
            <div className="text-3xl font-extrabold text-yellow-800">{stats.pendingCurators}</div>
          </div>
          <div className="bg-green-100 border-2 border-green-600 rounded-xl p-4">
            <div className="text-sm font-bold text-green-800 mb-1">Platform Revenue</div>
            <div className="text-2xl font-extrabold text-green-800">${stats.platformRevenue}</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white border-2 border-black rounded-xl overflow-hidden">
          <div className="flex border-b-2 border-black overflow-x-auto">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-6 py-4 font-bold transition whitespace-nowrap ${
                activeTab === 'overview' 
                  ? 'bg-yellow-300 border-r-2 border-black' 
                  : 'bg-white hover:bg-gray-50 border-r-2 border-black'
              }`}
            >
              📊 Overview
            </button>
            <button
              onClick={() => setActiveTab('curators')}
              className={`px-6 py-4 font-bold transition whitespace-nowrap ${
                activeTab === 'curators' 
                  ? 'bg-yellow-300 border-r-2 border-black' 
                  : 'bg-white hover:bg-gray-50 border-r-2 border-black'
              }`}
            >
              👥 Pro Curators
              {pendingCurators.length > 0 && (
                <span className="ml-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                  {pendingCurators.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`px-6 py-4 font-bold transition whitespace-nowrap ${
                activeTab === 'users' 
                  ? 'bg-yellow-300 border-r-2 border-black' 
                  : 'bg-white hover:bg-gray-50 border-r-2 border-black'
              }`}
            >
              🔐 Users
            </button>
            <button
              onClick={() => setActiveTab('datasets')}
              className={`px-6 py-4 font-bold transition whitespace-nowrap ${
                activeTab === 'datasets' 
                  ? 'bg-yellow-300 border-r-2 border-black' 
                  : 'bg-white hover:bg-gray-50 border-r-2 border-black'
              }`}
            >
              📦 Datasets
            </button>
            <button
              onClick={() => setActiveTab('activity')}
              className={`px-6 py-4 font-bold transition whitespace-nowrap ${
                activeTab === 'activity' 
                  ? 'bg-yellow-300' 
                  : 'bg-white hover:bg-gray-50'
              }`}
            >
              📋 Activity Log
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-extrabold mb-4">Platform Overview</h2>
                
                {/* Revenue Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="border-2 border-green-500 rounded-xl p-6 bg-green-50">
                    <div className="text-sm font-bold text-green-800 mb-1">Total Revenue</div>
                    <div className="text-4xl font-extrabold text-green-900">${stats.totalRevenue}</div>
                    <div className="text-sm text-green-700 mt-2">{stats.totalTransactions} transactions</div>
                  </div>
                  <div className="border-2 border-blue-500 rounded-xl p-6 bg-blue-50">
                    <div className="text-sm font-bold text-blue-800 mb-1">Platform Revenue (20%)</div>
                    <div className="text-4xl font-extrabold text-blue-900">${stats.platformRevenue}</div>
                  </div>
                  <div className="border-2 border-purple-500 rounded-xl p-6 bg-purple-50">
                    <div className="text-sm font-bold text-purple-800 mb-1">Creator Revenue (80%)</div>
                    <div className="text-4xl font-extrabold text-purple-900">${stats.creatorRevenue}</div>
                  </div>
                </div>

                {/* Recent Activity Summary */}
                <div>
                  <h3 className="text-xl font-extrabold mb-3">Recent Activity</h3>
                  <div className="space-y-2">
                    {activityLog.slice(0, 5).map((log) => (
                      <div key={log.id} className="border border-gray-200 rounded-lg p-3 text-sm">
                        <span className="font-bold">{log.action_type.replace(/_/g, ' ').toUpperCase()}</span>
                        <span className="text-gray-500 ml-2">
                          {new Date(log.created_at).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Quick Actions */}
                <div>
                  <h3 className="text-xl font-extrabold mb-3">Quick Actions</h3>
                  <div className="flex flex-wrap gap-3">
                    {pendingCurators.length > 0 && (
                      <button
                        onClick={() => setActiveTab('curators')}
                        className="bg-yellow-400 text-black font-bold px-6 py-3 rounded-full border-2 border-black hover:scale-105 transition"
                      >
                        Review {pendingCurators.length} Pending Curator{pendingCurators.length !== 1 ? 's' : ''}
                      </button>
                    )}
                    <button
                      onClick={() => setActiveTab('users')}
                      className="bg-blue-400 text-black font-bold px-6 py-3 rounded-full border-2 border-black hover:scale-105 transition"
                    >
                      Manage Users
                    </button>
                    <button
                      onClick={() => setActiveTab('datasets')}
                      className="bg-green-400 text-black font-bold px-6 py-3 rounded-full border-2 border-black hover:scale-105 transition"
                    >
                      Manage Datasets
                    </button>
                  </div>
                </div>
              </div>
            )}

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

            {activeTab === 'users' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-extrabold">User Management</h2>
                  <div className="text-sm text-gray-600">
                    Total: <span className="font-bold">{allUsers.length}</span> users
                  </div>
                </div>

                {allUsers.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <p className="text-xl font-bold mb-2">No users found</p>
                    <p>Check your database connection or run the diagnostic SQL script.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {allUsers.map((userProfile) => (
                      <div key={userProfile.id} className="border-2 border-black rounded-lg p-4 flex justify-between items-center hover:bg-gray-50 transition">
                        <div className="flex-1">
                          <div className="font-bold text-lg">{userProfile.username || 'Anonymous User'}</div>
                          <div className="text-sm text-gray-600">{userProfile.email || 'No email'}</div>
                          <div className="text-xs text-gray-500 mt-1">
                            User ID: <span className="font-mono">{userProfile.id?.slice(0, 20)}...</span>
                          </div>
                          {userProfile.created_at && (
                            <div className="text-xs text-gray-500">
                              Joined: {new Date(userProfile.created_at).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleViewUserDetails(userProfile.id)}
                            className="bg-blue-400 text-black font-bold px-4 py-2 rounded-full border-2 border-black hover:scale-105 transition text-sm"
                          >
                            View Details
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'datasets' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-extrabold">Dataset Management</h2>
                  <div className="text-sm text-gray-600">
                    Total: <span className="font-bold">{allDatasets.length}</span> datasets
                  </div>
                </div>

                {allDatasets.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <p className="text-xl font-bold mb-2">No datasets found</p>
                    <p>Users haven&apos;t uploaded any datasets yet, or there may be a database connection issue.</p>
                    <button
                      onClick={() => window.location.href = '/'}
                      className="mt-4 bg-blue-400 text-black font-bold px-6 py-3 rounded-full border-2 border-black hover:scale-105 transition"
                    >
                      Go Upload a Dataset
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {allDatasets.map((dataset) => (
                      <div key={dataset.id} className="border-2 border-black rounded-xl p-6 bg-white hover:shadow-lg transition">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex-1">
                            <h3 className="text-xl font-extrabold mb-2">{dataset.title}</h3>
                            <div className="flex items-center gap-3 text-sm text-gray-600 flex-wrap">
                              <span>By: <span className="font-bold">{dataset.profiles?.username || 'Unknown'}</span></span>
                              <span>•</span>
                              <span className="px-2 py-1 bg-purple-100 rounded">{dataset.modality || dataset.dataset_type || 'Unknown'}</span>
                              <span>•</span>
                              <span className="font-bold text-green-600">${dataset.price}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {dataset.is_featured && (
                              <span className="bg-yellow-400 text-black px-3 py-1 rounded-full text-sm font-bold border-2 border-black">
                                ⭐ FEATURED
                              </span>
                            )}
                            <button
                              onClick={() => handleToggleFeatured(dataset.id)}
                              className="bg-blue-400 text-black font-bold px-4 py-2 rounded-full border-2 border-black hover:scale-105 transition text-sm whitespace-nowrap"
                            >
                              {dataset.is_featured ? 'Unfeature' : 'Feature'}
                            </button>
                          </div>
                        </div>
                        <p className="text-gray-700 text-sm line-clamp-2 mb-3">{dataset.description}</p>
                        <div className="flex items-center gap-4 text-sm pt-3 border-t border-gray-200 flex-wrap">
                          <span className="font-bold">Size:</span>
                          <span>{dataset.file_size ? (dataset.file_size / 1024 / 1024).toFixed(2) + ' MB' : 'N/A'}</span>
                          <span>•</span>
                          <span className="font-bold">Purchases:</span>
                          <span>{dataset.purchase_count || 0}</span>
                          <span>•</span>
                          <span className="text-xs text-gray-500">
                            Created: {new Date(dataset.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex gap-2 mt-4">
                          <button
                            onClick={() => handleViewDataset(dataset.id)}
                            className="bg-green-400 text-black font-bold px-4 py-2 rounded-full border-2 border-black hover:scale-105 transition text-sm"
                          >
                            View Details
                          </button>
                          <button
                            onClick={() => handleDeleteDataset(dataset.id, dataset.title)}
                            className="bg-red-400 text-black font-bold px-4 py-2 rounded-full border-2 border-black hover:scale-105 transition text-sm"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
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
