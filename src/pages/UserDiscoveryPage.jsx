import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { Search, Sparkles, TrendingUp, User as UserIcon, CheckCircle, AlertCircle } from '../components/Icons'
import TrustLevelBadge from '../components/TrustLevelBadge'

const filterOptions = [
  { key: 'all', label: 'All Creators' },
  { key: 'pro', label: 'Pro Curators' },
  { key: 'network', label: 'Mutual Connections' },
  { key: 'rising', label: 'Rising Stars' }
]

const badgeColors = {
  verified: 'bg-blue-200 text-blue-800 border-blue-900',
  expert: 'bg-purple-200 text-purple-800 border-purple-900',
  master: 'bg-yellow-200 text-yellow-800 border-yellow-900'
}

const statusToneStyles = {
  success: 'bg-green-200 text-green-900',
  info: 'bg-blue-200 text-blue-900',
  error: 'bg-red-200 text-red-900'
}

const formatFollowers = (count = 0) => {
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`
  if (count >= 1000) return `${(count / 1000).toFixed(1)}k`
  return count.toString()
}

const formatDate = (value) => {
  if (!value) return 'New here'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'New here'
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short'
  })
}

export default function UserDiscoveryPage() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [profiles, setProfiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [activeFilter, setActiveFilter] = useState('all')
  const [followingMap, setFollowingMap] = useState({})
  const [pendingFollow, setPendingFollow] = useState({})
  const [networkOverlap, setNetworkOverlap] = useState({})
  const [statusMessages, setStatusMessages] = useState({})
  const statusTimeoutsRef = useRef({})

  const showStatusMessage = useCallback((profileId, type, message) => {
    setStatusMessages(prev => ({
      ...prev,
      [profileId]: { type, message }
    }))

    if (statusTimeoutsRef.current[profileId]) {
      clearTimeout(statusTimeoutsRef.current[profileId])
    }

    statusTimeoutsRef.current[profileId] = setTimeout(() => {
      setStatusMessages(prev => {
        const next = { ...prev }
        delete next[profileId]
        return next
      })
      delete statusTimeoutsRef.current[profileId]
    }, 4000)
  }, [])

  const loadProfiles = useCallback(async () => {
    try {
      setLoading(true)
      setErrorMessage('')

      const [{ data: profileData, error: profileError }, { data: proData, error: proError }] = await Promise.all([
        supabase
          .from('profiles')
          .select('id, username, display_name, avatar_url, bio, follower_count, location, website, twitter_handle, github_handle, created_at, trust_level')
          .order('follower_count', { ascending: false })
          .limit(150),
        supabase
          .from('pro_curators')
          .select('id, display_name, badge_level, specialties, rating, total_projects')
      ])

      if (profileError) throw profileError
      if (proError) throw proError

      const proCuratorMap = {}
      proData?.forEach(curator => {
        proCuratorMap[curator.id] = curator
      })

      const sanitizedProfiles = (profileData || [])
        .filter(profile => profile.username)
        .map(profile => ({
          ...profile,
          proCurator: proCuratorMap[profile.id] || null
        }))

      setProfiles(sanitizedProfiles)
    } catch (error) {
      console.error('Error loading creators:', error)
      setErrorMessage('We had trouble loading creators. Please refresh and try again.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadProfiles()
  }, [loadProfiles])

  useEffect(() => {
    const timers = statusTimeoutsRef.current || {}

    return () => {
      Object.values(timers).forEach(timeoutId => {
        if (timeoutId) {
          clearTimeout(timeoutId)
        }
      })
    }
  }, [])

  useEffect(() => {
    if (!user) {
      setFollowingMap({})
      setNetworkOverlap({})
      return
    }

    const fetchFollowing = async () => {
      try {
        const { data, error } = await supabase
          .from('user_follows')
          .select('following_id')
          .eq('follower_id', user.id)

        if (error) throw error

        const map = {}
        data?.forEach(entry => {
          map[entry.following_id] = true
        })
        setFollowingMap(map)
      } catch (error) {
        console.error('Error fetching following list:', error)
      }
    }

    fetchFollowing()
  }, [user])

  useEffect(() => {
    if (!user) return

    const followingIds = Object.keys(followingMap || {})
    if (followingIds.length === 0) {
      setNetworkOverlap({})
      return
    }

    const fetchOverlap = async () => {
      try {
        const { data, error } = await supabase
          .from('user_follows')
          .select('follower_id, following_id')
          .in('follower_id', followingIds)

        if (error) throw error

        const counts = {}
        data?.forEach(entry => {
          if (entry.following_id === user.id) return
          counts[entry.following_id] = (counts[entry.following_id] || 0) + 1
        })
        setNetworkOverlap(counts)
      } catch (error) {
        console.error('Error fetching overlap data:', error)
      }
    }

    fetchOverlap()
  }, [user, followingMap])

  const handleFollowToggle = async (profile) => {
    if (!user) {
      navigate('/login?signin=true')
      return
    }

    if (profile.id === user.id) return

    const currentlyFollowing = !!followingMap[profile.id]
    setPendingFollow(prev => ({ ...prev, [profile.id]: true }))
    const targetName = profile.display_name || profile.username || 'this creator'

    try {
      if (currentlyFollowing) {
        const { error } = await supabase
          .from('user_follows')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', profile.id)

        if (error) throw error

        setFollowingMap(prev => {
          const next = { ...prev }
          delete next[profile.id]
          return next
        })

        setProfiles(prev => prev.map(item => {
          if (item.id !== profile.id) return item
          return {
            ...item,
            follower_count: Math.max(0, (item.follower_count || 1) - 1)
          }
        }))

        showStatusMessage(profile.id, 'info', `You unfollowed ${targetName}.`)
      } else {
        const { error } = await supabase
          .from('user_follows')
          .insert({
            follower_id: user.id,
            following_id: profile.id
          })

        if (error) throw error

        setFollowingMap(prev => ({
          ...prev,
          [profile.id]: true
        }))

        setProfiles(prev => prev.map(item => {
          if (item.id !== profile.id) return item
          return {
            ...item,
            follower_count: (item.follower_count || 0) + 1
          }
        }))

        showStatusMessage(profile.id, 'success', `You’re now following ${targetName}.`)
      }
    } catch (error) {
      console.error('Error toggling follow state:', error)
      showStatusMessage(profile.id, 'error', 'We couldn’t update that follow action. Please try again.')
    } finally {
      setPendingFollow(prev => {
        const next = { ...prev }
        delete next[profile.id]
        return next
      })
    }
  }

  const filteredProfiles = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase()
    let list = profiles.filter(profile => profile.id !== user?.id)

    if (normalizedSearch) {
      list = list.filter(profile => {
        const haystack = [
          profile.display_name,
          profile.username,
          profile.bio,
          profile.location,
          profile.proCurator?.specialties?.join(', ')
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
        return haystack.includes(normalizedSearch)
      })
    }

    switch (activeFilter) {
      case 'pro':
        list = list.filter(profile => !!profile.proCurator)
        break
      case 'network':
        list = list.filter(profile => networkOverlap[profile.id] > 0)
        break
      case 'rising':
        list = list
          .filter(profile => (profile.follower_count || 0) < 1000)
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        break
      default:
        break
    }

    return list
  }, [profiles, searchTerm, activeFilter, user?.id, networkOverlap])

  const recommendedProfiles = useMemo(() => {
    const withOverlap = filteredProfiles
      .filter(profile => networkOverlap[profile.id] > 0)
      .sort((a, b) => (networkOverlap[b.id] || 0) - (networkOverlap[a.id] || 0))
    return withOverlap.slice(0, 6)
  }, [filteredProfiles, networkOverlap])

  const trendingProfiles = useMemo(() => {
    const sorted = [...profiles]
      .filter(profile => profile.id !== user?.id)
      .sort((a, b) => (b.follower_count || 0) - (a.follower_count || 0))
    return sorted.slice(0, 6)
  }, [profiles, user?.id])

  const newVoices = useMemo(() => {
    const sorted = [...profiles]
      .filter(profile => profile.id !== user?.id)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    return sorted.slice(0, 6)
  }, [profiles, user?.id])

  const renderProfileCard = (profile) => {
    const isFollowing = !!followingMap[profile.id]
    const isPending = !!pendingFollow[profile.id]
    const mutualCount = networkOverlap[profile.id] || 0
    const status = statusMessages[profile.id]
    const toneClass = status ? (statusToneStyles[status.type] || 'bg-gray-100 text-gray-900') : ''

    return (
      <div
        key={profile.id}
        className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:-translate-y-1 flex flex-col"
      >
        <div className="p-6 flex-1 flex flex-col">
          <div className="flex items-start gap-4">
            <Link to={`/profile/${profile.username}`} className="flex-shrink-0">
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.username}
                  className="w-16 h-16 rounded-full border-4 border-black object-cover"
                />
              ) : (
                <div className="w-16 h-16 rounded-full border-4 border-black bg-purple-200 flex items-center justify-center text-2xl font-black">
                  {profile.username?.[0]?.toUpperCase() || '?'}
                </div>
              )}
            </Link>

            <div className="flex-1 space-y-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <Link to={`/profile/${profile.username}`} className="text-xl font-black hover:underline truncate">
                  {profile.display_name || profile.username}
                </Link>
                <TrustLevelBadge level={profile.trust_level || 0} size="sm" />
                {profile.proCurator && (
                  <span className={`text-xs font-extrabold uppercase border-2 border-black px-2 py-1 ${badgeColors[profile.proCurator.badge_level] || 'bg-gray-200 text-gray-800'}`}>
                    Pro Curator · {profile.proCurator.badge_level}
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-600 truncate">@{profile.username}</p>
              {profile.location && (
                <p className="text-sm text-gray-600">📍 {profile.location}</p>
              )}
              {mutualCount > 0 && (
                <div className="inline-flex items-center gap-2 text-xs font-semibold text-green-700 bg-green-100 border-2 border-black px-2 py-1">
                  <UserIcon className="w-4 h-4" />
                  {mutualCount} mutual connection{mutualCount === 1 ? '' : 's'}
                </div>
              )}
            </div>

            <div className="flex flex-col items-end gap-2">
              <button
                onClick={() => handleFollowToggle(profile)}
                disabled={isPending || profile.id === user?.id}
                aria-pressed={isFollowing}
                aria-label={isFollowing ? `Unfollow ${profile.display_name || profile.username}` : `Follow ${profile.display_name || profile.username}`}
                className={`px-4 py-2 font-bold border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:-translate-y-0.5 hover:translate-x-[-0.5] disabled:opacity-50 ${
                  isFollowing ? 'bg-gray-200 hover:bg-gray-300' : 'bg-purple-400 hover:bg-purple-500'
                }`}
              >
                {isPending ? '...' : isFollowing ? 'Following' : 'Follow'}
              </button>
              <div className="min-h-[22px] text-right" aria-live="polite" role="status">
                {status && (
                  <span
                    className={`inline-flex items-center gap-2 px-3 py-1 text-xs font-semibold border-2 border-black rounded-xl ${toneClass || 'bg-gray-100 text-gray-900'}`}
                  >
                    {status.type === 'error' ? (
                      <AlertCircle className="w-4 h-4" />
                    ) : (
                      <CheckCircle className="w-4 h-4" />
                    )}
                    <span>{status.message}</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {profile.bio && (
            <p className="mt-4 text-sm text-gray-700 line-clamp-3">{profile.bio}</p>
          )}

          <div className="mt-6 grid grid-cols-2 gap-3 text-sm">
            <div className="border-2 border-black px-3 py-2 bg-yellow-100 font-bold text-center">
              <p className="text-xs uppercase tracking-wide text-gray-600">Followers</p>
              <p className="text-lg">{formatFollowers(profile.follower_count || 0)}</p>
            </div>
            <div className="border-2 border-black px-3 py-2 bg-blue-100 font-bold text-center">
              <p className="text-xs uppercase tracking-wide text-gray-600">Joined</p>
              <p className="text-lg">{formatDate(profile.created_at)}</p>
            </div>
          </div>

          {profile.proCurator?.specialties?.length > 0 && (
            <div className="mt-4">
              <p className="text-xs font-semibold uppercase text-gray-600 mb-1">Specialties</p>
              <div className="flex flex-wrap gap-2">
                {profile.proCurator.specialties.slice(0, 6).map(tag => (
                  <span key={tag} className="text-xs font-bold border-2 border-black px-2 py-1 bg-white">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="border-t-4 border-black bg-gray-50 px-6 py-3 text-sm flex flex-wrap gap-4">
          {profile.website && (
            <a
              href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-purple-600 hover:underline"
            >
              🌐 Website
            </a>
          )}
          {profile.twitter_handle && (
            <a
              href={`https://twitter.com/${profile.twitter_handle}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-purple-600 hover:underline"
            >
              🐦 Twitter
            </a>
          )}
          {profile.github_handle && (
            <a
              href={`https://github.com/${profile.github_handle}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-purple-600 hover:underline"
            >
              💻 GitHub
            </a>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-teal-50 py-12 px-4">
      <div className="max-w-6xl mx-auto space-y-10">
        
        {/* Navigation Bar */}
        <div className="flex items-center justify-between">
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 px-4 py-2 font-bold border-4 border-black bg-white hover:bg-gray-100 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
          >
            ← Home
          </Link>
          {user && (
            <div className="flex gap-3">
              <Link 
                to="/feed" 
                className="px-4 py-2 font-bold border-4 border-black bg-blue-200 hover:bg-blue-300 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
              >
                Feed
              </Link>
              <Link 
                to="/dashboard" 
                className="px-4 py-2 font-bold border-4 border-black bg-yellow-400 hover:bg-yellow-500 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
              >
                Dashboard
              </Link>
            </div>
          )}
        </div>

        <div className="bg-white border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] p-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-wide border-2 border-black px-3 py-1 bg-yellow-200 mb-4">
                <Sparkles className="w-4 h-4" />
                Social Hub
              </div>
              <h1 className="text-4xl font-black leading-tight mb-4">
                Discover the curators and dataset builders powering SETIQUE
              </h1>
              <p className="text-gray-700 text-lg">
                Search for creators by name, specialties, or location. Follow your favorite curators, find mutual connections, and explore pro talent ready to collaborate on your next project.
              </p>
            </div>
            <div className="w-full lg:w-80">
              <label className="relative block">
                <span className="absolute inset-y-0 left-0 flex items-center pl-4">
                  <Search className="w-5 h-5 text-gray-500" />
                </span>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search by name, skill, or location..."
                  className="w-full pl-12 pr-4 py-3 bg-white border-4 border-black rounded-full font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                />
              </label>
              <p className="text-xs text-gray-500 mt-3 font-semibold">
                Tip: Try searching for &ldquo;vision&rdquo;, &ldquo;finance&rdquo;, &ldquo;SF&rdquo;, or &ldquo;Pro Curator&rdquo;
              </p>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            {filterOptions.map(option => (
              <button
                key={option.key}
                onClick={() => setActiveFilter(option.key)}
                className={`px-4 py-2 font-bold border-4 border-black transition-all hover:-translate-y-0.5 ${
                  activeFilter === option.key
                    ? 'bg-purple-400 text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
                    : 'bg-white hover:bg-gray-100'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {errorMessage && (
          <div className="bg-red-100 border-4 border-black text-red-700 px-6 py-4 font-semibold">
            {errorMessage}
          </div>
        )}

        {user && recommendedProfiles.length > 0 && (
          <section className="bg-white border-4 border-black shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] p-6">
            <div className="flex items-center gap-3 mb-4">
              <UserIcon className="w-6 h-6" />
              <h2 className="text-2xl font-black">Creators in your orbit</h2>
            </div>
            <p className="text-sm text-gray-600 mb-6 font-semibold">
              People followed by the curators you already know. Great for building a trusted network fast.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recommendedProfiles.map(profile => (
                <div key={profile.id} className="border-4 border-black bg-gray-50 px-5 py-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    {profile.avatar_url ? (
                      <img
                        src={profile.avatar_url}
                        alt={profile.username}
                        className="w-12 h-12 rounded-full border-3 border-black object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full border-3 border-black bg-purple-200 flex items-center justify-center text-lg font-black">
                        {profile.username?.[0]?.toUpperCase() || '?'}
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <Link to={`/profile/${profile.username}`} className="font-bold hover:underline truncate">
                          {profile.display_name || profile.username}
                        </Link>
                        <TrustLevelBadge level={profile.trust_level || 0} size="sm" />
                      </div>
                      <p className="text-xs text-gray-600 truncate">@{profile.username}</p>
                      <p className="text-xs text-green-700 font-semibold">
                        {networkOverlap[profile.id]} mutual connection{networkOverlap[profile.id] === 1 ? '' : 's'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleFollowToggle(profile)}
                    disabled={pendingFollow[profile.id]}
                    className={`px-4 py-2 font-bold border-3 border-black transition-all ${
                      followingMap[profile.id] ? 'bg-gray-200 hover:bg-gray-300' : 'bg-purple-300 hover:bg-purple-400'
                    }`}
                  >
                    {pendingFollow[profile.id] ? '...' : followingMap[profile.id] ? 'Following' : 'Follow'}
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex items-center gap-3 mb-4">
              <TrendingUp className="w-6 h-6" />
              <h2 className="text-2xl font-black">Trending creators</h2>
            </div>
            <p className="text-sm text-gray-600 mb-6 font-semibold">
              High-signal profiles with growing communities.
            </p>
            <div className="space-y-3">
              {trendingProfiles.map((profile, index) => (
                <Link
                  key={profile.id}
                  to={`/profile/${profile.username}`}
                  className="flex items-center gap-3 p-3 border-2 border-black bg-gray-50 hover:bg-yellow-100 transition-all"
                >
                  <span className="text-lg font-black w-6 text-center">#{index + 1}</span>
                  {profile.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt={profile.username}
                      className="w-10 h-10 rounded-full border-3 border-black object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full border-3 border-black bg-purple-200 flex items-center justify-center text-sm font-black">
                      {profile.username?.[0]?.toUpperCase() || '?'}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="font-bold truncate">{profile.display_name || profile.username}</p>
                    <p className="text-xs text-gray-600 truncate">{formatFollowers(profile.follower_count || 0)} followers</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <div className="bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex items-center gap-3 mb-4">
              <Sparkles className="w-6 h-6" />
              <h2 className="text-2xl font-black">Fresh faces</h2>
            </div>
            <p className="text-sm text-gray-600 mb-6 font-semibold">
              Newly joined creators who are already publishing great datasets.
            </p>
            <div className="space-y-3">
              {newVoices.map(profile => (
                <Link
                  key={profile.id}
                  to={`/profile/${profile.username}`}
                  className="flex items-center gap-3 p-3 border-2 border-black bg-gray-50 hover:bg-blue-100 transition-all"
                >
                  {profile.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt={profile.username}
                      className="w-10 h-10 rounded-full border-3 border-black object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full border-3 border-black bg-purple-200 flex items-center justify-center text-sm font-black">
                      {profile.username?.[0]?.toUpperCase() || '?'}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="font-bold truncate">{profile.display_name || profile.username}</p>
                    <p className="text-xs text-gray-600 truncate">Joined {formatDate(profile.created_at)}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-3xl font-black">All creators</h2>
            <p className="text-sm text-gray-600 font-semibold">
              {filteredProfiles.length} profiles match your filters
            </p>
          </div>

          {loading ? (
            <div className="bg-white border-4 border-black p-8 text-center font-bold">Loading creators...</div>
          ) : filteredProfiles.length === 0 ? (
            <div className="bg-white border-4 border-black p-8 text-center font-bold">
              No creators found. Try a different search or switch filters.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredProfiles.map(renderProfileCard)}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
