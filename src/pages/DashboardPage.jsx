import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { stripePromise } from '../lib/stripe'
import {
  Database,
  ShoppingBag,
  DollarSign,
  TrendingUp,
  Download,
  LogOut,
  Home,
  Package,
  Edit,
  Trash,
  Eye,
  EyeOff,
  Upload,
  X,
} from '../components/Icons'

function DashboardPage() {
  const navigate = useNavigate()
  const { user, profile, signOut } = useAuth()
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  
  // Curator data
  const [myDatasets, setMyDatasets] = useState([])
  const [earnings, setEarnings] = useState(null)
  const [payoutAccount, setPayoutAccount] = useState(null)
  
  // Buyer data
  const [myPurchases, setMyPurchases] = useState([])
  
  // Bounty data
  const [myBounties, setMyBounties] = useState([])
  const [mySubmissions, setMySubmissions] = useState([])
  const [expandedBounty, setExpandedBounty] = useState(null)
  
  // Stripe Connect state
  const [connectingStripe, setConnectingStripe] = useState(false)
  const [connectError, setConnectError] = useState(null)
  
  // Dataset management state
  const [editingDataset, setEditingDataset] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [actionLoading, setActionLoading] = useState(false)

  const fetchDashboardData = useCallback(async () => {
    if (!user) return
    
    setLoading(true)
    try {
      // Fetch user's created datasets
      const { data: datasets } = await supabase
        .from('datasets')
        .select('*')
        .eq('creator_id', user.id)
        .order('created_at', { ascending: false })
      
      setMyDatasets(datasets || [])

      // Fetch earnings summary
      const { data: earningsData } = await supabase
        .from('creator_earnings')
        .select('*')
        .eq('creator_id', user.id)
        .order('earned_at', { ascending: false })
      
      // Calculate totals
      const totalEarned = earningsData?.reduce((sum, e) => sum + parseFloat(e.creator_net), 0) || 0
      const pendingEarnings = earningsData?.filter(e => e.status === 'pending').reduce((sum, e) => sum + parseFloat(e.creator_net), 0) || 0
      
      setEarnings({
        total: totalEarned,
        pending: pendingEarnings,
        paid: totalEarned - pendingEarnings,
        transactions: earningsData || []
      })

      // Fetch payout account
      const { data: payout } = await supabase
        .from('creator_payout_accounts')
        .select('*')
        .eq('creator_id', user.id)
        .single()
      
      setPayoutAccount(payout)

      // Fetch user's purchases
      const { data: purchases } = await supabase
        .from('purchases')
        .select(`
          *,
          datasets (*)
        `)
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .order('purchased_at', { ascending: false })
      
      setMyPurchases(purchases || [])

      // Fetch user's bounties (that they posted)
      const { data: bounties } = await supabase
        .from('bounties')
        .select(`
          *,
          bounty_submissions (
            id,
            status,
            notes,
            submitted_at,
            datasets (*),
            profiles:creator_id (*)
          )
        `)
        .eq('creator_id', user.id)
        .order('created_at', { ascending: false })
      
      setMyBounties(bounties || [])

      // Fetch user's submissions (datasets they submitted to bounties)
      const { data: submissions } = await supabase
        .from('bounty_submissions')
        .select(`
          *,
          bounties (*),
          datasets (*)
        `)
        .eq('creator_id', user.id)
        .order('submitted_at', { ascending: false })
      
      setMySubmissions(submissions || [])

    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (!user) {
      navigate('/')
      return
    }
    
    fetchDashboardData()
    
    // Check for Stripe onboarding completion
    const urlParams = new URLSearchParams(window.location.search)
    const onboardingStatus = urlParams.get('onboarding')
    const tabParam = urlParams.get('tab')
    
    if (onboardingStatus === 'complete') {
      alert('✅ Stripe account connected successfully! Your payout account is now set up.')
      // Switch to earnings tab if not already there
      if (tabParam === 'earnings') {
        setActiveTab('earnings')
      }
      // Clean up URL
      window.history.replaceState({}, '', '/dashboard')
      // Refresh data to show updated payout account
      setTimeout(() => fetchDashboardData(), 1000)
    } else if (onboardingStatus === 'refresh') {
      alert('⚠️ Stripe onboarding was interrupted. Please try again.')
      if (tabParam === 'earnings') {
        setActiveTab('earnings')
      }
      window.history.replaceState({}, '', '/dashboard')
    }
  }, [user, navigate, fetchDashboardData])

  const handleDownload = async (datasetId) => {
    try {
      const response = await fetch('/.netlify/functions/generate-download', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          datasetId: datasetId,
          userId: user.id,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate download link')
      }

      // Handle demo datasets with data URLs
      if (data.isDemo && data.downloadUrl.startsWith('data:')) {
        // Create a download link for the data URL
        const link = document.createElement('a')
        link.href = data.downloadUrl
        link.download = data.fileName || 'DEMO_README.txt'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        
        alert('📝 Demo dataset info downloaded! This is a sample to showcase how Setique works. Real datasets include actual data files.')
      } else {
        // For real datasets, open in new tab
        window.open(data.downloadUrl, '_blank')
        alert('Download started! Link expires in 24 hours.')
      }
      
      // Refresh download logs
      fetchDashboardData()
    } catch (error) {
      console.error('Download error:', error)
      alert('Error: ' + error.message)
    }
  }

  // Dataset management handlers
  const handleToggleActive = async (datasetId, currentStatus) => {
    setActionLoading(true)
    try {
      const { error } = await supabase
        .from('datasets')
        .update({ is_active: !currentStatus })
        .eq('id', datasetId)
        .eq('creator_id', user.id)
      
      if (error) throw error
      
      // Update local state
      setMyDatasets(prev => 
        prev.map(d => d.id === datasetId ? { ...d, is_active: !currentStatus } : d)
      )
      
      alert(`Dataset ${!currentStatus ? 'activated' : 'deactivated'} successfully!`)
    } catch (error) {
      console.error('Error toggling dataset:', error)
      alert('Failed to update dataset status')
    } finally {
      setActionLoading(false)
    }
  }

  const handleEditDataset = (dataset) => {
    setEditingDataset({
      id: dataset.id,
      title: dataset.title,
      description: dataset.description,
      price: dataset.price,
      modality: dataset.modality,
      tags: dataset.tags || []
    })
  }

  const handleSaveEdit = async () => {
    if (!editingDataset) return
    
    setActionLoading(true)
    try {
      const { error } = await supabase
        .from('datasets')
        .update({
          title: editingDataset.title,
          description: editingDataset.description,
          price: parseFloat(editingDataset.price),
          modality: editingDataset.modality,
          tags: editingDataset.tags,
        })
        .eq('id', editingDataset.id)
        .eq('creator_id', user.id)
      
      if (error) throw error
      
      // Update local state
      setMyDatasets(prev => 
        prev.map(d => d.id === editingDataset.id ? { ...d, ...editingDataset, price: parseFloat(editingDataset.price) } : d)
      )
      
      setEditingDataset(null)
      alert('Dataset updated successfully!')
    } catch (error) {
      console.error('Error updating dataset:', error)
      alert('Failed to update dataset')
    } finally {
      setActionLoading(false)
    }
  }

  const handleDeleteDataset = async (datasetId) => {
    if (!deleteConfirm) {
      setDeleteConfirm(datasetId)
      return
    }
    
    if (deleteConfirm !== datasetId) return
    
    setActionLoading(true)
    try {
      // Check if dataset has purchases
      const { data: purchases, error: purchaseError } = await supabase
        .from('purchases')
        .select('id')
        .eq('dataset_id', datasetId)
        .limit(1)
      
      if (purchaseError) throw purchaseError
      
      if (purchases && purchases.length > 0) {
        alert('Cannot delete dataset that has been purchased. Consider deactivating it instead.')
        setDeleteConfirm(null)
        setActionLoading(false)
        return
      }
      
      // Delete the dataset
      const { error } = await supabase
        .from('datasets')
        .delete()
        .eq('id', datasetId)
        .eq('creator_id', user.id)
      
      if (error) throw error
      
      // Update local state
      setMyDatasets(prev => prev.filter(d => d.id !== datasetId))
      setDeleteConfirm(null)
      alert('Dataset deleted successfully!')
    } catch (error) {
      console.error('Error deleting dataset:', error)
      alert('Failed to delete dataset')
    } finally {
      setActionLoading(false)
    }
  }

  const handleConnectStripe = async () => {
    setConnectingStripe(true)
    setConnectError(null)
    
    try {
      const response = await fetch('/.netlify/functions/connect-onboarding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          creatorId: user.id,
          email: profile?.email || user.email,
          returnUrl: `${window.location.origin}/dashboard?tab=earnings&onboarding=complete`,
          refreshUrl: `${window.location.origin}/dashboard?tab=earnings&onboarding=refresh`,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create Stripe Connect link')
      }

      // Redirect to Stripe onboarding
      window.location.href = data.url
    } catch (error) {
      console.error('Stripe Connect error:', error)
      setConnectError(error.message)
      setConnectingStripe(false)
    }
  }

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-300 via-pink-400 to-cyan-300 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-black mx-auto mb-4"></div>
          <p className="text-2xl font-extrabold text-black">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  const totalSpent = myPurchases.reduce((sum, p) => sum + parseFloat(p.amount), 0)

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-300 via-pink-400 to-cyan-300 text-black font-sans">
      {/* Header */}
      <header className="border-b-4 border-black bg-white/90 backdrop-blur sticky top-0 z-40">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-extrabold">
            <span className="bg-[linear-gradient(90deg,#ff00c3,#00ffff)] bg-clip-text text-transparent">
              Setique
            </span>
          </h1>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 font-bold text-black">
              {profile?.username || user.email}
            </div>
            <button
              onClick={() => navigate('/')}
              className="font-bold text-black hover:text-cyan-600 transition flex items-center gap-1"
            >
              <Home className="h-4 w-4" />
              Home
            </button>
            <button
              onClick={handleSignOut}
              className="font-bold text-black hover:text-pink-600 transition flex items-center gap-1"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </div>
        </nav>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-4xl font-extrabold mb-2">
            Welcome back, {profile?.username || 'there'}! 👋
          </h2>
          <p className="text-lg font-semibold text-black/70">
            Here&apos;s what&apos;s happening with your data economy
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <div className="bg-yellow-200 border-4 border-black rounded-2xl shadow-[6px_6px_0_#000] p-6">
            <Database className="h-8 w-8 mb-2 text-pink-600" />
            <div className="text-3xl font-extrabold">{myDatasets.length}</div>
            <div className="text-sm font-bold">Datasets Created</div>
          </div>
          <div className="bg-cyan-200 border-4 border-black rounded-2xl shadow-[6px_6px_0_#000] p-6">
            <ShoppingBag className="h-8 w-8 mb-2 text-pink-600" />
            <div className="text-3xl font-extrabold">{myPurchases.length}</div>
            <div className="text-sm font-bold">Datasets Purchased</div>
          </div>
          <div className="bg-pink-200 border-4 border-black rounded-2xl shadow-[6px_6px_0_#000] p-6">
            <DollarSign className="h-8 w-8 mb-2 text-cyan-600" />
            <div className="text-3xl font-extrabold">${earnings?.total.toFixed(2) || '0.00'}</div>
            <div className="text-sm font-bold">Total Earned</div>
          </div>
          <div className="bg-white border-4 border-black rounded-2xl shadow-[6px_6px_0_#000] p-6">
            <TrendingUp className="h-8 w-8 mb-2 text-yellow-600" />
            <div className="text-3xl font-extrabold">${totalSpent.toFixed(2)}</div>
            <div className="text-sm font-bold">Total Spent</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-6 py-3 rounded-full font-extrabold border-2 border-black transition ${
              activeTab === 'overview'
                ? 'bg-[linear-gradient(90deg,#ff00c3,#00ffff)] text-white'
                : 'bg-white text-black hover:bg-gray-100'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('datasets')}
            className={`px-6 py-3 rounded-full font-extrabold border-2 border-black transition ${
              activeTab === 'datasets'
                ? 'bg-[linear-gradient(90deg,#ff00c3,#00ffff)] text-white'
                : 'bg-white text-black hover:bg-gray-100'
            }`}
          >
            My Datasets ({myDatasets.length})
          </button>
          <button
            onClick={() => setActiveTab('purchases')}
            className={`px-6 py-3 rounded-full font-extrabold border-2 border-black transition ${
              activeTab === 'purchases'
                ? 'bg-[linear-gradient(90deg,#ff00c3,#00ffff)] text-white'
                : 'bg-white text-black hover:bg-gray-100'
            }`}
          >
            My Purchases ({myPurchases.length})
          </button>
          <button
            onClick={() => setActiveTab('earnings')}
            className={`px-6 py-3 rounded-full font-extrabold border-2 border-black transition ${
              activeTab === 'earnings'
                ? 'bg-[linear-gradient(90deg,#ff00c3,#00ffff)] text-white'
                : 'bg-white text-black hover:bg-gray-100'
            }`}
          >
            Earnings
          </button>
          <button
            onClick={() => setActiveTab('bounties')}
            className={`px-6 py-3 rounded-full font-extrabold border-2 border-black transition ${
              activeTab === 'bounties'
                ? 'bg-[linear-gradient(90deg,#ff00c3,#00ffff)] text-white'
                : 'bg-white text-black hover:bg-gray-100'
            }`}
          >
            My Bounties ({myBounties.length})
          </button>
          <button
            onClick={() => setActiveTab('submissions')}
            className={`px-6 py-3 rounded-full font-extrabold border-2 border-black transition ${
              activeTab === 'submissions'
                ? 'bg-[linear-gradient(90deg,#ff00c3,#00ffff)] text-white'
                : 'bg-white text-black hover:bg-gray-100'
            }`}
          >
            My Submissions ({mySubmissions.length})
          </button>
        </div>

        {/* Tab Content */}
        <div className="bg-white border-4 border-black rounded-3xl shadow-[8px_8px_0_#000] p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <h3 className="text-2xl font-extrabold">Recent Activity</h3>
              
              {/* Recent Purchases */}
              {myPurchases.length > 0 && (
                <div>
                  <h4 className="text-lg font-extrabold mb-3">Recent Purchases</h4>
                  <div className="space-y-2">
                    {myPurchases.slice(0, 3).map((purchase) => (
                      <div
                        key={purchase.id}
                        className="flex justify-between items-center p-3 bg-cyan-100 border-2 border-black rounded-lg"
                      >
                        <div>
                          <div className="font-bold">{purchase.datasets.title}</div>
                          <div className="text-sm text-black/60">
                            {new Date(purchase.purchased_at).toLocaleDateString()}
                          </div>
                        </div>
                        <button
                          onClick={() => handleDownload(purchase.dataset_id)}
                          className="bg-[linear-gradient(90deg,#ffea00,#00ffff)] text-black font-bold px-4 py-2 rounded-full border-2 border-black hover:scale-105 transition text-sm"
                        >
                          Download
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent Dataset Sales */}
              {earnings && earnings.transactions.length > 0 && (
                <div>
                  <h4 className="text-lg font-extrabold mb-3">Recent Sales</h4>
                  <div className="space-y-2">
                    {earnings.transactions.slice(0, 3).map((transaction) => (
                      <div
                        key={transaction.id}
                        className="flex justify-between items-center p-3 bg-pink-100 border-2 border-black rounded-lg"
                      >
                        <div>
                          <div className="font-bold">Sale #{transaction.id.substring(0, 8)}</div>
                          <div className="text-sm text-black/60">
                            {new Date(transaction.earned_at).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-extrabold text-lg">
                            +${parseFloat(transaction.creator_net).toFixed(2)}
                          </div>
                          <div className="text-xs font-bold text-black/60">
                            {transaction.status}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {myPurchases.length === 0 && myDatasets.length === 0 && (
                <div className="text-center py-12">
                  <Package className="h-16 w-16 mx-auto mb-4 text-black/30" />
                  <p className="font-bold text-black/60">
                    No activity yet. Start by creating a dataset or purchasing one!
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'datasets' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-2xl font-extrabold">My Datasets</h3>
                <button
                  onClick={() => navigate('/#curator-form')}
                  className="bg-[linear-gradient(90deg,#ffea00,#00ffff)] text-black font-extrabold px-6 py-3 rounded-full border-2 border-black hover:scale-105 transition flex items-center gap-2"
                >
                  <Upload className="h-4 w-4" />
                  Upload New Dataset
                </button>
              </div>
              
              {myDatasets.length > 0 ? (
                <div className="space-y-4">
                  {myDatasets.map((dataset) => (
                    <div
                      key={dataset.id}
                      className="border-2 border-black rounded-xl p-6 bg-yellow-100 relative"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="text-xl font-extrabold">{dataset.title}</h4>
                            <button
                              onClick={() => handleToggleActive(dataset.id, dataset.is_active)}
                              disabled={actionLoading}
                              className={`px-3 py-1 rounded-full border-2 border-black font-bold text-xs flex items-center gap-1 transition hover:scale-105 ${
                                dataset.is_active 
                                  ? 'bg-green-300 hover:bg-green-400' 
                                  : 'bg-gray-300 hover:bg-gray-400'
                              }`}
                              title={dataset.is_active ? 'Click to deactivate' : 'Click to activate'}
                            >
                              {dataset.is_active ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                              {dataset.is_active ? 'Active' : 'Inactive'}
                            </button>
                          </div>
                          <p className="text-sm font-semibold text-black/70 mb-3">
                            {dataset.description}
                          </p>
                          <div className="flex flex-wrap gap-4 text-sm font-bold">
                            <span className="flex items-center gap-1">
                              💰 ${dataset.price}
                            </span>
                            <span className="flex items-center gap-1">
                              📦 {dataset.modality}
                            </span>
                            <span className="flex items-center gap-1">
                              🛒 {dataset.purchase_count || 0} sales
                            </span>
                            <span className="flex items-center gap-1">
                              📅 {new Date(dataset.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          {dataset.tags && dataset.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2">
                              {dataset.tags.map((tag, idx) => (
                                <span
                                  key={idx}
                                  className="px-2 py-1 bg-white border border-black rounded-full text-xs font-bold"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2 ml-4">
                          <button
                            onClick={() => handleEditDataset(dataset)}
                            className="p-2 bg-blue-300 rounded-lg border-2 border-black hover:scale-110 transition"
                            title="Edit dataset"
                          >
                            <Edit className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleDeleteDataset(dataset.id)}
                            className={`p-2 rounded-lg border-2 border-black hover:scale-110 transition ${
                              deleteConfirm === dataset.id 
                                ? 'bg-red-500 text-white' 
                                : 'bg-red-300'
                            }`}
                            title={deleteConfirm === dataset.id ? 'Click again to confirm' : 'Delete dataset'}
                          >
                            <Trash className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                      
                      {deleteConfirm === dataset.id && (
                        <div className="mt-3 p-3 bg-red-100 border-2 border-red-500 rounded-lg">
                          <p className="font-bold text-sm text-red-700">
                            ⚠️ Are you sure? Click delete again to confirm. This cannot be undone!
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Package className="h-16 w-16 mx-auto mb-4 text-black/30" />
                  <p className="font-bold text-black/60 mb-4">
                    You haven&apos;t created any datasets yet
                  </p>
                  <button
                    onClick={() => navigate('/#curator-form')}
                    className="bg-[linear-gradient(90deg,#ffea00,#00ffff)] text-black font-extrabold px-6 py-3 rounded-full border-2 border-black hover:scale-105 transition"
                  >
                    Create Your First Dataset
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'purchases' && (
            <div>
              <h3 className="text-2xl font-extrabold mb-4">My Purchases</h3>
              {myPurchases.length > 0 ? (
                <div className="space-y-4">
                  {myPurchases.map((purchase) => (
                    <div
                      key={purchase.id}
                      className="border-2 border-black rounded-xl p-4 bg-cyan-100"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="text-xl font-extrabold">
                            {purchase.datasets.title}
                          </h4>
                          <p className="text-sm font-semibold text-black/70 mt-1">
                            {purchase.datasets.description}
                          </p>
                          <div className="flex gap-4 mt-2 text-sm font-bold">
                            <span>💰 ${purchase.amount}</span>
                            <span>
                              📅 {new Date(purchase.purchased_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDownload(purchase.dataset_id)}
                          className="ml-4 bg-[linear-gradient(90deg,#ffea00,#00ffff)] text-black font-extrabold px-6 py-3 rounded-full border-2 border-black hover:scale-105 transition flex items-center gap-2"
                        >
                          <Download className="h-4 w-4" />
                          Download
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <ShoppingBag className="h-16 w-16 mx-auto mb-4 text-black/30" />
                  <p className="font-bold text-black/60 mb-4">
                    You haven&apos;t purchased any datasets yet
                  </p>
                  <button
                    onClick={() => navigate('/#marketplace')}
                    className="bg-[linear-gradient(90deg,#ffea00,#00ffff)] text-black font-extrabold px-6 py-3 rounded-full border-2 border-black hover:scale-105 transition"
                  >
                    Browse Marketplace
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'earnings' && (
            <div>
              <h3 className="text-2xl font-extrabold mb-4">Earnings & Payouts</h3>
              
              {/* Earnings Summary */}
              <div className="grid md:grid-cols-3 gap-4 mb-6">
                <div className="bg-green-200 border-2 border-black rounded-xl p-4">
                  <div className="text-sm font-bold text-black/60 uppercase mb-1">
                    Total Earned
                  </div>
                  <div className="text-3xl font-extrabold">
                    ${earnings?.total.toFixed(2) || '0.00'}
                  </div>
                </div>
                <div className="bg-yellow-200 border-2 border-black rounded-xl p-4">
                  <div className="text-sm font-bold text-black/60 uppercase mb-1">
                    Pending
                  </div>
                  <div className="text-3xl font-extrabold">
                    ${earnings?.pending.toFixed(2) || '0.00'}
                  </div>
                </div>
                <div className="bg-blue-200 border-2 border-black rounded-xl p-4">
                  <div className="text-sm font-bold text-black/60 uppercase mb-1">
                    Paid Out
                  </div>
                  <div className="text-3xl font-extrabold">
                    ${earnings?.paid.toFixed(2) || '0.00'}
                  </div>
                </div>
              </div>

              {/* Payout Account Status */}
              {payoutAccount ? (
                <div className="bg-white border-2 border-black rounded-xl p-4 mb-6">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-extrabold mb-2">Payout Account</h4>
                      <p className="text-sm font-semibold">
                        Status: <span className="font-extrabold">{payoutAccount.account_status}</span>
                      </p>
                      <p className="text-sm font-semibold">
                        Payouts {payoutAccount.payouts_enabled ? 'Enabled ✅' : 'Disabled ❌'}
                      </p>
                    </div>
                    <a
                      href="https://dashboard.stripe.com/dashboard"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-purple-200 text-black font-bold px-4 py-2 rounded-full border-2 border-black hover:scale-105 transition text-sm"
                    >
                      Manage on Stripe →
                    </a>
                  </div>
                  {payoutAccount.current_balance >= payoutAccount.minimum_payout_threshold && (
                    <button className="bg-green-300 text-black font-bold px-4 py-2 rounded-full border-2 border-black hover:scale-105 transition w-full">
                      Request Payout (${payoutAccount.current_balance.toFixed(2)} available)
                    </button>
                  )}
                </div>
              ) : (
                <div className="bg-yellow-100 border-2 border-black rounded-xl p-4 mb-6">
                  <h4 className="font-extrabold mb-2">⚠️ Setup Payout Account</h4>
                  <p className="text-sm font-semibold mb-3">
                    Connect your Stripe account to receive payouts
                  </p>
                  {connectError && (
                    <div className="bg-red-100 border-2 border-red-500 rounded-lg p-3 mb-3">
                      <p className="text-sm font-bold text-red-800">❌ {connectError}</p>
                    </div>
                  )}
                  <button 
                    onClick={handleConnectStripe}
                    disabled={connectingStripe}
                    className="bg-[linear-gradient(90deg,#ffea00,#00ffff)] text-black font-bold px-4 py-2 rounded-full border-2 border-black hover:scale-105 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {connectingStripe ? 'Connecting...' : 'Connect Stripe Account'}
                  </button>
                </div>
              )}

              {/* Transaction History */}
              {earnings && earnings.transactions.length > 0 ? (
                <div>
                  <h4 className="font-extrabold mb-3">Transaction History</h4>
                  <div className="space-y-2">
                    {earnings.transactions.map((transaction) => (
                      <div
                        key={transaction.id}
                        className="flex justify-between items-center p-3 border-2 border-black rounded-lg bg-gray-50"
                      >
                        <div>
                          <div className="font-bold">
                            Sale #{transaction.id.substring(0, 8)}
                          </div>
                          <div className="text-xs text-black/60">
                            {new Date(transaction.earned_at).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-extrabold">
                            ${parseFloat(transaction.creator_net).toFixed(2)}
                          </div>
                          <div className="text-xs font-bold text-black/60">
                            {transaction.status}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <DollarSign className="h-16 w-16 mx-auto mb-4 text-black/30" />
                  <p className="font-bold text-black/60">
                    No earnings yet. Create and sell datasets to start earning!
                  </p>
                </div>
              )}
            </div>
          )}

          {/* My Bounties Tab */}
          {activeTab === 'bounties' && (
            <div>
              <h3 className="text-2xl font-extrabold mb-4">Bounties I Posted</h3>
              <p className="text-sm text-black/70 mb-6">
                View submissions from creators responding to your bounties
              </p>

              {myBounties.length > 0 ? (
                <div className="space-y-4">
                  {myBounties.map((bounty) => (
                    <div
                      key={bounty.id}
                      className="bg-gradient-to-br from-yellow-100 via-pink-100 to-cyan-100 border-2 border-black rounded-xl p-4"
                    >
                      {/* Bounty Header */}
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <h4 className="font-extrabold text-lg mb-1">{bounty.title}</h4>
                          <div className="flex gap-3 text-sm font-semibold text-black/70">
                            <span className="bg-white border-2 border-black rounded-full px-3 py-1">
                              {bounty.modality}
                            </span>
                            <span className="bg-white border-2 border-black rounded-full px-3 py-1">
                              ${bounty.budget}
                            </span>
                            <span className="bg-white border-2 border-black rounded-full px-3 py-1">
                              {bounty.bounty_submissions?.length || 0} submissions
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => setExpandedBounty(expandedBounty === bounty.id ? null : bounty.id)}
                          className="bg-white border-2 border-black rounded-full px-4 py-2 font-bold hover:bg-gray-100 transition"
                        >
                          {expandedBounty === bounty.id ? 'Hide' : 'View'} Submissions
                        </button>
                      </div>

                      {/* Submissions (Expanded) */}
                      {expandedBounty === bounty.id && (
                        <div className="mt-4 space-y-3">
                          {bounty.bounty_submissions && bounty.bounty_submissions.length > 0 ? (
                            bounty.bounty_submissions.map((submission) => (
                              <div
                                key={submission.id}
                                className="bg-white border-2 border-black rounded-xl p-4"
                              >
                                <div className="flex justify-between items-start mb-3">
                                  <div className="flex-1">
                                    <h5 className="font-extrabold text-base mb-1">
                                      {submission.datasets?.title || 'Untitled Dataset'}
                                    </h5>
                                    <p className="text-sm font-semibold text-black/70 mb-1">
                                      By {submission.profiles?.username || 'Anonymous'}
                                    </p>
                                    <p className="text-sm text-black/70 mb-2">
                                      Price: ${submission.datasets?.price || 0}
                                    </p>
                                    {submission.notes && (
                                      <div className="bg-gray-50 border border-black/20 rounded-lg p-3 mb-3">
                                        <p className="text-sm font-semibold italic">
                                          &quot;{submission.notes}&quot;
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex flex-col gap-2 ml-4">
                                    {submission.status === 'pending' && (
                                      <>
                                        <button
                                          onClick={async () => {
                                            try {
                                              const dataset = submission.datasets
                                              
                                              // Check if user already owns this dataset
                                              const { data: existingPurchase } = await supabase
                                                .from('purchases')
                                                .select('id')
                                                .eq('user_id', user.id)
                                                .eq('dataset_id', dataset.id)
                                                .single()

                                              if (existingPurchase) {
                                                alert('You already own this dataset!')
                                                return
                                              }

                                              // Update submission to approved
                                              const { error: updateError } = await supabase
                                                .from('bounty_submissions')
                                                .update({ status: 'approved' })
                                                .eq('id', submission.id)

                                              if (updateError) throw updateError

                                              // Handle free datasets
                                              if (dataset.price === 0) {
                                                const { error: purchaseError } = await supabase
                                                  .from('purchases')
                                                  .insert([{
                                                    user_id: user.id,
                                                    dataset_id: dataset.id,
                                                    amount: 0,
                                                    status: 'completed'
                                                  }])

                                                if (purchaseError) throw purchaseError
                                                alert('✅ Submission approved and dataset added to your library!')
                                                fetchDashboardData()
                                                return
                                              }

                                              // For paid datasets, create Stripe checkout
                                              const stripe = await stripePromise
                                              
                                              const response = await fetch('/.netlify/functions/create-checkout', {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({
                                                  datasetId: dataset.id,
                                                  userId: user.id
                                                })
                                              })

                                              const { sessionId, error } = await response.json()
                                              if (error) throw new Error(error)

                                              // Redirect to Stripe checkout
                                              await stripe.redirectToCheckout({ sessionId })
                                              
                                            } catch (err) {
                                              console.error('Error approving submission:', err)
                                              alert('Error approving submission: ' + err.message)
                                            }
                                          }}
                                          className="bg-green-300 text-black font-bold px-4 py-2 rounded-full border-2 border-black hover:scale-105 transition text-sm whitespace-nowrap"
                                        >
                                          ✓ Approve & Purchase
                                        </button>
                                        <button
                                          onClick={async () => {
                                            if (!window.confirm('Are you sure you want to reject this submission?')) return
                                            try {
                                              const { error } = await supabase
                                                .from('bounty_submissions')
                                                .update({ status: 'rejected' })
                                                .eq('id', submission.id)

                                              if (error) throw error
                                              alert('Submission rejected.')
                                              fetchDashboardData()
                                            } catch (err) {
                                              alert('Error rejecting submission: ' + err.message)
                                            }
                                          }}
                                          className="bg-red-300 text-black font-bold px-4 py-2 rounded-full border-2 border-black hover:scale-105 transition text-sm"
                                        >
                                          ✗ Reject
                                        </button>
                                      </>
                                    )}
                                    {submission.status === 'approved' && (
                                      <span className="bg-green-100 border-2 border-green-600 text-green-800 font-bold px-4 py-2 rounded-full text-sm">
                                        ✓ Approved
                                      </span>
                                    )}
                                    {submission.status === 'rejected' && (
                                      <span className="bg-red-100 border-2 border-red-600 text-red-800 font-bold px-4 py-2 rounded-full text-sm">
                                        ✗ Rejected
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <p className="text-xs text-black/50 font-semibold">
                                  Submitted {new Date(submission.submitted_at).toLocaleDateString()}
                                </p>
                              </div>
                            ))
                          ) : (
                            <div className="bg-white border-2 border-black rounded-xl p-6 text-center">
                              <p className="text-sm font-bold text-black/60">
                                No submissions yet. Share your bounty to get responses!
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Package className="h-16 w-16 mx-auto mb-4 text-black/30" />
                  <p className="font-bold text-black/60 mb-2">
                    No bounties posted yet
                  </p>
                  <p className="text-sm text-black/50 mb-4">
                    Post a bounty on the homepage to request specific datasets
                  </p>
                  <button
                    onClick={() => navigate('/')}
                    className="bg-[linear-gradient(90deg,#00ffff,#ff00c3)] text-white font-bold px-6 py-3 rounded-full border-2 border-black hover:opacity-90"
                  >
                    Go to Homepage
                  </button>
                </div>
              )}
            </div>
          )}

          {/* My Submissions Tab */}
          {activeTab === 'submissions' && (
            <div>
              <h3 className="text-2xl font-extrabold mb-4">My Bounty Submissions</h3>
              <p className="text-sm text-black/70 mb-6">
                Track the status of datasets you&apos;ve submitted to bounties
              </p>

              {mySubmissions.length > 0 ? (
                <div className="space-y-4">
                  {mySubmissions.map((submission) => (
                    <div
                      key={submission.id}
                      className="bg-white border-2 border-black rounded-xl p-4"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-extrabold text-lg mb-1">
                            {submission.datasets?.title || 'Untitled Dataset'}
                          </h4>
                          <p className="text-sm font-semibold text-black/70 mb-2">
                            → Submitted to: <strong>{submission.bounties?.title}</strong>
                          </p>
                          <p className="text-sm text-black/60 mb-2">
                            Bounty Budget: ${submission.bounties?.budget} • Your Price: ${submission.datasets?.price}
                          </p>
                          {submission.notes && (
                            <div className="bg-gray-50 border border-black/20 rounded-lg p-3 mb-2">
                              <p className="text-sm italic">
                                &quot;{submission.notes}&quot;
                              </p>
                            </div>
                          )}
                          <p className="text-xs text-black/50 font-semibold">
                            Submitted {new Date(submission.submitted_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="ml-4">
                          {submission.status === 'pending' && (
                            <span className="bg-yellow-100 border-2 border-yellow-600 text-yellow-800 font-bold px-4 py-2 rounded-full text-sm whitespace-nowrap">
                              ⏳ Pending Review
                            </span>
                          )}
                          {submission.status === 'approved' && (
                            <span className="bg-green-100 border-2 border-green-600 text-green-800 font-bold px-4 py-2 rounded-full text-sm whitespace-nowrap">
                              ✓ Approved
                            </span>
                          )}
                          {submission.status === 'rejected' && (
                            <span className="bg-red-100 border-2 border-red-600 text-red-800 font-bold px-4 py-2 rounded-full text-sm whitespace-nowrap">
                              ✗ Rejected
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Database className="h-16 w-16 mx-auto mb-4 text-black/30" />
                  <p className="font-bold text-black/60 mb-2">
                    No submissions yet
                  </p>
                  <p className="text-sm text-black/50 mb-4">
                    Browse bounties on the homepage and submit your datasets
                  </p>
                  <button
                    onClick={() => navigate('/')}
                    className="bg-[linear-gradient(90deg,#00ffff,#ff00c3)] text-white font-bold px-6 py-3 rounded-full border-2 border-black hover:opacity-90"
                  >
                    Browse Bounties
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
      
      {/* Edit Dataset Modal */}
      {editingDataset && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border-4 border-black max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-extrabold">Edit Dataset</h3>
                <button
                  onClick={() => setEditingDataset(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block font-bold mb-2">Title</label>
                  <input
                    type="text"
                    value={editingDataset.title}
                    onChange={(e) => setEditingDataset(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-4 py-2 border-2 border-black rounded-lg font-semibold"
                    placeholder="Dataset title"
                  />
                </div>
                
                <div>
                  <label className="block font-bold mb-2">Description</label>
                  <textarea
                    value={editingDataset.description}
                    onChange={(e) => setEditingDataset(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-4 py-2 border-2 border-black rounded-lg font-semibold"
                    rows="4"
                    placeholder="Describe your dataset..."
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold mb-2">Price ($)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={editingDataset.price}
                      onChange={(e) => setEditingDataset(prev => ({ ...prev, price: e.target.value }))}
                      className="w-full px-4 py-2 border-2 border-black rounded-lg font-semibold"
                    />
                  </div>
                  
                  <div>
                    <label className="block font-bold mb-2">Modality</label>
                    <select
                      value={editingDataset.modality}
                      onChange={(e) => setEditingDataset(prev => ({ ...prev, modality: e.target.value }))}
                      className="w-full px-4 py-2 border-2 border-black rounded-lg font-semibold"
                    >
                      <option value="vision">Vision</option>
                      <option value="audio">Audio</option>
                      <option value="text">Text</option>
                      <option value="multimodal">Multimodal</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block font-bold mb-2">Tags (comma-separated)</label>
                  <input
                    type="text"
                    value={editingDataset.tags?.join(', ') || ''}
                    onChange={(e) => setEditingDataset(prev => ({ 
                      ...prev, 
                      tags: e.target.value.split(',').map(t => t.trim()).filter(t => t) 
                    }))}
                    className="w-full px-4 py-2 border-2 border-black rounded-lg font-semibold"
                    placeholder="machine-learning, computer-vision, nlp"
                  />
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleSaveEdit}
                  disabled={actionLoading}
                  className="flex-1 bg-[linear-gradient(90deg,#ffea00,#00ffff)] text-black font-extrabold px-6 py-3 rounded-full border-2 border-black hover:scale-105 transition disabled:opacity-50"
                >
                  {actionLoading ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  onClick={() => setEditingDataset(null)}
                  className="flex-1 bg-gray-200 text-black font-bold px-6 py-3 rounded-full border-2 border-black hover:bg-gray-300 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default DashboardPage
