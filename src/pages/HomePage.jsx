import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { stripePromise } from '../lib/stripe'
import { SignInModal } from '../components/SignInModal'
import { BountySubmissionModal } from '../components/BountySubmissionModal'
import { AIAssistant } from '../components/AIAssistant'
import { TagInput } from '../components/TagInput'
import {
  Star,
  Database,
  Zap,
  X,
  Search,
  Archive,
  CircleDollarSign,
  BrainCircuit,
  LogOut,
  User,
} from '../components/Icons'

const badgeColors = {
  verified: 'bg-blue-100 text-blue-800 border-blue-800',
  expert: 'bg-purple-100 text-purple-800 border-purple-800',
  master: 'bg-yellow-100 text-yellow-800 border-yellow-800'
};

function HomePage() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  // General state
  const [query, setQuery] = useState('')
  const [modality, setModality] = useState('all')

  // Modal state
  const [selected, setSelected] = useState(null)
  const [selectedBounty, setSelectedBounty] = useState(null)
  const [submissionBounty, setSubmissionBounty] = useState(null)
  const [checkoutIdx, setCheckoutIdx] = useState(null)
  const [isSignInOpen, setSignInOpen] = useState(false)
  const [isProcessing, setProcessing] = useState(false)

  // Creator form state with localStorage persistence
  const [newTitle, setNewTitle] = useState(() => {
    return localStorage.getItem('draft_dataset_title') || ''
  })
  const [newDesc, setNewDesc] = useState(() => {
    return localStorage.getItem('draft_dataset_desc') || ''
  })
  const [newPrice, setNewPrice] = useState(() => {
    return localStorage.getItem('draft_dataset_price') || ''
  })
  const [newModality, setNewModality] = useState(() => {
    return localStorage.getItem('draft_dataset_modality') || 'vision'
  })
  const [newTags, setNewTags] = useState(() => {
    const saved = localStorage.getItem('draft_dataset_tags')
    return saved ? JSON.parse(saved) : []
  })
  
  // Auto-save form to localStorage
  useEffect(() => {
    localStorage.setItem('draft_dataset_title', newTitle)
  }, [newTitle])
  
  useEffect(() => {
    localStorage.setItem('draft_dataset_desc', newDesc)
  }, [newDesc])
  
  useEffect(() => {
    localStorage.setItem('draft_dataset_price', newPrice)
  }, [newPrice])
  
  useEffect(() => {
    localStorage.setItem('draft_dataset_modality', newModality)
  }, [newModality])
  
  useEffect(() => {
    localStorage.setItem('draft_dataset_tags', JSON.stringify(newTags))
  }, [newTags])
  
  // File upload state
  const [uploadFile, setUploadFile] = useState(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadError, setUploadError] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  
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
  
  // Allow price = 0 for demo datasets
  const numericNewPrice = newPrice === '' ? NaN : parseFloat(newPrice)
  const isCreatorFormValid =
    newTitle.trim() !== '' && newDesc.trim() !== '' && !isNaN(numericNewPrice) && numericNewPrice >= 0 && uploadFile !== null

  // Bounty form state with localStorage persistence
  const [bountyTitle, setBountyTitle] = useState(() => {
    return localStorage.getItem('draft_bounty_title') || ''
  })
  const [bountyDesc, setBountyDesc] = useState(() => {
    return localStorage.getItem('draft_bounty_desc') || ''
  })
  const [bountyModality, setBountyModality] = useState(() => {
    return localStorage.getItem('draft_bounty_modality') || 'image'
  })
  const [bountyQuantity, setBountyQuantity] = useState(() => {
    return localStorage.getItem('draft_bounty_quantity') || ''
  })
  const [bountyBudget, setBountyBudget] = useState(() => {
    return localStorage.getItem('draft_bounty_budget') || ''
  })
  const [bountyTags, setBountyTags] = useState(() => {
    const saved = localStorage.getItem('draft_bounty_tags')
    return saved ? JSON.parse(saved) : []
  })
  const [bountyDeadline, setBountyDeadline] = useState(() => {
    return localStorage.getItem('draft_bounty_deadline') || ''
  })
  
  // Auto-save bounty form to localStorage
  useEffect(() => {
    localStorage.setItem('draft_bounty_title', bountyTitle)
  }, [bountyTitle])
  
  useEffect(() => {
    localStorage.setItem('draft_bounty_desc', bountyDesc)
  }, [bountyDesc])
  
  useEffect(() => {
    localStorage.setItem('draft_bounty_modality', bountyModality)
  }, [bountyModality])
  
  useEffect(() => {
    localStorage.setItem('draft_bounty_quantity', bountyQuantity)
  }, [bountyQuantity])
  
  useEffect(() => {
    localStorage.setItem('draft_bounty_budget', bountyBudget)
  }, [bountyBudget])
  
  useEffect(() => {
    localStorage.setItem('draft_bounty_tags', JSON.stringify(bountyTags))
  }, [bountyTags])
  
  useEffect(() => {
    localStorage.setItem('draft_bounty_deadline', bountyDeadline)
  }, [bountyDeadline])
  
  const isBountyFormValid =
    bountyTitle.trim() && bountyBudget && bountyTags.length > 0

  // Data from Supabase
  const [datasets, setDatasets] = useState([])
  const [bounties, setBounties] = useState([])
  const [topCurators, setTopCurators] = useState([])
  const [userPurchases, setUserPurchases] = useState([])
  const [loading, setLoading] = useState(true)

  // Fetch datasets
  useEffect(() => {
    fetchDatasets()
    fetchBounties()
    fetchTopCurators()
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
    } finally {
      setLoading(false)
    }
  }

  const fetchBounties = async () => {
    try {
      const { data, error } = await supabase
        .from('curation_requests')
        .select('*')
        .eq('status', 'open')
        .order('created_at', { ascending: false })
        .limit(10)

      if (error) throw error
      
      // Fetch creator profiles for each bounty
      if (data && data.length > 0) {
        const creatorIds = [...new Set(data.map(b => b.creator_id).filter(Boolean))];
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, username')
          .in('id', creatorIds);
        
        // Attach profile data
        const bountiesWithProfiles = data.map(bounty => ({
          ...bounty,
          profiles: profilesData?.find(p => p.id === bounty.creator_id),
          // Map to old format for UI compatibility
          budget: bounty.budget_max || bounty.budget_min,
          modality: bounty.modality || 'data'
        }));
        
        setBounties(bountiesWithProfiles);
      } else {
        setBounties([]);
      }
    } catch (error) {
      console.error('Error fetching bounties:', error)
    }
  }

  const fetchTopCurators = async () => {
    try {
      const { data, error } = await supabase
        .from('datasets')
        .select('creator_id, profiles:creator_id(username), price, purchase_count')

      if (error) throw error

      // Calculate earnings per curator
      const curatorMap = {}
      data.forEach((dataset) => {
        const username = dataset.profiles?.username || 'Anonymous'
        if (!curatorMap[username]) {
          curatorMap[username] = 0
        }
        curatorMap[username] += dataset.price * dataset.purchase_count
      })

      // Convert to array and sort
      const curators = Object.entries(curatorMap)
        .map(([name, earnings]) => ({ name, earnings }))
        .sort((a, b) => b.earnings - a.earnings)
        .slice(0, 3)

      setTopCurators(curators)
    } catch (error) {
      console.error('Error fetching top curators:', error)
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

  // Validate file type based on modality
  const validateFile = (file, modality) => {
    const allowedTypes = {
      vision: ['image/jpeg', 'image/png', 'application/zip', 'application/x-tar', 'application/gzip'],
      audio: ['audio/mpeg', 'audio/wav', 'audio/flac', 'application/zip'],
      text: ['text/csv', 'application/json', 'application/zip', 'text/plain'],
      video: ['video/mp4', 'video/quicktime', 'application/zip'],
      nlp: ['text/csv', 'application/json', 'application/zip']
    }
    
    const allowed = allowedTypes[modality] || []
    const maxSize = 500 * 1024 * 1024 // 500MB
    
    if (!allowed.includes(file.type) && file.type !== '') {
      return `Invalid file type for ${modality}. Allowed: ${allowed.join(', ')}`
    }
    
    if (file.size > maxSize) {
      return `File too large. Maximum size is 500MB. Your file: ${(file.size / (1024 * 1024)).toFixed(2)}MB`
    }
    
    return null
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    
    const error = validateFile(file, newModality)
    if (error) {
      setUploadError(error)
      setUploadFile(null)
      return
    }
    
    setUploadFile(file)
    setUploadError('')
  }

  const handlePublish = async () => {
    if (!user) {
      setSignInOpen(true)
      return
    }

    if (!uploadFile) {
      alert('Please select a file to upload')
      return
    }

    setIsUploading(true)
    setUploadProgress(0)
    
    try {
      // Upload file to Supabase Storage
      const fileExt = uploadFile.name.split('.').pop()
      const fileName = `${user.id}/${Date.now()}.${fileExt}`
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('datasets')
        .upload(fileName, uploadFile, {
          cacheControl: '3600',
          upsert: false,
          onUploadProgress: (progress) => {
            const percentage = (progress.loaded / progress.total) * 100
            setUploadProgress(Math.round(percentage))
          }
        })

      if (uploadError) throw uploadError

      // Create dataset record with storage path
      const { error } = await supabase.from('datasets').insert([
        {
          creator_id: user.id,
          title: newTitle,
          description: newDesc,
          price: isNaN(numericNewPrice) ? 0 : numericNewPrice,
          modality: newModality,
          tags: newTags,
          accent_color: getAccentColor(newModality),
          download_url: uploadData.path,
          file_size: uploadFile.size,
          is_active: true,
        },
      ])

      if (error) throw error

      alert(
        `Published "${newTitle}"! Your dataset is now live on the marketplace.`
      )
      
      // Reset form and clear localStorage draft
      setNewTitle('')
      setNewDesc('')
      setNewPrice('')
      setNewTags([])
      setUploadFile(null)
      setUploadProgress(0)
      localStorage.removeItem('draft_dataset_title')
      localStorage.removeItem('draft_dataset_desc')
      localStorage.removeItem('draft_dataset_price')
      localStorage.removeItem('draft_dataset_modality')
      localStorage.removeItem('draft_dataset_tags')
      
      fetchDatasets()
    } catch (error) {
      console.error('Error publishing dataset:', error)
      alert('Error publishing dataset: ' + error.message)
    } finally {
      setIsUploading(false)
    }
  }

  const getAccentColor = (mod) => {
    const colors = {
      vision: 'bg-yellow-200',
      audio: 'bg-cyan-200',
      text: 'bg-pink-200',
      video: 'bg-yellow-200',
      nlp: 'bg-pink-200',
    }
    return colors[mod] || 'bg-yellow-200'
  }

  const handleCheckout = async () => {
    if (!user) {
      setSignInOpen(true)
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

  const handleBountyPost = async () => {
    if (!user) {
      setSignInOpen(true)
      return
    }

    try {
      // Insert into curation_requests (new system)
      const { error } = await supabase.from('curation_requests').insert([
        {
          creator_id: user.id,
          title: bountyTitle,
          description: bountyDesc,
          modality: bountyModality,
          budget_min: parseFloat(bountyBudget) * 0.8, // Set min to 80% of budget
          budget_max: parseFloat(bountyBudget),
          status: 'open',
          target_quality: 'standard',
          specialties_needed: bountyTags,
        },
      ])

      if (error) throw error

      alert(
        `Bounty "${bountyTitle}" posted with a budget of $${bountyBudget}!`
      )
      setBountyTitle('')
      setBountyDesc('')
      setBountyQuantity('')
      setBountyBudget('')
      setBountyTags([])
      setBountyDeadline('')
      localStorage.removeItem('draft_bounty_title')
      localStorage.removeItem('draft_bounty_desc')
      localStorage.removeItem('draft_bounty_modality')
      localStorage.removeItem('draft_bounty_quantity')
      localStorage.removeItem('draft_bounty_budget')
      localStorage.removeItem('draft_bounty_tags')
      localStorage.removeItem('draft_bounty_deadline')
      fetchBounties()
    } catch (error) {
      console.error('Error posting bounty:', error)
      alert('Error posting bounty: ' + error.message)
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
                Platform in active development. All transactions in test mode. 
                <a 
                  href="mailto:joseph@anconsulting.us" 
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

      <header className="flex flex-col sm:flex-row items-center justify-between mb-12">
        <a
          href="#"
          className="text-5xl font-extrabold tracking-tighter text-black bg-[linear-gradient(90deg,#ff00c3,#00ffff,#ffea00)] bg-clip-text text-transparent drop-shadow-[2px_2px_0_#000] mb-4 sm:mb-0 no-underline"
        >
          SETIQUE
        </a>
        <nav className="flex items-center gap-4">
          <a
            href="#marketplace"
            className="font-bold text-black hover:text-pink-600 transition"
          >
            Marketplace
          </a>
          <a
            href="#bounties"
            className="font-bold text-black hover:text-pink-600 transition"
          >
            Bounties
          </a>
          {user ? (
            <>
              <button
                onClick={() => navigate('/dashboard')}
                className="font-bold text-black hover:text-cyan-600 transition flex items-center gap-1"
              >
                <User className="h-4 w-4" />
                Dashboard
              </button>
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
            onClick={() => {
              const email = 'joseph@anconsulting.us'
              const subject = 'Setique Beta Feedback'
              const mailtoLink = `mailto:${email}?subject=${encodeURIComponent(subject)}`
              
              // Try to open mailto link
              window.location.href = mailtoLink
              
              // Also show alert with email address as backup
              setTimeout(() => {
                alert(`Send feedback to: ${email}\n\nSubject: ${subject}\n\nIf your email client didn't open, please email us directly at the address above.`)
              }, 500)
            }}
            className="bg-cyan-400 hover:bg-cyan-300 text-black font-extrabold px-4 py-2 rounded-full border-2 border-black shadow-[3px_3px_0_#000] hover:shadow-[4px_4px_0_#000] transition-all text-sm flex items-center gap-2"
            aria-label="Send beta feedback"
          >
            <span className="text-lg">💬</span>
            <span className="hidden sm:inline">Feedback</span>
          </button>
          <a
            href="#pro-curator"
            className="bg-[linear-gradient(90deg,#ff00c3,#00ffff)] text-white font-bold hover:opacity-90 transition px-5 py-2 rounded-full shadow-lg border-2 border-black text-sm active:scale-95"
          >
            Pro Curator
          </a>
        </nav>
      </header>

      <main>
        <section id="hero" className="text-center max-w-5xl mx-auto mb-16">
          <h2 className="text-5xl md:text-8xl font-extrabold mb-6 leading-tight text-black drop-shadow-[4px_4px_0_#fff]">
            Unique Data.
            <br /> Better AI.
          </h2>
          <p className="text-lg sm:text-2xl text-black/80 font-semibold mb-12">
            A marketplace where everyday creators monetize their expertise and AI builders
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
                You&apos;re the expert—set your price and earn 80% per sale. Pro Curators
                ensure quality and earn 40% ongoing. Build your reputation in the community.
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
                  🤔 What is Data Curation?
                </h4>
                <p className="font-semibold text-black/80 mb-3">
                  Data curation is the process of organizing, annotating, and packaging information 
                  so that AI models can learn from it. Think of yourself as a librarian for AI—you're 
                  collecting and labeling examples that teach machines about the world.
                </p>
                <div className="bg-white border-2 border-black rounded-xl p-4">
                  <p className="font-bold mb-2">💡 Example:</p>
                  <p className="font-semibold text-sm">
                    Instead of just having 100 cat photos, a curated dataset has 100 cat photos with 
                    labels like "breed: tabby, pose: sitting, mood: grumpy". This context makes the 
                    data valuable for training AI.
                  </p>
                </div>
              </div>

              {/* Types of Data You Can Curate */}
              <div>
                <h4 className="text-2xl font-extrabold mb-3 text-black">
                  🎨 What Kind of Data Can I Curate?
                </h4>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-yellow-200 border-2 border-black rounded-xl p-4">
                    <div className="font-extrabold text-lg mb-2">📸 Vision/Image</div>
                    <ul className="text-sm font-semibold space-y-1 list-disc list-inside">
                      <li>Photos of specific objects, places, or events</li>
                      <li>Annotated images with bounding boxes</li>
                      <li>Image pairs (before/after, style transfers)</li>
                    </ul>
                  </div>
                  <div className="bg-cyan-200 border-2 border-black rounded-xl p-4">
                    <div className="font-extrabold text-lg mb-2">🎵 Audio</div>
                    <ul className="text-sm font-semibold space-y-1 list-disc list-inside">
                      <li>Sound effects labeled by category</li>
                      <li>Voice recordings with transcripts</li>
                      <li>Music samples tagged by genre/mood</li>
                    </ul>
                  </div>
                  <div className="bg-pink-200 border-2 border-black rounded-xl p-4">
                    <div className="font-extrabold text-lg mb-2">📝 Text/NLP</div>
                    <ul className="text-sm font-semibold space-y-1 list-disc list-inside">
                      <li>Conversation examples (Q&A pairs)</li>
                      <li>Labeled text for sentiment/intent</li>
                      <li>Domain-specific writing samples</li>
                    </ul>
                  </div>
                  <div className="bg-yellow-200 border-2 border-black rounded-xl p-4">
                    <div className="font-extrabold text-lg mb-2">🎬 Video</div>
                    <ul className="text-sm font-semibold space-y-1 list-disc list-inside">
                      <li>Video clips with scene descriptions</li>
                      <li>Action recognition datasets</li>
                      <li>Timestamped event annotations</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Step by Step Guide */}
              <div>
                <h4 className="text-2xl font-extrabold mb-4 text-black">
                  🛠️ How to Create Your First Dataset
                </h4>
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-[linear-gradient(90deg,#ff00c3,#00ffff)] rounded-full flex items-center justify-center border-2 border-black font-extrabold text-white text-xl">
                      1
                    </div>
                    <div>
                      <div className="font-extrabold text-lg mb-1">Choose Your Niche</div>
                      <p className="font-semibold text-sm text-black/80">
                        Pick something you know deeply or have access to. The more specific, the better. 
                        "Photos of dogs" is generic. "Photos of rare Australian shepherd coat patterns" 
                        is valuable.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-[linear-gradient(90deg,#ff00c3,#00ffff)] rounded-full flex items-center justify-center border-2 border-black font-extrabold text-white text-xl">
                      2
                    </div>
                    <div>
                      <div className="font-extrabold text-lg mb-1">Collect Your Data</div>
                      <p className="font-semibold text-sm text-black/80">
                        Gather your raw materials: photos, audio files, text documents, etc. Aim for 
                        consistency in quality and format. 50-100 high-quality examples are better than 
                        1,000 low-quality ones.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-[linear-gradient(90deg,#ff00c3,#00ffff)] rounded-full flex items-center justify-center border-2 border-black font-extrabold text-white text-xl">
                      3
                    </div>
                    <div>
                      <div className="font-extrabold text-lg mb-1">Add Annotations</div>
                      <p className="font-semibold text-sm text-black/80 mb-2">
                        Create a simple CSV or JSON file that labels your data. Each row should describe 
                        one file with relevant metadata.
                      </p>
                      <div className="bg-black text-yellow-200 font-mono text-xs p-3 rounded border-2 border-black">
                        filename,label,color,size<br/>
                        dog_001.jpg,australian_shepherd,blue_merle,medium<br/>
                        dog_002.jpg,australian_shepherd,red_tri,large
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-[linear-gradient(90deg,#ff00c3,#00ffff)] rounded-full flex items-center justify-center border-2 border-black font-extrabold text-white text-xl">
                      4
                    </div>
                    <div>
                      <div className="font-extrabold text-lg mb-1">Package It Up</div>
                      <p className="font-semibold text-sm text-black/80">
                        Create a ZIP file containing your data files and annotation file. Add a README.txt 
                        explaining what's inside, how to use it, and any licensing information.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-[linear-gradient(90deg,#ff00c3,#00ffff)] rounded-full flex items-center justify-center border-2 border-black font-extrabold text-white text-xl">
                      5
                    </div>
                    <div>
                      <div className="font-extrabold text-lg mb-1">Set Your Price & Publish</div>
                      <p className="font-semibold text-sm text-black/80">
                        Consider the time invested, rarity of the data, and what similar datasets cost. 
                        Niche datasets with good annotations typically sell for $50-$500. Upload your ZIP 
                        file below and you're live!
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quality Tips */}
              <div>
                <h4 className="text-2xl font-extrabold mb-3 text-black">
                  ⭐ Tips for High-Quality Datasets
                </h4>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-white border-2 border-black rounded-xl p-4">
                    <div className="text-2xl mb-2">✅</div>
                    <ul className="text-sm font-semibold space-y-2">
                      <li><strong>Be Consistent:</strong> Use the same naming convention and format</li>
                      <li><strong>Be Thorough:</strong> Label all important attributes</li>
                      <li><strong>Be Honest:</strong> Clearly state data limitations</li>
                      <li><strong>Include Samples:</strong> Show 2-3 example rows</li>
                    </ul>
                  </div>
                  <div className="bg-white border-2 border-black rounded-xl p-4">
                    <div className="text-2xl mb-2">❌</div>
                    <ul className="text-sm font-semibold space-y-2">
                      <li><strong>Don't Mix Quality:</strong> Keep standards uniform</li>
                      <li><strong>Don't Skip Documentation:</strong> Always explain your schema</li>
                      <li><strong>Don't Use Copyrighted Material:</strong> Only share what you own</li>
                      <li><strong>Don't Rush:</strong> Quality over quantity always</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Common Questions */}
              <div>
                <h4 className="text-2xl font-extrabold mb-3 text-black">
                  ❓ Common Questions
                </h4>
                <div className="space-y-3">
                  <details className="bg-white border-2 border-black rounded-xl p-4 cursor-pointer">
                    <summary className="font-extrabold">How big should my dataset be?</summary>
                    <p className="font-semibold text-sm mt-2 text-black/80">
                      Start small! 50-200 well-curated examples are often enough for fine-tuning. 
                      Quality and proper labeling matter more than quantity.
                    </p>
                  </details>
                  <details className="bg-white border-2 border-black rounded-xl p-4 cursor-pointer">
                    <summary className="font-extrabold">What tools do I need?</summary>
                    <p className="font-semibold text-sm mt-2 text-black/80">
                      Just Excel/Google Sheets for CSV annotations, a text editor for JSON, and any 
                      ZIP tool. For images, tools like LabelImg (free) help with bounding boxes.
                    </p>
                  </details>
                  <details className="bg-white border-2 border-black rounded-xl p-4 cursor-pointer">
                    <summary className="font-extrabold">Can I update my dataset after publishing?</summary>
                    <p className="font-semibold text-sm mt-2 text-black/80">
                      Not yet, but this feature is coming soon! For now, ensure your dataset is complete 
                      before publishing. You can always create v2 as a new listing.
                    </p>
                  </details>
                  <details className="bg-white border-2 border-black rounded-xl p-4 cursor-pointer">
                    <summary className="font-extrabold">What if I don't have data but have an idea?</summary>
                    <p className="font-semibold text-sm mt-2 text-black/80">
                      Post a bounty! Scroll down to the "Commission a Custom Dataset" section and 
                      offer a reward for curators to build exactly what you need.
                    </p>
                  </details>
                </div>
              </div>

              <div className="text-center pt-4">
                <a
                  href="#curator-form"
                  className="inline-block bg-[linear-gradient(90deg,#ffea00,#00ffff)] text-black font-extrabold text-lg px-12 py-4 rounded-full border-4 border-black hover:scale-105 transition-transform shadow-xl active:scale-100"
                >
                  Ready to Create Your Dataset →
                </a>
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

        {/* Curator Form Section */}
        <section id="curator-form" className="max-w-4xl mx-auto mb-24 pt-10">
          <div className="bg-yellow-200 border-4 border-black rounded-3xl shadow-[8px_8px_0_#000] overflow-hidden">
            <div className="bg-[linear-gradient(90deg,#ff00c3,#00ffff)] p-6 border-b-4 border-black">
              <h3 className="text-3xl font-extrabold text-white drop-shadow-[2px_2px_0_#000]">
                Become a Data Curator
              </h3>
            </div>
            <div className="space-y-6 p-6 text-black">
              <input
                placeholder="Dataset Title (e.g., 'A Photographic Archive of Brutalist Architecture in Pittsburgh')"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full bg-white border-2 border-black rounded-md font-semibold p-3"
              />
              <textarea
                placeholder="Describe your collection's unique value. What story does it tell? Why is it essential for building a more interesting AI?"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                className="w-full bg-white border-2 border-black rounded-md font-semibold p-3"
                rows="3"
              />
              <input
                type="number"
                placeholder="Your Price (USD)"
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
                className="w-full bg-white border-2 border-black rounded-md font-semibold p-3"
              />
              <select
                value={newModality}
                onChange={(e) => setNewModality(e.target.value)}
                className="w-full bg-white border-2 border-black rounded-md font-semibold p-3"
              >
                <option value="vision">Vision/Image</option>
                <option value="audio">Audio</option>
                <option value="text">Text</option>
                <option value="video">Video</option>
                <option value="nlp">NLP</option>
              </select>
              <div>
                <label className="font-bold mb-2 block">Tags</label>
                <TagInput tags={newTags} setTags={setNewTags} />
              </div>
              
              {/* File Upload */}
              <div>
                <label className="font-bold mb-2 block">Dataset File</label>
                <input
                  type="file"
                  onChange={handleFileChange}
                  className="w-full bg-white border-2 border-black rounded-md font-semibold p-3"
                  accept=".csv,.json,.zip,.tar,.gz,.mp3,.wav,.flac,.mp4,.mov,.jpg,.jpeg,.png,.txt"
                />
                {uploadFile && (
                  <p className="text-sm mt-2 font-semibold">
                    Selected: {uploadFile.name} ({(uploadFile.size / (1024 * 1024)).toFixed(2)}MB)
                  </p>
                )}
                {uploadError && (
                  <p className="text-sm mt-2 font-bold text-red-600">
                    ⚠️ {uploadError}
                  </p>
                )}
                {isUploading && (
                  <div className="mt-3">
                    <div className="w-full bg-white border-2 border-black rounded-full h-6 overflow-hidden">
                      <div
                        className="bg-[linear-gradient(90deg,#00ffff,#ff00c3)] h-full transition-all duration-300 flex items-center justify-center text-xs font-bold"
                        style={{ width: `${uploadProgress}%` }}
                      >
                        {uploadProgress}%
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              <button
                onClick={handlePublish}
                disabled={!isCreatorFormValid || isUploading}
                className="w-full bg-[linear-gradient(90deg,#ffea00,#00ffff)] text-black font-extrabold py-4 rounded-full border-4 border-black hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100 active:scale-100"
              >
                {isUploading ? `Uploading... ${uploadProgress}%` : 'Publish to Marketplace'}
              </button>
            </div>
          </div>
        </section>

        {/* Featured Section */}
        {datasets.length > 0 && (
          <section id="featured" className="max-w-7xl mx-auto mb-24">
            <h3 className="text-4xl sm:text-5xl font-extrabold mb-8 text-black drop-shadow-[3px_3px_0_#fff] text-center">
              Featured Collections
            </h3>
            <div className="grid lg:grid-cols-2 gap-10">
              {datasets.slice(0, 2).map((d, idx) => (
                <div
                  key={d.id}
                  className={`${d.accent_color} border-4 border-black rounded-3xl shadow-[8px_8px_0_#000] p-6 flex flex-col sm:flex-row gap-6 items-center`}
                >
                  <div className="text-5xl">
                    {idx === 0 ? '🏛️' : '⌨️'}
                  </div>
                  <div>
                    <div className="text-xs font-extrabold uppercase bg-white/50 px-2 py-1 inline-block rounded-full border-2 border-black mb-2">
                      Featured
                    </div>
                    <h4 className="text-2xl font-extrabold mb-2">{d.title}</h4>
                    <p className="font-semibold text-black/80">{d.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Marketplace Section */}
        <section id="marketplace" className="max-w-7xl mx-auto mb-24 pt-10">
          <h3 className="text-4xl sm:text-5xl font-extrabold mb-6 text-black drop-shadow-[3px_3px_0_#fff] flex items-center justify-center sm:justify-start gap-3">
            <Database className="h-10 w-10 text-pink-600" /> The Marketplace
          </h3>
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
          </div>
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
                    <div className="flex items-center justify-between gap-2 mt-auto">
                      <div className="flex items-center gap-2">
                        <div className="bg-yellow-400 text-black font-bold border-2 border-black px-3 py-1 rounded-full shadow">
                          {d.price === 0 ? 'FREE' : `$${d.price}`}
                        </div>
                        {userOwnsDataset(d.id) && (
                          <div className="bg-green-400 text-black font-bold border-2 border-black px-3 py-1 rounded-full shadow text-xs">
                            ✓ Owned
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setSelected(datasets.indexOf(d))}
                          className="bg-white text-black font-extrabold border-2 border-black rounded-full px-4 py-2 hover:bg-yellow-200 text-sm transition-colors active:scale-95"
                        >
                          Details
                        </button>
                        {userOwnsDataset(d.id) ? (
                          <button
                            onClick={() => navigate('/dashboard')}
                            className="bg-green-400 text-black font-bold border-2 border-black rounded-full px-4 py-2 hover:bg-green-300 text-sm transition-colors active:scale-95"
                          >
                            View in Library
                          </button>
                        ) : (
                          <button
                            onClick={() => setCheckoutIdx(datasets.indexOf(d))}
                            className="bg-[linear-gradient(90deg,#00ffff,#ff00c3)] text-white font-bold border-2 border-black rounded-full px-4 py-2 hover:opacity-90 text-sm transition-opacity active:scale-95"
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

        {/* Bounties Section - Continued in next part */}
        <section id="bounties" className="max-w-5xl mx-auto mb-24 pt-10">
          <div className="bg-white border-4 border-black rounded-3xl shadow-[8px_8px_0_#000]">
            <div className="p-6 border-b-4 border-black bg-gradient-to-r from-yellow-300 to-pink-300">
              <h3 className="text-4xl font-extrabold text-black">
                Commission a Custom Dataset
              </h3>
              <p className="font-semibold text-black/80 mt-1">
                Post a bounty and have our community of curators build the exact
                dataset your AI model needs.
              </p>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-6">
                <div className="lg:col-span-2 space-y-2">
                  <label className="font-extrabold text-lg">Bounty Title</label>
                  <input
                    value={bountyTitle}
                    onChange={(e) => setBountyTitle(e.target.value)}
                    className="w-full bg-white border-2 border-black font-semibold p-3 rounded-md"
                    placeholder="e.g., 1,000 Photos of Ugly Holiday Sweaters"
                  />
                </div>
                <div className="lg:col-span-2 space-y-2">
                  <label className="font-extrabold text-lg">
                    Detailed Description
                  </label>
                  <textarea
                    value={bountyDesc}
                    onChange={(e) => setBountyDesc(e.target.value)}
                    className="w-full bg-white border-2 border-black font-semibold p-3 rounded-md"
                    rows="4"
                    placeholder="Describe what you need. What are the key characteristics? What makes a submission good or bad? Provide context."
                  />
                </div>

                <div className="space-y-2">
                  <label className="font-extrabold text-lg">Data Modality</label>
                  <select
                    value={bountyModality}
                    onChange={(e) => setBountyModality(e.target.value)}
                    className="w-full bg-white border-2 border-black font-semibold p-3 rounded-md"
                  >
                    <option value="image">Image</option>
                    <option value="audio">Audio</option>
                    <option value="text">Text</option>
                    <option value="video">Video</option>
                    <option value="tabular">Tabular (CSV/JSON)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="font-extrabold text-lg">
                    Required Quantity
                  </label>
                  <input
                    value={bountyQuantity}
                    onChange={(e) => setBountyQuantity(e.target.value)}
                    className="w-full bg-white border-2 border-black font-semibold p-3 rounded-md"
                    placeholder="e.g., 1,000 images"
                  />
                </div>
                <div className="lg:col-span-2 space-y-2">
                  <label className="font-extrabold text-lg">
                    Labels / Tags (Press Enter to add)
                  </label>
                  <TagInput tags={bountyTags} setTags={setBountyTags} />
                </div>

                <div className="space-y-2">
                  <label className="font-extrabold text-lg">Budget (USD)</label>
                  <input
                    type="number"
                    value={bountyBudget}
                    onChange={(e) => setBountyBudget(e.target.value)}
                    className="w-full bg-white border-2 border-black font-semibold p-3 rounded-md"
                    placeholder="e.g., 500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="font-extrabold text-lg">Deadline</label>
                  <input
                    type="date"
                    value={bountyDeadline}
                    onChange={(e) => setBountyDeadline(e.target.value)}
                    className="w-full bg-white border-2 border-black font-semibold p-3 rounded-md"
                  />
                </div>
              </div>
              <button
                onClick={handleBountyPost}
                disabled={!isBountyFormValid}
                className="w-full mt-6 bg-[linear-gradient(90deg,#00ffff,#ff00c3,#ffea00)] text-black font-extrabold text-lg px-8 py-4 rounded-full border-4 border-black hover:scale-105 transition-transform active:scale-100 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
              >
                Post Bounty
              </button>
            </div>
          </div>

          <div className="mt-12">
            <h4 className="text-3xl font-extrabold mb-4 text-black drop-shadow-[2px_2px_0_#fff]">
              Active Bounties
            </h4>
            <div className="space-y-4">
              {bounties.length > 0 ? (
                bounties.map((bounty, idx) => (
                  <div
                    key={bounty.id}
                    onClick={() => setSelectedBounty(idx)}
                    className="bg-white/50 border-2 border-black rounded-xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 cursor-pointer hover:bg-yellow-200/50 transition"
                  >
                    <div>
                      <span className="text-xs font-extrabold px-2 py-1 border-2 border-black rounded-full bg-cyan-200 uppercase">
                        {bounty.modality}
                      </span>
                      <h5 className="font-extrabold text-lg mt-2">
                        {bounty.title.startsWith('(DEMO)') ? bounty.title : bounty.title}
                      </h5>
                      <p className="text-sm text-black/70 font-semibold">
                        {bounty.description.substring(0, 100)}...
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="font-extrabold text-2xl">
                        ${bounty.budget}
                      </div>
                      {bounty.quantity && (
                        <div className="font-semibold text-sm">
                          for {bounty.quantity}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center font-semibold text-black/70">
                  No active bounties yet. Be the first to post one!
                </p>
              )}
            </div>
          </div>
        </section>

        {/* Leaderboard */}
        {topCurators.length > 0 && (
          <section id="leaderboard" className="max-w-4xl mx-auto mb-24 pt-10">
            <h3 className="text-5xl font-extrabold mb-8 flex items-center gap-3 text-black drop-shadow-[3px_3px_0_#fff]">
              <Star className="h-8 w-8 text-cyan-400 animate-pulse" /> Top
              Curators
            </h3>
            <div className="bg-cyan-200 rounded-3xl border-4 border-black divide-y-4 divide-black shadow-[8px_8px_0_#000] overflow-hidden">
              {topCurators.map((curator, idx) => (
                <div
                  key={idx}
                  className="flex justify-between items-center p-6 hover:bg-yellow-300 transition font-extrabold text-xl text-black"
                >
                  <span>
                    #{idx + 1}. {curator.name}
                  </span>
                  <span className="text-lg font-bold bg-white/50 px-3 py-1 rounded-full border-2 border-black">
                    ${curator.earnings.toFixed(0)}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

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

      <footer className="text-center text-black font-bold mt-8 text-sm bg-yellow-300 border-t-4 border-black py-4">
        © {new Date().getFullYear()} Setique — The Niche Data Economy
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
      {selectedBounty !== null && bounties[selectedBounty] && (
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
              <span className="text-xs font-extrabold px-3 py-1 border-2 border-black rounded-full bg-cyan-300 uppercase inline-block mb-3">
                {bounties[selectedBounty].modality} Bounty
              </span>
              <h4 className="text-3xl font-extrabold mb-2">
                {bounties[selectedBounty].title.startsWith('(DEMO)') ? bounties[selectedBounty].title : bounties[selectedBounty].title}
              </h4>
              <div className="flex items-center gap-2 text-sm font-semibold text-black/70">
                <span>
                  Posted by {bounties[selectedBounty].profiles?.username || 'Anonymous'}
                </span>
                <span>•</span>
                <span>
                  {new Date(bounties[selectedBounty].created_at).toLocaleDateString()}
                </span>
              </div>
            </div>

            {/* Budget Display */}
            <div className="bg-white border-2 border-black rounded-xl p-4 mb-4">
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-sm font-bold text-black/60 uppercase">Total Budget</div>
                  <div className="text-4xl font-extrabold">${bounties[selectedBounty].budget}</div>
                </div>
                {bounties[selectedBounty].quantity && (
                  <div className="text-right">
                    <div className="text-sm font-bold text-black/60 uppercase">Quantity</div>
                    <div className="text-2xl font-extrabold">{bounties[selectedBounty].quantity}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Description */}
            <div className="mb-4">
              <h5 className="font-extrabold text-lg mb-2">📋 Description</h5>
              <div className="bg-white/80 border-2 border-black rounded-xl p-4">
                <p className="font-semibold text-black/80 whitespace-pre-wrap">
                  {bounties[selectedBounty].description}
                </p>
              </div>
            </div>

            {/* Tags */}
            {bounties[selectedBounty].tags && bounties[selectedBounty].tags.length > 0 && (
              <div className="mb-4">
                <h5 className="font-extrabold text-lg mb-2">🏷️ Tags</h5>
                <div className="flex flex-wrap gap-2">
                  {bounties[selectedBounty].tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-xs font-extrabold px-3 py-1 border-2 border-black rounded-full bg-pink-200"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Deadline */}
            {bounties[selectedBounty].deadline && (
              <div className="mb-4">
                <h5 className="font-extrabold text-lg mb-2">⏰ Deadline</h5>
                <div className="bg-white/80 border-2 border-black rounded-xl p-3">
                  <p className="font-bold">
                    {new Date(bounties[selectedBounty].deadline).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>
            )}

            {/* Requirements */}
            <div className="mb-6">
              <h5 className="font-extrabold text-lg mb-2">✅ Requirements</h5>
              <div className="bg-white/80 border-2 border-black rounded-xl p-4 space-y-2">
                <div className="flex items-start gap-2">
                  <span className="text-lg">📦</span>
                  <span className="font-semibold text-sm">
                    Data Type: <strong>{bounties[selectedBounty].modality}</strong>
                  </span>
                </div>
                {bounties[selectedBounty].quantity && (
                  <div className="flex items-start gap-2">
                    <span className="text-lg">📊</span>
                    <span className="font-semibold text-sm">
                      Quantity: <strong>{bounties[selectedBounty].quantity}</strong>
                    </span>
                  </div>
                )}
                <div className="flex items-start gap-2">
                  <span className="text-lg">💰</span>
                  <span className="font-semibold text-sm">
                    Payment: <strong>${bounties[selectedBounty].budget} upon approval</strong>
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
                  setSubmissionBounty(bounties[selectedBounty])
                }}
                className="flex-1 bg-[linear-gradient(90deg,#00ffff,#ff00c3)] text-white font-extrabold border-2 border-black rounded-full px-6 py-3 hover:opacity-90 active:scale-95 transition"
              >
                Submit Your Dataset
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
          // Refresh data after successful submission
          fetchBounties()
        }}
      />

      {/* AI Assistant */}
      <AIAssistant />
    </div>
  )
}

export default HomePage
