import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { stripePromise } from '../lib/stripe'
import { CheckCircle, AlertCircle, X } from '../components/Icons'
import ReportButton from '../components/ReportButton'
import TrustLevelBadge from '../components/TrustLevelBadge'

export default function UserProfilePage() {
  const { username } = useParams()
  const navigate = useNavigate()
  const { user, profile: currentUserProfile } = useAuth()
  
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState(null)
  const [datasets, setDatasets] = useState([])
  const [isFollowing, setIsFollowing] = useState(false)
  const [followLoading, setFollowLoading] = useState(false)
  const [followStatus, setFollowStatus] = useState(null)
  const [activeTab, setActiveTab] = useState('datasets') // datasets, followers, following
  const [followers, setFollowers] = useState([])
  const [following, setFollowing] = useState([])
  const [profileFollowsViewer, setProfileFollowsViewer] = useState(false)
  const [mutualConnectionIds, setMutualConnectionIds] = useState([])
  const [selectedDataset, setSelectedDataset] = useState(null)
  const [userPurchases, setUserPurchases] = useState([])
  const [isProcessing, setIsProcessing] = useState(false)
  const statusTimerRef = useRef(null)
  
  const isOwnProfile = user?.id === profile?.id
  const profileDisplayName = profile?.display_name || profile?.username || 'this user'
  const statusToneClasses = {
    success: 'bg-green-200 text-green-900',
    info: 'bg-blue-100 text-blue-900',
    error: 'bg-red-200 text-red-900',
  }

  const showFollowStatus = useCallback((type, message) => {
    if (statusTimerRef.current) {
      clearTimeout(statusTimerRef.current)
    }

    setFollowStatus({ type, message })

    statusTimerRef.current = setTimeout(() => {
      setFollowStatus(null)
      statusTimerRef.current = null
    }, 4000)
  }, [])

  useEffect(() => {
    return () => {
      if (statusTimerRef.current) {
        clearTimeout(statusTimerRef.current)
      }
    }
  }, [])

  const fetchUserProfile = useCallback(async (options = {}) => {
    const { showLoader = true } = options
    try {
      if (showLoader) {
        setLoading(true)
      }

      setProfileFollowsViewer(false)
      setMutualConnectionIds([])

      // Fetch user profile by username
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', username)
        .single()

      if (profileError) throw profileError
      if (!profileData) {
        alert('User not found')
        navigate('/')
        return
      }

      setProfile(profileData)

      // Fetch user's datasets
      const { data: datasetsData, error: datasetsError } = await supabase
        .from('datasets')
        .select('*')
        .eq('creator_id', profileData.id)
        .eq('is_published', true)
        .order('created_at', { ascending: false })

      if (!datasetsError) {
        setDatasets(datasetsData || [])
      }

      // Check if current user is following this profile
      if (user && user.id !== profileData.id) {
        const { data: followData } = await supabase
          .from('user_follows')
          .select('id')
          .eq('follower_id', user.id)
          .eq('following_id', profileData.id)
          .maybeSingle()

        setIsFollowing(!!followData)
      }

      // Fetch followers
      const { data: followersData } = await supabase
        .from('user_follows')
        .select('id, follower_id, created_at')
        .eq('following_id', profileData.id)
        .order('created_at', { ascending: false })

      // Fetch follower profiles separately
      let followersList = []
      if (followersData && followersData.length > 0) {
        const followerIds = followersData.map(f => f.follower_id)
        const { data: followerProfiles } = await supabase
          .from('profiles')
          .select('id, username, display_name, avatar_url')
          .in('id', followerIds)
        
        // Attach profiles to followers
        followersList = followersData.map(follower => ({
          ...follower,
          profiles: followerProfiles?.find(p => p.id === follower.follower_id)
        }))
      } else {
        followersList = []
      }
      setFollowers(followersList)

      // Fetch following
      const { data: followingData } = await supabase
        .from('user_follows')
        .select('id, following_id, created_at')
        .eq('follower_id', profileData.id)
        .order('created_at', { ascending: false })

      // Fetch following profiles separately
      let followingList = []
      if (followingData && followingData.length > 0) {
        const followingIds = followingData.map(f => f.following_id)
        const { data: followingProfiles } = await supabase
          .from('profiles')
          .select('id, username, display_name, avatar_url')
          .in('id', followingIds)
        
        // Attach profiles to following
        followingList = followingData.map(follow => ({
          ...follow,
          profiles: followingProfiles?.find(p => p.id === follow.following_id)
        }))
      } else {
        followingList = []
      }
      setFollowing(followingList)

      // Determine mutual connections (people who both follow and are followed by this profile)
      const followerIdSet = new Set((followersData ?? []).map(f => f.follower_id))
      const mutualIds = (followingData ?? [])
        .filter(follow => followerIdSet.has(follow.following_id))
        .map(follow => follow.following_id)
      setMutualConnectionIds(mutualIds)

      // Determine if this profile follows the current viewer
      if (user && user.id !== profileData.id) {
        const { data: profileFollowsViewerData, error: profileFollowsViewerError } = await supabase
          .from('user_follows')
          .select('id')
          .eq('follower_id', profileData.id)
          .eq('following_id', user.id)
          .maybeSingle()

        if (!profileFollowsViewerError) {
          setProfileFollowsViewer(!!profileFollowsViewerData)
        }
      }

    } catch (error) {
      console.error('Error fetching profile:', error)
      alert('Error loading profile')
    } finally {
      if (showLoader) {
        setLoading(false)
      }
    }
  }, [navigate, user, username])

  useEffect(() => {
    fetchUserProfile()
  }, [fetchUserProfile])

  // Fetch user's purchases
  useEffect(() => {
    const fetchUserPurchases = async () => {
      if (!user) {
        setUserPurchases([])
        return
      }

      const { data } = await supabase
        .from('purchases')
        .select('dataset_id')
        .eq('user_id', user.id)
        .eq('status', 'completed')

      setUserPurchases(data?.map(p => p.dataset_id) || [])
    }

    fetchUserPurchases()
  }, [user])

  const userOwnsDataset = (datasetId) => {
    return userPurchases.includes(datasetId)
  }

  const handleBuyDataset = async (dataset) => {
    if (!user) {
      alert('Please sign in to purchase datasets')
      navigate('/login')
      return
    }

    // Check if user already owns this dataset
    if (userOwnsDataset(dataset.id)) {
      alert('You already own this dataset!')
      setSelectedDataset(null)
      return
    }

    if (dataset.price === 0) {
      // Free dataset
      try {
        setIsProcessing(true)
        
        // Double-check ownership before inserting
        const { data: existingPurchase } = await supabase
          .from('purchases')
          .select('id')
          .eq('user_id', user.id)
          .eq('dataset_id', dataset.id)
          .maybeSingle()

        if (existingPurchase) {
          alert('You already own this dataset!')
          setSelectedDataset(null)
          // Refresh purchases to sync state
          const { data } = await supabase
            .from('purchases')
            .select('dataset_id')
            .eq('user_id', user.id)
            .eq('status', 'completed')
          setUserPurchases(data?.map(p => p.dataset_id) || [])
          setIsProcessing(false)
          return
        }

        const { error } = await supabase
          .from('purchases')
          .insert({
            user_id: user.id,
            dataset_id: dataset.id,
            amount: 0,
            status: 'completed'
          })

        if (error) {
          if (error.code === '23505') {
            // Duplicate key error
            alert('You already own this dataset!')
          } else {
            throw error
          }
        } else {
          alert('Dataset added to your library!')
        }

        setSelectedDataset(null)
        // Refresh purchases
        const { data } = await supabase
          .from('purchases')
          .select('dataset_id')
          .eq('user_id', user.id)
          .eq('status', 'completed')
        setUserPurchases(data?.map(p => p.dataset_id) || [])
      } catch (error) {
        console.error('Error claiming free dataset:', error)
        alert('Failed to add dataset to library. Please try again.')
      } finally {
        setIsProcessing(false)
      }
    } else {
      // Paid dataset - create Stripe checkout
      try {
        setIsProcessing(true)
        const response = await fetch('/.netlify/functions/create-checkout-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            datasetId: dataset.id,
            userId: user.id,
            price: dataset.price,
            title: dataset.title
          })
        })

        const { sessionId } = await response.json()
        const stripe = await stripePromise
        await stripe.redirectToCheckout({ sessionId })
      } catch (error) {
        console.error('Error creating checkout:', error)
        alert('Failed to create checkout session')
        setIsProcessing(false)
      }
    }
  }

  const handleFollowToggle = async () => {
    if (!user) {
      alert('Please sign in to follow users')
      navigate('/signin')
      return
    }

    const targetName = profile?.display_name || profile?.username || 'this user'

    try {
      setFollowLoading(true)

      if (isFollowing) {
        // Unfollow
        const { error } = await supabase
          .from('user_follows')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', profile.id)

        if (error) throw error
        setIsFollowing(false)
        setProfile(prev =>
          prev
            ? {
                ...prev,
                follower_count: Math.max(0, (prev.follower_count ?? 1) - 1),
              }
            : prev
        )
        setFollowers(prev => prev.filter(f => f.follower_id !== user.id))
        setMutualConnectionIds(prev => prev.filter(id => id !== user.id))
        showFollowStatus('info', `You unfollowed ${targetName}.`)
      } else {
        // Follow
        const { data: newFollow, error } = await supabase
          .from('user_follows')
          .insert({
            follower_id: user.id,
            following_id: profile.id
          })
          .select('id, created_at')
          .single()

        if (error) throw error
        setIsFollowing(true)
        setProfile(prev =>
          prev
            ? {
                ...prev,
                follower_count: (prev.follower_count ?? 0) + 1,
              }
            : prev
        )
        setFollowers(prev => {
          if (prev.some(f => f.follower_id === user.id)) {
            return prev
          }

          const fallbackUsername =
            currentUserProfile?.username ??
            user.user_metadata?.username ??
            user.email?.split('@')?.[0] ??
            'you'

          const followerProfile = {
            id: currentUserProfile?.id ?? user.id,
            username: fallbackUsername,
            display_name:
              currentUserProfile?.display_name ??
              user.user_metadata?.full_name ??
              fallbackUsername,
            avatar_url:
              currentUserProfile?.avatar_url ??
              user.user_metadata?.avatar_url ??
              null,
          }

          const optimisticFollow = {
            id: newFollow?.id ?? `temp-${user.id}`,
            follower_id: user.id,
            created_at: newFollow?.created_at ?? new Date().toISOString(),
            profiles: followerProfile,
          }

          return [optimisticFollow, ...prev]
        })

        if (profileFollowsViewer) {
          setMutualConnectionIds(prev => {
            if (prev.includes(user.id)) return prev
            return [...prev, user.id]
          })
        }

        showFollowStatus('success', `You’re now following ${targetName}.`)
      }

      // Refresh profile to update counts
      await fetchUserProfile({ showLoader: false })
    } catch (error) {
      console.error('Error toggling follow:', error)
      showFollowStatus('error', 'We couldn’t update follow status. Please try again.')
    } finally {
      setFollowLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">User not found</h1>
          <Link to="/" className="text-purple-600 hover:underline">← Back to Home</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        
        {/* Navigation Bar */}
        <div className="mb-6 flex items-center justify-between">
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
                to="/discover" 
                className="px-4 py-2 font-bold border-4 border-black bg-green-200 hover:bg-green-300 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
              >
                Discover
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

        {/* Profile Header */}
        <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-8 mb-8">
          <div className="flex flex-col md:flex-row gap-6">
            
            {/* Avatar */}
            <div className="flex-shrink-0">
              {profile.avatar_url ? (
                <img 
                  src={profile.avatar_url} 
                  alt={profile.username}
                  className="w-32 h-32 rounded-full border-4 border-black object-cover"
                />
              ) : (
                <div className="w-32 h-32 rounded-full border-4 border-black bg-purple-200 flex items-center justify-center">
                  <span className="text-4xl font-bold text-purple-600">
                    {profile.username?.[0]?.toUpperCase() || '?'}
                  </span>
                </div>
              )}
            </div>

            {/* Profile Info */}
            <div className="flex-1">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-3xl font-black">
                      {profile.display_name || profile.username}
                    </h1>
                    <TrustLevelBadge level={profile.trust_level || 0} size="md" />
                  </div>
                  <p className="text-gray-600 mb-2">@{profile.username}</p>
                  {profile.location && (
                    <p className="text-gray-600 mb-2">📍 {profile.location}</p>
                  )}
                </div>

                {/* Follow Button */}
                {!isOwnProfile && user && (
                  <div className="flex flex-col items-start gap-2">
                    <button
                      onClick={handleFollowToggle}
                      disabled={followLoading}
                      aria-pressed={isFollowing}
                      aria-label={isFollowing ? `Unfollow ${profileDisplayName}` : `Follow ${profileDisplayName}`}
                      className={`px-6 py-3 font-bold border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] disabled:opacity-50 ${
                        isFollowing
                          ? 'bg-gray-200 hover:bg-gray-300'
                          : 'bg-purple-400 hover:bg-purple-500'
                      }`}
                    >
                      {followLoading ? '...' : isFollowing ? 'Following' : 'Follow'}
                    </button>
                    <div className="min-h-[24px]" aria-live="polite" role="status">
                      {followStatus && (
                        <span
                          className={`inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold border-2 border-black rounded-xl ${
                            statusToneClasses[followStatus.type] || 'bg-gray-100 text-gray-900'
                          }`}
                        >
                          {followStatus.type === 'error' ? (
                            <AlertCircle className="w-4 h-4" />
                          ) : (
                            <CheckCircle className="w-4 h-4" />
                          )}
                          <span>{followStatus.message}</span>
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {!isOwnProfile && profileFollowsViewer && (
                  <span className="inline-flex items-center gap-1 px-3 py-2 font-semibold text-sm bg-green-200 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    🤝 Follows you
                  </span>
                )}

                {isOwnProfile && (
                  <Link
                    to="/settings"
                    className="px-6 py-3 font-bold border-4 border-black bg-blue-400 hover:bg-blue-500 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                  >
                    Edit Profile
                  </Link>
                )}
              </div>

              {/* Bio */}
              {profile.bio && (
                <p className="text-gray-700 mb-4">{profile.bio}</p>
              )}

              {/* Social Links */}
              <div className="flex flex-wrap gap-3 mb-4">
                {profile.website && (
                  <a 
                    href={profile.website} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-purple-600 hover:underline flex items-center gap-1"
                  >
                    🌐 Website
                  </a>
                )}
                {profile.twitter_handle && (
                  <a 
                    href={`https://twitter.com/${profile.twitter_handle}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-purple-600 hover:underline flex items-center gap-1"
                  >
                    🐦 Twitter
                  </a>
                )}
                {profile.github_handle && (
                  <a 
                    href={`https://github.com/${profile.github_handle}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-purple-600 hover:underline flex items-center gap-1"
                  >
                    💻 GitHub
                  </a>
                )}
                {profile.linkedin_handle && (
                  <a 
                    href={`https://linkedin.com/in/${profile.linkedin_handle}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-purple-600 hover:underline flex items-center gap-1"
                  >
                    💼 LinkedIn
                  </a>
                )}
              </div>

              {/* Stats */}
              <div className="flex gap-6 text-sm">
                <button
                  onClick={() => setActiveTab('followers')}
                  className="hover:underline"
                >
                  <span className="font-bold">{profile.follower_count || 0}</span> Followers
                </button>
                <button
                  onClick={() => setActiveTab('following')}
                  className="hover:underline"
                >
                  <span className="font-bold">{profile.following_count || 0}</span> Following
                </button>
                <div>
                  <span className="font-bold">{datasets.length}</span> Datasets
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('datasets')}
            className={`px-6 py-3 font-bold border-4 border-black transition-all ${
              activeTab === 'datasets'
                ? 'bg-yellow-400 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
                : 'bg-white hover:bg-gray-100'
            }`}
          >
            Datasets ({datasets.length})
          </button>
          <button
            onClick={() => setActiveTab('followers')}
            className={`px-6 py-3 font-bold border-4 border-black transition-all ${
              activeTab === 'followers'
                ? 'bg-yellow-400 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
                : 'bg-white hover:bg-gray-100'
            }`}
          >
            Followers ({followers.length})
          </button>
          <button
            onClick={() => setActiveTab('following')}
            className={`px-6 py-3 font-bold border-4 border-black transition-all ${
              activeTab === 'following'
                ? 'bg-yellow-400 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
                : 'bg-white hover:bg-gray-100'
            }`}
          >
            Following ({following.length})
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'datasets' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {datasets.length === 0 ? (
              <div className="col-span-full text-center py-12 bg-white border-4 border-black p-8">
                <p className="text-gray-600">No datasets published yet</p>
              </div>
            ) : (
              datasets.map(dataset => (
                <button
                  key={dataset.id}
                  onClick={() => setSelectedDataset(dataset)}
                  className="bg-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all hover:-translate-y-1 p-6 text-left w-full"
                >
                  <h3 className="text-xl font-bold mb-2">{dataset.title}</h3>
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                    {dataset.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="bg-purple-200 px-3 py-1 text-sm font-bold border-2 border-black">
                      {dataset.modality}
                    </span>
                    <span className="font-bold text-lg">
                      ${dataset.price}
                    </span>
                  </div>
                  {dataset.purchase_count > 0 && (
                    <div className="mt-3 text-sm text-gray-600">
                      {dataset.purchase_count} {dataset.purchase_count === 1 ? 'purchase' : 'purchases'}
                    </div>
                  )}
                </button>
              ))
            )}
          </div>
        )}

        {activeTab === 'followers' && (
          <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6">
            {followers.length === 0 ? (
              <p className="text-center text-gray-600 py-8">No followers yet</p>
            ) : (
              <div className="space-y-4">
                {followers.map(follow => (
                  <Link
                    key={follow.id}
                    to={`/profile/${follow.profiles.username}`}
                    className="flex items-center gap-4 p-4 hover:bg-gray-50 border-2 border-black transition-all"
                  >
                    {follow.profiles.avatar_url ? (
                      <img 
                        src={follow.profiles.avatar_url} 
                        alt={follow.profiles.username}
                        className="w-12 h-12 rounded-full border-2 border-black object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full border-2 border-black bg-purple-200 flex items-center justify-center">
                        <span className="text-xl font-bold">
                          {follow.profiles.username?.[0]?.toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div>
                      <p className="font-bold">{follow.profiles.display_name || follow.profiles.username}</p>
                      <p className="text-sm text-gray-600">@{follow.profiles.username}</p>
                      {mutualConnectionIds.includes(follow.follower_id) && (
                        <span className="inline-flex items-center gap-1 mt-1 text-xs font-semibold text-green-700 bg-green-100 border-2 border-black px-2 py-1">
                          🤝 Follows you
                        </span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'following' && (
          <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6">
            {following.length === 0 ? (
              <p className="text-center text-gray-600 py-8">Not following anyone yet</p>
            ) : (
              <div className="space-y-4">
                {following.map(follow => (
                  <Link
                    key={follow.id}
                    to={`/profile/${follow.profiles.username}`}
                    className="flex items-center gap-4 p-4 hover:bg-gray-50 border-2 border-black transition-all"
                  >
                    {follow.profiles.avatar_url ? (
                      <img 
                        src={follow.profiles.avatar_url} 
                        alt={follow.profiles.username}
                        className="w-12 h-12 rounded-full border-2 border-black object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full border-2 border-black bg-purple-200 flex items-center justify-center">
                        <span className="text-xl font-bold">
                          {follow.profiles.username?.[0]?.toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div>
                      <p className="font-bold">{follow.profiles.display_name || follow.profiles.username}</p>
                      <p className="text-sm text-gray-600">@{follow.profiles.username}</p>
                      {mutualConnectionIds.includes(follow.following_id) && (
                        <span className="inline-flex items-center gap-1 mt-1 text-xs font-semibold text-green-700 bg-green-100 border-2 border-black px-2 py-1">
                          🤝 Follows you
                        </span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Dataset Detail Modal */}
      {selectedDataset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="modal-backdrop absolute inset-0 bg-black/50"
            onClick={() => setSelectedDataset(null)}
          />
          <div className="modal-panel relative bg-white text-black max-w-2xl w-full border-4 border-black rounded-3xl shadow-[12px_12px_0_#000] p-6 z-10 max-h-[90vh] overflow-y-auto">
            <button
              className="absolute top-3 right-3 border-2 border-black rounded-full p-1 bg-yellow-300 active:scale-95"
              onClick={() => setSelectedDataset(null)}
            >
              <X className="h-5 w-5" />
            </button>
            <h4 className="text-3xl font-extrabold mb-2">
              {selectedDataset.title}
            </h4>
            <p className="text-black/80 font-semibold mb-4">
              {selectedDataset.description}
            </p>
            {selectedDataset.schema_fields && selectedDataset.schema_fields.length > 0 && (
              <div>
                <div className="mb-4">
                  <div className="font-extrabold mb-1">Schema</div>
                  <div className="flex flex-wrap gap-2">
                    {selectedDataset.schema_fields.map((f) => (
                      <span
                        key={f}
                        className="text-xs font-extrabold px-2 py-1 border-2 border-black rounded-full bg-yellow-200"
                      >
                        {f}
                      </span>
                    ))}
                  </div>
                </div>
                {selectedDataset.sample_data && (
                  <div className="bg-black text-yellow-200 font-mono text-xs p-3 rounded-md border-2 border-black mb-4 whitespace-pre-wrap">
                    {selectedDataset.sample_data}
                  </div>
                )}
                {selectedDataset.notes && (
                  <div className="text-sm font-bold mb-6">
                    {selectedDataset.notes}
                  </div>
                )}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="bg-yellow-400 text-black font-bold border-2 border-black px-3 py-1 rounded-full">
                      {selectedDataset.price === 0 ? 'FREE' : `$${selectedDataset.price}`}
                    </div>
                    {(user && selectedDataset.creator_id === user.id) && (
                      <div className="bg-purple-400 text-white font-bold border-2 border-black px-3 py-1 rounded-full text-sm">
                        ✓ Your dataset
                      </div>
                    )}
                    {(user && selectedDataset.creator_id !== user.id && userOwnsDataset(selectedDataset.id)) && (
                      <div className="bg-green-400 text-black font-bold border-2 border-black px-3 py-1 rounded-full text-sm">
                        ✓ You own this
                      </div>
                    )}
                  </div>
                  {(user && (selectedDataset.creator_id === user.id || userOwnsDataset(selectedDataset.id))) ? (
                    <button
                      className="bg-green-400 text-black font-bold border-2 border-black rounded-full px-6 py-2 hover:bg-green-300 active:scale-95"
                      onClick={() => {
                        setSelectedDataset(null)
                        navigate('/dashboard')
                      }}
                    >
                      View in Library
                    </button>
                  ) : (
                    <button
                      className="bg-[linear-gradient(90deg,#00ffff,#ff00c3)] text-white font-bold border-2 border-black rounded-full px-6 py-2 active:scale-95"
                      onClick={() => handleBuyDataset(selectedDataset)}
                      disabled={isProcessing}
                    >
                      {isProcessing ? 'Processing...' : (selectedDataset.price === 0 ? 'Get Free' : 'Buy Now')}
                    </button>
                  )}
                </div>
                {/* Report button - only show if not own dataset */}
                {user && selectedDataset.creator_id !== user.id && (
                  <div className="flex justify-end">
                    <ReportButton 
                      datasetId={selectedDataset.id} 
                      datasetTitle={selectedDataset.title}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
