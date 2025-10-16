import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { logger, handleSupabaseError } from '../lib/logger'
import { fetchUserPurchases as fetchPurchases } from '../lib/purchases'
import { checkBetaAccess as checkBeta } from '../lib/betaAccess'
import { handleDatasetCheckout, refreshDatasetsAfterPurchase } from '../lib/checkout'
import { SignInModal } from '../components/SignInModal'
import { BountySubmissionModal } from '../components/BountySubmissionModal'
import FeedbackModal from '../components/FeedbackModal'
import ShareModal from '../components/ShareModal'
import NotificationBell from '../components/NotificationBell'
import {
  Star,
  Zap,
  X,
  Archive,
  CircleDollarSign,
  BrainCircuit,
  LogOut,
  User,
} from '../components/Icons'

function HomePage() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  // Beta access state
  const [hasBetaAccess, setHasBetaAccess] = useState(false)

  // Modal state
  const [selected, setSelected] = useState(null)
  const [selectedBounty, setSelectedBounty] = useState(null)
  const [submissionBounty, setSubmissionBounty] = useState(null)
  const [checkoutIdx, setCheckoutIdx] = useState(null)
  const [isSignInOpen, setSignInOpen] = useState(false)
  const [isProcessing, setProcessing] = useState(false)
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [shareModalOpen, setShareModalOpen] = useState(false)
  const [datasetToShare, setDatasetToShare] = useState(null)
  
  // Check URL parameters for auth modal (supports /login and /signup routes)
  useEffect(() => {
    if (searchParams.get('signin') === 'true' || searchParams.get('signup') === 'true') {
      setSignInOpen(true)
    }
  }, [searchParams])
  
  // Check beta access when user changes
  useEffect(() => {
    const loadBetaAccess = async () => {
      if (!user) {
        setHasBetaAccess(false)
        return
      }

      const hasAccess = await checkBeta(user.id)
      setHasBetaAccess(hasAccess)
    }

    loadBetaAccess()
  }, [user])

  // Beta banner state
  const [showBetaBanner, setShowBetaBanner] = useState(() => {
    // Check localStorage to see if user dismissed banner
    const dismissed = localStorage.getItem('betaBannerDismissed')
    return dismissed !== 'true'
  })
  
  const dismissBetaBanner = () => {
    localStorage.setItem('betaBannerDismissed', 'true')
    setShowBetaBanner(false)
  }

  // Data from Supabase
  const [datasets, setDatasets] = useState([])
  const [userPurchases, setUserPurchases] = useState([])

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
    
    const purchases = await fetchPurchases(user.id)
    setUserPurchases(purchases)
  }

  const userOwnsDataset = (datasetId) => {
    return userPurchases.includes(datasetId)
  }

  const fetchDatasets = async () => {
    try {
      // Fetch top 5 datasets by favorite count for featured section
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
        .order('favorite_count', { ascending: false })
        .limit(5)

      // If partnership query fails (table doesn't exist), try without it
      if (error) {
        logger.warn('⚠️ Partnership query failed, trying without partnerships:', error.message)
        const simpleQuery = await supabase
          .from('datasets')
          .select(
            `
            *,
            profiles:creator_id (username, full_name)
          `
          )
          .eq('is_active', true)
          .order('favorite_count', { ascending: false })
          .limit(5)
        
        data = simpleQuery.data
        error = simpleQuery.error
      }

      if (error) throw error
      setDatasets(data || [])
    } catch (error) {
      handleSupabaseError(error, 'fetchDatasets')
    }
  }

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

    setProcessing(true)
    
    const result = await handleDatasetCheckout({
      user,
      dataset: datasets[checkoutIdx],
      hasBetaAccess,
      fetchUserPurchases,
      onNavigate: navigate
    })

    // Handle result
    if (!result.success) {
      if (result.requiresAuth) {
        setSignInOpen(true)
      } else {
        alert(result.message)
      }
      setCheckoutIdx(null)
      setProcessing(false)
      return
    }

    // Success handling
    if (result.isFree) {
      alert(result.message)
      setCheckoutIdx(null)
      setProcessing(false)
      
      // Refresh datasets if needed
      if (result.shouldRefreshDatasets) {
        await refreshDatasetsAfterPurchase(setDatasets)
      }
    }
    // For paid datasets, user will be redirected to Stripe (processing state persists)
  }


  const handleSignOut = async () => {
    await signOut()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-300 via-pink-400 to-cyan-300 text-black font-sans p-4 sm:p-8 overflow-x-hidden relative">
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,white,transparent_70%)] animate-pulse pointer-events-none -z-10" />

      {/* Beta Banner */}
      {showBetaBanner && (
        <div className="bg-gradient-to-r from-yellow-300 to-pink-300 border-4 border-black rounded-2xl shadow-[6px_6px_0_#000] p-4 mb-6 max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-2xl">🚧</span>
                <span className="font-extrabold text-lg">BETA VERSION</span>
              </div>
              <p className="text-sm font-semibold">
                Platform in active development. All transactions are live and real. 
                  <a 
                    href="mailto:info@setique.com" 
                  className="underline ml-1 hover:text-cyan-600 transition"
                >
                  Report issues or share feedback
                </a>
              </p>
            </div>
            <button
              onClick={dismissBetaBanner}
              className="bg-white hover:bg-gray-100 border-2 border-black rounded-full p-2 transition hover:scale-110 flex-shrink-0"
              aria-label="Dismiss beta banner"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      <header className="flex items-center justify-between mb-12">
        <a
          href="#"
          className="text-4xl sm:text-5xl font-extrabold tracking-tighter text-black bg-[linear-gradient(90deg,#ff00c3,#00ffff,#ffea00)] bg-clip-text text-transparent drop-shadow-[2px_2px_0_#000] no-underline"
        >
          SETIQUE
        </a>
        
        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-4">
          <button
            onClick={() => navigate('/datasets')}
            className="font-bold text-black hover:text-pink-600 transition"
          >
            Datasets
          </button>
          <button
            onClick={() => navigate('/bounties')}
            className="font-bold text-black hover:text-pink-600 transition"
          >
            Bounties
          </button>
          <button
            onClick={() => navigate('/resources')}
            className="font-bold text-black hover:text-pink-600 transition"
          >
            Resources
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
          <button
            onClick={() => setFeedbackModalOpen(true)}
            className="bg-cyan-400 hover:bg-cyan-300 text-black font-extrabold px-4 py-2 rounded-full border-2 border-black shadow-[3px_3px_0_#000] hover:shadow-[4px_4px_0_#000] transition-all text-sm flex items-center gap-2"
            aria-label="Send beta feedback"
          >
            <span className="text-lg">💬</span>
            <span>Feedback</span>
          </button>
          <a
            href="#pro-curator"
            className="bg-[linear-gradient(90deg,#ff00c3,#00ffff)] text-white font-bold hover:opacity-90 transition px-5 py-2 rounded-full shadow-lg border-2 border-black text-sm active:scale-95"
          >
            Pro Curator
          </a>
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
              setMobileMenuOpen(false)
              navigate('/datasets')
            }}
            className="w-full text-left block font-bold text-black hover:text-pink-600 transition py-2"
          >
            Datasets
          </button>
          <button
            onClick={() => {
              setMobileMenuOpen(false)
              navigate('/bounties')
            }}
            className="w-full text-left block font-bold text-black hover:text-pink-600 transition py-2"
          >
            Bounties
          </button>
          <button
            onClick={() => {
              setMobileMenuOpen(false)
              navigate('/resources')
            }}
            className="w-full text-left block font-bold text-black hover:text-pink-600 transition py-2"
          >
            Resources
          </button>
          {user ? (
            <>
              <button
                onClick={() => {
                  setMobileMenuOpen(false)
                  navigate('/dashboard')
                }}
                className="w-full text-left font-bold text-black hover:text-cyan-600 transition flex items-center gap-2 py-2"
              >
                <User className="h-4 w-4" />
                Dashboard
              </button>
              <button
                onClick={() => {
                  setMobileMenuOpen(false)
                  handleSignOut()
                }}
                className="w-full text-left font-bold text-black hover:text-pink-600 transition flex items-center gap-2 py-2"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            </>
          ) : (
            <button
              onClick={() => {
                setMobileMenuOpen(false)
                setSignInOpen(true)
              }}
              className="w-full text-left font-bold text-black hover:text-pink-600 transition py-2"
            >
              Sign In
            </button>
          )}
          <button
            onClick={() => {
              setMobileMenuOpen(false)
              setFeedbackModalOpen(true)
            }}
            className="w-full bg-cyan-400 hover:bg-cyan-300 text-black font-extrabold px-4 py-2 rounded-full border-2 border-black shadow-[3px_3px_0_#000] transition-all text-sm flex items-center justify-center gap-2"
          >
            <span className="text-lg">💬</span>
            Feedback
          </button>
          <a
            href="#pro-curator"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-center bg-[linear-gradient(90deg,#ff00c3,#00ffff)] text-white font-bold hover:opacity-90 transition px-5 py-2 rounded-full shadow-lg border-2 border-black text-sm"
          >
            Pro Curator
          </a>
        </div>
      )}

      <main>
        <section id="hero" className="text-center max-w-5xl mx-auto mb-16">
          <h2 className="text-5xl md:text-8xl font-extrabold mb-6 leading-tight text-black drop-shadow-[4px_4px_0_#fff]">
            Unique Data.
            <br /> Better AI.
          </h2>
          <p className="text-lg sm:text-2xl text-black/80 font-semibold mb-12">
            A marketplace where creators monetize niche expertise and AI builders
            discover unique datasets. Turn your specialized knowledge into revenue or find
            cross-domain data that gives your AI the edge.
          </p>
        </section>

        <section id="philosophy" className="max-w-5xl mx-auto mb-24">
          <div className="bg-white/30 p-8 rounded-3xl border-4 border-black shadow-[8px_8px_0_#000]">
            <h3 className="text-3xl font-extrabold text-center mb-2">
              Our Philosophy
            </h3>
            <p className="text-center font-semibold text-xl text-black/80">
              We believe the future of AI should be built on rich, diverse, and wonderfully
              specific knowledge captured by real people. We&apos;re democratizing data by
              <strong> empowering creators</strong> to monetize their expertise AND
              <strong> enabling builders</strong> to discover datasets that matter. A thriving
              community where everyone benefits.
            </p>
          </div>
        </section>

        <section id="how-it-works" className="max-w-6xl mx-auto mb-24">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div className="bg-white/30 p-8 rounded-3xl border-4 border-black shadow-[8px_8px_0_#000]">
              <Archive className="h-16 w-16 text-pink-600 mx-auto mb-4" />
              <h3 className="text-2xl font-extrabold mb-2">1. Share Your Expertise</h3>
              <p className="font-semibold text-black/70">
                Creators: Package your unique knowledge—rare images, specialized audio, handwriting samples,
                niche datasets. Buyers: Browse and discover datasets across all domains for your AI projects.
              </p>
            </div>
            <div className="bg-white/30 p-8 rounded-3xl border-4 border-black shadow-[8px_8px_0_#000]">
              <CircleDollarSign className="h-16 w-16 text-cyan-500 mx-auto mb-4" />
              <h3 className="text-2xl font-extrabold mb-2">2. Set Your Price & Earn Revenue</h3>
              <p className="font-semibold text-black/70">
                Set your own pricing and earn 80% revenue share on every sale—ongoing passive income. 
                Pro Curators can partner to enhance quality, earning 40% of the creator&apos;s share. Build your reputation and grow.
              </p>
            </div>
            <div className="bg-white/30 p-8 rounded-3xl border-4 border-black shadow-[8px_8px_0_#000]">
              <BrainCircuit className="h-16 w-16 text-yellow-400 mx-auto mb-4" />
              <h3 className="text-2xl font-extrabold mb-2">3. Grow Together</h3>
              <p className="font-semibold text-black/70">
                Creators earn ongoing income from specialized knowledge. AI builders discover
                unique data that improves their models. Join a community democratizing data for everyone.
              </p>
            </div>
          </div>
        </section>

        {/* Pro Curator Program Section */}
        <section id="pro-curator" className="max-w-6xl mx-auto mb-24 pt-10">
          <div className="bg-gradient-to-br from-purple-100 via-pink-100 to-yellow-100 border-4 border-black rounded-3xl shadow-[12px_12px_0_#000] overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-yellow-500 p-8 border-b-4 border-black text-center">
              <div className="flex items-center justify-center gap-3 mb-3">
                <Star className="h-10 w-10 text-yellow-300 fill-yellow-300" />
                <h3 className="text-4xl md:text-5xl font-extrabold text-white drop-shadow-[3px_3px_0_#000]">
                  Pro Curator Program
                </h3>
                <Star className="h-10 w-10 text-yellow-300 fill-yellow-300" />
              </div>
              <p className="text-xl font-bold text-white/90 max-w-3xl mx-auto">
                Partner with data owners, apply your expertise, and earn 50/50 revenue splits on professionally curated datasets for ongoing passive income
              </p>
            </div>

            <div className="p-8">
              {/* Value Proposition Cards */}
              <div className="grid md:grid-cols-3 gap-6 mb-10">
                <div className="bg-white border-3 border-black rounded-2xl p-6 shadow-[4px_4px_0_#000]">
                  <div className="text-4xl mb-3">🎯</div>
                  <h4 className="text-xl font-extrabold mb-2 text-black">Expert Recognition</h4>
                  <p className="font-semibold text-black/70 text-sm">
                    Earn Pro Curator certification and verified badges (Verified → Expert → Master) as you complete projects and build your reputation on the platform.
                  </p>
                </div>
                <div className="bg-white border-3 border-black rounded-2xl p-6 shadow-[4px_4px_0_#000]">
                  <div className="text-4xl mb-3">💰</div>
                  <h4 className="text-xl font-extrabold mb-2 text-black">Fair Revenue Split</h4>
                  <p className="font-semibold text-black/70 text-sm">
                    Earn 40% of every dataset sale in a 50/50 split with the creator. No upfront costs, no hourly limits—just ongoing passive income from quality work.
                  </p>
                </div>
                <div className="bg-white border-3 border-black rounded-2xl p-6 shadow-[4px_4px_0_#000]">
                  <div className="text-4xl mb-3">🤝</div>
                  <h4 className="text-xl font-extrabold mb-2 text-black">Choose Your Projects</h4>
                  <p className="font-semibold text-black/70 text-sm">
                    Browse curation requests (bounties), submit competitive proposals, and partner with data owners who need your specific domain expertise.
                  </p>
                </div>
              </div>

              {/* How It Works */}
              <div className="bg-white border-3 border-black rounded-2xl p-8 mb-8 shadow-[4px_4px_0_#000]">
                <h4 className="text-2xl font-extrabold mb-6 text-center text-black">How It Works</h4>
                <div className="grid md:grid-cols-4 gap-6">
                  <div className="text-center">
                    <div className="bg-indigo-100 border-2 border-black rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3 font-extrabold text-2xl text-indigo-600">
                      1
                    </div>
                    <h5 className="font-extrabold text-sm mb-2">Apply for Certification</h5>
                    <p className="text-xs font-semibold text-black/70">
                      Complete your profile with specialties, bio, and portfolio samples to get started
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="bg-pink-100 border-2 border-black rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3 font-extrabold text-2xl text-pink-600">
                      2
                    </div>
                    <h5 className="font-extrabold text-sm mb-2">Browse Opportunities</h5>
                    <p className="text-xs font-semibold text-black/70">
                      View curation requests (bounties) from data owners seeking expert help
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="bg-yellow-100 border-2 border-black rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3 font-extrabold text-2xl text-yellow-600">
                      3
                    </div>
                    <h5 className="font-extrabold text-sm mb-2">Submit Proposals</h5>
                    <p className="text-xs font-semibold text-black/70">
                      Pitch your approach, timeline, and pricing for each project you want to win
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="bg-green-100 border-2 border-black rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3 font-extrabold text-2xl text-green-600">
                      4
                    </div>
                    <h5 className="font-extrabold text-sm mb-2">Earn Passively</h5>
                    <p className="text-xs font-semibold text-black/70">
                      Get 40% of every sale automatically—forever
                    </p>
                  </div>
                </div>
              </div>

              {/* Specialties */}
              <div className="bg-gradient-to-r from-cyan-50 to-pink-50 border-3 border-black rounded-2xl p-6 mb-8">
                <h4 className="text-xl font-extrabold mb-4 text-black">Specialties We Need:</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-white border-2 border-black rounded-lg p-3 text-center">
                    <div className="text-2xl mb-1">✍️</div>
                    <div className="text-xs font-extrabold">Handwritten Text</div>
                  </div>
                  <div className="bg-white border-2 border-black rounded-lg p-3 text-center">
                    <div className="text-2xl mb-1">🎵</div>
                    <div className="text-xs font-extrabold">Audio Transcription</div>
                  </div>
                  <div className="bg-white border-2 border-black rounded-lg p-3 text-center">
                    <div className="text-2xl mb-1">🎬</div>
                    <div className="text-xs font-extrabold">Video Annotation</div>
                  </div>
                  <div className="bg-white border-2 border-black rounded-lg p-3 text-center">
                    <div className="text-2xl mb-1">🖼️</div>
                    <div className="text-xs font-extrabold">Image Labeling</div>
                  </div>
                  <div className="bg-white border-2 border-black rounded-lg p-3 text-center">
                    <div className="text-2xl mb-1">📝</div>
                    <div className="text-xs font-extrabold">Text Classification</div>
                  </div>
                  <div className="bg-white border-2 border-black rounded-lg p-3 text-center">
                    <div className="text-2xl mb-1">📡</div>
                    <div className="text-xs font-extrabold">Sensor Data</div>
                  </div>
                  <div className="bg-white border-2 border-black rounded-lg p-3 text-center">
                    <div className="text-2xl mb-1">💹</div>
                    <div className="text-xs font-extrabold">Financial Data</div>
                  </div>
                  <div className="bg-white border-2 border-black rounded-lg p-3 text-center">
                    <div className="text-2xl mb-1">🏥</div>
                    <div className="text-xs font-extrabold">Medical Imaging</div>
                  </div>
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                {user ? (
                  <>
                    <button
                      onClick={() => navigate('/dashboard?tab=pro-curator')}
                      className="bg-indigo-600 text-white font-extrabold px-8 py-4 rounded-full border-3 border-black shadow-[6px_6px_0_#000] hover:translate-y-1 hover:shadow-[3px_3px_0_#000] transition text-lg"
                    >
                      Apply to Become a Pro Curator
                    </button>
                    <button
                      onClick={() => navigate('/marketplace')}
                      className="bg-white text-black font-extrabold px-8 py-4 rounded-full border-3 border-black shadow-[6px_6px_0_#000] hover:translate-y-1 hover:shadow-[3px_3px_0_#000] transition text-lg"
                    >
                      Browse Curation Requests
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setSignInOpen(true)}
                    className="bg-indigo-600 text-white font-extrabold px-8 py-4 rounded-full border-3 border-black shadow-[6px_6px_0_#000] hover:translate-y-1 hover:shadow-[3px_3px_0_#000] transition text-lg"
                  >
                    Sign In to Apply
                  </button>
                )}
              </div>

              {/* Stats Teaser */}
              <div className="mt-8 pt-6 border-t-2 border-black/20">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-3xl font-extrabold text-purple-600">50%</div>
                    <div className="text-xs font-bold text-black/70">Revenue Split</div>
                  </div>
                  <div>
                    <div className="text-3xl font-extrabold text-pink-600">∞</div>
                    <div className="text-xs font-bold text-black/70">Passive Income</div>
                  </div>
                  <div>
                    <div className="text-3xl font-extrabold text-yellow-600">3</div>
                    <div className="text-xs font-bold text-black/70">Badge Levels</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Toolkit */}
        <section id="toolkit" className="max-w-5xl mx-auto mb-24 text-center pt-10">
          <h3 className="text-5xl font-extrabold mb-6 text-black drop-shadow-[3px_3px_0_#fff] flex items-center justify-center gap-3">
            <Zap className="h-10 w-10 text-yellow-400" /> Creator Toolkit
          </h3>
          <p className="text-black/80 max-w-2xl mx-auto mb-8 font-semibold">
            Power up your workflow with the SETIQUE API. Programmatically upload
            datasets from your apps and scripts, automate your data publishing,
            and earn passive income at scale.
          </p>
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault()
              alert('API Docs coming soon!')
            }}
            className="inline-block bg-[linear-gradient(90deg,#ff00c3,#00ffff,#ffea00)] text-black font-extrabold text-lg px-12 py-6 rounded-full border-4 border-black hover:scale-110 transition-transform shadow-xl active:scale-100"
          >
            Explore the API
          </a>
        </section>
      </main>

      <footer className="text-center text-black font-bold mt-8 text-sm bg-yellow-300 border-t-4 border-black py-4">
        © {new Date().getFullYear()} SETIQUE — Unique Data. Better AI.
      </footer>

      {/* Modals */}
      <SignInModal isOpen={isSignInOpen} onClose={() => setSignInOpen(false)} />

      {checkoutIdx !== null && datasets[checkoutIdx] && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="modal-backdrop absolute inset-0 bg-black/50"
            onClick={() => !isProcessing && setCheckoutIdx(null)}
          />
          <div className="modal-panel relative bg-white text-black max-w-md w-full border-4 border-black rounded-3xl shadow-[12px_12px_0_#000] p-6 z-10">
            <button
              className="absolute top-3 right-3 border-2 border-black rounded-full p-1 bg-yellow-300 active:scale-95"
              onClick={() => !isProcessing && setCheckoutIdx(null)}
            >
              <X className="h-5 w-5" />
            </button>
            <h4 className="text-2xl font-extrabold mb-2">
              {datasets[checkoutIdx].price === 0 ? 'Get Free Dataset' : 'Checkout'}
            </h4>
            {isProcessing ? (
              <div className="text-center py-10">
                <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-black mx-auto"></div>
                <p className="font-bold mt-4">
                  {datasets[checkoutIdx].price === 0 ? 'Adding to your library...' : 'Processing Payment...'}
                </p>
              </div>
            ) : (
              <div>
                <p className="font-semibold mb-4">
                  {datasets[checkoutIdx].title}
                </p>
                <div className="flex items-center justify-between mb-6">
                  <span className="font-extrabold">
                    {datasets[checkoutIdx].price === 0 ? 'Price' : 'Total'}
                  </span>
                  <span className="font-extrabold">
                    {datasets[checkoutIdx].price === 0 ? 'FREE' : `$${datasets[checkoutIdx].price}`}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    className="bg-[linear-gradient(90deg,#00ffff,#ff00c3)] text-white font-bold border-2 border-black rounded-full px-6 py-2 active:scale-95"
                    onClick={handleCheckout}
                  >
                    {datasets[checkoutIdx].price === 0 ? 'Get Free Dataset' : `Pay $${datasets[checkoutIdx].price}`}
                  </button>
                  <button
                    className="border-2 border-black bg-yellow-200 text-black font-bold rounded-full px-6 py-2 active:scale-95"
                    onClick={() => setCheckoutIdx(null)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {selected !== null && datasets[selected] && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="modal-backdrop absolute inset-0 bg-black/50"
            onClick={() => setSelected(null)}
          />
          <div className="modal-panel relative bg-white text-black max-w-2xl w-full border-4 border-black rounded-3xl shadow-[12px_12px_0_#000] p-6 z-10 max-h-[90vh] overflow-y-auto">
            <button
              className="absolute top-3 right-3 border-2 border-black rounded-full p-1 bg-yellow-300 active:scale-95"
              onClick={() => setSelected(null)}
            >
              <X className="h-5 w-5" />
            </button>
            <h4 className="text-3xl font-extrabold mb-2">
              {datasets[selected].title}
            </h4>
            <p className="text-black/80 font-semibold mb-4">
              {datasets[selected].description}
            </p>
            {datasets[selected].schema_fields && (
              <div>
                <div className="mb-4">
                  <div className="font-extrabold mb-1">Schema</div>
                  <div className="flex flex-wrap gap-2">
                    {datasets[selected].schema_fields.map((f) => (
                      <span
                        key={f}
                        className="text-xs font-extrabold px-2 py-1 border-2 border-black rounded-full bg-yellow-200"
                      >
                        {f}
                      </span>
                    ))}
                  </div>
                </div>
                {datasets[selected].sample_data && (
                  <div className="bg-black text-yellow-200 font-mono text-xs p-3 rounded-md border-2 border-black mb-4 whitespace-pre-wrap">
                    {datasets[selected].sample_data}
                  </div>
                )}
                {datasets[selected].notes && (
                  <div className="text-sm font-bold mb-6">
                    {datasets[selected].notes}
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="bg-yellow-400 text-black font-bold border-2 border-black px-3 py-1 rounded-full">
                      {datasets[selected].price === 0 ? 'FREE' : `$${datasets[selected].price}`}
                    </div>
                    {userOwnsDataset(datasets[selected].id) && (
                      <div className="bg-green-400 text-black font-bold border-2 border-black px-3 py-1 rounded-full text-sm">
                        ✓ You own this
                      </div>
                    )}
                  </div>
                  {userOwnsDataset(datasets[selected].id) ? (
                    <button
                      className="bg-green-400 text-black font-bold border-2 border-black rounded-full px-6 py-2 hover:bg-green-300 active:scale-95"
                      onClick={() => {
                        setSelected(null)
                        navigate('/dashboard')
                      }}
                    >
                      View in Library
                    </button>
                  ) : (
                    <button
                      className="bg-[linear-gradient(90deg,#00ffff,#ff00c3)] text-white font-bold border-2 border-black rounded-full px-6 py-2 active:scale-95"
                      onClick={() => {
                        setSelected(null)
                        setCheckoutIdx(selected)
                      }}
                    >
                      {datasets[selected].price === 0 ? 'Get Free' : 'Buy Now'}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Bounty Detail Modal */}
      {selectedBounty && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="modal-backdrop absolute inset-0 bg-black/50"
            onClick={() => setSelectedBounty(null)}
          />
          <div className="modal-panel relative bg-gradient-to-br from-yellow-200 via-pink-200 to-cyan-200 text-black max-w-2xl w-full border-4 border-black rounded-3xl shadow-[12px_12px_0_#000] p-6 z-10 max-h-[90vh] overflow-y-auto">
            <button
              className="absolute top-3 right-3 border-2 border-black rounded-full p-1 bg-yellow-300 active:scale-95 hover:bg-yellow-400 transition"
              onClick={() => setSelectedBounty(null)}
            >
              <X className="h-5 w-5" />
            </button>
            
            {/* Bounty Header */}
            <div className="mb-4">
              <h4 className="text-3xl font-extrabold mb-2">
                {selectedBounty.title}
              </h4>
              <div className="flex items-center gap-2 text-sm font-semibold text-black/70">
                <span>
                  Posted by {selectedBounty.profiles?.username || 'Anonymous'}
                </span>
                <span>•</span>
                <span>
                  {new Date(selectedBounty.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>

            {/* Budget Display */}
            <div className="bg-white border-2 border-black rounded-xl p-4 mb-4">
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-sm font-bold text-black/60 uppercase">Budget Range</div>
                  <div className="text-4xl font-extrabold">${selectedBounty.budget_min || 0} - ${selectedBounty.budget_max || 0}</div>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="mb-4">
              <h5 className="font-extrabold text-lg mb-2">📋 Description</h5>
              <div className="bg-white/80 border-2 border-black rounded-xl p-4">
                <p className="font-semibold text-black/80 whitespace-pre-wrap">
                  {selectedBounty.description}
                </p>
              </div>
            </div>

            {/* Specialties */}
            {selectedBounty.specialties_needed && selectedBounty.specialties_needed.length > 0 && (
              <div className="mb-4">
                <h5 className="font-extrabold text-lg mb-2">🏷️ Specialties</h5>
                <div className="flex flex-wrap gap-2">
                  {selectedBounty.specialties_needed.map((specialty, idx) => (
                    <span
                      key={idx}
                      className="text-xs font-extrabold px-3 py-1 border-2 border-black rounded-full bg-pink-200"
                    >
                      #{specialty}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Requirements */}
            <div className="mb-6">
              <h5 className="font-extrabold text-lg mb-2">✅ Requirements</h5>
              <div className="bg-white/80 border-2 border-black rounded-xl p-4 space-y-2">
                <div className="flex items-start gap-2">
                  <span className="text-lg">🎯</span>
                  <span className="font-semibold text-sm">
                    Quality Level: <strong>{selectedBounty.target_quality || 'standard'}</strong>
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-lg">�</span>
                  <span className="font-semibold text-sm">
                    Payment: <strong>${selectedBounty.budget_min || 0} - ${selectedBounty.budget_max || 0} upon approval</strong>
                  </span>
                </div>
              </div>
            </div>

            {/* CTA Button */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  if (!user) {
                    setSelectedBounty(null)
                    setSignInOpen(true)
                    return
                  }
                  // Open submission modal
                  setSubmissionBounty(selectedBounty)
                }}
                className="flex-1 bg-[linear-gradient(90deg,#00ffff,#ff00c3)] text-white font-extrabold border-2 border-black rounded-full px-6 py-3 hover:opacity-90 active:scale-95 transition"
              >
                Submit Proposal
              </button>
              <button
                onClick={() => setSelectedBounty(null)}
                className="border-2 border-black bg-white text-black font-bold rounded-full px-6 py-3 hover:bg-gray-100 active:scale-95 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bounty Submission Modal */}
      <BountySubmissionModal
        isOpen={submissionBounty !== null}
        onClose={() => setSubmissionBounty(null)}
        bounty={submissionBounty}
        onSuccess={() => {
          // Close modal after successful submission
          setSubmissionBounty(null)
        }}
      />

      {/* Feedback Modal */}
      <FeedbackModal 
        isOpen={feedbackModalOpen}
        onClose={() => setFeedbackModalOpen(false)}
      />

      {/* Share Modal */}
      <ShareModal
        isOpen={shareModalOpen}
        onClose={() => {
          setShareModalOpen(false)
          setDatasetToShare(null)
        }}
        dataset={datasetToShare}
      />
    </div>
  )
}

export default HomePage
