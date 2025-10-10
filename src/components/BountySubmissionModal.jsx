import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export function BountySubmissionModal({ isOpen, onClose, bounty, onSuccess }) {
  const { user, profile } = useAuth()
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    file: null,
    price: '',
    license: 'Commercial'
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Tier validation
  const tierHierarchy = {
    newcomer: 0,
    verified: 1,
    expert: 2,
    master: 3
  };

  const tierDisplayInfo = {
    newcomer: { label: 'Open to All', badge: '🌟', color: 'bg-gray-100 text-gray-800' },
    verified: { label: 'Verified+', badge: '✓', color: 'bg-blue-100 text-blue-800' },
    expert: { label: 'Expert+', badge: '✓✓', color: 'bg-purple-100 text-purple-800' },
    master: { label: 'Master Only', badge: '⭐', color: 'bg-yellow-100 text-yellow-800' }
  };

  useEffect(() => {
    if (isOpen && bounty) {
      // Pre-fill suggested price from bounty
      setFormData(prev => ({
        ...prev,
        price: bounty.budget_max || bounty.budget_min || ''
      }))
    }
  }, [isOpen, bounty])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Validate user is signed in
      if (!user) {
        throw new Error('Please sign in to submit to bounties')
      }

      // Check tier requirements
      const requiredTier = bounty.minimum_curator_tier || 'newcomer';
      const trustLevelMap = ['newcomer', 'verified', 'expert', 'master'];
      const userTierString = trustLevelMap[profile?.trust_level || 0];
      
      if (tierHierarchy[userTierString] < tierHierarchy[requiredTier]) {
        throw new Error(`This bounty requires ${tierDisplayInfo[requiredTier].label} trust level. Your current level: ${tierDisplayInfo[userTierString].label}. Upload datasets and earn feedback to rank up!`)
      }

      // Validate form
      if (!formData.title || !formData.description || !formData.file || !formData.price) {
        throw new Error('Please fill in all required fields')
      }

      // Validate file
      if (formData.file.size > 100 * 1024 * 1024) { // 100MB limit
        throw new Error('File must be under 100MB')
      }

      // Upload file to Supabase storage
      const fileExt = formData.file.name.split('.').pop()
      const fileName = `${user.id}-${Date.now()}.${fileExt}`
      const filePath = `${user.id}/${fileName}` // Use user ID as folder per storage policy

      const { error: uploadError } = await supabase.storage
        .from('datasets')
        .upload(filePath, formData.file)

      if (uploadError) throw uploadError

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('datasets')
        .getPublicUrl(filePath)

      // Create dataset record
      const { data: datasetData, error: datasetError } = await supabase
        .from('datasets')
        .insert([{
          creator_id: user.id,
          title: formData.title,
          description: formData.description,
          price: parseFloat(formData.price),
          file_url: publicUrl,
          file_size: formData.file.size,
          modality: 'custom', // Since bounties don't have modality
          license: formData.license,
          tags: ['bounty-submission'],
          is_active: true
        }])
        .select()
        .single()

      if (datasetError) throw datasetError

      // Create bounty submission record
      const { error: submissionError } = await supabase
        .from('bounty_submissions')
        .insert([{
          request_id: bounty.id,
          creator_id: user.id,
          dataset_id: datasetData.id,
          notes: `Custom dataset created for bounty: ${bounty.title}`,
          status: 'pending'
        }])

      if (submissionError) throw submissionError

      // Success!
      onSuccess?.()
      handleClose()
      alert('🎉 Custom dataset submitted successfully! The bounty creator will review your submission.')
    } catch (err) {
      console.error('Submission error:', err)
      setError(err.message || 'Failed to submit dataset')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setFormData({
      title: '',
      description: '',
      file: null,
      price: '',
      license: 'Commercial'
    })
    setError('')
    onClose()
  }

  if (!isOpen || !bounty) return null

  // Check tier requirement
  const requiredTier = bounty.minimum_curator_tier || 'newcomer';
  const trustLevelMap = ['newcomer', 'verified', 'expert', 'master'];
  const userTierString = trustLevelMap[profile?.trust_level || 0];
  const meetsTierRequirement = tierHierarchy[userTierString] >= tierHierarchy[requiredTier];
  const tierInfo = tierDisplayInfo[requiredTier];
  const userTierInfo = tierDisplayInfo[userTierString];

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-white border-4 border-black rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-gradient-to-r from-cyan-300 to-pink-300 border-b-4 border-black p-6 flex justify-between items-center">
          <h3 className="text-2xl font-black">Create Custom Dataset for Bounty</h3>
          <button
            onClick={handleClose}
            className="text-3xl font-bold hover:opacity-70 transition-opacity"
          >
            ×
          </button>
        </div>

        <div className="p-6">
          {/* Tier Warning Banner */}
          {!meetsTierRequirement && (
            <div className="bg-yellow-50 border-2 border-yellow-600 rounded-xl p-4 mb-6">
              <div className="flex items-start gap-3">
                <span className="text-2xl">⚠️</span>
                <div>
                  <h4 className="font-extrabold text-yellow-900 mb-1">Tier Requirement Not Met</h4>
                  <p className="text-sm text-yellow-800 mb-2">
                    This bounty requires <span className="font-bold">{tierInfo.label}</span> trust level.
                  </p>
                  <p className="text-sm text-yellow-800">
                    Your current level: <span className="font-bold">{userTierInfo.label}</span>
                  </p>
                  <p className="text-xs text-yellow-700 mt-2">
                    💡 Upload quality datasets and earn positive feedback to rank up!
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Bounty Info */}
          <div className="bg-gradient-to-r from-purple-100 to-pink-100 border-2 border-black rounded-xl p-4 mb-6">
            <h4 className="font-extrabold text-lg mb-2">{bounty.title}</h4>
            <p className="text-sm text-black/80 mb-3">{bounty.description}</p>
            <div className="flex gap-3 flex-wrap text-sm">
              <span className="bg-white border-2 border-black rounded-full px-3 py-1 font-bold">
                💰 ${bounty.budget_min} - ${bounty.budget_max}
              </span>
              <span className={`border-2 border-black rounded-full px-3 py-1 font-bold ${tierInfo.color}`}>
                {tierInfo.badge} {tierInfo.label} Required
              </span>
              <span className={`border-2 border-black rounded-full px-3 py-1 font-bold ${userTierInfo.color}`}>
                👤 Your Tier: {userTierInfo.label}
              </span>
            </div>
          </div>

          {/* Submission Form */}
          <form onSubmit={handleSubmit}>
            {/* Dataset Title */}
            <div className="mb-4">
              <label className="block font-extrabold text-lg mb-2">
                Dataset Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Customer Sentiment Analysis Dataset"
                className="w-full px-4 py-3 border-2 border-black rounded-xl font-bold"
                required
              />
            </div>

            {/* Dataset Description */}
            <div className="mb-4">
              <label className="block font-extrabold text-lg mb-2">
                Dataset Description *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe your dataset and how it fulfills the bounty requirements..."
                className="w-full px-4 py-3 border-2 border-black rounded-xl font-bold resize-none"
                rows="4"
                required
              />
              <p className="text-sm text-black/70 mt-1">
                Explain what data is included and how it meets the bounty specifications
              </p>
            </div>

            {/* File Upload */}
            <div className="mb-4">
              <label className="block font-extrabold text-lg mb-2">
                Upload Dataset File *
              </label>
              <input
                type="file"
                onChange={(e) => setFormData({ ...formData, file: e.target.files[0] })}
                accept=".csv,.json,.parquet,.xlsx,.xls,.zip,.rar,.7z,.tar,.gz,.txt,.md,.pdf,.wav,.mp3,.mp4,.avi,.mov,.mkv,.png,.jpg,.jpeg,.gif,.svg,.webp,.sql,.db,.sqlite,.h5,.hdf5,.npy,.npz,.pickle,.pkl,.arrow,.feather,.xml,.yaml,.yml,.tsv,.avro,.orc"
                className="w-full px-4 py-3 border-2 border-black rounded-xl font-bold file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:font-bold file:bg-gradient-to-r file:from-cyan-500 file:to-pink-500 file:text-white hover:file:opacity-90"
                required
              />
              <p className="text-sm text-black/70 mt-1">
                Accepted formats: CSV, JSON, Excel, Parquet, ZIP/RAR, TXT, MD, PDF, Audio (WAV/MP3), Video (MP4/AVI/MOV), Images (PNG/JPG/GIF/SVG), SQL, HDF5, NumPy, Pickle, Arrow, Feather, and more • Max size: 100MB
              </p>
            </div>

            {/* Price */}
            <div className="mb-4">
              <label className="block font-extrabold text-lg mb-2">
                Dataset Price *
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-lg">$</span>
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  className="w-full pl-8 pr-4 py-3 border-2 border-black rounded-xl font-bold"
                  required
                />
              </div>
              <p className="text-sm text-black/70 mt-1">
                Suggested price based on bounty budget: ${bounty.budget_min} - ${bounty.budget_max}
              </p>
            </div>

            {/* License */}
            <div className="mb-6">
              <label className="block font-extrabold text-lg mb-2">
                License Type
              </label>
              <select
                value={formData.license}
                onChange={(e) => setFormData({ ...formData, license: e.target.value })}
                className="w-full px-4 py-3 border-2 border-black rounded-xl font-bold bg-white"
              >
                <option value="Commercial">Commercial Use Allowed</option>
                <option value="Non-Commercial">Non-Commercial Only</option>
                <option value="Research">Research & Education Only</option>
              </select>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-100 border-2 border-red-500 rounded-xl p-4 mb-6">
                <p className="font-bold text-red-700">⚠️ {error}</p>
              </div>
            )}

            {/* Revenue Split Info */}
            <div className="bg-gradient-to-r from-green-50 to-blue-50 border-2 border-black rounded-xl p-4 mb-6">
              <h4 className="font-extrabold mb-2">💰 Your Earnings</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Dataset Price:</span>
                  <span className="font-bold">${formData.price || '0.00'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Your Share (80%):</span>
                  <span className="font-bold text-green-700">${formData.price ? (parseFloat(formData.price) * 0.8).toFixed(2) : '0.00'}</span>
                </div>
                <div className="flex justify-between text-xs text-black/60">
                  <span>Platform Fee (20%):</span>
                  <span>${formData.price ? (parseFloat(formData.price) * 0.2).toFixed(2) : '0.00'}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={loading || !meetsTierRequirement}
                className="flex-1 bg-[linear-gradient(90deg,#00ffff,#ff00c3)] text-white font-extrabold text-lg py-3 border-2 border-black rounded-full hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition"
                title={!meetsTierRequirement ? `Requires ${tierInfo.label} trust level` : ''}
              >
                {loading ? 'Uploading...' : !meetsTierRequirement ? '🔒 Tier Requirement Not Met' : '🚀 Submit Custom Dataset'}
              </button>
              <button
                type="button"
                onClick={handleClose}
                className="px-6 py-3 border-2 border-black rounded-full font-bold hover:bg-black/5 transition"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
