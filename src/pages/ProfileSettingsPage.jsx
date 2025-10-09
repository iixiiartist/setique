import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { CheckCircle, AlertCircle } from '../components/Icons'

export default function ProfileSettingsPage() {
  const navigate = useNavigate()
  const { user, profile, refreshProfile } = useAuth()
  
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState(null)
  const [formData, setFormData] = useState({
    username: '',
    display_name: '',
    bio: '',
    avatar_url: '',
    website: '',
    twitter_handle: '',
    github_handle: '',
    linkedin_handle: ''
  })

  useEffect(() => {
    if (profile) {
      setFormData({
        username: profile.username || '',
        display_name: profile.display_name || '',
        bio: profile.bio || '',
        avatar_url: profile.avatar_url || '',
        website: profile.website || '',
        twitter_handle: profile.twitter_handle || '',
        github_handle: profile.github_handle || '',
        linkedin_handle: profile.linkedin_handle || ''
      })
    }
  }, [profile])

  const showStatus = (type, message) => {
    setStatus({ type, message })
    setTimeout(() => setStatus(null), 4000)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!user) {
      showStatus('error', 'You must be logged in to update your profile.')
      return
    }

    // Validate username
    if (formData.username && !/^[a-zA-Z0-9_-]+$/.test(formData.username)) {
      showStatus('error', 'Username can only contain letters, numbers, underscores, and hyphens.')
      return
    }

    if (formData.username && formData.username.length < 3) {
      showStatus('error', 'Username must be at least 3 characters long.')
      return
    }

    setLoading(true)

    try {
      // Check if username is taken (if it changed)
      if (formData.username && formData.username !== profile?.username) {
        const { data: existingUser } = await supabase
          .from('profiles')
          .select('id')
          .eq('username', formData.username)
          .single()

        if (existingUser && existingUser.id !== user.id) {
          showStatus('error', 'This username is already taken.')
          setLoading(false)
          return
        }
      }

      // Clean up social handles (remove @ symbol if present)
      const cleanedData = {
        ...formData,
        twitter_handle: formData.twitter_handle.replace(/^@/, ''),
        github_handle: formData.github_handle.replace(/^@/, ''),
        linkedin_handle: formData.linkedin_handle.replace(/^@/, '')
      }

      // Update profile
      const { data, error } = await supabase
        .from('profiles')
        .update(cleanedData)
        .eq('id', user.id)
        .select()

      if (error) {
        console.error('Supabase update error:', error)
        console.error('Error details:', JSON.stringify(error, null, 2))
        throw error
      }

      console.log('Profile updated successfully:', data)

      // Refresh profile in context
      await refreshProfile()

      showStatus('success', 'Profile updated successfully!')
      
      // Navigate to profile page after a short delay
      setTimeout(() => {
        if (formData.username) {
          navigate(`/profile/${formData.username}`)
        } else {
          navigate('/dashboard')
        }
      }, 1500)
    } catch (error) {
      console.error('Error updating profile:', error)
      console.error('Error message:', error.message)
      console.error('Error code:', error.code)
      console.error('Error details:', error.details)
      showStatus('error', `Failed to update profile: ${error.message || 'Please try again.'}`)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-yellow-50 flex items-center justify-center p-4">
        <div className="bg-white border-4 border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] max-w-md w-full">
          <p className="text-center text-gray-700">Please log in to edit your profile.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-yellow-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        
        {/* Navigation Bar */}
        <div className="mb-6 flex items-center justify-between">
          <Link 
            to="/dashboard" 
            className="inline-flex items-center gap-2 px-4 py-2 font-bold border-4 border-black bg-white hover:bg-gray-100 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
          >
            ← Back to Dashboard
          </Link>
          {profile?.username && (
            <Link 
              to={`/profile/${profile.username}`} 
              className="px-4 py-2 font-bold border-4 border-black bg-blue-200 hover:bg-blue-300 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            >
              View Profile
            </Link>
          )}
        </div>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-black mb-4">Edit Profile</h1>
          <p className="text-gray-700">
            Update your profile information and social links
          </p>
        </div>

        {/* Status Message */}
        {status && (
          <div
            className={`mb-6 p-4 border-4 border-black flex items-start gap-3 ${
              status.type === 'success'
                ? 'bg-green-200'
                : status.type === 'error'
                ? 'bg-red-200'
                : 'bg-blue-100'
            }`}
          >
            {status.type === 'success' ? (
              <CheckCircle className="w-6 h-6 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-6 h-6 flex-shrink-0" />
            )}
            <p className="font-semibold">{status.message}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white border-4 border-black p-6 md:p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <div className="space-y-6">
            {/* Username */}
            <div>
              <label htmlFor="username" className="block font-bold mb-2">
                Username *
              </label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border-4 border-black focus:outline-none focus:ring-4 focus:ring-yellow-400"
                placeholder="your_username"
              />
              <p className="text-sm text-gray-600 mt-1">
                Your unique identifier. Letters, numbers, underscores, and hyphens only.
              </p>
            </div>

            {/* Display Name */}
            <div>
              <label htmlFor="display_name" className="block font-bold mb-2">
                Display Name
              </label>
              <input
                type="text"
                id="display_name"
                name="display_name"
                value={formData.display_name}
                onChange={handleChange}
                className="w-full px-4 py-3 border-4 border-black focus:outline-none focus:ring-4 focus:ring-yellow-400"
                placeholder="Your Name"
              />
              <p className="text-sm text-gray-600 mt-1">
                The name displayed on your profile (optional).
              </p>
            </div>

            {/* Bio */}
            <div>
              <label htmlFor="bio" className="block font-bold mb-2">
                Bio
              </label>
              <textarea
                id="bio"
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                rows={4}
                className="w-full px-4 py-3 border-4 border-black focus:outline-none focus:ring-4 focus:ring-yellow-400 resize-none"
                placeholder="Tell us about yourself..."
              />
              <p className="text-sm text-gray-600 mt-1">
                A short description about you and your work.
              </p>
            </div>

            {/* Avatar URL */}
            <div>
              <label htmlFor="avatar_url" className="block font-bold mb-2">
                Avatar URL
              </label>
              <input
                type="url"
                id="avatar_url"
                name="avatar_url"
                value={formData.avatar_url}
                onChange={handleChange}
                className="w-full px-4 py-3 border-4 border-black focus:outline-none focus:ring-4 focus:ring-yellow-400"
                placeholder="https://example.com/avatar.jpg"
              />
              <p className="text-sm text-gray-600 mt-1">
                Link to your profile picture.
              </p>
            </div>

            {/* Social Links Section */}
            <div className="border-t-4 border-black pt-6 mt-6">
              <h3 className="text-2xl font-black mb-4">Social Links</h3>
              
              {/* Website */}
              <div className="mb-4">
                <label htmlFor="website" className="block font-bold mb-2">
                  🌐 Website
                </label>
                <input
                  type="url"
                  id="website"
                  name="website"
                  value={formData.website}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border-4 border-black focus:outline-none focus:ring-4 focus:ring-yellow-400"
                  placeholder="https://yourwebsite.com"
                />
              </div>

              {/* Twitter */}
              <div className="mb-4">
                <label htmlFor="twitter_handle" className="block font-bold mb-2">
                  🐦 Twitter Handle
                </label>
                <input
                  type="text"
                  id="twitter_handle"
                  name="twitter_handle"
                  value={formData.twitter_handle}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border-4 border-black focus:outline-none focus:ring-4 focus:ring-yellow-400"
                  placeholder="username"
                />
                <p className="text-sm text-gray-600 mt-1">
                  Without the @ symbol
                </p>
              </div>

              {/* GitHub */}
              <div>
                <label htmlFor="github_handle" className="block font-bold mb-2">
                  💻 GitHub Handle
                </label>
                <input
                  type="text"
                  id="github_handle"
                  name="github_handle"
                  value={formData.github_handle}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border-4 border-black focus:outline-none focus:ring-4 focus:ring-yellow-400"
                  placeholder="username"
                />
                <p className="text-sm text-gray-600 mt-1">
                  Without the @ symbol
                </p>
              </div>

              {/* LinkedIn */}
              <div>
                <label htmlFor="linkedin_handle" className="block font-bold mb-2">
                  💼 LinkedIn Profile
                </label>
                <input
                  type="text"
                  id="linkedin_handle"
                  name="linkedin_handle"
                  value={formData.linkedin_handle}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border-4 border-black focus:outline-none focus:ring-4 focus:ring-yellow-400"
                  placeholder="username"
                />
                <p className="text-sm text-gray-600 mt-1">
                  Your LinkedIn username (e.g., &quot;johnsmith&quot; from linkedin.com/in/johnsmith)
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4 mt-8">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 font-bold border-4 border-black bg-yellow-400 hover:bg-yellow-500 disabled:bg-gray-300 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] disabled:translate-x-0 disabled:translate-y-0 disabled:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-6 py-3 font-bold border-4 border-black bg-white hover:bg-gray-100 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
