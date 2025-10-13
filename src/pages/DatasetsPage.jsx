/* eslint-disable react/no-unescaped-entities */
import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { stripePromise } from '../lib/stripe'
import { SignInModal } from '../components/SignInModal'
import FavoriteButton from '../components/FavoriteButton'
import ShareModal from '../components/ShareModal'
import NotificationBell from '../components/NotificationBell'
import { logDatasetPurchased } from '../lib/activityTracking'
import {
  Star,
  Database,
  X,
  Search,
  LogOut,
  User,
  Home,
  Share2,
} from '../components/Icons'

const badgeColors = {
  verified: 'bg-blue-100 text-blue-800 border-blue-800',
  expert: 'bg-purple-100 text-purple-800 border-purple-800',
  master: 'bg-yellow-100 text-yellow-800 border-yellow-800'
};

export default function DatasetsPage() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  // General state
  const [query, setQuery] = useState('')
  const [modality, setModality] = useState('all')
  
  // Beta access state
  const [hasBetaAccess, setHasBetaAccess] = useState(false)

  // Modal state
  const [selected, setSelected] = useState(null)
  const [checkoutIdx, setCheckoutIdx] = useState(null)
  const [isSignInOpen, setSignInOpen] = useState(false)
  const [isProcessing, setProcessing] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [shareModalOpen, setShareModalOpen] = useState(false)
  const [datasetToShare, setDatasetToShare] = useState(null)

  // Data from Supabase
  const [datasets, setDatasets] = useState([])
  const [userPurchases, setUserPurchases] = useState([])

  // Check beta access when user changes
  useEffect(() => {
    const checkBetaAccess = async () => {
      if (!user) {
        setHasBetaAccess(false)
        return
      }

      try {
        const { data, error } = await supabase.rpc('has_beta_access', {
          user_id_param: user.id
        })
        
        if (error) {
          console.error('Beta access check error:', error)
          setHasBetaAccess(false)
        } else {
          setHasBetaAccess(data)
        }
      } catch (error) {
        console.error('Error checking beta access:', error)
        setHasBetaAccess(false)
      }
    }

    checkBetaAccess()
  }, [user])

  // Fetch datasets
  useEffect(() => {
    fetchDatasets()
    if (user) {
      fetchUserPurchases()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const fetchUserPurchases = async () => {
    if (!user) return
    
    try {
      const { data, error } = await supabase
        .from('purchases')
        .select('dataset_id')
        .eq('user_id', user.id)
        .eq('status', 'completed')
      
      if (error) throw error
      setUserPurchases(data.map(p => p.dataset_id))
    } catch (error) {
      console.error('Error fetching user purchases:', error)
    }
  }

  const userOwnsDataset = (datasetId) => {
    return userPurchases.includes(datasetId)
  }

  const fetchDatasets = async () => {
    try {
      // Try with partnerships first
      let { data, error } = await supabase
        .from('datasets')
        .select(
          `
          *,
          profiles:creator_id (username, full_name),
          dataset_partnerships (
            id,
            curator_user_id,
            status,
            pro_curators (
              display_name,
              badge_level
            )
          )
        `
        )
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      // If partnership query fails (table doesn't exist), try without it
      if (error) {
        console.warn('⚠️ Partnership query failed, trying without partnerships:', error.message)
        const simpleQuery = await supabase
          .from('datasets')
          .select(
            `
            *,
            profiles:creator_id (username, full_name)
          `
          )
          .eq('is_active', true)
          .order('created_at', { ascending: false })
        
        data = simpleQuery.data
        error = simpleQuery.error
      }

      if (error) throw error
      setDatasets(data || [])
    } catch (error) {
      console.error('❌ Error fetching datasets:', error)
    }
  }

  const filtered = useMemo(
    () =>
      datasets.filter(
        (d) =>
          (d.title + d.description + d.tags.join(' '))
            .toLowerCase()
            .includes(query.toLowerCase()) &&
          (modality === 'all' || d.tags.some((tag) => tag === modality))
      ),
    [datasets, query, modality]
  )

  useEffect(() => {
    const isModalOpen = selected !== null || checkoutIdx !== null || isSignInOpen
    document.body.style.overflow = isModalOpen ? 'hidden' : 'unset'
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [selected, checkoutIdx, isSignInOpen])

  const handleCheckout = async () => {
    if (!user) {
      setSignInOpen(true)
      return
    }

    // Check if user has beta access
    if (!hasBetaAccess) {
      alert('You need to be approved for beta access to purchase datasets. Check your email for your access code!')
      navigate('/dashboard')
      return
    }

    setProcessing(true)
    try {
      const dataset = datasets[checkoutIdx]

      // Check if user already owns this dataset
      const { data: existingPurchase } = await supabase
        .from('purchases')
        .select('id')
        .eq('user_id', user.id)
        .eq('dataset_id', dataset.id)
        .single()

      if (existingPurchase) {
        alert('You already own this dataset! Check your dashboard to download it.')
        setCheckoutIdx(null)
        setProcessing(false)
        return
      }

      // Handle free datasets differently
      if (dataset.price === 0) {
        // Create purchase record directly for free datasets
        const { error: purchaseError } = await supabase
          .from('purchases')
          .insert([
            {
              user_id: user.id,
              dataset_id: dataset.id,
              amount: 0,
              status: 'completed',
            },
          ])

        if (purchaseError) {
          // Handle duplicate purchase error specifically
          if (purchaseError.code === '23505') {
            alert('You already own this dataset! Check your dashboard to download it.')
          } else {
            throw new Error(purchaseError.message)
          }
          setCheckoutIdx(null)
          setProcessing(false)
          return
        }

        // Log activity for social feed and send notification
        await logDatasetPurchased(user.id, dataset.id, dataset.title, 0, dataset.user_id)

        // Show success message and refresh
        alert(`✅ ${dataset.title} added to your library!`)
        setCheckoutIdx(null)
        setProcessing(false)
        
        // Reload datasets and purchases
        const { data: newDatasets } = await supabase
          .from('datasets')
          .select('*, profiles(username)')
          .order('created_at', { ascending: false })
        if (newDatasets) setDatasets(newDatasets)
        
        // Refresh user purchases to update UI
        fetchUserPurchases()

        return
      }

      // For paid datasets, use Stripe checkout
      const response = await fetch('/.netlify/functions/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          datasetId: dataset.id,
          userId: user.id,
          price: dataset.price,
          title: dataset.title,
          creatorId: dataset.creator_id, // Pass creator ID for Stripe Connect
        }),
      })

      const { sessionId, error } = await response.json()

      if (error) {
        throw new Error(error)
      }

      // Redirect to Stripe Checkout
      const stripe = await stripePromise
      const { error: stripeError } = await stripe.redirectToCheckout({
        sessionId,
      })

      if (stripeError) {
        throw stripeError
      }
    } catch (error) {
      console.error('Error during checkout:', error)
      alert('Error processing payment: ' + error.message)
      setProcessing(false)
      setCheckoutIdx(null)
    }
  }

  const handleSignOut = async () => {
    await signOut()
    setMobileMenuOpen(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-300 via-pink-400 to-cyan-300 text-black font-sans p-4 sm:p-8">
      {/* Header */}
      <header className="flex items-center justify-between mb-12">
        <a
          href="/"
          className="text-4xl sm:text-5xl font-extrabold tracking-tighter text-black bg-[linear-gradient(90deg,#ff00c3,#00ffff,#ffea00)] bg-clip-text text-transparent drop-shadow-[2px_2px_0_#000] no-underline"
        >
          SETIQUE
        </a>
        
        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-4">
          <button
            onClick={() => navigate('/')}
            className="font-bold text-black hover:text-pink-600 transition flex items-center gap-1"
          >
            <Home className="h-4 w-4" />
            Home
          </button>
          <button
            onClick={() => navigate('/bounties')}
            className="font-bold text-black hover:text-pink-600 transition"
          >
            Bounties
          </button>
          {user ? (
            <>
              <button
                onClick={() => navigate('/dashboard')}
                className="font-bold text-black hover:text-cyan-600 transition flex items-center gap-1"
              >
                <User className="h-4 w-4" />
                Dashboard
              </button>
              
              {/* Notification Bell */}
              <NotificationBell />
              
              <button
                onClick={handleSignOut}
                className="font-bold text-black hover:text-pink-600 transition flex items-center gap-1"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            </>
          ) : (
            <button
              onClick={() => setSignInOpen(true)}
              className="font-bold text-black hover:text-pink-600 transition"
            >
              Sign In
            </button>
          )}
        </nav>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="lg:hidden bg-white border-2 border-black rounded-lg p-2 hover:bg-gray-100 transition"
          aria-label="Toggle menu"
        >
          <div className="w-6 h-5 flex flex-col justify-between">
            <span className={`block h-0.5 w-full bg-black transition-all ${mobileMenuOpen ? 'rotate-45 translate-y-2' : ''}`}></span>
            <span className={`block h-0.5 w-full bg-black transition-all ${mobileMenuOpen ? 'opacity-0' : ''}`}></span>
            <span className={`block h-0.5 w-full bg-black transition-all ${mobileMenuOpen ? '-rotate-45 -translate-y-2' : ''}`}></span>
          </div>
        </button>
      </header>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden mb-8 bg-white border-4 border-black rounded-2xl shadow-[8px_8px_0_#000] p-4 space-y-3">
          <button
            onClick={() => {
              navigate('/')
              setMobileMenuOpen(false)
            }}
            className="w-full text-left font-bold text-black hover:text-cyan-600 transition py-2 px-4 rounded hover:bg-gray-50"
          >
            Home
          </button>
          <button
            onClick={() => {
              navigate('/bounties')
              setMobileMenuOpen(false)
            }}
            className="w-full text-left font-bold text-black hover:text-pink-600 transition py-2 px-4 rounded hover:bg-gray-50"
          >
            Bounties
          </button>
          {user ? (
            <>
              <button
                onClick={() => {
                  navigate('/dashboard')
                  setMobileMenuOpen(false)
                }}
                className="w-full text-left font-bold text-black hover:text-cyan-600 transition py-2 px-4 rounded hover:bg-gray-50"
              >
                Dashboard
              </button>
              <button
                onClick={handleSignOut}
                className="w-full text-left font-bold text-black hover:text-pink-600 transition py-2 px-4 rounded hover:bg-gray-50"
              >
                Sign Out
              </button>
            </>
          ) : (
            <button
              onClick={() => {
                setSignInOpen(true)
                setMobileMenuOpen(false)
              }}
              className="w-full text-left font-bold text-black hover:text-pink-600 transition py-2 px-4 rounded hover:bg-gray-50"
            >
              Sign In
            </button>
          )}
        </div>
      )}

      {/* Main Content */}
      {hasBetaAccess ? (
        <section className="max-w-7xl mx-auto">
          <h1 className="text-4xl sm:text-5xl font-extrabold mb-6 text-black drop-shadow-[3px_3px_0_#fff] flex items-center justify-center sm:justify-start gap-3">
            <Database className="h-10 w-10 text-pink-600" /> Dataset Marketplace
          </h1>
          
          {/* Search and Filters */}
          <div className="mb-8 grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
            <div className="md:col-span-6">
              <div className="relative flex items-center">
                <Search className="h-5 w-5 text-black/60 absolute left-4 pointer-events-none" />
                <input
                  className="w-full bg-white border-2 border-black rounded-full py-2.5 pl-11 pr-10 font-semibold shadow-inner"
                  placeholder="Search for anything..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
                {query && (
                  <button
                    onClick={() => setQuery('')}
                    className="absolute right-3 p-1 rounded-full hover:bg-black/10 transition-colors"
                  >
                    <X className="h-4 w-4 text-black/60" />
                  </button>
                )}
              </div>
            </div>
            <div className="md:col-span-3">
              <select
                className="w-full bg-white border-2 border-black rounded-full px-4 py-2.5 font-extrabold appearance-none"
                value={modality}
                onChange={(e) => setModality(e.target.value)}
              >
                <option value="all">All Categories</option>
                <option value="vision">Vision</option>
                <option value="audio">Audio</option>
                <option value="text">Text</option>
                <option value="nlp">NLP</option>
                <option value="video">Video</option>
              </select>
            </div>
            <div className="md:col-span-3 text-center md:text-right">
              <p className="font-bold text-lg">
                {filtered.length} dataset{filtered.length !== 1 ? 's' : ''} found
              </p>
            </div>
          </div>
          
          {/* Datasets Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10">
            {filtered.length > 0 ? (
              filtered.map((d) => (
                <div
                  key={d.id}
                  className={`${d.accent_color} border-4 border-black rounded-3xl shadow-[8px_8px_0_#000] hover:scale-105 transition-transform flex flex-col`}
                >
                  <div className="p-6 pb-2">
                    <h3 className="text-2xl font-extrabold text-black uppercase">
                      {d.title}
                    </h3>
                    {d.dataset_partnerships?.[0]?.pro_curators && d.dataset_partnerships[0].status === 'active' && (
                      <div className="mt-2 flex items-center gap-2">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold border-2 ${badgeColors[d.dataset_partnerships[0].pro_curators.badge_level] || badgeColors.verified}`}>
                          <Star className="w-3 h-3 mr-1 fill-current" />
                          PRO CURATOR
                        </span>
                        <span className="text-xs font-semibold text-black/70">
                          by {d.dataset_partnerships[0].pro_curators.display_name}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="p-6 pt-2 flex flex-col flex-grow">
                    <p className="text-black/80 mb-4 text-sm leading-relaxed font-semibold flex-grow">
                      {d.description}
                    </p>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {d.tags.map((t) => (
                        <span
                          key={t}
                          onClick={() => setModality(t)}
                          className="text-xs font-extrabold px-2 py-1 border-2 border-black rounded-full bg-white cursor-pointer hover:bg-yellow-200 transition-colors"
                        >
                          #{t}
                        </span>
                      ))}
                    </div>
                    
                    {/* Card footer with better layout */}
                    <div className="flex flex-col gap-3 mt-auto">
                      {/* Row 1: Price, status badges, and social actions */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <div className="bg-yellow-400 text-black font-bold border-2 border-black px-3 py-1 rounded-full shadow text-sm">
                            {d.price === 0 ? 'FREE' : `$${d.price}`}
                          </div>
                          {userOwnsDataset(d.id) && (
                            <div className="bg-green-400 text-black font-bold border-2 border-black px-3 py-1 rounded-full shadow text-xs">
                              ✓ Owned
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <FavoriteButton 
                            datasetId={d.id}
                            datasetTitle={d.title}
                            ownerId={d.user_id}
                            initialCount={d.favorite_count || 0}
                            size="sm"
                          />
                          <button
                            onClick={() => {
                              setDatasetToShare(d)
                              setShareModalOpen(true)
                            }}
                            className="p-2 bg-cyan-400 text-black border-2 border-black rounded-full hover:bg-cyan-500 transition active:scale-95"
                            aria-label="Share dataset"
                          >
                            <Share2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      
                      {/* Row 2: Action buttons */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => setSelected(datasets.indexOf(d))}
                          className="bg-white text-black font-extrabold border-2 border-black rounded-full px-4 py-2 hover:bg-yellow-200 text-sm transition-colors active:scale-95 flex-1"
                        >
                          Details
                        </button>
                        {userOwnsDataset(d.id) ? (
                          <button
                            onClick={() => navigate('/dashboard')}
                            className="bg-green-400 text-black font-bold border-2 border-black rounded-full px-4 py-2 hover:bg-green-300 text-sm transition-colors active:scale-95 flex-1"
                          >
                            View in Library
                          </button>
                        ) : !user ? (
                          <button
                            onClick={() => setSignInOpen(true)}
                            className="bg-[linear-gradient(90deg,#00ffff,#ff00c3)] text-white font-bold border-2 border-black rounded-full px-4 py-2 hover:opacity-90 text-sm transition-opacity active:scale-95 flex-1"
                          >
                            Sign Up to Buy
                          </button>
                        ) : !hasBetaAccess ? (
                          <button
                            onClick={() => navigate('/dashboard')}
                            className="bg-yellow-400 text-black font-bold border-2 border-black rounded-full px-4 py-2 hover:bg-yellow-300 text-sm transition-colors active:scale-95 flex-1"
                          >
                            Get Beta Access
                          </button>
                        ) : (
                          <button
                            onClick={() => setCheckoutIdx(datasets.indexOf(d))}
                            className="bg-[linear-gradient(90deg,#00ffff,#ff00c3)] text-white font-bold border-2 border-black rounded-full px-4 py-2 hover:opacity-90 text-sm transition-opacity active:scale-95 flex-1"
                          >
                            {d.price === 0 ? 'Get Free' : 'Buy Now'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="md:col-span-3 text-center font-bold text-xl text-black/70 py-10 bg-black/5 rounded-2xl border-2 border-black border-dashed">
                <h3>No datasets found. An opportunity for a curator?</h3>
                <p className="text-sm font-normal mt-2">
                  If you can't find it, it's because the right expert hasn't
                  created it yet. That could be you.
                </p>
              </div>
            )}
          </div>
        </section>
      ) : (
        <section className="max-w-4xl mx-auto">
          <h1 className="text-4xl sm:text-5xl font-extrabold mb-6 text-black drop-shadow-[3px_3px_0_#fff] flex items-center justify-center sm:justify-start gap-3">
            <Database className="h-10 w-10 text-pink-600" /> Dataset Marketplace
          </h1>
          <div className="bg-gradient-to-br from-yellow-50 to-pink-50 border-4 border-black rounded-3xl shadow-[8px_8px_0_#000] p-12 text-center">
            <div className="text-6xl mb-4">🔒</div>
            <h2 className="text-3xl font-extrabold text-black mb-4">
              Beta Access Required
            </h2>
            <p className="text-lg font-semibold text-black/70 mb-6 max-w-2xl mx-auto">
              The marketplace is currently in private beta. {user ? 'Your beta access request is being reviewed!' : 'Sign up to join the waiting list and get early access.'}
            </p>
            {user ? (
              <button
                onClick={() => navigate('/dashboard')}
                className="bg-[linear-gradient(90deg,#ff00c3,#00ffff)] text-white font-bold border-2 border-black rounded-full px-8 py-3 hover:opacity-90 transition-opacity text-lg"
              >
                Go to Dashboard
              </button>
            ) : (
              <button
                onClick={() => setSignInOpen(true)}
                className="bg-[linear-gradient(90deg,#ff00c3,#00ffff)] text-white font-bold border-2 border-black rounded-full px-8 py-3 hover:opacity-90 transition-opacity text-lg"
              >
                Sign Up for Beta
              </button>
            )}
          </div>
        </section>
      )}

      {/* Dataset Detail Modal */}
      {selected !== null && datasets[selected] && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto"
          onClick={() => setSelected(null)}
        >
          <div
            className="bg-white border-4 border-black rounded-3xl shadow-[12px_12px_0_#000] p-8 max-w-2xl w-full my-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-3xl font-extrabold text-black">
                {datasets[selected].title}
              </h2>
              <button
                onClick={() => setSelected(null)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <h3 className="font-bold text-lg mb-2">Description</h3>
                <p className="text-black/80">{datasets[selected].description}</p>
              </div>
              <div>
                <h3 className="font-bold text-lg mb-2">Categories</h3>
                <div className="flex flex-wrap gap-2">
                  {datasets[selected].tags.map((t) => (
                    <span
                      key={t}
                      className="text-sm font-bold px-3 py-1 border-2 border-black rounded-full bg-yellow-200"
                    >
                      #{t}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="font-bold text-lg mb-2">Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-black/60">Price</p>
                    <p className="font-bold text-lg">
                      {datasets[selected].price === 0
                        ? 'FREE'
                        : `$${datasets[selected].price}`}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-black/60">File Size</p>
                    <p className="font-bold text-lg">{datasets[selected].file_size_mb} MB</p>
                  </div>
                </div>
              </div>
              <div className="pt-4 border-t-2 border-black">
                {userOwnsDataset(datasets[selected].id) ? (
                  <button
                    onClick={() => navigate('/dashboard')}
                    className="w-full bg-green-400 text-black font-bold border-2 border-black rounded-full px-6 py-3 hover:bg-green-300 transition-colors"
                  >
                    View in Library
                  </button>
                ) : !user ? (
                  <button
                    onClick={() => {
                      setSelected(null)
                      setSignInOpen(true)
                    }}
                    className="w-full bg-[linear-gradient(90deg,#00ffff,#ff00c3)] text-white font-bold border-2 border-black rounded-full px-6 py-3 hover:opacity-90 transition-opacity"
                  >
                    Sign Up to Buy
                  </button>
                ) : !hasBetaAccess ? (
                  <button
                    onClick={() => navigate('/dashboard')}
                    className="w-full bg-yellow-400 text-black font-bold border-2 border-black rounded-full px-6 py-3 hover:bg-yellow-300 transition-colors"
                  >
                    Get Beta Access
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setCheckoutIdx(selected)
                      setSelected(null)
                    }}
                    className="w-full bg-[linear-gradient(90deg,#00ffff,#ff00c3)] text-white font-bold border-2 border-black rounded-full px-6 py-3 hover:opacity-90 transition-opacity"
                  >
                    {datasets[selected].price === 0 ? 'Get Free' : 'Buy Now'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Checkout Confirmation Modal */}
      {checkoutIdx !== null && datasets[checkoutIdx] && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => !isProcessing && setCheckoutIdx(null)}
        >
          <div
            className="bg-white border-4 border-black rounded-3xl shadow-[12px_12px_0_#000] p-8 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-2xl font-extrabold mb-4">
              {datasets[checkoutIdx].price === 0 ? 'Get Dataset' : 'Purchase Dataset'}
            </h2>
            <p className="mb-6 text-black/80">
              {datasets[checkoutIdx].price === 0
                ? `Are you sure you want to add "${datasets[checkoutIdx].title}" to your library?`
                : `You're about to purchase "${datasets[checkoutIdx].title}" for $${datasets[checkoutIdx].price}.`}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setCheckoutIdx(null)}
                disabled={isProcessing}
                className="flex-1 bg-white text-black font-bold border-2 border-black rounded-full px-6 py-3 hover:bg-gray-100 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCheckout}
                disabled={isProcessing}
                className="flex-1 bg-[linear-gradient(90deg,#00ffff,#ff00c3)] text-white font-bold border-2 border-black rounded-full px-6 py-3 hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {isProcessing ? 'Processing...' : datasets[checkoutIdx].price === 0 ? 'Get It' : 'Continue'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sign In Modal */}
      <SignInModal isOpen={isSignInOpen} onClose={() => setSignInOpen(false)} />

      {/* Share Modal */}
      {shareModalOpen && datasetToShare && (
        <ShareModal
          isOpen={shareModalOpen}
          onClose={() => {
            setShareModalOpen(false)
            setDatasetToShare(null)
          }}
          dataset={datasetToShare}
        />
      )}
    </div>
  )
}
