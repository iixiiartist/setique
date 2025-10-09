import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { X, Send } from './Icons'

export default function FeedbackModal({ isOpen, onClose }) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: user?.email || '',
    category: 'feedback',
    message: ''
  })

  const categories = [
    { value: 'bug', label: '🐛 Bug Report', desc: 'Something isn\'t working' },
    { value: 'feature', label: '✨ Feature Request', desc: 'Suggest a new feature' },
    { value: 'improvement', label: '🚀 Improvement', desc: 'Make something better' },
    { value: 'question', label: '❓ Question', desc: 'Need help or clarification' },
    { value: 'other', label: '💬 Other', desc: 'General feedback' }
  ]

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) {
      alert('Please fill in all required fields')
      return
    }

    setLoading(true)

    try {
      const { error } = await supabase
        .from('user_feedback')
        .insert({
          user_id: user?.id || null,
          email: formData.email,
          name: formData.name,
          category: formData.category,
          message: formData.message,
          status: 'new'
        })

      if (error) throw error

      alert('✅ Thank you for your feedback! We\'ll review it shortly.')
      
      // Reset form
      setFormData({
        name: '',
        email: user?.email || '',
        category: 'feedback',
        message: ''
      })
      
      onClose()
    } catch (error) {
      console.error('Error submitting feedback:', error)
      alert('Failed to submit feedback. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="border-b-4 border-black p-6 bg-cyan-400 flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-extrabold text-black">💬 Send Feedback</h2>
            <p className="text-sm font-semibold text-black/70 mt-1">
              Help us improve SETIQUE
            </p>
          </div>
          <button
            onClick={onClose}
            className="bg-white border-3 border-black p-2 hover:bg-gray-100 transition rounded-lg"
            aria-label="Close feedback modal"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Name */}
          <div>
            <label className="block text-sm font-bold text-black mb-2">
              Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 border-3 border-black rounded-lg font-semibold focus:outline-none focus:ring-3 focus:ring-cyan-400"
              placeholder="Your name"
              required
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-bold text-black mb-2">
              Email *
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-3 border-3 border-black rounded-lg font-semibold focus:outline-none focus:ring-3 focus:ring-cyan-400"
              placeholder="your@email.com"
              required
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-bold text-black mb-3">
              Category *
            </label>
            <div className="space-y-2">
              {categories.map((cat) => (
                <label
                  key={cat.value}
                  className={`flex items-start gap-3 p-4 border-3 border-black rounded-lg cursor-pointer transition ${
                    formData.category === cat.value
                      ? 'bg-cyan-400 shadow-[4px_4px_0_#000]'
                      : 'bg-white hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="category"
                    value={cat.value}
                    checked={formData.category === cat.value}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="font-bold text-black">{cat.label}</div>
                    <div className="text-sm text-black/70">{cat.desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Message */}
          <div>
            <label className="block text-sm font-bold text-black mb-2">
              Message *
            </label>
            <textarea
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              rows={6}
              className="w-full px-4 py-3 border-3 border-black rounded-lg font-semibold focus:outline-none focus:ring-3 focus:ring-cyan-400 resize-none"
              placeholder="Tell us what's on your mind..."
              required
            />
            <p className="text-xs text-gray-600 mt-2">
              Be as detailed as possible. For bug reports, include steps to reproduce.
            </p>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-white text-black font-bold px-6 py-3 rounded-full border-3 border-black hover:bg-gray-100 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-cyan-400 text-black font-bold px-6 py-3 rounded-full border-3 border-black shadow-[4px_4px_0_#000] hover:translate-y-1 hover:shadow-[2px_2px_0_#000] transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                'Sending...'
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Send Feedback
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
