import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { Database, ShoppingBag, Sparkles } from '../components/Icons'

const filterOptions = [
  { key: 'all', label: 'All activity' },
  { key: 'datasets', label: 'New datasets' },
  { key: 'purchases', label: 'Purchases' }
]

const eventMeta = {
  dataset: {
    title: 'Published a new dataset',
    iconBg: 'bg-yellow-200',
    iconComponent: Database
  },
  purchase: {
    title: 'Purchased a dataset',
    iconBg: 'bg-blue-200',
    iconComponent: ShoppingBag
  }
}

const formatTimeAgo = (value) => {
  if (!value) return 'Recently'
  const timestamp = new Date(value)
  if (Number.isNaN(timestamp.getTime())) return 'Recently'
  const now = new Date()
  const diffMs = now.getTime() - timestamp.getTime()

  const minute = 60 * 1000
  const hour = 60 * minute
  const day = 24 * hour

  if (diffMs < minute) return 'Just now'
  if (diffMs < hour) {
    const minutes = Math.round(diffMs / minute)
    return `${minutes} minute${minutes === 1 ? '' : 's'} ago`
  }
  if (diffMs < day) {
    const hours = Math.round(diffMs / hour)
    return `${hours} hour${hours === 1 ? '' : 's'} ago`
  }
  const days = Math.round(diffMs / day)
  return `${days} day${days === 1 ? '' : 's'} ago`
}

const formatCurrency = (value) => {
  if (value === null || value === undefined) return '—'
  const amount = Number(value)
  if (Number.isNaN(amount)) return '—'
  return `$${amount.toFixed(2)}`
}

