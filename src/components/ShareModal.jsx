import { useState } from 'react'
import { X, Copy, Check } from 'lucide-react'
import { Twitter, Linkedin, Facebook } from './Icons'

const ShareModal = ({ isOpen, onClose, dataset }) => {
  const [copied, setCopied] = useState(false)

  if (!isOpen || !dataset) return null

  const shareUrl = `${window.location.origin}/dataset/${dataset.id}`
  const shareTitle = `Check out "${dataset.title}" on Setique`

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
      alert('Failed to copy link')
    }
  }

  const handleShareTwitter = () => {
    const text = `${shareTitle} - ${dataset.modality} dataset for $${dataset.price}`
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`
    window.open(url, '_blank', 'width=550,height=420')
  }

  const handleShareLinkedIn = () => {
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`
    window.open(url, '_blank', 'width=550,height=420')
  }

  const handleShareFacebook = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`
    window.open(url, '_blank', 'width=550,height=420')
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div 
        className="bg-white border-4 border-black rounded-2xl shadow-[8px_8px_0_#000] p-6 max-w-md w-full"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h3 className="text-2xl font-extrabold mb-1">Share Dataset</h3>
            <p className="text-sm text-black/70">{dataset.title}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
            aria-label="Close"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Copy Link */}
        <div className="mb-6">
          <label className="block font-bold text-sm mb-2">Share Link</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={shareUrl}
              readOnly
              className="flex-1 px-4 py-2 border-2 border-black rounded-lg font-mono text-sm bg-gray-50"
            />
            <button
              onClick={handleCopyLink}
              className={`px-4 py-2 font-bold rounded-lg border-2 border-black transition ${
                copied
                  ? 'bg-green-400 text-black'
                  : 'bg-yellow-300 text-black hover:bg-yellow-400'
              }`}
              aria-label="Copy link"
            >
              {copied ? (
                <Check className="h-5 w-5" />
              ) : (
                <Copy className="h-5 w-5" />
              )}
            </button>
          </div>
          {copied && (
            <p className="text-sm text-green-600 font-bold mt-2">✓ Link copied to clipboard!</p>
          )}
        </div>

        {/* Social Share Buttons */}
        <div>
          <label className="block font-bold text-sm mb-3">Share on Social Media</label>
          <div className="grid grid-cols-3 gap-3">
            {/* Twitter */}
            <button
              onClick={handleShareTwitter}
              className="flex flex-col items-center gap-2 p-4 bg-[#1DA1F2] text-white rounded-xl border-2 border-black hover:scale-105 transition shadow-[4px_4px_0_#000] hover:shadow-[2px_2px_0_#000]"
            >
              <Twitter className="h-6 w-6" />
              <span className="text-xs font-bold">Twitter</span>
            </button>

            {/* LinkedIn */}
            <button
              onClick={handleShareLinkedIn}
              className="flex flex-col items-center gap-2 p-4 bg-[#0A66C2] text-white rounded-xl border-2 border-black hover:scale-105 transition shadow-[4px_4px_0_#000] hover:shadow-[2px_2px_0_#000]"
            >
              <Linkedin className="h-6 w-6" />
              <span className="text-xs font-bold">LinkedIn</span>
            </button>

            {/* Facebook */}
            <button
              onClick={handleShareFacebook}
              className="flex flex-col items-center gap-2 p-4 bg-[#1877F2] text-white rounded-xl border-2 border-black hover:scale-105 transition shadow-[4px_4px_0_#000] hover:shadow-[2px_2px_0_#000]"
            >
              <Facebook className="h-6 w-6" />
              <span className="text-xs font-bold">Facebook</span>
            </button>
          </div>
        </div>

        {/* Info */}
        <div className="mt-6 p-3 bg-cyan-50 border-2 border-black rounded-lg">
          <p className="text-xs text-black/70">
            <span className="font-bold">Tip:</span> Share this dataset to help grow the Setique community and earn social proof!
          </p>
        </div>
      </div>
    </div>
  )
}

export default ShareModal
