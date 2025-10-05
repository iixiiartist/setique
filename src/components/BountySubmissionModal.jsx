import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export function BountySubmissionModal({ isOpen, onClose, bounty, onSuccess }) {
  const { user } = useAuth()
  const [userDatasets, setUserDatasets] = useState([])
  const [selectedDataset, setSelectedDataset] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [existingSubmissions, setExistingSubmissions] = useState([])

  useEffect(() => {
    if (isOpen && user && bounty?.id) {
      const fetchData = async () => {
        try {
          // Fetch user's datasets
          const { data: datasetsData, error: datasetsError } = await supabase
            .from('datasets')
            .select('id, title, price, modality')
            .eq('creator_id', user.id)
            .order('created_at', { ascending: false })

          if (datasetsError) throw datasetsError
          setUserDatasets(datasetsData || [])

          // Fetch existing submissions
          const { data: submissionsData, error: submissionsError } = await supabase
            .from('bounty_submissions')
            .select('dataset_id')
            .eq('bounty_id', bounty.id)
            .eq('creator_id', user.id)

          if (submissionsError) throw submissionsError
          setExistingSubmissions(submissionsData?.map(s => s.dataset_id) || [])
        } catch (err) {
          console.error('Error fetching data:', err)
        }
      }
      fetchData()
    }
  }, [isOpen, user, bounty?.id])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Validate selection
      if (!selectedDataset) {
        throw new Error('Please select a dataset')
      }

      // Check for duplicate submission
      if (existingSubmissions.includes(selectedDataset)) {
        throw new Error('You have already submitted this dataset to this bounty')
      }

      // Insert submission
      const { error: insertError } = await supabase
        .from('bounty_submissions')
        .insert([{
          bounty_id: bounty.id,
          creator_id: user.id,
          dataset_id: selectedDataset,
          notes: notes.trim(),
          status: 'pending'
        }])

      if (insertError) throw insertError

      // Success!
      onSuccess?.()
      handleClose()
      alert('🎉 Dataset submitted successfully! The bounty creator will review your submission.')
    } catch (err) {
      console.error('Submission error:', err)
      setError(err.message || 'Failed to submit dataset')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setSelectedDataset('')
    setNotes('')
    setError('')
    onClose()
  }

  if (!isOpen) return null

  const availableDatasets = userDatasets.filter(
    d => !existingSubmissions.includes(d.id)
  )

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-white border-4 border-black rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b-4 border-black p-6 flex justify-between items-center">
          <h3 className="text-2xl font-black">Submit Dataset to Bounty</h3>
          <button
            onClick={handleClose}
            className="text-3xl font-bold hover:opacity-70 transition-opacity"
          >
            ×
          </button>
        </div>

        <div className="p-6">
          {/* Bounty Info */}
          <div className="bg-[#00ffff]/10 border-2 border-black rounded-xl p-4 mb-6">
            <h4 className="font-extrabold text-lg mb-2">{bounty?.title}</h4>
            <div className="flex gap-4 text-sm">
              <span className="bg-white border-2 border-black rounded-full px-3 py-1 font-bold">
                {bounty?.modality}
              </span>
              <span className="bg-white border-2 border-black rounded-full px-3 py-1 font-bold">
                Budget: ${bounty?.budget}
              </span>
            </div>
          </div>

          {/* No Datasets Warning */}
          {userDatasets.length === 0 && (
            <div className="bg-yellow-100 border-2 border-black rounded-xl p-4 mb-6">
              <p className="font-bold">⚠️ You don&apos;t have any datasets yet!</p>
              <p className="text-sm mt-2">
                Create a dataset first by clicking &quot;Upload New Dataset&quot; on the homepage,
                then return here to submit it to this bounty.
              </p>
            </div>
          )}

          {/* All Already Submitted Warning */}
          {userDatasets.length > 0 && availableDatasets.length === 0 && (
            <div className="bg-yellow-100 border-2 border-black rounded-xl p-4 mb-6">
              <p className="font-bold">ℹ️ You&apos;ve already submitted all your datasets to this bounty.</p>
            </div>
          )}

          {/* Submission Form */}
          {availableDatasets.length > 0 && (
            <form onSubmit={handleSubmit}>
              {/* Dataset Selection */}
              <div className="mb-6">
                <label className="block font-extrabold text-lg mb-2">
                  Select Your Dataset *
                </label>
                <select
                  value={selectedDataset}
                  onChange={(e) => setSelectedDataset(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-black rounded-xl font-bold bg-white"
                  required
                >
                  <option value="">Choose a dataset...</option>
                  {availableDatasets.map(dataset => (
                    <option key={dataset.id} value={dataset.id}>
                      {dataset.title} - ${dataset.price} ({dataset.modality})
                    </option>
                  ))}
                </select>
                <p className="text-sm text-black/70 mt-2">
                  Select which of your datasets you&apos;d like to submit to this bounty.
                </p>
              </div>

              {/* Notes */}
              <div className="mb-6">
                <label className="block font-extrabold text-lg mb-2">
                  Why does this dataset fit?
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Explain how your dataset meets the bounty requirements..."
                  className="w-full px-4 py-3 border-2 border-black rounded-xl font-bold resize-none"
                  rows="4"
                />
                <p className="text-sm text-black/70 mt-2">
                  Optional: Help the bounty creator understand why your dataset is a good match.
                </p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-100 border-2 border-red-500 rounded-xl p-4 mb-6">
                  <p className="font-bold text-red-700">⚠️ {error}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={loading || !selectedDataset}
                  className="flex-1 bg-[linear-gradient(90deg,#00ffff,#ff00c3)] text-white font-extrabold text-lg py-3 border-2 border-black rounded-full hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Submitting...' : '🚀 Submit Dataset'}
                </button>
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-6 py-3 border-2 border-black rounded-full font-bold hover:bg-black/5"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