export default function ActivityFeedPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [events, setEvents] = useState([])
  const [activeFilter, setActiveFilter] = useState('all')
  const [followingCount, setFollowingCount] = useState(0)

  const loadFeed = useCallback(
    async (options = { silent: false }) => {
      if (!user) {
        setEvents([])
        setFollowingCount(0)
        setLoading(false)
        return
      }

      if (options.silent) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }

      try {
        setErrorMessage('')

        const { data: followingData, error: followingError } = await supabase
          .from('user_follows')
          .select('following_id')
          .eq('follower_id', user.id)

        if (followingError) throw followingError

        const followingIds = followingData?.map((entry) => entry.following_id).filter(Boolean) || []
        setFollowingCount(followingIds.length)

        if (followingIds.length === 0) {
          setEvents([])
          return
        }

        const [datasetsResult, purchasesResult] = await Promise.all([
          supabase
            .from('datasets')
            .select(`
              id,
              title,
              modality,
              price,
              created_at,
              profiles:creator_id (
                id,
                username,
                display_name,
                avatar_url
              )
            `)
            .in('creator_id', followingIds)
            .eq('is_published', true)
            .order('created_at', { ascending: false })
            .limit(30),
          supabase
            .from('purchases')
            .select(`
              id,
              amount,
              status,
              purchased_at,
              dataset_id,
              datasets (
                id,
                title,
                creator_id,
                price,
                profiles:creator_id (
                  id,
                  username,
                  display_name
                )
              ),
              profiles:user_id (
                id,
                username,
                display_name,
                avatar_url
              )
            `)
            .in('user_id', followingIds)
            .eq('status', 'completed')
            .order('purchased_at', { ascending: false })
            .limit(30)
        ])

        if (datasetsResult.error) throw datasetsResult.error
        if (purchasesResult.error) throw purchasesResult.error

        const datasetEvents = (datasetsResult.data || []).map((item) => ({
          id: `dataset-${item.id}`,
          type: 'dataset',
          createdAt: item.created_at,
          actor: item.profiles,
          dataset: {
            id: item.id,
            title: item.title,
            modality: item.modality,
            price: item.price
          }
        }))

        const purchaseEvents = (purchasesResult.data || []).map((item) => ({
          id: `purchase-${item.id}`,
          type: 'purchase',
          createdAt: item.purchased_at,
          actor: item.profiles,
          dataset: item.datasets
            ? {
                id: item.datasets.id,
                title: item.datasets.title,
                price: item.datasets.price,
                creator: item.datasets.profiles
              }
            : null,
          amount: item.amount,
          status: item.status
        }))

        const combined = [...datasetEvents, ...purchaseEvents]
          .filter((event) => event.actor && event.actor.username)
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, 40)

        setEvents(combined)
      } catch (error) {
        console.error('Error loading activity feed:', error)
        setErrorMessage('We could not load your feed. Try again in a moment.')
      } finally {
        if (options.silent) {
          setRefreshing(false)
        } else {
          setLoading(false)
        }
      }
    },
    [user]
  )

  useEffect(() => {
    loadFeed()
  }, [loadFeed])

  const filteredEvents = useMemo(() => {
    if (activeFilter === 'datasets') {
      return events.filter((event) => event.type === 'dataset')
    }
    if (activeFilter === 'purchases') {
      return events.filter((event) => event.type === 'purchase')
    }
    return events
  }, [events, activeFilter])

  const handleRefresh = async () => {
    await loadFeed({ silent: true })
  }

  const renderEvent = (event) => {
    const meta = eventMeta[event.type]
    const IconComponent = meta.iconComponent
    const actorDisplay = event.actor.display_name || event.actor.username

    return (
      <div
        key={event.id}
        className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6"
      >
        <div className="flex items-start gap-4">
          <div className={`w-14 h-14 border-4 border-black rounded-full flex items-center justify-center ${meta.iconBg}`}>
            <IconComponent className="w-7 h-7" />
          </div>
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              <Link
                to={`/profile/${event.actor.username}`}
                className="font-extrabold text-lg hover:underline"
              >
                {actorDisplay}
              </Link>
              <span className="text-sm font-semibold text-gray-500">@{event.actor.username}</span>
              <span className="text-sm font-semibold text-gray-500">{formatTimeAgo(event.createdAt)}</span>
            </div>

            <p className="text-sm font-semibold text-gray-700">{meta.title}</p>

            {event.type === 'dataset' && (
              <div className="border-2 border-black bg-yellow-100 px-4 py-3">
                <Link
                  to={`/dataset/${event.dataset.id}`}
                  className="font-bold text-lg hover:underline"
                >
                  {event.dataset.title}
                </Link>
                <div className="mt-2 text-sm font-semibold text-gray-600 flex gap-4 flex-wrap">
                  <span>Modality: {event.dataset.modality || 'Unknown'}</span>
                  <span>Price: {formatCurrency(event.dataset.price)}</span>
                </div>
              </div>
            )}

            {event.type === 'purchase' && event.dataset && (
              <div className="border-2 border-black bg-blue-100 px-4 py-3">
                <div className="font-bold text-lg">
                  {event.dataset.title}
                </div>
                <div className="mt-2 text-sm font-semibold text-gray-600 flex gap-4 flex-wrap">
                  <span>Spend: {formatCurrency(event.amount)}</span>
                  <span>Status: {event.status}</span>
                </div>
                {event.dataset.creator?.username && (
                  <div className="mt-2 text-sm font-semibold text-gray-600">
                    Creator:&nbsp;
                    <Link
                      to={`/profile/${event.dataset.creator.username}`}
                      className="hover:underline"
                    >
                      {event.dataset.creator.display_name || event.dataset.creator.username}
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-teal-50 py-12 px-4">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="bg-white border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] p-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 border-2 border-black px-3 py-1 bg-yellow-200 font-bold uppercase text-xs tracking-wide">
                <Sparkles className="w-4 h-4" />
                Network Feed
              </div>
              <h1 className="text-4xl font-black leading-tight">
                See what the creators you follow have shipped lately
              </h1>
              <p className="text-gray-600 font-semibold">
                Track dataset drops and purchase activity from your network in one place.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="border-4 border-black px-4 py-3 bg-white font-bold text-center">
                <div className="text-xs text-gray-500 uppercase">Following</div>
                <div className="text-2xl">{followingCount}</div>
              </div>
              <button
                onClick={handleRefresh}
                disabled={loading || refreshing}
                className="px-6 py-3 font-bold border-4 border-black bg-purple-400 hover:bg-purple-500 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
              >
                {refreshing ? 'Refreshing…' : 'Refresh feed'}
              </button>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            {filterOptions.map((option) => (
              <button
                key={option.key}
                onClick={() => setActiveFilter(option.key)}
                className={`px-4 py-2 font-bold border-4 border-black transition-all ${
                  activeFilter === option.key
                    ? 'bg-purple-400 text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
                    : 'bg-white hover:bg-gray-100'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </header>

        {errorMessage && (
          <div className="bg-red-100 border-4 border-black text-red-700 px-6 py-4 font-semibold">
            {errorMessage}
          </div>
        )}

        {loading ? (
          <div className="bg-white border-4 border-black p-12 text-center font-bold">
            Loading your feed…
          </div>
        ) : followingCount === 0 ? (
          <div className="bg-white border-4 border-black p-12 text-center space-y-4">
            <p className="text-xl font-black">Follow creators to build your activity feed.</p>
            <p className="text-sm font-semibold text-gray-600">
              Head to the discovery hub to explore trending curators and start following profiles that inspire you.
            </p>
            <Link
              to="/discover"
              className="inline-block px-6 py-3 font-bold border-4 border-black bg-purple-400 hover:bg-purple-500 transition shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
            >
              Browse creators
            </Link>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="bg-white border-4 border-black p-12 text-center space-y-4">
            <p className="text-xl font-black">No activity yet for that filter.</p>
            <p className="text-sm font-semibold text-gray-600">
              Try switching filters or refreshing to see the latest updates.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredEvents.map(renderEvent)}
          </div>
        )}
      </div>
    </div>
  )
}
