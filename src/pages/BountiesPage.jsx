/* eslint-disable react/no-unescaped-entities */
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { SignInModal } from '../components/SignInModal'
import { BountySubmissionModal } from '../components/BountySubmissionModal'
import NotificationBell from '../components/NotificationBell'
import {
  CircleDollarSign,
  X,
  LogOut,
  User,
  Home,
} from '../components/Icons'

const tierDisplayInfo = {
  newcomer: { label: 'Open to All', badge: '🌟', color: 'bg-gray-100 text-gray-800 border-gray-600' },
  verified: { label: 'Verified+', badge: '✓', color: 'bg-blue-100 text-blue-800 border-blue-600' },
  expert: { label: 'Expert+', badge: '✓✓', color: 'bg-purple-100 text-purple-800 border-purple-600' },
  master: { label: 'Master Only', badge: '⭐', color: 'bg-yellow-100 text-yellow-800 border-yellow-600' }
};

export default function BountiesPage() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  // Beta access state
  const [hasBetaAccess, setHasBetaAccess] = useState(false)

  // Modal state
  const [selectedBounty, setSelectedBounty] = useState(null)
  const [submissionBounty, setSubmissionBounty] = useState(null)
  const [isSignInOpen, setSignInOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Data from Supabase
  const [bounties, setBounties] = useState([])
  const [loading, setLoading] = useState(true)

  // Set page title and meta tags for SEO
  useEffect(() => {
    document.title = 'Active Bounties - Commission Custom Datasets | Setique'
    
    // Update meta description
    const metaDescription = document.querySelector('meta[name="description"]')
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Browse open dataset bounties and get paid to curate custom AI training data. Commission expert curators to build specialized datasets for your machine learning projects.')
    }
    
    // Update Open Graph tags
    const ogTitle = document.querySelector('meta[property="og:title"]')
    if (ogTitle) ogTitle.setAttribute('content', 'Active Bounties - Setique')
    
    const ogDescription = document.querySelector('meta[property="og:description"]')
    if (ogDescription) ogDescription.setAttribute('content', 'Get paid to curate datasets or commission custom AI training data from expert curators.')
    
    // Update Twitter tags
    const twitterTitle = document.querySelector('meta[name="twitter:title"]')
    if (twitterTitle) twitterTitle.setAttribute('content', 'Active Bounties - Setique')
    
    const twitterDescription = document.querySelector('meta[name="twitter:description"]')
    if (twitterDescription) twitterDescription.setAttribute('content', 'Get paid to curate datasets or commission custom AI training data from expert curators.')
    
    // Cleanup: restore defaults when component unmounts
    return () => {
      document.title = 'Setique - Discover Unique AI Training Data You Won\'t Find Anywhere Else'
      if (metaDescription) {
        metaDescription.setAttribute('content', 'Setique - Unique Data. Better AI. An ecosystem where AI builders discover unique datasets AND everyday creators earn from their expertise.')
      }
    }
  }, [])

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

  // Fetch bounties
  useEffect(() => {
    fetchBounties()
  }, [])

  const fetchBounties = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('curation_requests')
        .select('*')
        .eq('status', 'open')
        .order('created_at', { ascending: false })

      if (error) throw error
      
      // Fetch creator profiles separately
      if (data && data.length > 0) {
        const creatorIds = [...new Set(data.map(b => b.creator_id).filter(Boolean))];
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, username')
          .in('id', creatorIds);
        
        // Attach profile data and map to old format
        const bountiesWithProfiles = data.map(bounty => ({
          ...bounty,
          profiles: profilesData?.find(p => p.id === bounty.creator_id),
          budget: bounty.budget_max || bounty.budget_min,
          modality: bounty.modality || 'data'
        }));
        
        setBounties(bountiesWithProfiles);
      } else {
        setBounties([]);
      }
    } catch (error) {
      console.error('Error fetching bounties:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    await signOut()
    setMobileMenuOpen(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-300 via-cyan-300 to-blue-300 text-black font-sans p-4 sm:p-8">
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
            onClick={() => navigate('/datasets')}
            className="font-bold text-black hover:text-pink-600 transition"
          >
            Datasets
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
              navigate('/datasets')
              setMobileMenuOpen(false)
            }}
            className="w-full text-left font-bold text-black hover:text-pink-600 transition py-2 px-4 rounded hover:bg-gray-50"
          >
            Datasets
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
          <div className="mb-8">
            <h1 className="text-4xl sm:text-5xl font-extrabold mb-4 text-black drop-shadow-[3px_3px_0_#fff] flex items-center justify-center sm:justify-start gap-3">
              <CircleDollarSign className="h-10 w-10 text-green-600" /> Active Bounties
            </h1>
            <p className="text-lg font-semibold text-black/80 mb-4">
              Get paid to curate datasets! Browse open bounties from companies looking for custom data.
            </p>
            {user && (
              <button
                onClick={() => navigate('/dashboard')}
                className="bg-gradient-to-r from-cyan-400 to-green-400 text-black font-extrabold px-6 py-3 rounded-full border-4 border-black hover:scale-105 transition-transform active:scale-100 shadow-[4px_4px_0_#000]"
              >
                Post a Bounty
              </button>
            )}
          </div>
          
          {loading ? (
            <div className="text-center py-20">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-black border-t-transparent"></div>
              <p className="mt-4 font-bold text-lg">Loading bounties...</p>
            </div>
          ) : bounties.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {bounties.map((bounty) => {
                const tierInfo = tierDisplayInfo[bounty.minimum_curator_tier || 'newcomer'];
                return (
                <div
                  key={bounty.id}
                  className="bg-gradient-to-br from-green-100 to-cyan-100 border-4 border-black rounded-2xl shadow-[6px_6px_0_#000] p-6 hover:scale-105 transition-transform"
                >
                  <div className="flex items-start justify-between mb-3">
                    <h2 className="text-xl font-extrabold text-black pr-2">
                      {bounty.title}
                    </h2>
                    <div className="bg-green-400 text-black font-bold border-2 border-black px-3 py-1 rounded-full text-sm whitespace-nowrap">
                      ${bounty.budget_min}-${bounty.budget_max}
                    </div>
                  </div>
                  
                  {/* Tier Badge */}
                  <div className="mb-3">
                    <span className={`text-xs font-bold px-2 py-1 border-2 rounded-full inline-flex items-center gap-1 ${tierInfo.color}`}>
                      <span>{tierInfo.badge}</span>
                      <span>{tierInfo.label}</span>
                    </span>
                  </div>

                  <p className="text-sm font-semibold text-black/80 mb-4 line-clamp-3">
                    {bounty.description}
                  </p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {bounty.specialties_needed?.slice(0, 3).map((specialty, idx) => (
                      <span
                        key={idx}
                        className="text-xs font-bold px-2 py-1 bg-white border-2 border-black rounded-full"
                      >
                        #{specialty}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center justify-between text-xs font-semibold text-black/70 mb-4">
                    <span>Posted by {bounty.profiles?.username || 'Anonymous'}</span>
                    <span className="uppercase bg-yellow-200 px-2 py-1 rounded border-2 border-black">
                      {bounty.status}
                    </span>
                  </div>
                  <button
                    onClick={() => setSelectedBounty(bounty)}
                    className="w-full bg-gradient-to-r from-cyan-400 to-green-400 text-black font-extrabold border-2 border-black rounded-full px-4 py-2 hover:opacity-90 transition-opacity active:scale-95"
                  >
                    View Details
                  </button>
                </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-gradient-to-br from-gray-100 to-gray-200 border-4 border-black rounded-2xl shadow-[6px_6px_0_#000] p-12 text-center">
              <div className="text-6xl mb-4">💼</div>
              <h2 className="text-2xl font-extrabold text-black mb-3">
                No Active Bounties Right Now
              </h2>
              <p className="text-lg font-semibold text-black/70 mb-6 max-w-2xl mx-auto">
                Be the first to post a bounty! Commission our community of expert curators to build the custom dataset your AI project needs.
              </p>
              <button
                onClick={() => {
                  if (!user) {
                    setSignInOpen(true)
                  } else {
                    navigate('/dashboard')
                  }
                }}
                className="bg-gradient-to-r from-cyan-400 to-green-400 text-black font-extrabold text-lg px-8 py-3 rounded-full border-4 border-black hover:scale-105 transition-transform active:scale-100"
              >
                {user ? 'Post a Bounty' : 'Sign In to Post Bounty'}
              </button>
            </div>
          )}

          {/* Post Bounty CTA */}
          <div className="mt-16 bg-white border-4 border-black rounded-3xl shadow-[8px_8px_0_#000] overflow-hidden">
            <div className="p-6 border-b-4 border-black bg-gradient-to-r from-yellow-300 to-pink-300">
              <h3 className="text-3xl font-extrabold text-black">
                Commission a Custom Dataset
              </h3>
              <p className="font-semibold text-black/80 mt-1">
                Post a bounty and have our community of curators build the exact dataset your AI model needs.
              </p>
            </div>
            <div className="p-8 text-center">
              <p className="text-xl font-semibold mb-6 text-black">
                Can't find what you need? Commission expert curators to build custom datasets tailored to your AI project.
              </p>
              <button
                onClick={() => {
                  if (!user) {
                    setSignInOpen(true)
                  } else {
                    navigate('/dashboard')
                  }
                }}
                className="bg-[linear-gradient(90deg,#00ffff,#ff00c3,#ffea00)] text-black font-extrabold text-lg px-12 py-4 rounded-full border-4 border-black hover:scale-105 transition-transform active:scale-100"
              >
                {user ? 'Go to Dashboard to Post Bounty' : 'Sign Up to Post Bounty'}
              </button>
            </div>
          </div>
        </section>
      ) : (
        <section className="max-w-4xl mx-auto">
          <h1 className="text-4xl sm:text-5xl font-extrabold mb-6 text-black drop-shadow-[3px_3px_0_#fff] flex items-center justify-center sm:justify-start gap-3">
            <CircleDollarSign className="h-10 w-10 text-green-600" /> Active Bounties
          </h1>
          <div className="bg-gradient-to-br from-green-50 to-cyan-50 border-4 border-black rounded-3xl shadow-[8px_8px_0_#000] p-12 text-center">
            <div className="text-6xl mb-4">🔒</div>
            <h2 className="text-3xl font-extrabold text-black mb-4">
              Beta Access Required
            </h2>
            <p className="text-lg font-semibold text-black/70 mb-6 max-w-2xl mx-auto">
              Commission custom datasets from expert curators! {user ? 'Your beta access request is being reviewed.' : 'Sign up to join the waiting list and get early access to bounties.'}
            </p>
            {!user ? (
              <button
                onClick={() => setSignInOpen(true)}
                className="bg-gradient-to-r from-cyan-400 to-green-400 text-white font-extrabold text-lg px-8 py-3 rounded-full border-4 border-black hover:scale-105 transition-transform active:scale-100"
              >
                Sign Up for Beta Access
              </button>
            ) : (
              <button
                onClick={() => navigate('/dashboard')}
                className="bg-gradient-to-r from-yellow-400 to-green-400 text-black font-extrabold text-lg px-8 py-3 rounded-full border-4 border-black hover:scale-105 transition-transform active:scale-100"
              >
                Check Your Beta Status
              </button>
            )}
          </div>
        </section>
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
              <h2 className="text-3xl font-extrabold mb-2">
                {selectedBounty.title}
              </h2>
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
              <h3 className="font-extrabold text-lg mb-2">📋 Description</h3>
              <div className="bg-white/80 border-2 border-black rounded-xl p-4">
                <p className="font-semibold text-black/80 whitespace-pre-wrap">
                  {selectedBounty.description}
                </p>
              </div>
            </div>

            {/* Specialties */}
            {selectedBounty.specialties_needed && selectedBounty.specialties_needed.length > 0 && (
              <div className="mb-4">
                <h3 className="font-extrabold text-lg mb-2">🏷️ Specialties</h3>
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
              <h3 className="font-extrabold text-lg mb-2">✅ Requirements</h3>
              <div className="bg-white/80 border-2 border-black rounded-xl p-4 space-y-2">
                <div className="flex items-start gap-2">
                  <span className="text-lg">🎯</span>
                  <span className="font-semibold text-sm">
                    Quality Level: <strong>{selectedBounty.target_quality || 'standard'}</strong>
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-lg">💰</span>
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
      {submissionBounty && (
        <BountySubmissionModal
          isOpen={true}
          onClose={() => setSubmissionBounty(null)}
          bounty={submissionBounty}
          onSuccess={() => {
            setSubmissionBounty(null)
            setSelectedBounty(null)
            alert('✅ Your submission has been received! The requester will review it soon.')
          }}
        />
      )}

      {/* Sign In Modal */}
      <SignInModal isOpen={isSignInOpen} onClose={() => setSignInOpen(false)} />
    </div>
  )
}
