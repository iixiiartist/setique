/* eslint-disable react/no-unescaped-entities */
import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { stripePromise } from '../lib/stripe'
import { SignInModal } from '../components/SignInModal'
import { BountySubmissionModal } from '../components/BountySubmissionModal'
import FeedbackModal from '../components/FeedbackModal'
import ShareModal from '../components/ShareModal'
import NotificationBell from '../components/NotificationBell'
import { logDatasetPurchased } from '../lib/activityTracking'
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
          .order('favorite_count', { ascending: false })
          .limit(5)
        
        data = simpleQuery.data
        error = simpleQuery.error
      }

      if (error) throw error
      setDatasets(data || [])
    } catch (error) {
      console.error('❌ Error fetching datasets:', error)
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
            An ecosystem where everyday creators monetize their expertise and AI builders
            discover unique datasets. Turn your niche knowledge into income or find
            cross-domain data that gives your AI the edge.
          </p>
        </section>

        <section id="philosophy" className="max-w-5xl mx-auto mb-24">
          <div className="bg-white/30 p-8 rounded-3xl border-4 border-black shadow-[8px_8px_0_#000]">
            <h3 className="text-3xl font-extrabold text-center mb-2">
              Our Philosophy
            </h3>
            <p className="text-center font-semibold text-xl text-black/80">
              We believe the future of AI should be built on the rich, diverse, and wonderfully
              specific knowledge captured by real people. We&apos;re democratizing data by
              <strong> empowering creators</strong> to monetize their expertise AND
              <strong> enabling builders</strong> to discover unexpected datasets. A thriving
              community where everyone benefits.
            </p>
          </div>
        </section>

        <section id="how-it-works" className="max-w-6xl mx-auto mb-24">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div className="bg-white/30 p-8 rounded-3xl border-4 border-black shadow-[8px_8px_0_#000]">
              <Archive className="h-16 w-16 text-pink-600 mx-auto mb-4" />
              <h3 className="text-2xl font-extrabold mb-2">1. Curate Your Expertise</h3>
              <p className="font-semibold text-black/70">
                Creators: Package your unique knowledge—rare photos, handwriting samples,
                audio recordings, niche datasets. Buyers: Browse and discover across all domains.
              </p>
            </div>
            <div className="bg-white/30 p-8 rounded-3xl border-4 border-black shadow-[8px_8px_0_#000]">
              <CircleDollarSign className="h-16 w-16 text-cyan-500 mx-auto mb-4" />
              <h3 className="text-2xl font-extrabold mb-2">2. Set Your Value & Build Trust</h3>
              <p className="font-semibold text-black/70">
                You&apos;re the expert—set your price and earn 80% per purchase (ongoing passive income). Pro Curators
                can help improve quality and earn 40% ongoing by partnering with you. Build your reputation in the community.
              </p>
            </div>
            <div className="bg-white/30 p-8 rounded-3xl border-4 border-black shadow-[8px_8px_0_#000]">
              <BrainCircuit className="h-16 w-16 text-yellow-400 mx-auto mb-4" />
              <h3 className="text-2xl font-extrabold mb-2">3. Thrive Together</h3>
              <p className="font-semibold text-black/70">
                Creators earn passive income from their niche knowledge. Builders discover
                unique data for better AI. Join a community democratizing data for everyone.
              </p>
            </div>
          </div>
        </section>

        {/* Data Curation Guide Section */}
        <section id="curator-guide" className="max-w-6xl mx-auto mb-24 pt-10">
          <div className="bg-gradient-to-br from-yellow-200 via-pink-200 to-cyan-200 border-4 border-black rounded-3xl shadow-[8px_8px_0_#000] overflow-hidden">
            <div className="bg-[linear-gradient(90deg,#ff00c3,#00ffff)] p-6 border-b-4 border-black">
              <h3 className="text-4xl font-extrabold text-white drop-shadow-[2px_2px_0_#000]">
                📚 Data Curation Guide for Beginners
              </h3>
              <p className="text-white/90 font-semibold mt-2">
                Never created a dataset before? Start here.
              </p>
            </div>
            
            <div className="p-8 space-y-8">
              {/* What is Data Curation */}
              <div>
                <h4 className="text-2xl font-extrabold mb-3 text-black">
                  🤔 What is Data Curation? (In Plain English)
                </h4>
                <p className="font-semibold text-black/80 mb-3">
                  Data curation is like being a teacher for AI. Just like a child learns by looking at many examples, 
                  AI learns from datasets. Your job as a curator is to collect examples and label them so the AI 
                  understands what it's looking at.
                </p>
                <div className="bg-white border-3 border-black rounded-xl p-5 space-y-3">
                  <p className="font-bold mb-2">💡 Real-World Example:</p>
                  <p className="font-semibold text-sm leading-relaxed">
                    Imagine you're teaching a robot to identify different types of pizza:<br/>
                    <span className="text-green-700">✓ Good dataset:</span> 100 pizza photos, each labeled with "style: neapolitan, 
                    toppings: margherita, crust: thin, cooked: wood-fired"<br/>
                    <span className="text-red-700">✗ Bad dataset:</span> 100 pizza photos with no labels or just "pizza"
                  </p>
                  <p className="font-semibold text-sm text-black/70 italic mt-2">
                    The labels (metadata) are what make the data valuable. Without them, it's just random pictures!
                  </p>
                </div>
              </div>

              {/* Why This Matters */}
              <div className="bg-gradient-to-r from-purple-100 to-pink-100 border-3 border-black rounded-xl p-5">
                <h4 className="text-xl font-extrabold mb-3 text-black">
                  🎯 Why Your Work Matters
                </h4>
                <div className="space-y-2 text-sm font-semibold">
                  <p>• AI companies need specialized data that doesn't exist yet</p>
                  <p>• Researchers need specific examples for their studies</p>
                  <p>• Startups need custom datasets for their unique products</p>
                  <p>• You get paid for creating what they need!</p>
                </div>
              </div>

              {/* Types of Data You Can Curate */}
              <div>
                <h4 className="text-2xl font-extrabold mb-4 text-black">
                  🎨 What Kind of Data Can I Curate? (Start With What You Know!)
                </h4>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-yellow-200 border-3 border-black rounded-xl p-5">
                    <div className="font-extrabold text-lg mb-3 flex items-center gap-2">
                      📸 Images/Photos
                      <span className="text-xs bg-green-500 text-white px-2 py-1 rounded-full">Easiest to start!</span>
                    </div>
                    <p className="text-sm font-semibold mb-3 text-black/70">Perfect if you have a camera or smartphone</p>
                    <ul className="text-sm font-semibold space-y-2">
                      <li className="flex items-start gap-2">
                        <span className="text-green-600 font-bold">→</span>
                        <span>Photos of plants in your garden (labeled by species, health, season)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-600 font-bold">→</span>
                        <span>Screenshots of UI designs (labeled by style, platform, purpose)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-600 font-bold">→</span>
                        <span>Product photos (labeled by condition, angle, lighting)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-600 font-bold">→</span>
                        <span>Handwritten text samples for OCR training</span>
                      </li>
                    </ul>
                  </div>
                  
                  <div className="bg-pink-200 border-3 border-black rounded-xl p-5">
                    <div className="font-extrabold text-lg mb-3 flex items-center gap-2">
                      📝 Text/Conversations
                      <span className="text-xs bg-blue-500 text-white px-2 py-1 rounded-full">High demand!</span>
                    </div>
                    <p className="text-sm font-semibold mb-3 text-black/70">Perfect if you're good at writing or have domain knowledge</p>
                    <ul className="text-sm font-semibold space-y-2">
                      <li className="flex items-start gap-2">
                        <span className="text-pink-600 font-bold">→</span>
                        <span>Customer service Q&A examples (question → helpful answer)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-pink-600 font-bold">→</span>
                        <span>Product reviews labeled with sentiment (positive/negative/neutral)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-pink-600 font-bold">→</span>
                        <span>Industry-specific terminology with explanations</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-pink-600 font-bold">→</span>
                        <span>Email templates for different scenarios</span>
                      </li>
                    </ul>
                  </div>

                  <div className="bg-cyan-200 border-3 border-black rounded-xl p-5">
                    <div className="font-extrabold text-lg mb-3">🎵 Audio/Sound</div>
                    <p className="text-sm font-semibold mb-3 text-black/70">Perfect if you have recording equipment</p>
                    <ul className="text-sm font-semibold space-y-2">
                      <li className="flex items-start gap-2">
                        <span className="text-cyan-600 font-bold">→</span>
                        <span>Environmental sounds (labeled by location, time, weather)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-cyan-600 font-bold">→</span>
                        <span>Voice recordings in different accents/dialects</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-cyan-600 font-bold">→</span>
                        <span>Musical instrument samples (labeled by note, technique)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-cyan-600 font-bold">→</span>
                        <span>Speech with transcripts for speech recognition</span>
                      </li>
                    </ul>
                  </div>

                  <div className="bg-yellow-200 border-3 border-black rounded-xl p-5">
                    <div className="font-extrabold text-lg mb-3">🎬 Video</div>
                    <p className="text-sm font-semibold mb-3 text-black/70">More advanced but very valuable</p>
                    <ul className="text-sm font-semibold space-y-2">
                      <li className="flex items-start gap-2">
                        <span className="text-yellow-600 font-bold">→</span>
                        <span>Short clips of specific actions (labeled with timestamps)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-yellow-600 font-bold">→</span>
                        <span>Tutorial videos with step-by-step annotations</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-yellow-600 font-bold">→</span>
                        <span>Sports movements broken down frame-by-frame</span>
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="mt-4 bg-purple-100 border-3 border-black rounded-xl p-4">
                  <p className="font-bold text-sm flex items-center gap-2">
                    💡 <span>Pro Tip: Start with what you already have!</span>
                  </p>
                  <p className="text-sm font-semibold text-black/70 mt-2">
                    Got a hobby? Professional expertise? Large photo collection? That's your starting point! 
                    The best datasets come from people with deep knowledge in a specific area.
                  </p>
                </div>
              </div>

              {/* Step by Step Guide - MORE DETAILED */}
              <div>
                <h4 className="text-2xl font-extrabold mb-4 text-black">
                  🛠️ Step-by-Step: Creating Your First Dataset (No Tech Skills Required!)
                </h4>
                <div className="space-y-6">
                  {/* Step 1 */}
                  <div className="bg-white border-3 border-black rounded-xl p-5">
                    <div className="flex gap-4 mb-4">
                      <div className="flex-shrink-0 w-14 h-14 bg-gradient-to-br from-pink-500 to-purple-500 rounded-full flex items-center justify-center border-3 border-black font-extrabold text-white text-2xl shadow-lg">
                        1
                      </div>
                      <div className="flex-1">
                        <div className="font-extrabold text-xl mb-2">Pick Your Niche (The More Specific, The Better!)</div>
                        <p className="font-semibold text-sm text-black/80 mb-3">
                          Think about what makes YOU unique. What do you know that most people don't?
                        </p>
                      </div>
                    </div>
                    <div className="bg-gray-50 border-2 border-gray-300 rounded-lg p-4 space-y-3">
                      <div>
                        <p className="font-bold text-sm text-red-600 mb-1">❌ Too Generic:</p>
                        <p className="text-sm pl-4">"Photos of dogs" → Already exists everywhere</p>
                      </div>
                      <div>
                        <p className="font-bold text-sm text-green-600 mb-1">✅ Perfect Niche:</p>
                        <p className="text-sm pl-4">"Photos of senior rescue dogs in rehabilitation, labeled by breed, temperament, and training progress" → Unique and valuable!</p>
                      </div>
                    </div>
                    <div className="mt-3 p-3 bg-blue-50 border-2 border-blue-300 rounded-lg">
                      <p className="font-bold text-xs text-blue-900 mb-1">🎯 FINDING YOUR NICHE:</p>
                      <ul className="text-xs space-y-1 pl-4">
                        <li>• What's your job or profession?</li>
                        <li>• What are your hobbies?</li>
                        <li>• What problems have you solved repeatedly?</li>
                        <li>• What do friends ask you for help with?</li>
                      </ul>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="bg-white border-3 border-black rounded-xl p-5">
                    <div className="flex gap-4 mb-4">
                      <div className="flex-shrink-0 w-14 h-14 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-full flex items-center justify-center border-3 border-black font-extrabold text-white text-2xl shadow-lg">
                        2
                      </div>
                      <div className="flex-1">
                        <div className="font-extrabold text-xl mb-2">Collect Your Raw Data</div>
                        <p className="font-semibold text-sm text-black/80 mb-3">
                          Gather your examples. Quality matters WAY more than quantity!
                        </p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="bg-yellow-50 border-2 border-yellow-400 rounded-lg p-3">
                        <p className="font-bold text-sm mb-2">📏 How Many Examples Do I Need?</p>
                        <ul className="text-sm space-y-1 pl-4">
                          <li>• <strong>Minimum:</strong> 50 examples (good for starting out)</li>
                          <li>• <strong>Sweet spot:</strong> 100-500 examples (ideal for most AI training)</li>
                          <li>• <strong>Advanced:</strong> 1,000+ examples (for complex tasks)</li>
                        </ul>
                      </div>
                      <div className="bg-green-50 border-2 border-green-400 rounded-lg p-3">
                        <p className="font-bold text-sm mb-2">✅ Quality Checklist:</p>
                        <ul className="text-sm space-y-1">
                          <li className="flex items-start gap-2">
                            <input type="checkbox" className="mt-1" disabled />
                            <span>All files are the same format (all JPG, or all MP3, etc.)</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <input type="checkbox" className="mt-1" disabled />
                            <span>Similar quality/resolution across all files</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <input type="checkbox" className="mt-1" disabled />
                            <span>Clear filenames (dog_01.jpg, dog_02.jpg, not IMG_8472.jpg)</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <input type="checkbox" className="mt-1" disabled />
                            <span>You have the legal right to use/sell this data</span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className="bg-white border-3 border-black rounded-xl p-5">
                    <div className="flex gap-4 mb-4">
                      <div className="flex-shrink-0 w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center border-3 border-black font-extrabold text-white text-2xl shadow-lg">
                        3
                      </div>
                      <div className="flex-1">
                        <div className="font-extrabold text-xl mb-2">Create Your Labels/Annotations (The Most Important Part!)</div>
                        <p className="font-semibold text-sm text-black/80 mb-3">
                          This is where the magic happens. Labels tell the AI what it's looking at.
                        </p>
                      </div>
                    </div>
                    
                    <div className="bg-purple-50 border-2 border-purple-400 rounded-lg p-4 mb-4">
                      <p className="font-bold text-sm mb-3">🎓 ANNOTATION 101: Two Easy Methods</p>
                      
                      <div className="space-y-4">
                        <div>
                          <p className="font-bold text-sm bg-white px-3 py-2 rounded border-2 border-black mb-2">
                            METHOD 1: CSV File (Use Excel or Google Sheets)
                          </p>
                          <p className="text-xs font-semibold mb-2 text-black/70">
                            Perfect for: Images, audio files, any file-based data
                          </p>
                          <div className="bg-black text-green-400 font-mono text-xs p-4 rounded border-2 border-gray-600 overflow-x-auto">
                            filename,category,difficulty,tags<br/>
                            recipe_001.jpg,dessert,easy,"chocolate,gluten-free"<br/>
                            recipe_002.jpg,main,medium,"pasta,vegetarian"<br/>
                            recipe_003.jpg,appetizer,easy,"cheese,quick"
                          </div>
                          <p className="text-xs font-semibold mt-2 text-black/60 italic">
                            Save as .csv file and include it in your ZIP!
                          </p>
                        </div>

                        <div>
                          <p className="font-bold text-sm bg-white px-3 py-2 rounded border-2 border-black mb-2">
                            METHOD 2: JSON File (Slightly More Advanced)
                          </p>
                          <p className="text-xs font-semibold mb-2 text-black/70">
                            Perfect for: Text conversations, structured data
                          </p>
                          <div className="bg-black text-yellow-300 font-mono text-xs p-4 rounded border-2 border-gray-600 overflow-x-auto">
                            {'['}
                              <br/>  {'{'}"question": "How do I reset my password?",
                              <br/>   "answer": "Click 'Forgot Password' on the login page.",
                              <br/>   "category": "account",
                              <br/>   "difficulty": "easy"{'}'},
                            <br/>  {'{'}"question": "Can I export my data?",
                              <br/>   "answer": "Yes! Go to Settings → Export Data.",
                              <br/>   "category": "data",
                              <br/>   "difficulty": "medium"{'}'}
                            <br/>{']'}
                          </div>
                          <p className="text-xs font-semibold mt-2 text-black/60 italic">
                            Save as .json file and include it in your ZIP!
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-orange-50 border-2 border-orange-400 rounded-lg p-3">
                      <p className="font-bold text-sm mb-2">💡 What Should I Label?</p>
                      <p className="text-sm font-semibold mb-2">Think about what someone using this data would want to know:</p>
                      <ul className="text-sm space-y-1 pl-4">
                        <li>• <strong>Category/Type:</strong> What is this thing?</li>
                        <li>• <strong>Attributes:</strong> What are its characteristics?</li>
                        <li>• <strong>Context:</strong> When/where was this captured?</li>
                        <li>• <strong>Quality markers:</strong> Any issues or special notes?</li>
                      </ul>
                    </div>
                  </div>

                  {/* Step 4 */}
                  <div className="bg-white border-3 border-black rounded-xl p-5">
                    <div className="flex gap-4 mb-4">
                      <div className="flex-shrink-0 w-14 h-14 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-full flex items-center justify-center border-3 border-black font-extrabold text-white text-2xl shadow-lg">
                        4
                      </div>
                      <div className="flex-1">
                        <div className="font-extrabold text-xl mb-2">Write a README File (Your Dataset's Instruction Manual)</div>
                        <p className="font-semibold text-sm text-black/80 mb-3">
                          Help buyers understand what they're getting and how to use it.
                        </p>
                      </div>
                    </div>

                    <div className="bg-gray-50 border-2 border-gray-400 rounded-lg p-4">
                      <p className="font-bold text-sm mb-3">📄 README Template (Copy & Customize This!):</p>
                      <div className="bg-white border-2 border-black rounded p-3 font-mono text-xs space-y-2 overflow-x-auto">
                        <p><strong># [Your Dataset Name]</strong></p>
                        <p></p>
                        <p><strong>## What's Inside</strong></p>
                        <p>- Number of examples: [X]</p>
                        <p>- File format: [JPG/CSV/MP3/etc]</p>
                        <p>- Total size: [approximate]</p>
                        <p></p>
                        <p><strong>## How to Use</strong></p>
                        <p>1. Unzip the file</p>
                        <p>2. Find the annotations.csv file</p>
                        <p>3. Match filenames to labels</p>
                        <p></p>
                        <p><strong>## Label Descriptions</strong></p>
                        <p>- category: The type of [thing]</p>
                        <p>- difficulty: Easy/Medium/Hard</p>
                        <p>- tags: Additional metadata</p>
                        <p></p>
                        <p><strong>## License</strong></p>
                        <p>This data is for AI training only. </p>
                        <p>No redistribution without permission.</p>
                      </div>
                      <p className="text-xs font-semibold mt-3 text-black/60">
                        Save this as "README.txt" in your ZIP file!
                      </p>
                    </div>
                  </div>

                  {/* Step 5 */}
                  <div className="bg-white border-3 border-black rounded-xl p-5">
                    <div className="flex gap-4 mb-4">
                      <div className="flex-shrink-0 w-14 h-14 bg-gradient-to-br from-pink-500 to-red-500 rounded-full flex items-center justify-center border-3 border-black font-extrabold text-white text-2xl shadow-lg">
                        5
                      </div>
                      <div className="flex-1">
                        <div className="font-extrabold text-xl mb-2">Package Everything in a ZIP File</div>
                        <p className="font-semibold text-sm text-black/80 mb-3">
                          Bundle all your files together so buyers get everything in one download.
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="bg-blue-50 border-2 border-blue-400 rounded-lg p-3">
                        <p className="font-bold text-sm mb-2">📦 Your ZIP Should Contain:</p>
                        <div className="font-mono text-xs space-y-1 pl-3">
                          <p>📁 my_dataset.zip/</p>
                          <p className="pl-4">├── README.txt <span className="text-blue-600">(explains everything)</span></p>
                          <p className="pl-4">├── annotations.csv <span className="text-blue-600">(or .json)</span></p>
                          <p className="pl-4">├── data/</p>
                          <p className="pl-8">├── file_001.jpg</p>
                          <p className="pl-8">├── file_002.jpg</p>
                          <p className="pl-8">└── ...</p>
                        </div>
                      </div>

                      <div className="bg-purple-50 border-2 border-purple-400 rounded-lg p-3">
                        <p className="font-bold text-sm mb-2">💻 How to Create a ZIP (No Tech Skills Needed):</p>
                        <div className="space-y-2 text-sm">
                          <p><strong>Windows:</strong> Select all files → Right-click → "Send to" → "Compressed (zipped) folder"</p>
                          <p><strong>Mac:</strong> Select all files → Right-click → "Compress [number] items"</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Step 6 */}
                  <div className="bg-gradient-to-r from-green-400 to-cyan-400 border-3 border-black rounded-xl p-5">
                    <div className="flex gap-4 mb-4">
                      <div className="flex-shrink-0 w-14 h-14 bg-black rounded-full flex items-center justify-center border-3 border-white font-extrabold text-white text-2xl shadow-lg">
                        6
                      </div>
                      <div className="flex-1">
                        <div className="font-extrabold text-xl mb-2 text-white drop-shadow">Set Your Price & Publish!</div>
                        <p className="font-semibold text-sm text-white/90 mb-3">
                          You're ready to go live! Scroll down to the upload section below.
                        </p>
                      </div>
                    </div>

                    <div className="bg-white rounded-lg p-4">
                      <p className="font-bold text-sm mb-2">💰 Pricing Guide:</p>
                      <ul className="text-sm space-y-1">
                        <li>• <strong>$25-$50:</strong> Small datasets (50-100 examples), common topics</li>
                        <li>• <strong>$75-$200:</strong> Medium datasets (100-500 examples), specialized</li>
                        <li>• <strong>$250-$500+:</strong> Large/expert datasets, rare/unique data</li>
                      </ul>
                      <p className="text-xs font-semibold mt-3 text-black/60 italic">
                        💡 Tip: Check similar datasets in the ecosystem to see competitive pricing!
                      </p>
                    </div>
                  </div>
                </div>

                {/* Visual Summary */}
                <div className="mt-6 bg-gradient-to-r from-yellow-200 via-pink-200 to-cyan-200 border-3 border-black rounded-xl p-5 text-center">
                  <p className="font-extrabold text-lg mb-2">🎉 That's It! You're a Data Curator!</p>
                  <p className="font-semibold text-sm">
                    Start with just 50 examples in your area of expertise. Keep it simple, focus on quality, and you'll create something valuable. 
                    The AI revolution needs YOUR unique knowledge!
                  </p>
                </div>
              </div>

              {/* Quality Tips - EXPANDED */}
              <div>
                <h4 className="text-2xl font-extrabold mb-4 text-black">
                  ⭐ Pro Tips for Success (From Experienced Curators)
                </h4>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-green-50 border-3 border-green-500 rounded-xl p-5">
                    <div className="text-3xl mb-3">✅ DO THIS</div>
                    <ul className="text-sm font-semibold space-y-3">
                      <li className="flex items-start gap-2">
                        <span className="text-green-600 font-bold text-lg">→</span>
                        <div>
                          <strong>Be Consistent:</strong> Use the same naming convention, format, and quality across ALL files
                        </div>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-600 font-bold text-lg">→</span>
                        <div>
                          <strong>Include Examples:</strong> Show 2-3 sample rows in your description so buyers know exactly what they're getting
                        </div>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-600 font-bold text-lg">→</span>
                        <div>
                          <strong>Be Thorough:</strong> Label ALL important attributes, not just the obvious ones
                        </div>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-600 font-bold text-lg">→</span>
                        <div>
                          <strong>Test Your Own Data:</strong> Try loading and using it yourself before publishing
                        </div>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-600 font-bold text-lg">→</span>
                        <div>
                          <strong>Be Honest:</strong> Clearly state any limitations or quirks in your README
                        </div>
                      </li>
                    </ul>
                  </div>
                  
                  <div className="bg-red-50 border-3 border-red-500 rounded-xl p-5">
                    <div className="text-3xl mb-3">❌ AVOID THIS</div>
                    <ul className="text-sm font-semibold space-y-3">
                      <li className="flex items-start gap-2">
                        <span className="text-red-600 font-bold text-lg">→</span>
                        <div>
                          <strong>Mixed Quality:</strong> Don't combine high-res and low-res files in the same dataset
                        </div>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-red-600 font-bold text-lg">→</span>
                        <div>
                          <strong>No Documentation:</strong> Never upload data without explaining what it is and how to use it
                        </div>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-red-600 font-bold text-lg">→</span>
                        <div>
                          <strong>Copyrighted Material:</strong> Only upload data you own or have permission to sell
                        </div>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-red-600 font-bold text-lg">→</span>
                        <div>
                          <strong>Rushing:</strong> Don't publish incomplete or poorly labeled data just to get it out there
                        </div>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-red-600 font-bold text-lg">→</span>
                        <div>
                          <strong>Vague Labels:</strong> Avoid ambiguous labels like "good", "bad", "thing1", "stuff"
                        </div>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Common Questions - EXPANDED */}
              <div>
                <h4 className="text-2xl font-extrabold mb-4 text-black">
                  ❓ Your Questions Answered
                </h4>
                <div className="space-y-3">
                  <details className="bg-white border-3 border-black rounded-xl p-4 cursor-pointer hover:bg-gray-50 transition">
                    <summary className="font-extrabold text-base cursor-pointer select-none">
                      Do I need to be a programmer or data scientist?
                    </summary>
                    <p className="font-semibold text-sm mt-3 text-black/80 leading-relaxed">
                      <strong>Absolutely not!</strong> If you can use Excel/Google Sheets and create a ZIP file, you have all 
                      the technical skills needed. The hard part is the domain knowledge—knowing what to label and why it matters. 
                      That's where YOUR expertise comes in!
                    </p>
                  </details>

                  <details className="bg-white border-3 border-black rounded-xl p-4 cursor-pointer hover:bg-gray-50 transition">
                    <summary className="font-extrabold text-base cursor-pointer select-none">
                      How big should my dataset be to sell it?
                    </summary>
                    <p className="font-semibold text-sm mt-3 text-black/80 leading-relaxed">
                      Start with <strong>50-100 well-curated examples</strong>. This is enough for fine-tuning many AI models. 
                      Quality and proper labeling matter WAY more than quantity. A perfectly labeled set of 100 examples 
                      is more valuable than 10,000 unlabeled images.
                    </p>
                  </details>

                  <details className="bg-white border-3 border-black rounded-xl p-4 cursor-pointer hover:bg-gray-50 transition">
                    <summary className="font-extrabold text-base cursor-pointer select-none">
                      What tools do I need? Do I need special software?
                    </summary>
                    <p className="font-semibold text-sm mt-3 text-black/80 leading-relaxed">
                      <strong>Nope! Just free, common tools:</strong><br/>
                      • <strong>Excel or Google Sheets</strong> for creating CSV annotation files<br/>
                      • <strong>Notepad or any text editor</strong> for JSON and README files<br/>
                      • <strong>Built-in ZIP tool</strong> in Windows or Mac<br/>
                      • <strong>(Optional)</strong> For image bounding boxes, try LabelImg (free tool)<br/>
                      That's literally it!
                    </p>
                  </details>

                  <details className="bg-white border-3 border-black rounded-xl p-4 cursor-pointer hover:bg-gray-50 transition">
                    <summary className="font-extrabold text-base cursor-pointer select-none">
                      Can I update or improve my dataset after publishing?
                    </summary>
                    <p className="font-semibold text-sm mt-3 text-black/80 leading-relaxed">
                      Not yet—this feature is coming soon! For now, make sure your dataset is complete and well-tested 
                      before publishing. If you want to add more examples or fix issues, you can create a "v2" as a 
                      new listing and notify previous buyers.
                    </p>
                  </details>

                  <details className="bg-white border-3 border-black rounded-xl p-4 cursor-pointer hover:bg-gray-50 transition">
                    <summary className="font-extrabold text-base cursor-pointer select-none">
                      What if I have an idea but don't have the data yet?
                    </summary>
                    <p className="font-semibold text-sm mt-3 text-black/80 leading-relaxed">
                      <strong>Post a bounty!</strong> Scroll down to the "Commission a Custom Dataset" section. Describe 
                      what you need, set a reward amount, and experienced curators will bid to build it for you. 
                      It's like hiring a freelancer, but for data!
                    </p>
                  </details>

                  <details className="bg-white border-3 border-black rounded-xl p-4 cursor-pointer hover:bg-gray-50 transition">
                    <summary className="font-extrabold text-base cursor-pointer select-none">
                      How do I know if my dataset idea is good?
                    </summary>
                    <p className="font-semibold text-sm mt-3 text-black/80 leading-relaxed">
                      Ask yourself: <strong>"Does this exist already?"</strong> and <strong>"Would an AI developer 
                      pay for this?"</strong> Good datasets are:<br/>
                      • Specific to a niche (not generic)<br/>
                      • Well-labeled with useful metadata<br/>
                      • Hard to recreate (requires expertise or time)<br/>
                      • Addresses a real need in AI training<br/><br/>
                      Check the ecosystem to see what's selling and what gaps exist!
                    </p>
                  </details>

                  <details className="bg-white border-3 border-black rounded-xl p-4 cursor-pointer hover:bg-gray-50 transition">
                    <summary className="font-extrabold text-base cursor-pointer select-none">
                      What about copyright and legal stuff?
                    </summary>
                    <p className="font-semibold text-sm mt-3 text-black/80 leading-relaxed">
                      <strong>Only upload data you own or have permission to distribute.</strong><br/>
                      • Photos you took yourself? ✅ Good to go<br/>
                      • Text you wrote? ✅ Good to go<br/>
                      • Movies/songs from the internet? ❌ Don't do it<br/>
                      • Public domain data? ✅ Usually fine (check the license)<br/><br/>
                      When in doubt, include clear licensing information in your README file.
                    </p>
                  </details>

                  <details className="bg-white border-3 border-black rounded-xl p-4 cursor-pointer hover:bg-gray-50 transition">
                    <summary className="font-extrabold text-base cursor-pointer select-none">
                      How long does it take to create a dataset?
                    </summary>
                    <p className="font-semibold text-sm mt-3 text-black/80 leading-relaxed">
                      <strong>It depends!</strong><br/>
                      • <strong>Simple dataset (50 images):</strong> 2-4 hours for collection and labeling<br/>
                      • <strong>Medium dataset (200 examples):</strong> 1-2 days<br/>
                      • <strong>Complex dataset (500+ examples):</strong> 1-2 weeks<br/><br/>
                      The labeling/annotation is usually what takes the most time, not collecting the data.
                    </p>
                  </details>

                  <details className="bg-white border-3 border-black rounded-xl p-4 cursor-pointer hover:bg-gray-50 transition">
                    <summary className="font-extrabold text-base cursor-pointer select-none">
                      Can I collaborate with others on a dataset?
                    </summary>
                    <p className="font-semibold text-sm mt-3 text-black/80 leading-relaxed">
                      <strong>Yes!</strong> You can work with teammates to collect and label data, then publish under one account. 
                      Just make sure you have clear agreements about revenue sharing. The platform doesn't enforce this—it's 
                      between you and your collaborators.
                    </p>
                  </details>
                </div>
              </div>

              {/* Final Encouragement */}
              <div className="bg-gradient-to-r from-purple-400 via-pink-400 to-yellow-400 border-3 border-black rounded-xl p-6 text-center">
                <div className="text-4xl mb-3">🚀</div>
                <h4 className="text-2xl font-extrabold mb-3 text-white drop-shadow-lg">
                  Ready to Start Your Data Curation Journey?
                </h4>
                <p className="font-semibold text-white/95 mb-4 max-w-2xl mx-auto">
                  Don't overthink it! Pick something you know, start small with 50 examples, and improve as you go. 
                  Every expert curator started exactly where you are now. Your unique knowledge is valuable—let's monetize it!
                </p>
                <button
                  onClick={() => {
                    if (!user) {
                      setSignInOpen(true)
                    } else if (!hasBetaAccess) {
                      navigate('/dashboard')
                    } else {
                      navigate('/dashboard')
                    }
                  }}
                  className="inline-block bg-white text-black font-extrabold px-8 py-4 rounded-full border-3 border-black shadow-[6px_6px_0_#000] hover:translate-y-1 hover:shadow-[3px_3px_0_#000] transition-all text-lg"
                >
                  {!user ? 'Sign Up to Start' : !hasBetaAccess ? 'Complete Beta Access' : 'Upload Your First Dataset →'}
                </button>
              </div>
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
                Partner with data owners, apply your expertise, and earn 50/50 revenue splits on professionally curated datasets
              </p>
            </div>

            <div className="p-8">
              {/* Value Proposition Cards */}
              <div className="grid md:grid-cols-3 gap-6 mb-10">
                <div className="bg-white border-3 border-black rounded-2xl p-6 shadow-[4px_4px_0_#000]">
                  <div className="text-4xl mb-3">🎯</div>
                  <h4 className="text-xl font-extrabold mb-2 text-black">Expert Recognition</h4>
                  <p className="font-semibold text-black/70 text-sm">
                    Get certified as a Pro Curator. Earn badges (Verified → Expert → Master) as you complete projects and build your reputation.
                  </p>
                </div>
                <div className="bg-white border-3 border-black rounded-2xl p-6 shadow-[4px_4px_0_#000]">
                  <div className="text-4xl mb-3">💰</div>
                  <h4 className="text-xl font-extrabold mb-2 text-black">Fair Revenue Split</h4>
                  <p className="font-semibold text-black/70 text-sm">
                    Earn 40% of every dataset sale (50/50 split of the creator share). No upfront costs, no hourly limits—just passive income from quality work.
                  </p>
                </div>
                <div className="bg-white border-3 border-black rounded-2xl p-6 shadow-[4px_4px_0_#000]">
                  <div className="text-4xl mb-3">🤝</div>
                  <h4 className="text-xl font-extrabold mb-2 text-black">Choose Your Projects</h4>
                  <p className="font-semibold text-black/70 text-sm">
                    Browse curation requests, submit proposals, and partner with data owners who need your specific expertise.
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
                      Submit your profile with specialties, bio, and portfolio samples
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="bg-pink-100 border-2 border-black rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3 font-extrabold text-2xl text-pink-600">
                      2
                    </div>
                    <h5 className="font-extrabold text-sm mb-2">Browse Opportunities</h5>
                    <p className="text-xs font-semibold text-black/70">
                      View curation requests from data owners who need help
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="bg-yellow-100 border-2 border-black rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3 font-extrabold text-2xl text-yellow-600">
                      3
                    </div>
                    <h5 className="font-extrabold text-sm mb-2">Submit Proposals</h5>
                    <p className="text-xs font-semibold text-black/70">
                      Pitch your approach, timeline, and pricing for projects
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
            Power up your workflow. Use the Setique API to programmatically upload
            datasets from your apps and scripts. Automate your uploads and earn
            passively.
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

      <footer className="text-center text-black font-bold mt-8 text-sm bg-yellow-300 border-t-4 border-black py-6">
        <div className="max-w-4xl mx-auto px-4">
          <p className="mb-3">© {new Date().getFullYear()} Setique — The Niche Data Economy</p>
          <div className="flex justify-center gap-6 text-xs">
            <Link to="/privacy" className="hover:underline">
              Privacy Policy
            </Link>
          </div>
        </div>
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
