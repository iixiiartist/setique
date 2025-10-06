import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export default function AdminDashboard() {
  console.log('🔵 AdminDashboard component loaded');
  const { user, loading: authLoading } = useAuth();
  console.log('🔵 User from AuthContext:', user, 'Auth loading:', authLoading);
  const navigate = useNavigate();
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
  const [selectedDataset, setSelectedDataset] = useState(null);
  const [showDatasetModal, setShowDatasetModal] = useState(false);
  
  // Users
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  
  // Activity log
  const [activityLog, setActivityLog] = useState([]);
  
  // Deletion requests
  const [deletionRequests, setDeletionRequests] = useState([]);
  const [rejectingRequest, setRejectingRequest] = useState(null);
  const [adminResponse, setAdminResponse] = useState('');
  
  // Bounties (curation requests)
  const [allBounties, setAllBounties] = useState([]);
  const [selectedBounty, setSelectedBounty] = useState(null);
  const [showBountyModal, setShowBountyModal] = useState(false);
  
  // Stats
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalDatasets: 0,
    totalCurators: 0,
    pendingCurators: 0,
    totalRevenue: 0,
    platformRevenue: 0,
    creatorRevenue: 0,
    totalTransactions: 0,
    totalBounties: 0,
    openBounties: 0,
    assignedBounties: 0,
    completedBounties: 0
  });

  const checkAdminStatus = async () => {
    // Redirect if no user
    if (!user) {
      console.log('No user logged in');
      navigate('/');
      return;
    }

    console.log('Checking admin status for user:', user.id, user.email);

    try {
      const { data, error } = await supabase
        .from('admins')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      console.log('Admin query result:', { data, error });

      if (error) {
        console.error('Error querying admins table:', error);
        setIsAdmin(false);
        setLoading(false);
        // Redirect unauthorized users
        navigate('/');
        return;
      }

      if (!data) {
        console.error('User not found in admins table');
        setIsAdmin(false);
        setLoading(false);
        // Redirect unauthorized users
        navigate('/');
        return;
      }

      if (data) {
        console.log('User is admin!', data);
        setIsAdmin(true);
        await fetchAdminData();
      }
    } catch (error) {
      console.error('Exception checking admin status:', error);
      setIsAdmin(false);
      setLoading(false);
      // Redirect on error
      navigate('/');
    }
  };

  useEffect(() => {
    // Wait for auth to finish loading
    if (authLoading) {
      console.log('⏳ Waiting for auth to load...');
      return;
    }

    // Redirect if not logged in (after auth loaded)
    if (!user) {
      console.log('❌ No user after auth loaded - redirecting to home');
      navigate('/');
      return;
    }
    
    console.log('✅ User authenticated, checking admin status');
    checkAdminStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading]);

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

      // Fetch bounties (curation requests) directly from Supabase
      const { data: bountiesData, error: bountiesError } = await supabase
        .from('curation_requests')
        .select(`
          *,
          profiles:requester_id (
            id,
            username,
            email
          ),
          curation_proposals (
            id
          )
        `)
        .order('created_at', { ascending: false });
      
      console.log('📊 Admin bounties fetch:', { bountiesData, bountiesError });
      
      if (bountiesError) {
        console.error('Error fetching bounties:', bountiesError);
      }
      
      console.log('📊 Setting bounties count:', bountiesData?.length || 0);
      setAllBounties(bountiesData || []);

      // Fetch deletion requests directly from Supabase (admin has access via RLS)
      const { data: deletionRequestsData, error: deletionError } = await supabase
        .from('deletion_requests')
        .select(`
          *,
          datasets:dataset_id (
            id,
            title,
            description,
            price,
            modality
          ),
          profiles:requester_id (
            id,
            username,
            email
          )
        `)
        .order('requested_at', { ascending: false });
      
      if (deletionError) {
        console.error('Error fetching deletion requests:', deletionError);
      }
      
      setDeletionRequests(deletionRequestsData || []);

      setStats({
        totalUsers: users.data?.length || 0,
        totalDatasets: datasets.data?.length || 0,
        totalCurators: curators.data?.length || 0,
        pendingCurators: curators.data?.filter(c => c.certification_status === 'pending').length || 0,
        totalRevenue: revenue.data?.totalRevenue || 0,
        platformRevenue: revenue.data?.platformRevenue || 0,
        creatorRevenue: revenue.data?.creatorRevenue || 0,
        totalTransactions: revenue.data?.totalTransactions || 0,
        totalBounties: bountiesData?.length || 0,
        openBounties: bountiesData?.filter(b => b.status === 'open').length || 0,
        assignedBounties: bountiesData?.filter(b => b.status === 'assigned').length || 0,
        completedBounties: bountiesData?.filter(b => b.status === 'completed').length || 0
      });

      // Done loading admin data
      setLoading(false);
      console.log('✅ Admin data loaded successfully');

    } catch (error) {
      console.error('Error fetching admin data:', error);
      // Set loading to false even on error so user can see the dashboard
      setLoading(false);
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
    const userProfile = allUsers.find(u => u.id === userId);
    if (userProfile) {
      setSelectedUser(userProfile);
      setShowUserModal(true);
    }
  };

  const handleViewDataset = (datasetId) => {
    const dataset = allDatasets.find(d => d.id === datasetId);
    if (dataset) {
      setSelectedDataset(dataset);
      setShowDatasetModal(true);
    }
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

  const handleApproveDeletionRequest = async (requestId) => {
    if (!confirm('⚠️ Approve this deletion request? The dataset will be permanently deleted.')) {
      return;
    }

    try {
      const response = await fetch('/.netlify/functions/admin-actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          action: 'approve_deletion_request',
          targetId: requestId,
          targetType: 'deletion_request',
          details: { adminResponse: 'Deletion request approved' }
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to approve deletion request');
      }

      alert('✅ Deletion request approved and dataset deleted!');
      setRejectingRequest(null);
      setAdminResponse('');
      await fetchAdminData();
    } catch (error) {
      console.error('Error approving deletion request:', error);
      alert('Failed to approve deletion request: ' + error.message);
    }
  };

  const handleRejectDeletionRequest = async (requestId) => {
    if (!adminResponse || adminResponse.length < 5) {
      alert('Please provide a rejection reason (minimum 5 characters)');
      return;
    }

    try {
      const response = await fetch('/.netlify/functions/admin-actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          action: 'reject_deletion_request',
          targetId: requestId,
          targetType: 'deletion_request',
          details: { adminResponse }
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to reject deletion request');
      }

      alert('❌ Deletion request rejected.');
      setRejectingRequest(null);
      setAdminResponse('');
      await fetchAdminData();
    } catch (error) {
      console.error('Error rejecting deletion request:', error);
      alert('Failed to reject deletion request: ' + error.message);
    }
  };

  const handleCloseBounty = async (bountyId) => {
    if (!confirm('Close this bounty? No more proposals will be accepted.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('curation_requests')
        .update({ status: 'closed' })
        .eq('id', bountyId);

      if (error) throw error;

      alert('✅ Bounty closed successfully!');
      await fetchAdminData();
    } catch (error) {
      console.error('Error closing bounty:', error);
      alert('Failed to close bounty: ' + error.message);
    }
  };

  const handleDeleteBounty = async (bountyId) => {
    if (!confirm('⚠️ PERMANENTLY delete this bounty? This cannot be undone!')) {
      return;
    }

    try {
      // Delete proposals first (foreign key constraint)
      const { error: proposalsError } = await supabase
        .from('curation_proposals')
        .delete()
        .eq('request_id', bountyId);

      if (proposalsError) throw proposalsError;

      // Then delete the bounty
      const { error } = await supabase
        .from('curation_requests')
        .delete()
        .eq('id', bountyId);

      if (error) throw error;

      alert('✅ Bounty and all proposals deleted successfully!');
      await fetchAdminData();
    } catch (error) {
      console.error('Error deleting bounty:', error);
      alert('Failed to delete bounty: ' + error.message);
    }
  };

  // Show loading while auth is loading
  if (authLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-gray-600">Loading authentication...</p>
        </div>
      </div>
    );
  }

  if (loading || !user || !isAdmin) {
    // Show nothing while checking/redirecting
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-gray-600">Checking admin permissions...</p>
        </div>
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
              onClick={() => setActiveTab('bounties')}
              className={`px-6 py-4 font-bold transition whitespace-nowrap ${
                activeTab === 'bounties' 
                  ? 'bg-yellow-300 border-r-2 border-black' 
                  : 'bg-white hover:bg-gray-50 border-r-2 border-black'
              }`}
            >
              💰 Bounties
              <span className="ml-2 text-xs text-gray-600">
                ({stats.openBounties} open)
              </span>
            </button>
            <button
              onClick={() => setActiveTab('deletions')}
              className={`px-6 py-4 font-bold transition whitespace-nowrap ${
                activeTab === 'deletions' 
                  ? 'bg-yellow-300 border-r-2 border-black' 
                  : 'bg-white hover:bg-gray-50 border-r-2 border-black'
              }`}
            >
              🗑️ Deletion Requests
              {deletionRequests.filter(r => r.status === 'pending').length > 0 && (
                <span className="ml-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                  {deletionRequests.filter(r => r.status === 'pending').length}
                </span>
              )}
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

            {activeTab === 'bounties' && (
              <div>
                <h3 className="text-2xl font-extrabold mb-4">Bounty Management</h3>
                
                {/* Bounty Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-blue-100 border-2 border-blue-600 rounded-xl p-4">
                    <div className="text-sm font-bold text-blue-800">Total Bounties</div>
                    <div className="text-3xl font-extrabold text-blue-800">{stats.totalBounties}</div>
                  </div>
                  <div className="bg-green-100 border-2 border-green-600 rounded-xl p-4">
                    <div className="text-sm font-bold text-green-800">Open</div>
                    <div className="text-3xl font-extrabold text-green-800">{stats.openBounties}</div>
                  </div>
                  <div className="bg-yellow-100 border-2 border-yellow-600 rounded-xl p-4">
                    <div className="text-sm font-bold text-yellow-800">Assigned</div>
                    <div className="text-3xl font-extrabold text-yellow-800">{stats.assignedBounties}</div>
                  </div>
                  <div className="bg-purple-100 border-2 border-purple-600 rounded-xl p-4">
                    <div className="text-sm font-bold text-purple-800">Completed</div>
                    <div className="text-3xl font-extrabold text-purple-800">{stats.completedBounties}</div>
                  </div>
                </div>

                {allBounties.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <p>No bounties yet.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Open Bounties */}
                    <div>
                      <h4 className="text-lg font-bold mb-3 text-green-700">🟢 Open Bounties ({allBounties.filter(b => b.status === 'open').length})</h4>
                      {allBounties.filter(b => b.status === 'open').length === 0 ? (
                        <p className="text-gray-500 text-sm">No open bounties</p>
                      ) : (
                        <div className="space-y-3">
                          {allBounties.filter(b => b.status === 'open').map((bounty) => (
                            <div key={bounty.id} className="border-2 border-green-500 bg-green-50 rounded-xl p-4">
                              <div className="flex justify-between items-start mb-3">
                                <div className="flex-1">
                                  <div className="flex items-center gap-3 mb-2">
                                    <h5 className="text-xl font-extrabold">{bounty.title}</h5>
                                    <span className="bg-green-200 text-green-800 px-2 py-1 rounded text-xs font-bold">
                                      {bounty.status}
                                    </span>
                                  </div>
                                  <p className="text-gray-700 mb-2">{bounty.description}</p>
                                  <div className="flex gap-4 text-sm">
                                    <span className="font-semibold">
                                      💰 ${bounty.budget_min} - ${bounty.budget_max}
                                    </span>
                                    <span className="text-gray-600">
                                      📅 {new Date(bounty.created_at).toLocaleDateString()}
                                    </span>
                                    <span className="text-gray-600">
                                      👤 {bounty.profiles?.username || 'Unknown'}
                                    </span>
                                    <span className="text-gray-600">
                                      📝 {bounty.curation_proposals?.[0]?.count || 0} proposals
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleCloseBounty(bounty.id)}
                                  className="bg-yellow-400 border-2 border-black px-4 py-2 rounded-lg font-bold hover:bg-yellow-300 transition text-sm"
                                >
                                  🔒 Close Bounty
                                </button>
                                <button
                                  onClick={() => handleDeleteBounty(bounty.id)}
                                  className="bg-red-400 border-2 border-black px-4 py-2 rounded-lg font-bold hover:bg-red-300 transition text-sm"
                                >
                                  🗑️ Delete
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedBounty(bounty);
                                    setShowBountyModal(true);
                                  }}
                                  className="bg-blue-400 border-2 border-black px-4 py-2 rounded-lg font-bold hover:bg-blue-300 transition text-sm"
                                >
                                  👁️ View Details
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Assigned Bounties */}
                    <div>
                      <h4 className="text-lg font-bold mb-3 text-yellow-700">🟡 Assigned Bounties ({allBounties.filter(b => b.status === 'assigned').length})</h4>
                      {allBounties.filter(b => b.status === 'assigned').length === 0 ? (
                        <p className="text-gray-500 text-sm">No assigned bounties</p>
                      ) : (
                        <div className="space-y-3">
                          {allBounties.filter(b => b.status === 'assigned').map((bounty) => (
                            <div key={bounty.id} className="border-2 border-yellow-500 bg-yellow-50 rounded-xl p-4">
                              <div className="flex justify-between items-start mb-3">
                                <div className="flex-1">
                                  <div className="flex items-center gap-3 mb-2">
                                    <h5 className="text-xl font-extrabold">{bounty.title}</h5>
                                    <span className="bg-yellow-200 text-yellow-800 px-2 py-1 rounded text-xs font-bold">
                                      {bounty.status}
                                    </span>
                                  </div>
                                  <p className="text-gray-700 mb-2">{bounty.description}</p>
                                  <div className="flex gap-4 text-sm">
                                    <span className="font-semibold">
                                      💰 ${bounty.budget_min} - ${bounty.budget_max}
                                    </span>
                                    <span className="text-gray-600">
                                      📅 {new Date(bounty.created_at).toLocaleDateString()}
                                    </span>
                                    <span className="text-gray-600">
                                      👤 {bounty.profiles?.username || 'Unknown'}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleDeleteBounty(bounty.id)}
                                  className="bg-red-400 border-2 border-black px-4 py-2 rounded-lg font-bold hover:bg-red-300 transition text-sm"
                                >
                                  🗑️ Delete
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedBounty(bounty);
                                    setShowBountyModal(true);
                                  }}
                                  className="bg-blue-400 border-2 border-black px-4 py-2 rounded-lg font-bold hover:bg-blue-300 transition text-sm"
                                >
                                  👁️ View Details
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Completed & Closed Bounties */}
                    <div>
                      <h4 className="text-lg font-bold mb-3 text-gray-700">⚫ Completed & Closed ({allBounties.filter(b => b.status === 'completed' || b.status === 'closed').length})</h4>
                      {allBounties.filter(b => b.status === 'completed' || b.status === 'closed').length === 0 ? (
                        <p className="text-gray-500 text-sm">No completed or closed bounties</p>
                      ) : (
                        <div className="space-y-3">
                          {allBounties.filter(b => b.status === 'completed' || b.status === 'closed').map((bounty) => (
                            <div key={bounty.id} className="border-2 border-gray-400 bg-gray-50 rounded-xl p-4">
                              <div className="flex justify-between items-start mb-3">
                                <div className="flex-1">
                                  <div className="flex items-center gap-3 mb-2">
                                    <h5 className="text-xl font-extrabold">{bounty.title}</h5>
                                    <span className="bg-gray-200 text-gray-800 px-2 py-1 rounded text-xs font-bold">
                                      {bounty.status}
                                    </span>
                                  </div>
                                  <p className="text-gray-700 mb-2">{bounty.description}</p>
                                  <div className="flex gap-4 text-sm">
                                    <span className="font-semibold">
                                      💰 ${bounty.budget_min} - ${bounty.budget_max}
                                    </span>
                                    <span className="text-gray-600">
                                      📅 {new Date(bounty.created_at).toLocaleDateString()}
                                    </span>
                                    <span className="text-gray-600">
                                      👤 {bounty.profiles?.username || 'Unknown'}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleDeleteBounty(bounty.id)}
                                  className="bg-red-400 border-2 border-black px-4 py-2 rounded-lg font-bold hover:bg-red-300 transition text-sm"
                                >
                                  🗑️ Delete
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'deletions' && (
              <div>
                <h3 className="text-2xl font-extrabold mb-4">Dataset Deletion Requests</h3>
                
                {deletionRequests.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <p>No deletion requests.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Pending Requests */}
                    <div>
                      <h4 className="text-lg font-bold mb-3 text-yellow-700">⏳ Pending Requests ({deletionRequests.filter(r => r.status === 'pending').length})</h4>
                      {deletionRequests.filter(r => r.status === 'pending').length === 0 ? (
                        <p className="text-gray-500 text-sm">No pending requests</p>
                      ) : (
                        <div className="space-y-3">
                          {deletionRequests.filter(r => r.status === 'pending').map((request) => (
                            <div key={request.id} className="border-2 border-yellow-500 bg-yellow-50 rounded-xl p-4">
                              <div className="flex justify-between items-start mb-3">
                                <div className="flex-1">
                                  <div className="flex items-center gap-3 mb-2">
                                    <h5 className="text-xl font-extrabold">{request.datasets?.title || 'Dataset Deleted'}</h5>
                                    {request.datasets && (
                                      <>
                                        <span className="px-2 py-1 bg-purple-200 rounded-full text-xs font-bold">
                                          {request.datasets.modality}
                                        </span>
                                        <span className="text-sm font-bold text-green-600">
                                          ${request.datasets.price}
                                        </span>
                                      </>
                                    )}
                                  </div>
                                  <p className="text-sm text-gray-600 mb-2">
                                    <strong>Requester:</strong> {request.profiles?.username || request.profiles?.email || 'Unknown'}
                                  </p>
                                  <p className="text-sm text-gray-600 mb-2">
                                    <strong>Requested:</strong> {new Date(request.requested_at).toLocaleString()}
                                  </p>
                                  <div className="bg-white border border-yellow-400 rounded-lg p-3 mt-2">
                                    <p className="text-sm font-bold mb-1">Reason:</p>
                                    <p className="text-sm text-gray-700">{request.reason}</p>
                                  </div>
                                </div>
                              </div>
                              
                              {/* Actions */}
                              {rejectingRequest === request.id ? (
                                <div className="border-t-2 border-yellow-500 pt-3 mt-3">
                                  <label className="block text-sm font-bold mb-2">Admin Response (required):</label>
                                  <textarea
                                    value={adminResponse}
                                    onChange={(e) => setAdminResponse(e.target.value)}
                                    placeholder="Explain why this deletion request is being rejected..."
                                    className="w-full border-2 border-gray-300 rounded-lg p-3 text-sm resize-none focus:outline-none focus:border-red-500"
                                    rows="3"
                                  />
                                  <div className="flex gap-2 mt-2">
                                    <button
                                      onClick={() => handleRejectDeletionRequest(request.id)}
                                      className="flex-1 bg-red-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-red-600 transition"
                                    >
                                      ✓ Confirm Rejection
                                    </button>
                                    <button
                                      onClick={() => {
                                        setRejectingRequest(null);
                                        setAdminResponse('');
                                      }}
                                      className="flex-1 bg-gray-300 text-black font-bold py-2 px-4 rounded-lg hover:bg-gray-400 transition"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleApproveDeletionRequest(request.id)}
                                    className="flex-1 bg-green-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-600 transition"
                                  >
                                    ✓ Approve & Delete Dataset
                                  </button>
                                  <button
                                    onClick={() => setRejectingRequest(request.id)}
                                    className="flex-1 bg-red-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-red-600 transition"
                                  >
                                    ✗ Reject Request
                                  </button>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Approved Requests */}
                    {deletionRequests.filter(r => r.status === 'approved').length > 0 && (
                      <div>
                        <h4 className="text-lg font-bold mb-3 text-green-700">✓ Approved Requests ({deletionRequests.filter(r => r.status === 'approved').length})</h4>
                        <div className="space-y-2">
                          {deletionRequests.filter(r => r.status === 'approved').map((request) => (
                            <div key={request.id} className="border border-green-500 bg-green-50 rounded-lg p-3">
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="font-bold">{request.datasets?.title || 'Dataset Deleted'}</p>
                                  <p className="text-xs text-gray-600">
                                    Approved on {new Date(request.reviewed_at).toLocaleString()}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Rejected Requests */}
                    {deletionRequests.filter(r => r.status === 'rejected').length > 0 && (
                      <div>
                        <h4 className="text-lg font-bold mb-3 text-red-700">✗ Rejected Requests ({deletionRequests.filter(r => r.status === 'rejected').length})</h4>
                        <div className="space-y-2">
                          {deletionRequests.filter(r => r.status === 'rejected').map((request) => (
                            <div key={request.id} className="border border-red-500 bg-red-50 rounded-lg p-3">
                              <div className="flex justify-between items-start mb-2">
                                <div>
                                  <p className="font-bold">{request.datasets?.title || 'Unknown Dataset'}</p>
                                  <p className="text-xs text-gray-600">
                                    Rejected on {new Date(request.reviewed_at).toLocaleString()}
                                  </p>
                                </div>
                              </div>
                              {request.admin_response && (
                                <div className="bg-white border border-red-400 rounded p-2 mt-2">
                                  <p className="text-xs font-bold mb-1">Admin Response:</p>
                                  <p className="text-xs text-gray-700">{request.admin_response}</p>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
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

      {/* Dataset Details Modal */}
      {showDatasetModal && selectedDataset && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowDatasetModal(false)}>
          <div className="bg-white rounded-xl border-2 border-black max-w-3xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              {/* Header */}
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h2 className="text-3xl font-extrabold mb-2">{selectedDataset.title}</h2>
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="px-3 py-1 bg-purple-200 rounded-full font-bold">{selectedDataset.modality}</span>
                    <span className="text-2xl font-extrabold text-green-600">${selectedDataset.price}</span>
                    {selectedDataset.is_featured && (
                      <span className="bg-yellow-400 text-black px-3 py-1 rounded-full text-sm font-bold border-2 border-black">
                        ⭐ FEATURED
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setShowDatasetModal(false)}
                  className="bg-red-400 text-black font-bold px-4 py-2 rounded-full border-2 border-black hover:scale-105 transition"
                >
                  ✕ Close
                </button>
              </div>

              {/* Description */}
              <div className="mb-6">
                <h3 className="text-xl font-bold mb-2">Description</h3>
                <p className="text-gray-700">{selectedDataset.description}</p>
              </div>

              {/* Tags */}
              {selectedDataset.tags && selectedDataset.tags.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-xl font-bold mb-2">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedDataset.tags.map((tag, idx) => (
                      <span key={idx} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Metadata */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="border-2 border-black rounded-lg p-4">
                  <div className="text-sm font-bold text-gray-600 mb-1">Creator</div>
                  <div className="font-bold">{selectedDataset.profiles?.username || 'Unknown'}</div>
                  <div className="text-xs text-gray-500">{selectedDataset.profiles?.email || ''}</div>
                </div>
                <div className="border-2 border-black rounded-lg p-4">
                  <div className="text-sm font-bold text-gray-600 mb-1">File Size</div>
                  <div className="font-bold">{selectedDataset.file_size ? (selectedDataset.file_size / 1024 / 1024).toFixed(2) + ' MB' : 'N/A'}</div>
                </div>
                <div className="border-2 border-black rounded-lg p-4">
                  <div className="text-sm font-bold text-gray-600 mb-1">Purchases</div>
                  <div className="font-bold">{selectedDataset.purchase_count || 0}</div>
                </div>
                <div className="border-2 border-black rounded-lg p-4">
                  <div className="text-sm font-bold text-gray-600 mb-1">Status</div>
                  <div className="font-bold">{selectedDataset.is_active ? '✅ Active' : '❌ Inactive'}</div>
                </div>
              </div>

              {/* Download URL */}
              {selectedDataset.download_url && (
                <div className="mb-6">
                  <h3 className="text-xl font-bold mb-2">Storage Path</h3>
                  <div className="bg-gray-100 p-3 rounded-lg border border-gray-300 font-mono text-sm break-all">
                    {selectedDataset.download_url}
                  </div>
                </div>
              )}

              {/* Dates */}
              <div className="flex gap-4 text-sm text-gray-600 mb-6">
                <div>
                  <span className="font-bold">Created:</span> {new Date(selectedDataset.created_at).toLocaleString()}
                </div>
                {selectedDataset.updated_at && (
                  <div>
                    <span className="font-bold">Updated:</span> {new Date(selectedDataset.updated_at).toLocaleString()}
                  </div>
                )}
              </div>

              {/* Admin Actions */}
              <div className="flex gap-3 pt-4 border-t-2 border-gray-200">
                <button
                  onClick={() => {
                    handleToggleFeatured(selectedDataset.id);
                    setShowDatasetModal(false);
                  }}
                  className="bg-blue-400 text-black font-bold px-6 py-3 rounded-full border-2 border-black hover:scale-105 transition"
                >
                  {selectedDataset.is_featured ? '⭐ Unfeature' : '⭐ Feature'}
                </button>
                <button
                  onClick={() => {
                    setShowDatasetModal(false);
                    handleDeleteDataset(selectedDataset.id, selectedDataset.title);
                  }}
                  className="bg-red-400 text-black font-bold px-6 py-3 rounded-full border-2 border-black hover:scale-105 transition"
                >
                  🗑️ Delete
                </button>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(selectedDataset.id);
                    alert('Dataset ID copied to clipboard!');
                  }}
                  className="bg-gray-200 text-black font-bold px-6 py-3 rounded-full border-2 border-black hover:scale-105 transition"
                >
                  📋 Copy ID
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* User Details Modal */}
      {showUserModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowUserModal(false)}>
          <div className="bg-white rounded-xl border-2 border-black max-w-3xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              {/* Header */}
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-3xl font-extrabold mb-2">{selectedUser.username || 'Anonymous User'}</h2>
                  <p className="text-gray-600">{selectedUser.email || 'No email'}</p>
                </div>
                <button
                  onClick={() => setShowUserModal(false)}
                  className="bg-red-400 text-black font-bold px-4 py-2 rounded-full border-2 border-black hover:scale-105 transition"
                >
                  ✕ Close
                </button>
              </div>

              {/* User Info */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="border-2 border-black rounded-lg p-4">
                  <div className="text-sm font-bold text-gray-600 mb-1">User ID</div>
                  <div className="font-mono text-sm break-all">{selectedUser.id}</div>
                </div>
                <div className="border-2 border-black rounded-lg p-4">
                  <div className="text-sm font-bold text-gray-600 mb-1">Joined</div>
                  <div className="font-bold">{selectedUser.created_at ? new Date(selectedUser.created_at).toLocaleDateString() : 'Unknown'}</div>
                </div>
              </div>

              {/* User's Datasets */}
              <div className="mb-6">
                <h3 className="text-xl font-bold mb-3">Datasets Created</h3>
                {allDatasets.filter(d => d.creator_id === selectedUser.id).length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No datasets created yet</p>
                ) : (
                  <div className="space-y-2">
                    {allDatasets.filter(d => d.creator_id === selectedUser.id).map((dataset) => (
                      <div key={dataset.id} className="border border-gray-300 rounded-lg p-3 flex justify-between items-center hover:bg-gray-50">
                        <div>
                          <div className="font-bold">{dataset.title}</div>
                          <div className="text-sm text-gray-600">${dataset.price} • {dataset.purchase_count || 0} purchases</div>
                        </div>
                        <button
                          onClick={() => {
                            setShowUserModal(false);
                            handleViewDataset(dataset.id);
                          }}
                          className="bg-blue-400 text-black font-bold px-3 py-1 rounded-full border-2 border-black hover:scale-105 transition text-sm"
                        >
                          View
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Admin Actions */}
              <div className="flex gap-3 pt-4 border-t-2 border-gray-200">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(selectedUser.id);
                    alert('User ID copied to clipboard!');
                  }}
                  className="bg-gray-200 text-black font-bold px-6 py-3 rounded-full border-2 border-black hover:scale-105 transition"
                >
                  📋 Copy User ID
                </button>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(selectedUser.email || '');
                    alert('Email copied to clipboard!');
                  }}
                  className="bg-gray-200 text-black font-bold px-6 py-3 rounded-full border-2 border-black hover:scale-105 transition"
                >
                  📧 Copy Email
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
