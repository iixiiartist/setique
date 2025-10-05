import { useState, useMemo, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { stripePromise } from '../lib/stripe'
import { SignInModal } from '../components/SignInModal'
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

function HomePage() {
  const { user, profile, signOut } = useAuth()

  // General state
  const [query, setQuery] = useState('')
  const [modality, setModality] = useState('all')

  // Modal state
  const [selected, setSelected] = useState(null)
  const [checkoutIdx, setCheckoutIdx] = useState(null)
  const [isSignInOpen, setSignInOpen] = useState(false)
  const [isProcessing, setProcessing] = useState(false)

  // Creator form state
  const [newTitle, setNewTitle] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [newPrice, setNewPrice] = useState('')
  const [newModality, setNewModality] = useState('vision')
  const [newTags, setNewTags] = useState([])
  const isCreatorFormValid =
    newTitle.trim() !== '' && newDesc.trim() !== '' && newPrice > 0

  // Bounty form state
  const [bountyTitle, setBountyTitle] = useState('')
  const [bountyDesc, setBountyDesc] = useState('')
  const [bountyModality, setBountyModality] = useState('image')
  const [bountyQuantity, setBountyQuantity] = useState('')
  const [bountyBudget, setBountyBudget] = useState('')
  const [bountyTags, setBountyTags] = useState([])
  const [bountyDeadline, setBountyDeadline] = useState('')
  const isBountyFormValid =
    bountyTitle.trim() && bountyBudget && bountyTags.length > 0

  // Data from Supabase
  const [datasets, setDatasets] = useState([])
  const [bounties, setBounties] = useState([])
  const [topCurators, setTopCurators] = useState([])
  const [loading, setLoading] = useState(true)

  // Fetch datasets
  useEffect(() => {
    fetchDatasets()
    fetchBounties()
    fetchTopCurators()
  }, [])

  const fetchDatasets = async () => {
    try {
      const { data, error } = await supabase
        .from('datasets')
        .select(
          `
          *,
          profiles:creator_id (username, full_name)
        `
        )
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (error) throw error
      setDatasets(data || [])
    } catch (error) {
      console.error('Error fetching datasets:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchBounties = async () => {
    try {
      const { data, error } = await supabase
        .from('bounties')
        .select(
          `
          *,
          profiles:creator_id (username, full_name)
        `
        )
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(10)

      if (error) throw error
      setBounties(data || [])
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

  const handlePublish = async () => {
    if (!user) {
      setSignInOpen(true)
      return
    }

    try {
      const { data, error } = await supabase.from('datasets').insert([
        {
          creator_id: user.id,
          title: newTitle,
          description: newDesc,
          price: parseFloat(newPrice),
          modality: newModality,
          tags: newTags,
          accent_color: getAccentColor(newModality),
        },
      ])

      if (error) throw error

      alert(
        `Published "${newTitle}"! Your dataset is now live on the marketplace.`
      )
      setNewTitle('')
      setNewDesc('')
      setNewPrice('')
      setNewTags([])
      fetchDatasets()
    } catch (error) {
      console.error('Error publishing dataset:', error)
      alert('Error publishing dataset: ' + error.message)
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

      // Call our Netlify function to create Stripe checkout session
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
      const { data, error } = await supabase.from('bounties').insert([
        {
          creator_id: user.id,
          title: bountyTitle,
          description: bountyDesc,
          modality: bountyModality,
          quantity: bountyQuantity,
          budget: parseFloat(bountyBudget),
          labels: bountyTags,
          deadline: bountyDeadline || null,
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
              <div className="flex items-center gap-2 font-bold text-black">
                <User className="h-5 w-5" />
                {profile?.username || user.email}
              </div>
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
          <a
            href="#curator-form"
            className="bg-[linear-gradient(90deg,#ff00c3,#00ffff)] text-white font-bold hover:opacity-90 transition px-5 py-2 rounded-full shadow-lg border-2 border-black text-sm active:scale-95"
          >
            Become a Curator
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
            Generic datasets create generic AI. The next leap in machine
            intelligence will be powered by authentic, passionate, and beautifully
            niche data—curated by you.
          </p>
        </section>

        <section id="philosophy" className="max-w-5xl mx-auto mb-24">
          <div className="bg-white/30 p-8 rounded-3xl border-4 border-black shadow-[8px_8px_0_#000]">
            <h3 className="text-3xl font-extrabold text-center mb-2">
              Our Philosophy
            </h3>
            <p className="text-center font-semibold text-xl text-black/80">
              We believe the future of AI shouldn't be built on sterile,
              mass-produced data. It should be built on the rich, diverse, and
              wonderfully specific realities captured by passionate people. We are
              democratizing data by empowering the experts: **you**.
            </p>
          </div>
        </section>

        <section id="how-it-works" className="max-w-6xl mx-auto mb-24">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div className="bg-white/30 p-8 rounded-3xl border-4 border-black shadow-[8px_8px_0_#000]">
              <Archive className="h-16 w-16 text-pink-600 mx-auto mb-4" />
              <h3 className="text-2xl font-extrabold mb-2">1. Curate Your World</h3>
              <p className="font-semibold text-black/70">
                Package your unique expertise or collection, from photos of rare
                sneakers to recordings of regional bird calls.
              </p>
            </div>
            <div className="bg-white/30 p-8 rounded-3xl border-4 border-black shadow-[8px_8px_0_#000]">
              <CircleDollarSign className="h-16 w-16 text-cyan-500 mx-auto mb-4" />
              <h3 className="text-2xl font-extrabold mb-2">2. Define Its Value</h3>
              <p className="font-semibold text-black/70">
                You're the expert. You set the price for your collection, creating
                a new market for authentic knowledge.
              </p>
            </div>
            <div className="bg-white/30 p-8 rounded-3xl border-4 border-black shadow-[8px_8px_0_#000]">
              <BrainCircuit className="h-16 w-16 text-yellow-400 mx-auto mb-4" />
              <h3 className="text-2xl font-extrabold mb-2">3. Fuel the Future</h3>
              <p className="font-semibold text-black/70">
                Your niche dataset helps developers build smarter, more creative,
                and less biased AI models.
              </p>
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
              <button
                onClick={handlePublish}
                disabled={!isCreatorFormValid}
                className="w-full bg-[linear-gradient(90deg,#ffea00,#00ffff)] text-black font-extrabold py-4 rounded-full border-4 border-black hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100 active:scale-100"
              >
                Publish to Marketplace
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
                <option value="architecture">Architecture</option>
                <option value="subculture">Subculture</option>
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
                      <div className="bg-yellow-400 text-black font-bold border-2 border-black px-3 py-1 rounded-full shadow">
                        ${d.price}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setSelected(datasets.indexOf(d))}
                          className="bg-white text-black font-extrabold border-2 border-black rounded-full px-4 py-2 hover:bg-yellow-200 text-sm transition-colors active:scale-95"
                        >
                          Details
                        </button>
                        <button
                          onClick={() => setCheckoutIdx(datasets.indexOf(d))}
                          className="bg-[linear-gradient(90deg,#00ffff,#ff00c3)] text-white font-bold border-2 border-black rounded-full px-4 py-2 hover:opacity-90 text-sm transition-opacity active:scale-95"
                        >
                          Buy Now
                        </button>
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
                bounties.map((bounty) => (
                  <div
                    key={bounty.id}
                    className="bg-white/50 border-2 border-black rounded-xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
                  >
                    <div>
                      <span className="text-xs font-extrabold px-2 py-1 border-2 border-black rounded-full bg-cyan-200 uppercase">
                        {bounty.modality}
                      </span>
                      <h5 className="font-extrabold text-lg mt-2">
                        {bounty.title}
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
            <h4 className="text-2xl font-extrabold mb-2">Checkout</h4>
            {isProcessing ? (
              <div className="text-center py-10">
                <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-black mx-auto"></div>
                <p className="font-bold mt-4">Processing Payment...</p>
              </div>
            ) : (
              <div>
                <p className="font-semibold mb-4">
                  {datasets[checkoutIdx].title}
                </p>
                <div className="flex items-center justify-between mb-6">
                  <span className="font-extrabold">Total</span>
                  <span className="font-extrabold">
                    ${datasets[checkoutIdx].price}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    className="bg-[linear-gradient(90deg,#00ffff,#ff00c3)] text-white font-bold border-2 border-black rounded-full px-6 py-2 active:scale-95"
                    onClick={handleCheckout}
                  >
                    Pay ${datasets[checkoutIdx].price}
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
                  <div className="bg-yellow-400 text-black font-bold border-2 border-black px-3 py-1 rounded-full">
                    ${datasets[selected].price}
                  </div>
                  <button
                    className="bg-[linear-gradient(90deg,#00ffff,#ff00c3)] text-white font-bold border-2 border-black rounded-full px-6 py-2 active:scale-95"
                    onClick={() => {
                      setSelected(null)
                      setCheckoutIdx(selected)
                    }}
                  >
                    Buy Now
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default HomePage
