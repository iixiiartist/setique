import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import {
  Database,
  ShoppingBag,
  DollarSign,
  TrendingUp,
  Download,
  LogOut,
  Home,
  Package,
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
  
  // Stripe Connect state
  const [connectingStripe, setConnectingStripe] = useState(false)
  const [connectError, setConnectError] = useState(null)

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

      window.open(data.downloadUrl, '_blank')
      alert('Download started! Link expires in 24 hours.')
      
      // Refresh download logs
      fetchDashboardData()
    } catch (error) {
      console.error('Download error:', error)
      alert('Error: ' + error.message)
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
              <h3 className="text-2xl font-extrabold mb-4">My Datasets</h3>
              {myDatasets.length > 0 ? (
                <div className="space-y-4">
                  {myDatasets.map((dataset) => (
                    <div
                      key={dataset.id}
                      className="border-2 border-black rounded-xl p-4 bg-yellow-100"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="text-xl font-extrabold">{dataset.title}</h4>
                          <p className="text-sm font-semibold text-black/70 mt-1">
                            {dataset.description}
                          </p>
                        </div>
                        <span
                          className={`px-3 py-1 rounded-full border-2 border-black font-bold text-xs ${
                            dataset.is_active ? 'bg-green-300' : 'bg-gray-300'
                          }`}
                        >
                          {dataset.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <div className="flex gap-4 mt-3 text-sm font-bold">
                        <span>💰 ${dataset.price}</span>
                        <span>📦 {dataset.modality}</span>
                        <span>🛒 {dataset.purchase_count} sales</span>
                        <span>📅 {new Date(dataset.created_at).toLocaleDateString()}</span>
                      </div>
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
                  <h4 className="font-extrabold mb-2">Payout Account</h4>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-semibold">
                        Status: <span className="font-extrabold">{payoutAccount.account_status}</span>
                      </p>
                      <p className="text-sm font-semibold">
                        Payouts {payoutAccount.payouts_enabled ? 'Enabled ✅' : 'Disabled ❌'}
                      </p>
                    </div>
                    {payoutAccount.current_balance >= payoutAccount.minimum_payout_threshold && (
                      <button className="bg-green-300 text-black font-bold px-4 py-2 rounded-full border-2 border-black hover:scale-105 transition">
                        Request Payout
                      </button>
                    )}
                  </div>
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
        </div>
      </main>
    </div>
  )
}

export default DashboardPage
