/* eslint-disable react/no-unescaped-entities */
import { useState, useMemo, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { logger, handleSupabaseError } from '../lib/logger'
import { fetchUserPurchases as fetchPurchases } from '../lib/purchases'
import { checkBetaAccess as checkBeta } from '../lib/betaAccess'
import { handleDatasetCheckout, refreshDatasetsAfterPurchase } from '../lib/checkout'
import { SignInModal } from '../components/SignInModal'
import FavoriteButton from '../components/FavoriteButton'
import ShareModal from '../components/ShareModal'
import NotificationBell from '../components/NotificationBell'
import DatasetComments from '../components/comments/DatasetComments'
import DatasetReviews from '../components/DatasetReviews'
import StarRating from '../components/StarRating'
import { CurationLevelBadge } from '../components/CurationLevelBadge'
import PlatformBadge from '../components/social/PlatformBadge'
import ExtendedFieldsPreview, { ExtendedFieldsBadge } from '../components/social/ExtendedFieldsPreview'
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
  const location = useLocation()
  const processedUrlRef = useRef(false)

  // General state
  const [query, setQuery] = useState('')
  const [modality, setModality] = useState('all')
  const [curationFilter, setCurationFilter] = useState('all')
  const [platformFilter, setPlatformFilter] = useState('all')
  const [extendedFieldsFilter, setExtendedFieldsFilter] = useState(false)
  const [hygieneFilter, setHygieneFilter] = useState(false)
  
  // Beta access state
  const [hasBetaAccess, setHasBetaAccess] = useState(false)

  // Modal state
  const [selected, setSelected] = useState(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [checkoutIdx, setCheckoutIdx] = useState(null)
  const [isSignInOpen, setSignInOpen] = useState(false)
  const [isProcessing, setProcessing] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [shareModalOpen, setShareModalOpen] = useState(false)
  const [datasetToShare, setDatasetToShare] = useState(null)

  // Data from Supabase
  const [datasets, setDatasets] = useState([])
  const [userPurchases, setUserPurchases] = useState([])
  const [isAdmin, setIsAdmin] = useState(false)

  // Set page title and meta tags for SEO
  useEffect(() => {
    document.title = 'Dataset Marketplace - Unique AI Training Data | Setique'
    
    // Update meta description
    const metaDescription = document.querySelector('meta[name="description"]')
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Browse unique AI training datasets curated by experts. Premium data for computer vision, NLP, audio, video, and text ML models. Discover specialized datasets you won\'t find anywhere else.')
    }
    
    // Update Open Graph tags
    const ogTitle = document.querySelector('meta[property="og:title"]')
    if (ogTitle) ogTitle.setAttribute('content', 'Dataset Marketplace - Setique')
    
    const ogDescription = document.querySelector('meta[property="og:description"]')
    if (ogDescription) ogDescription.setAttribute('content', 'Browse unique AI training datasets curated by experts. Premium data for ML and AI development.')
    
    // Update Twitter tags
    const twitterTitle = document.querySelector('meta[name="twitter:title"]')
    if (twitterTitle) twitterTitle.setAttribute('content', 'Dataset Marketplace - Setique')
    
    const twitterDescription = document.querySelector('meta[name="twitter:description"]')
    if (twitterDescription) twitterDescription.setAttribute('content', 'Browse unique AI training datasets curated by experts. Premium data for ML and AI development.')
    
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

  // Fetch datasets
  useEffect(() => {
    fetchDatasets()
    if (user) {
      fetchUserPurchases()
      checkAdminStatus()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const checkAdminStatus = async () => {
    if (!user) {
      setIsAdmin(false)
      return
    }

    try {
      const { data, error } = await supabase
        .from('admins')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()

      if (error || !data) {
        setIsAdmin(false)
      } else {
        setIsAdmin(true)
      }
    } catch (error) {
      handleSupabaseError(error, 'checkAdminStatus')
      setIsAdmin(false)
    }
  }

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
          .order('created_at', { ascending: false })
        
        data = simpleQuery.data
        error = simpleQuery.error
      }

      if (error) throw error
      setDatasets(data || [])
    } catch (error) {
      handleSupabaseError(error, 'fetchDatasets')
    }
  }

  const filtered = useMemo(
    () =>
      datasets.filter(
        (d) =>
          (d.title + d.description + d.tags.join(' '))
            .toLowerCase()
            .includes(query.toLowerCase()) &&
          (modality === 'all' || d.tags.some((tag) => tag === modality)) &&
          (curationFilter === 'all' || 
           curationFilter === 'verified' ? d.verified_by_curator === true :
           (d.curation_level || 'curated') === curationFilter) &&
          (platformFilter === 'all' || d.platform === platformFilter) &&
          (!extendedFieldsFilter || d.has_extended_fields === true) &&
          (!hygieneFilter || d.hygiene_passed === true)
      ),
    [datasets, query, modality, curationFilter, platformFilter, extendedFieldsFilter, hygieneFilter]
  )

  useEffect(() => {
    const isModalOpen = selected !== null || checkoutIdx !== null || isSignInOpen
    document.body.style.overflow = isModalOpen ? 'hidden' : 'unset'
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [selected, checkoutIdx, isSignInOpen])

  // Handle URL parameters for opening modal with specific dataset and tab
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search)
    const datasetId = searchParams.get('id')
    const tab = searchParams.get('tab')

    // Only process URL params once and when datasets are loaded
    if (datasetId && datasets.length > 0 && !processedUrlRef.current) {
      // Find the dataset index by ID
      const datasetIndex = datasets.findIndex(d => d.id === datasetId)
      if (datasetIndex !== -1) {
        setSelected(datasetIndex)
        // Set the active tab if specified (default to 'overview')
        if (tab && ['overview', 'comments', 'reviews'].includes(tab)) {
          setActiveTab(tab)
        } else {
          setActiveTab('overview')
        }
        // Mark URL as processed
        processedUrlRef.current = true
        // Clear URL params to clean up the URL bar
        window.history.replaceState({}, '', '/datasets')
      }
    }
    
    // Reset the ref when there's no ID in URL (user navigated away)
    if (!datasetId) {
      processedUrlRef.current = false
    }
  }, [location.search, datasets])

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
          
          {/* Curation Level Filters */}
          <div className="mb-6 bg-gradient-to-r from-yellow-100 via-pink-100 to-cyan-100 border-4 border-black rounded-xl p-4">
            <h3 className="font-extrabold text-sm mb-3">Filter by Curation Level:</h3>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setCurationFilter('all')}
                className={`px-4 py-2 font-bold rounded-full border-2 border-black transition-all ${
                  curationFilter === 'all'
                    ? 'bg-black text-white shadow-none'
                    : 'bg-white text-black shadow-[2px_2px_0_#000] hover:shadow-[4px_4px_0_#000]'
                }`}
              >
                🔥 All Datasets
              </button>
              <button
                onClick={() => setCurationFilter('curated')}
                className={`px-4 py-2 font-bold rounded-full border-2 border-black transition-all ${
                  curationFilter === 'curated'
                    ? 'bg-green-400 text-black shadow-none'
                    : 'bg-green-200 text-black shadow-[2px_2px_0_#000] hover:shadow-[4px_4px_0_#000]'
                }`}
              >
                🏷️ Curated
              </button>
              <button
                onClick={() => setCurationFilter('partial')}
                className={`px-4 py-2 font-bold rounded-full border-2 border-black transition-all ${
                  curationFilter === 'partial'
                    ? 'bg-yellow-400 text-black shadow-none'
                    : 'bg-yellow-200 text-black shadow-[2px_2px_0_#000] hover:shadow-[4px_4px_0_#000]'
                }`}
              >
                🔧 Partial
              </button>
              <button
                onClick={() => setCurationFilter('raw')}
                className={`px-4 py-2 font-bold rounded-full border-2 border-black transition-all ${
                  curationFilter === 'raw'
                    ? 'bg-orange-400 text-black shadow-none'
                    : 'bg-orange-200 text-black shadow-[2px_2px_0_#000] hover:shadow-[4px_4px_0_#000]'
                }`}
              >
                📦 Raw Data
              </button>
              <button
                onClick={() => setCurationFilter('verified')}
                className={`px-4 py-2 font-bold rounded-full border-2 border-black transition-all ${
                  curationFilter === 'verified'
                    ? 'bg-purple-400 text-white shadow-none'
                    : 'bg-purple-200 text-black shadow-[2px_2px_0_#000] hover:shadow-[4px_4px_0_#000]'
                }`}
              >
                🛡️ Verified Only
              </button>
            </div>
          </div>
          
          {/* Platform & Social Analytics Filters */}
          <div className="mb-6 bg-gradient-to-r from-cyan-100 via-purple-100 to-pink-100 border-4 border-black rounded-xl p-4">
            <h3 className="font-extrabold text-sm mb-3">Filter by Platform & Data Type:</h3>
            <div className="flex flex-wrap gap-2 mb-3">
              <button
                onClick={() => setPlatformFilter('all')}
                className={`px-4 py-2 font-bold rounded-full border-2 border-black transition-all ${
                  platformFilter === 'all'
                    ? 'bg-black text-white shadow-none'
                    : 'bg-white text-black shadow-[2px_2px_0_#000] hover:shadow-[4px_4px_0_#000]'
                }`}
              >
                📊 All Platforms
              </button>
              <button
                onClick={() => setPlatformFilter('tiktok')}
                className={`px-4 py-2 font-bold rounded-full border-2 border-black transition-all ${
                  platformFilter === 'tiktok'
                    ? 'bg-black text-white shadow-none'
                    : 'bg-gray-200 text-black shadow-[2px_2px_0_#000] hover:shadow-[4px_4px_0_#000]'
                }`}
              >
                🎵 TikTok
              </button>
              <button
                onClick={() => setPlatformFilter('youtube')}
                className={`px-4 py-2 font-bold rounded-full border-2 border-black transition-all ${
                  platformFilter === 'youtube'
                    ? 'bg-red-500 text-white shadow-none'
                    : 'bg-red-200 text-black shadow-[2px_2px_0_#000] hover:shadow-[4px_4px_0_#000]'
                }`}
              >
                ▶️ YouTube
              </button>
              <button
                onClick={() => setPlatformFilter('instagram')}
                className={`px-4 py-2 font-bold rounded-full border-2 border-black transition-all ${
                  platformFilter === 'instagram'
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-none'
                    : 'bg-pink-200 text-black shadow-[2px_2px_0_#000] hover:shadow-[4px_4px_0_#000]'
                }`}
              >
                📷 Instagram
              </button>
              <button
                onClick={() => setPlatformFilter('linkedin')}
                className={`px-4 py-2 font-bold rounded-full border-2 border-black transition-all ${
                  platformFilter === 'linkedin'
                    ? 'bg-blue-600 text-white shadow-none'
                    : 'bg-blue-200 text-black shadow-[2px_2px_0_#000] hover:shadow-[4px_4px_0_#000]'
                }`}
              >
                💼 LinkedIn
              </button>
              <button
                onClick={() => setPlatformFilter('shopify')}
                className={`px-4 py-2 font-bold rounded-full border-2 border-black transition-all ${
                  platformFilter === 'shopify'
                    ? 'bg-green-600 text-white shadow-none'
                    : 'bg-green-200 text-black shadow-[2px_2px_0_#000] hover:shadow-[4px_4px_0_#000]'
                }`}
              >
                🛍️ Shopify
              </button>
            </div>
            
            {/* Advanced Filters */}
            <div className="flex flex-wrap gap-2 pt-2 border-t-2 border-black/20">
              <button
                onClick={() => setExtendedFieldsFilter(!extendedFieldsFilter)}
                className={`px-3 py-1.5 text-sm font-bold rounded-full border-2 border-black transition-all ${
                  extendedFieldsFilter
                    ? 'bg-cyan-500 text-white shadow-none'
                    : 'bg-white text-black shadow-[2px_2px_0_#000] hover:shadow-[3px_3px_0_#000]'
                }`}
              >
                <Database className="inline w-3.5 h-3.5 mr-1" />
                Extended Fields Only
              </button>
              <button
                onClick={() => setHygieneFilter(!hygieneFilter)}
                className={`px-3 py-1.5 text-sm font-bold rounded-full border-2 border-black transition-all ${
                  hygieneFilter
                    ? 'bg-green-500 text-white shadow-none'
                    : 'bg-white text-black shadow-[2px_2px_0_#000] hover:shadow-[3px_3px_0_#000]'
                }`}
              >
                ✓ PII Hygiene Verified
              </button>
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
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h3 className="text-2xl font-extrabold text-black uppercase flex-1">
                      {d.title}
                    </h3>
                    <CurationLevelBadge 
                      level={d.curation_level || 'curated'} 
                      verified={d.verified_by_curator}
                      size="sm"
                    />
                  </div>
                    
                    {/* Rating display */}
                    {d.review_count > 0 && (
                      <div className="flex items-center gap-2 mt-2">
                        <StarRating 
                          rating={d.average_rating || 0} 
                          readonly 
                          size="sm" 
                        />
                        <span className="text-sm font-bold text-gray-700">
                          {(d.average_rating || 0).toFixed(1)}
                        </span>
                        <span className="text-xs text-gray-600">
                          ({d.review_count})
                        </span>
                      </div>
                    )}                    {d.dataset_partnerships?.[0]?.pro_curators && d.dataset_partnerships[0].status === 'active' && (
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
                    
                    {/* Platform & Social Analytics Badges */}
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      {d.platform && (
                        <PlatformBadge 
                          platform={d.platform} 
                          size="sm"
                          showIcon={true}
                          showName={true}
                        />
                      )}
                      {d.has_extended_fields && d.extended_field_count > 0 && (
                        <ExtendedFieldsBadge 
                          count={d.extended_field_count}
                          showCount={true}
                        />
                      )}
                      {d.hygiene_passed && (
                        <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 text-xs font-bold rounded-full border-2 border-green-600">
                          ✓ PII Clean
                        </span>
                      )}
                    </div>
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
                            ownerId={d.creator_id}
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
          onClick={() => {
            setSelected(null);
            setActiveTab('overview'); // Reset tab when closing
          }}
        >
          <div
            className="bg-white border-4 border-black rounded-3xl shadow-[12px_12px_0_#000] p-6 max-w-6xl w-full my-8 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header with rating */}
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-2xl font-extrabold text-black pr-8 mb-2">
                  {datasets[selected].title}
                </h2>
                {/* Average rating display */}
                {datasets[selected].review_count > 0 && (
                  <div className="flex items-center gap-2">
                    <StarRating 
                      rating={datasets[selected].average_rating || 0} 
                      readonly 
                      size="sm" 
                    />
                    <span className="text-sm font-bold text-gray-700">
                      {(datasets[selected].average_rating || 0).toFixed(1)}
                    </span>
                    <span className="text-sm text-gray-600">
                      ({datasets[selected].review_count} {datasets[selected].review_count === 1 ? 'review' : 'reviews'})
                    </span>
                  </div>
                )}
              </div>
              <button
                onClick={() => {
                  setSelected(null);
                  setActiveTab('overview');
                }}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Tabs */}
            <div className="border-b-4 border-black mb-6">
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`
                    px-6 py-3 font-bold text-sm relative
                    transition-colors
                    ${activeTab === 'overview' 
                      ? 'text-black' 
                      : 'text-gray-500 hover:text-gray-700'
                    }
                  `}
                >
                  Overview
                  {activeTab === 'overview' && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-yellow-400" />
                  )}
                </button>
                
                <button
                  onClick={() => setActiveTab('comments')}
                  className={`
                    px-6 py-3 font-bold text-sm relative
                    transition-colors
                    ${activeTab === 'comments' 
                      ? 'text-black' 
                      : 'text-gray-500 hover:text-gray-700'
                    }
                  `}
                >
                  Comments
                  {datasets[selected].comment_count > 0 && (
                    <span className="ml-1 text-xs">
                      ({datasets[selected].comment_count})
                    </span>
                  )}
                  {activeTab === 'comments' && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-yellow-400" />
                  )}
                </button>

                <button
                  onClick={() => setActiveTab('reviews')}
                  className={`
                    px-6 py-3 font-bold text-sm relative
                    transition-colors
                    ${activeTab === 'reviews' 
                      ? 'text-black' 
                      : 'text-gray-500 hover:text-gray-700'
                    }
                  `}
                >
                  Reviews
                  {datasets[selected].review_count > 0 && (
                    <span className="ml-1 text-xs">
                      ({datasets[selected].review_count})
                    </span>
                  )}
                  {activeTab === 'reviews' && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-yellow-400" />
                  )}
                </button>
              </div>
            </div>

            {/* Tab Content */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Dataset Details */}
                <div>
                  <h3 className="font-bold text-lg mb-2">Description</h3>
                  <p className="text-black/80 text-sm">{datasets[selected].description}</p>
                </div>
                
                <div>
                  <h3 className="font-bold text-lg mb-2">Categories</h3>
                  <div className="flex flex-wrap gap-2">
                    {datasets[selected].tags.map((t) => (
                      <span
                        key={t}
                        className="text-xs font-bold px-2 py-1 border-2 border-black rounded-full bg-yellow-200"
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Platform & Extended Fields (Social Analytics) */}
                {datasets[selected].platform && (
                  <div>
                    <h3 className="font-bold text-lg mb-2">Platform</h3>
                    <div className="flex items-center gap-3">
                      <PlatformBadge 
                        platform={datasets[selected].platform} 
                        size="lg"
                        showIcon={true}
                        showName={true}
                      />
                      {datasets[selected].data_type && (
                        <span className="text-sm font-semibold text-gray-600">
                          {datasets[selected].data_type === 'social_analytics' && '📊 Social Analytics Dataset'}
                          {datasets[selected].data_type === 'ecommerce' && '🛒 E-commerce Data'}
                          {datasets[selected].data_type === 'professional' && '💼 Professional Network Data'}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {datasets[selected].has_extended_fields && datasets[selected].extended_fields_list && (
                  <ExtendedFieldsPreview 
                    fields={datasets[selected].extended_fields_list}
                    count={datasets[selected].extended_field_count}
                    platform={datasets[selected].platform}
                    defaultExpanded={false}
                  />
                )}

                <div>
                  <h3 className="font-bold text-lg mb-2">Details</h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="bg-gray-50 border-2 border-black p-3 rounded-lg">
                      <p className="text-xs text-black/60 mb-1">Price</p>
                      <p className="font-bold text-lg">
                        {datasets[selected].price === 0
                          ? 'FREE'
                          : `$${datasets[selected].price}`}
                      </p>
                    </div>
                    <div className="bg-gray-50 border-2 border-black p-3 rounded-lg">
                      <p className="text-xs text-black/60 mb-1">File Size</p>
                      <p className="font-bold text-lg">{datasets[selected].file_size_mb} MB</p>
                    </div>
                  </div>
                </div>

                {/* Action Button */}
                <div className="pt-4">
                  {userOwnsDataset(datasets[selected].id) ? (
                    <button
                      onClick={() => navigate('/dashboard')}
                      className="w-full bg-green-400 text-black font-bold border-2 border-black rounded-full px-6 py-3 hover:bg-green-300 transition-colors text-sm"
                    >
                      View in Library
                    </button>
                  ) : !user ? (
                    <button
                      onClick={() => {
                        setSelected(null)
                        setSignInOpen(true)
                      }}
                      className="w-full bg-[linear-gradient(90deg,#00ffff,#ff00c3)] text-white font-bold border-2 border-black rounded-full px-6 py-3 hover:opacity-90 transition-opacity text-sm"
                    >
                      Sign Up to Buy
                    </button>
                  ) : !hasBetaAccess ? (
                    <button
                      onClick={() => navigate('/dashboard')}
                      className="w-full bg-yellow-400 text-black font-bold border-2 border-black rounded-full px-6 py-3 hover:bg-yellow-300 transition-colors text-sm"
                    >
                      Get Beta Access
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setCheckoutIdx(selected)
                        setSelected(null)
                      }}
                      className="w-full bg-[linear-gradient(90deg,#00ffff,#ff00c3)] text-white font-bold border-2 border-black rounded-full px-6 py-3 hover:opacity-90 transition-opacity text-sm"
                    >
                      {datasets[selected].price === 0 ? 'Get Free' : 'Buy Now'}
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Comments Tab */}
            {activeTab === 'comments' && (
              <DatasetComments
                datasetId={datasets[selected].id}
                datasetOwnerId={datasets[selected].creator_id}
                datasetTitle={datasets[selected].title}
                currentUserId={user?.id}
                isAdmin={isAdmin}
                initialCommentCount={datasets[selected].comment_count || 0}
              />
            )}

            {/* Reviews Tab */}
            {activeTab === 'reviews' && (
              <DatasetReviews
                datasetId={datasets[selected].id}
                currentUser={user}
                isOwner={user?.id === datasets[selected].creator_id}
              />
            )}
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
