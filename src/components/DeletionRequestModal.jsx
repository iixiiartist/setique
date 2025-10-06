// DeletionRequestModal.jsx
// Modal for users to request dataset deletion with reason

import { useState } from 'react'
import { X, AlertTriangle } from './Icons'

export default function DeletionRequestModal({ dataset, onClose, onSubmit }) {
  const [reason, setReason] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    // Validate reason
    if (reason.length < 10) {
      setError('Reason must be at least 10 characters')
      return
    }

    if (reason.length > 1000) {
      setError('Reason must be less than 1000 characters')
      return
    }

    setIsSubmitting(true)

    try {
      await onSubmit(dataset.id, reason)
      onClose()
    } catch (err) {
      setError(err.message || 'Failed to submit deletion request')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border-2 border-yellow-500/50 rounded-xl p-6 max-w-lg w-full shadow-2xl">
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-yellow-500" />
            <h2 className="text-2xl font-bold text-white">Request Dataset Deletion</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
            disabled={isSubmitting}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Warning Notice */}
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mb-6">
          <p className="text-yellow-500 text-sm">
            <strong>Important:</strong> This will submit a deletion request to the admin. 
            Your dataset will remain active until an admin reviews and approves your request.
          </p>
        </div>

        {/* Dataset Info */}
        <div className="bg-gray-800 rounded-lg p-4 mb-6">
          <p className="text-gray-400 text-sm mb-1">Dataset to delete:</p>
          <p className="text-white font-semibold">{dataset.title}</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {/* Reason */}
          <div className="mb-6">
            <label htmlFor="reason" className="block text-sm font-medium text-gray-300 mb-2">
              Reason for deletion <span className="text-red-500">*</span>
            </label>
            <textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Please explain why you want to delete this dataset (minimum 10 characters)..."
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500 transition-colors resize-none"
              rows="5"
              disabled={isSubmitting}
              required
            />
            <div className="flex justify-between mt-2">
              <p className="text-xs text-gray-500">
                {reason.length < 10 ? `Need ${10 - reason.length} more characters` : 'Reason meets minimum'}
              </p>
              <p className="text-xs text-gray-500">
                {reason.length}/1000
              </p>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 bg-red-500/10 border border-red-500/50 rounded-lg p-3">
              <p className="text-red-500 text-sm">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-800 hover:bg-gray-700 text-white py-3 rounded-lg transition-colors disabled:opacity-50"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-black font-semibold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSubmitting || reason.length < 10}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
