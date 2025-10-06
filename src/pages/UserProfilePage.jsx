import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export default function UserProfilePage() {
  const { username } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState(null)
  const [datasets, setDatasets] = useState([])
  const [isFollowing, setIsFollowing] = useState(false)
  const [followLoading, setFollowLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('datasets') // datasets, followers, following
  const [followers, setFollowers] = useState([])
  const [following, setFollowing] = useState([])
  
  const isOwnProfile = user?.id === profile?.id

  useEffect(() => {
    fetchUserProfile()
  }, [username])

  const fetchUserProfile = async () => {
    try {
      setLoading(true)

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
        .select(`
          id,
          follower_id,
          created_at,
          profiles:follower_id (
            id,
            username,
            display_name,
            avatar_url
          )
        `)
        .eq('following_id', profileData.id)
        .order('created_at', { ascending: false })

      setFollowers(followersData || [])

      // Fetch following
      const { data: followingData } = await supabase
        .from('user_follows')
        .select(`
          id,
          following_id,
          created_at,
          profiles:following_id (
            id,
            username,
            display_name,
            avatar_url
          )
        `)
        .eq('follower_id', profileData.id)
        .order('created_at', { ascending: false })

      setFollowing(followingData || [])

    } catch (error) {
      console.error('Error fetching profile:', error)
      alert('Error loading profile')
    } finally {
      setLoading(false)
    }
  }

  const handleFollowToggle = async () => {
    if (!user) {
      alert('Please sign in to follow users')
      navigate('/signin')
      return
    }

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
      } else {
        // Follow
        const { error } = await supabase
          .from('user_follows')
          .insert({
            follower_id: user.id,
            following_id: profile.id
          })

        if (error) throw error
        setIsFollowing(true)
      }

      // Refresh profile to update counts
      await fetchUserProfile()
    } catch (error) {
      console.error('Error toggling follow:', error)
      alert('Failed to update follow status')
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
                  <h1 className="text-3xl font-black mb-2">
                    {profile.display_name || profile.username}
                  </h1>
                  <p className="text-gray-600 mb-2">@{profile.username}</p>
                  {profile.location && (
                    <p className="text-gray-600 mb-2">📍 {profile.location}</p>
                  )}
                </div>

                {/* Follow Button */}
                {!isOwnProfile && user && (
                  <button
                    onClick={handleFollowToggle}
                    disabled={followLoading}
                    className={`px-6 py-3 font-bold border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] disabled:opacity-50 ${
                      isFollowing
                        ? 'bg-gray-200 hover:bg-gray-300'
                        : 'bg-purple-400 hover:bg-purple-500'
                    }`}
                  >
                    {followLoading ? '...' : isFollowing ? 'Following' : 'Follow'}
                  </button>
                )}

                {isOwnProfile && (
                  <Link
                    to="/dashboard"
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
                <Link
                  key={dataset.id}
                  to={`/dataset/${dataset.id}`}
                  className="bg-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all hover:-translate-y-1 p-6"
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
                </Link>
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
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
