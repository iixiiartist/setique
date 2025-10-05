import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { X, Upload } from './Icons'
import { TagInput } from './TagInput'

export function DatasetUploadModal({ isOpen, onClose, onSuccess }) {
  const { user } = useAuth()
  
  // Form state with localStorage persistence
  const [title, setTitle] = useState(() => {
    return localStorage.getItem('draft_modal_dataset_title') || ''
  })
  const [description, setDescription] = useState(() => {
    return localStorage.getItem('draft_modal_dataset_desc') || ''
  })
  const [price, setPrice] = useState(() => {
    return localStorage.getItem('draft_modal_dataset_price') || ''
  })
  const [modality, setModality] = useState(() => {
    return localStorage.getItem('draft_modal_dataset_modality') || 'vision'
  })
  const [tags, setTags] = useState(() => {
    const saved = localStorage.getItem('draft_modal_dataset_tags')
    return saved ? JSON.parse(saved) : []
  })
  
  // Auto-save form to localStorage
  useEffect(() => {
    if (isOpen) {
      localStorage.setItem('draft_modal_dataset_title', title)
    }
  }, [title, isOpen])
  
  useEffect(() => {
    if (isOpen) {
      localStorage.setItem('draft_modal_dataset_desc', description)
    }
  }, [description, isOpen])
  
  useEffect(() => {
    if (isOpen) {
      localStorage.setItem('draft_modal_dataset_price', price)
    }
  }, [price, isOpen])
  
  useEffect(() => {
    if (isOpen) {
      localStorage.setItem('draft_modal_dataset_modality', modality)
    }
  }, [modality, isOpen])
  
  useEffect(() => {
    if (isOpen) {
      localStorage.setItem('draft_modal_dataset_tags', JSON.stringify(tags))
    }
  }, [tags, isOpen])
  
  // File upload state
  const [uploadFile, setUploadFile] = useState(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  
  // Allow price = 0 for demo datasets; treat blank or negative as invalid
  const numericPrice = price === '' ? NaN : parseFloat(price)
  const isFormValid = title.trim() !== '' && description.trim() !== '' && !isNaN(numericPrice) && numericPrice >= 0 && uploadFile !== null
  
  // Debug form validation
  console.log('📋 Form validation:', {
    title: title.trim(),
    titleValid: title.trim() !== '',
    description: description.trim(),
    descriptionValid: description.trim() !== '',
    price: price,
    numericPrice: numericPrice,
    priceValid: !isNaN(numericPrice) && numericPrice >= 0,
    uploadFile: uploadFile?.name,
    fileValid: uploadFile !== null,
    isFormValid: isFormValid
  })

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setUploadFile(file)
      setUploadError('')
    }
  }

  const getAccentColor = (mod) => {
    const colors = {
      vision: 'bg-yellow-200',
      audio: 'bg-cyan-200',
      text: 'bg-pink-200',
      video: 'bg-yellow-200',
      multimodal: 'bg-purple-200',
      other: 'bg-gray-200',
    }
    return colors[mod] || 'bg-yellow-200'
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!user) {
      alert('You must be signed in to upload datasets')
      return
    }

    if (!uploadFile) {
      setUploadError('Please select a file to upload')
      return
    }

    setIsUploading(true)
    setUploadProgress(0)
    setUploadError('')
    
    try {
      // Upload file to Supabase Storage
      const fileExt = uploadFile.name.split('.').pop()
      const fileName = `${user.id}/${Date.now()}.${fileExt}`
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('datasets')
        .upload(fileName, uploadFile, {
          cacheControl: '3600',
          upsert: false,
          onUploadProgress: (progress) => {
            const percentage = (progress.loaded / progress.total) * 100
            setUploadProgress(Math.round(percentage))
          }
        })

      if (uploadError) throw uploadError

      // Create dataset record with storage path
      const { error: insertError } = await supabase.from('datasets').insert([
        {
          creator_id: user.id,
          title: title.trim(),
          description: description.trim(),
          price: isNaN(numericPrice) ? 0 : numericPrice,
          modality: modality,
          tags: tags,
          accent_color: getAccentColor(modality),
          download_url: uploadData.path,
          file_size: uploadFile.size,
          is_active: true,
        },
      ])

      if (insertError) throw insertError

      alert(`✅ Published "${title}"! Your dataset is now live on the marketplace.`)
      
      // Reset form and clear localStorage draft
      setTitle('')
      setDescription('')
      setPrice('')
      setModality('vision')
      setTags([])
      setUploadFile(null)
      setUploadProgress(0)
      localStorage.removeItem('draft_modal_dataset_title')
      localStorage.removeItem('draft_modal_dataset_desc')
      localStorage.removeItem('draft_modal_dataset_price')
      localStorage.removeItem('draft_modal_dataset_modality')
      localStorage.removeItem('draft_modal_dataset_tags')
      
      // Call success callback to refresh dashboard data
      if (onSuccess) {
        onSuccess()
      }
      
      // Close modal
      onClose()
    } catch (error) {
      console.error('Error publishing dataset:', error)
      setUploadError('Error publishing dataset: ' + error.message)
      alert('Error publishing dataset: ' + error.message)
    } finally {
      setIsUploading(false)
    }
  }

  const handleClose = () => {
    if (isUploading) {
      if (!confirm('Upload in progress. Are you sure you want to cancel?')) {
        return
      }
    }
    setTitle('')
    setDescription('')
    setPrice('')
    setModality('vision')
    setTags([])
    setUploadFile(null)
    setUploadProgress(0)
    setUploadError('')
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl border-4 border-black max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-2xl font-extrabold">Upload New Dataset</h3>
              <p className="text-sm font-semibold text-black/60 mt-1">
                Share your curated data with the community
              </p>
            </div>
            <button
              onClick={handleClose}
              disabled={isUploading}
              className="p-2 hover:bg-gray-100 rounded-lg transition disabled:opacity-50"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Title */}
            <div>
              <label className="block font-bold mb-2">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={isUploading}
                className="w-full px-4 py-2 border-2 border-black rounded-lg font-semibold disabled:bg-gray-100"
                placeholder="e.g., Street Signs Dataset for Object Detection"
                required
              />
            </div>
            
            {/* Description */}
            <div>
              <label className="block font-bold mb-2">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isUploading}
                className="w-full px-4 py-2 border-2 border-black rounded-lg font-semibold disabled:bg-gray-100"
                rows="4"
                placeholder="Describe your dataset, its format, use cases, and quality..."
                required
              />
            </div>
            
            {/* Price and Modality */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-bold mb-2">
                  Price (USD) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  disabled={isUploading}
                  className="w-full px-4 py-2 border-2 border-black rounded-lg font-semibold disabled:bg-gray-100"
                  placeholder="0.00"
                  required
                />
                <p className="text-xs font-semibold text-black/60 mt-1">
                  Set to $0 for demo datasets
                </p>
              </div>
              
              <div>
                <label className="block font-bold mb-2">
                  Modality <span className="text-red-500">*</span>
                </label>
                <select
                  value={modality}
                  onChange={(e) => setModality(e.target.value)}
                  disabled={isUploading}
                  className="w-full px-4 py-2 border-2 border-black rounded-lg font-semibold disabled:bg-gray-100"
                  required
                >
                  <option value="vision">Vision</option>
                  <option value="audio">Audio</option>
                  <option value="text">Text</option>
                  <option value="video">Video</option>
                  <option value="multimodal">Multimodal</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
            
            {/* Tags */}
            <div>
              <label className="block font-bold mb-2">Tags</label>
              <TagInput
                tags={tags}
                onChange={setTags}
                disabled={isUploading}
                placeholder="machine-learning, computer-vision, classification"
              />
              <p className="text-xs font-semibold text-black/60 mt-1">
                Add tags to help users discover your dataset
              </p>
            </div>
            
            {/* File Upload */}
            <div>
              <label className="block font-bold mb-2">
                Dataset File <span className="text-red-500">*</span>
              </label>
              <div className="border-2 border-dashed border-black rounded-lg p-6 text-center">
                {uploadFile ? (
                  <div>
                    <p className="font-bold text-green-600 mb-2">✓ File Selected</p>
                    <p className="font-semibold text-sm">{uploadFile.name}</p>
                    <p className="text-xs text-black/60">
                      {(uploadFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                    {!isUploading && (
                      <button
                        type="button"
                        onClick={() => setUploadFile(null)}
                        className="mt-2 text-sm font-bold text-red-600 hover:underline"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ) : (
                  <div>
                    <Upload className="h-12 w-12 mx-auto mb-2 text-black/30" />
                    <p className="font-bold mb-2">Click to upload or drag and drop</p>
                    <p className="text-xs text-black/60">
                      ZIP, CSV, JSON, or other data formats
                    </p>
                  </div>
                )}
                <input
                  type="file"
                  onChange={handleFileChange}
                  disabled={isUploading}
                  className="hidden"
                  id="dataset-file-upload"
                  accept=".zip,.csv,.json,.txt,.xlsx,.parquet,.h5,.pkl"
                />
                {!uploadFile && (
                  <label
                    htmlFor="dataset-file-upload"
                    className="mt-3 inline-block bg-gray-200 hover:bg-gray-300 text-black font-bold px-6 py-2 rounded-full border-2 border-black cursor-pointer transition"
                  >
                    Choose File
                  </label>
                )}
              </div>
              {uploadError && (
                <p className="text-red-600 font-semibold text-sm mt-2">⚠️ {uploadError}</p>
              )}
            </div>
            
            {/* Upload Progress */}
            {isUploading && (
              <div className="bg-blue-50 border-2 border-blue-500 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold">Uploading...</span>
                  <span className="font-bold text-blue-600">{uploadProgress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 border-2 border-black">
                  <div
                    className="bg-blue-500 h-full rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}
            
            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={!isFormValid || isUploading}
                className="flex-1 bg-[linear-gradient(90deg,#ffea00,#00ffff)] text-black font-extrabold px-6 py-3 rounded-full border-2 border-black hover:scale-105 transition disabled:opacity-50 disabled:hover:scale-100"
              >
                {isUploading ? `Uploading ${uploadProgress}%...` : 'Publish Dataset'}
              </button>
              <button
                type="button"
                onClick={handleClose}
                disabled={isUploading}
                className="flex-1 bg-gray-200 text-black font-bold px-6 py-3 rounded-full border-2 border-black hover:bg-gray-300 transition disabled:opacity-50"
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
