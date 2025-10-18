import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { logDatasetPublished } from '../lib/activityTracking'
import { X, Upload, Package, Wrench, Tag as TagIcon } from './Icons'
import { TagInput } from './TagInput'
import Papa from 'papaparse'
// Week 2: Upload Flow Integration
import SchemaAnalysisResults from './upload/SchemaAnalysisResults'
import PricingSuggestionCard from './upload/PricingSuggestionCard'
import VersionSelector from './upload/VersionSelector'
import HygieneReport from './upload/HygieneReport'
import SetiqueSeocialExplainer from './upload/SetiqueSeocialExplainer'
import { useSchemaDetection } from '@/hooks/useSchemaDetection'
import { usePricingSuggestion } from '@/hooks/usePricingSuggestion'
import { processDataset } from '@/services/hygieneService'

export function DatasetUploadModal({ isOpen, onClose, onSuccess }) {
  const { user } = useAuth()
  
  // Curation level state (new)
  const [curationLevel, setCurationLevel] = useState(() => {
    return localStorage.getItem('draft_modal_curation_level') || 'curated'
  })
  
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
  
  // New fields for raw/partial datasets
  const [samplePreviews, setSamplePreviews] = useState([])
  const [readmeContent, setReadmeContent] = useState(() => {
    return localStorage.getItem('draft_modal_readme_content') || ''
  })
  const [metadataCompleteness, setMetadataCompleteness] = useState(50)
  
  // Auto-save curation level to localStorage
  useEffect(() => {
    if (isOpen) {
      localStorage.setItem('draft_modal_curation_level', curationLevel)
    }
  }, [curationLevel, isOpen])
  
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
  
  // Auto-save README content
  useEffect(() => {
    if (isOpen) {
      localStorage.setItem('draft_modal_readme_content', readmeContent)
    }
  }, [readmeContent, isOpen])
  
  // File upload state
  const [uploadFile, setUploadFile] = useState(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  
  // Week 2: Social Analytics State
  const [, setCsvData] = useState(null)
  const [datasetVersion, setDatasetVersion] = useState('standard')
  const [hygieneReport, setHygieneReport] = useState(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  
  // Week 2: Custom Hooks
  const schemaDetection = useSchemaDetection()
  const pricingSuggestion = usePricingSuggestion()
  
  // Allow price = 0 for demo datasets; treat blank or negative as invalid
  const numericPrice = price === '' ? NaN : parseFloat(price)
  
  // Validation logic based on curation level
  const isFormValid = (() => {
    const basicValid = title.trim() !== '' && 
                      description.trim() !== '' && 
                      !isNaN(numericPrice) && 
                      numericPrice >= 0 && 
                      uploadFile !== null
    
    if (!basicValid) return false
    
    // Additional validations for raw/partial
    if (curationLevel === 'raw') {
      return samplePreviews.length >= 3 && 
             samplePreviews.length <= 10 &&
             readmeContent.trim().length >= 100
    }
    
    if (curationLevel === 'partial') {
      return samplePreviews.length >= 3 && 
             samplePreviews.length <= 10
    }
    
    return true
  })()
  
  const handleFileChange = async (e) => {
    const file = e.target.files[0]
    if (file) {
      setUploadFile(file)
      setUploadError('')
      
      // Week 2: Auto-detect CSV files and trigger schema analysis
      if (file.name.endsWith('.csv')) {
        setIsAnalyzing(true)
        
        // Parse CSV file
        Papa.parse(file, {
          header: true,
          skipEmptyLines: true,
          complete: async (results) => {
            try {
              if (results.data && results.data.length > 0) {
                setCsvData(results.data)
                
                // Run schema detection
                const analysis = await schemaDetection.detectSchema(results.data)
                
                // Run hygiene scan
                const hygiene = await processDataset(results.data)
                setHygieneReport(hygiene)
                
                // Calculate pricing if schema detected
                if (analysis) {
                  await pricingSuggestion.calculatePricing(
                    {
                      rowCount: results.data.length,
                      platform: analysis.platform,
                      hasExtendedFields: analysis.extendedFields?.length > 0,
                      extendedFieldCount: analysis.extendedFields?.length || 0
                    },
                    analysis
                  )
                }
              }
            } catch (error) {
              console.error('CSV analysis failed:', error)
              setUploadError('CSV analysis failed. You can still upload manually.')
            } finally {
              setIsAnalyzing(false)
            }
          },
          error: (error) => {
            console.error('CSV parsing failed:', error)
            setUploadError('Failed to parse CSV file')
            setIsAnalyzing(false)
          }
        })
      }
    }
  }
  
  const handleSamplePreviewChange = (e) => {
    const files = Array.from(e.target.files)
    if (files.length + samplePreviews.length > 10) {
      setUploadError('Maximum 10 sample preview files allowed')
      return
    }
    
    // Check file sizes (max 5MB each)
    const oversized = files.filter(f => f.size > 5 * 1024 * 1024)
    if (oversized.length > 0) {
      setUploadError('Sample preview files must be under 5MB each')
      return
    }
    
    setSamplePreviews([...samplePreviews, ...files])
    setUploadError('')
  }
  
  const removeSamplePreview = (index) => {
    setSamplePreviews(samplePreviews.filter((_, i) => i !== index))
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
      // Step 1: Upload main dataset file to Supabase Storage
      const fileExt = uploadFile.name.split('.').pop()
      const fileName = `${user.id}/${Date.now()}.${fileExt}`
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('datasets')
        .upload(fileName, uploadFile, {
          cacheControl: '3600',
          upsert: false,
          onUploadProgress: (progress) => {
            const percentage = (progress.loaded / progress.total) * 100
            setUploadProgress(Math.round(percentage * 0.7)) // Reserve 30% for sample uploads
          }
        })

      if (uploadError) throw uploadError
      
      // Step 2: Upload sample preview files (if any)
      let samplePreviewUrls = []
      if (samplePreviews.length > 0) {
        setUploadProgress(70)
        const uploadPromises = samplePreviews.map(async (file, index) => {
          const ext = file.name.split('.').pop()
          const samplePath = `${user.id}/samples/${Date.now()}_${index}.${ext}`
          
          const { data, error } = await supabase.storage
            .from('datasets')
            .upload(samplePath, file, {
              cacheControl: '3600',
              upsert: false
            })
          
          if (error) throw error
          
          // Get public URL for the sample
          const { data: { publicUrl } } = supabase.storage
            .from('datasets')
            .getPublicUrl(data.path)
          
          return publicUrl
        })
        
        samplePreviewUrls = await Promise.all(uploadPromises)
        setUploadProgress(90)
      }

      // Step 3: Create dataset record with all fields
      const { data: insertedDataset, error: insertError } = await supabase.from('datasets').insert([
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
          // New curation level fields
          curation_level: curationLevel,
          sample_preview_urls: samplePreviewUrls,
          readme_content: curationLevel === 'raw' ? readmeContent.trim() : null,
          metadata_completeness: curationLevel === 'partial' ? metadataCompleteness : 100,
          // Week 2: Social Analytics Fields
          platform: schemaDetection.platform || null,
          data_type: schemaDetection.platform ? 'social_analytics' : 'other',
          has_extended_fields: schemaDetection.extendedFields?.length > 0 || false,
          extended_field_count: schemaDetection.extendedFields?.length || 0,
          extended_fields_list: schemaDetection.extendedFields || [],
          dataset_version: datasetVersion,
          schema_detected: schemaDetection.analysis ? true : false,
          schema_confidence: schemaDetection.confidence || null,
          canonical_fields: schemaDetection.canonicalFields || {},
          hygiene_version: hygieneReport?.version || 'v1.0',
          hygiene_passed: hygieneReport?.passed || false,
          pii_issues_found: hygieneReport?.issuesFound || 0,
          hygiene_report: hygieneReport || {},
          suggested_price: pricingSuggestion.suggestedPrice || null,
          price_confidence: pricingSuggestion.confidence || null,
          pricing_factors: pricingSuggestion.factors || {},
          // review_status will be auto-set by trigger based on Pro Curator status
        },
      ]).select()

      if (insertError) throw insertError
      
      setUploadProgress(100)

      // Step 4: Log activity for social feed
      if (insertedDataset && insertedDataset[0]) {
        await logDatasetPublished(
          user.id,
          insertedDataset[0].id,
          title.trim(),
          numericPrice,
          modality
        )
      }
      
      // Success message varies by curation level
      const reviewMessage = curationLevel === 'raw' && user.trust_level < 3
        ? ' Your upload will be reviewed by our team within 24-48 hours.'
        : ' Your dataset is now live on the marketplace.'
      
      alert(`✅ Published "${title}"!${reviewMessage}`)
      
      // Reset form and clear localStorage draft
      setTitle('')
      setDescription('')
      setPrice('')
      setModality('vision')
      setTags([])
      setUploadFile(null)
      setSamplePreviews([])
      setReadmeContent('')
      setMetadataCompleteness(50)
      setCurationLevel('curated')
      setUploadProgress(0)
      // Week 2: Reset social analytics state
      setCsvData(null)
      setDatasetVersion('standard')
      setHygieneReport(null)
      setIsAnalyzing(false)
      schemaDetection.resetAnalysis()
      pricingSuggestion.resetPricing()
      localStorage.removeItem('draft_modal_dataset_title')
      localStorage.removeItem('draft_modal_dataset_desc')
      localStorage.removeItem('draft_modal_dataset_price')
      localStorage.removeItem('draft_modal_dataset_modality')
      localStorage.removeItem('draft_modal_dataset_tags')
      localStorage.removeItem('draft_modal_readme_content')
      localStorage.removeItem('draft_modal_curation_level')
      
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
    setSamplePreviews([])
    setReadmeContent('')
    setMetadataCompleteness(50)
    setCurationLevel('curated')
    setUploadProgress(0)
    setUploadError('')
    // Week 2: Reset social analytics state
    setCsvData(null)
    setDatasetVersion('standard')
    setHygieneReport(null)
    setIsAnalyzing(false)
    schemaDetection.resetAnalysis()
    pricingSuggestion.resetPricing()
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
                Choose your curation level and share your data
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
            {/* Curation Level Selector */}
            <div className="bg-gradient-to-r from-yellow-100 via-pink-100 to-cyan-100 border-4 border-black rounded-xl p-4">
              <label className="block font-extrabold text-lg mb-3">
                🎯 Curation Level
              </label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setCurationLevel('raw')}
                  disabled={isUploading}
                  className={`
                    flex flex-col items-center p-4 rounded-lg border-4 border-black
                    font-bold text-sm transition
                    ${curationLevel === 'raw' 
                      ? 'bg-orange-300 shadow-[4px_4px_0_#000]' 
                      : 'bg-white hover:bg-gray-50'}
                    disabled:opacity-50 disabled:cursor-not-allowed
                  `}
                >
                  <Package className="h-8 w-8 mb-2" />
                  <span>Raw Data</span>
                  <span className="text-xs font-normal text-black/70 mt-1">
                    No labels
                  </span>
                </button>
                
                <button
                  type="button"
                  onClick={() => setCurationLevel('partial')}
                  disabled={isUploading}
                  className={`
                    flex flex-col items-center p-4 rounded-lg border-4 border-black
                    font-bold text-sm transition
                    ${curationLevel === 'partial' 
                      ? 'bg-yellow-300 shadow-[4px_4px_0_#000]' 
                      : 'bg-white hover:bg-gray-50'}
                    disabled:opacity-50 disabled:cursor-not-allowed
                  `}
                >
                  <Wrench className="h-8 w-8 mb-2" />
                  <span>Partial</span>
                  <span className="text-xs font-normal text-black/70 mt-1">
                    Some labeling
                  </span>
                </button>
                
                <button
                  type="button"
                  onClick={() => setCurationLevel('curated')}
                  disabled={isUploading}
                  className={`
                    flex flex-col items-center p-4 rounded-lg border-4 border-black
                    font-bold text-sm transition
                    ${curationLevel === 'curated' 
                      ? 'bg-green-300 shadow-[4px_4px_0_#000]' 
                      : 'bg-white hover:bg-gray-50'}
                    disabled:opacity-50 disabled:cursor-not-allowed
                  `}
                >
                  <TagIcon className="h-8 w-8 mb-2" />
                  <span>Curated</span>
                  <span className="text-xs font-normal text-black/70 mt-1">
                    Fully labeled
                  </span>
                </button>
              </div>
              
              {/* Info message based on selection */}
              <div className="mt-3 p-3 bg-white border-2 border-black rounded-lg text-sm font-semibold">
                {curationLevel === 'raw' && (
                  <p>
                    📦 <strong>Raw data:</strong> Requires 3-10 sample previews + README (100+ chars).
                    {user?.trust_level < 3 && <span className="text-orange-600"> Will be reviewed within 24-48 hours.</span>}
                  </p>
                )}
                {curationLevel === 'partial' && (
                  <p>
                    🏗️ <strong>Partially curated:</strong> Requires 3-10 sample previews. Set your metadata completeness percentage.
                  </p>
                )}
                {curationLevel === 'curated' && (
                  <p>
                    🏷️ <strong>Fully curated:</strong> Production-ready data. Sample previews optional but recommended.
                  </p>
                )}
              </div>
            </div>
            
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
            
            {/* Copyright Warning */}
            <div className="bg-red-50 border-3 border-red-600 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <span className="text-2xl">⚠️</span>
                <div>
                  <p className="font-extrabold text-red-900 mb-2">Copyright & Legal Notice</p>
                  <p className="text-sm font-bold text-red-800 mb-2">
                    You MUST own or have legal rights to distribute all data you upload. 
                  </p>
                  <p className="text-xs font-semibold text-red-700">
                    • Do NOT upload copyrighted images, music, videos, or text without permission<br/>
                    • Do NOT scrape or republish data from other platforms without authorization<br/>
                    • Violations will result in immediate account suspension and legal action<br/>
                    • By uploading, you confirm you have all necessary rights and permissions
                  </p>
                </div>
              </div>
            </div>
            
            {/* Price and Modality */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-bold mb-2">
                  Price (USD) <span className="text-red-500">*</span>
                </label>
                
                {/* Dynamic Price Guidance */}
                <div className="mb-2 p-2 bg-blue-50 border-2 border-blue-400 rounded-lg text-xs">
                  <p className="font-bold text-blue-900 mb-1">
                    💡 Typical Pricing:
                  </p>
                  <p className="font-semibold text-blue-700">
                    {curationLevel === 'raw' && '$5-25 typical'}
                    {curationLevel === 'partial' && `$20-60 typical for ${metadataCompleteness}% complete`}
                    {curationLevel === 'curated' && '$50+ typical (often $150-500+)'}
                  </p>
                  <p className="text-blue-600 mt-1">
                    No max—price based on your data&apos;s value!
                  </p>
                </div>
                
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
            
            {/* Sample Preview Upload (Raw/Partial) */}
            {(curationLevel === 'raw' || curationLevel === 'partial') && (
              <div className="bg-yellow-50 border-3 border-yellow-400 rounded-xl p-4">
                <label className="block font-extrabold mb-2">
                  Sample Previews <span className="text-red-500">* (3-10 required)</span>
                </label>
                <p className="text-xs font-semibold text-black/70 mb-3">
                  Upload 3-10 representative sample files (max 5MB each) so buyers can assess quality before purchasing.
                </p>
                
                {samplePreviews.length > 0 && (
                  <div className="mb-3 space-y-2">
                    {samplePreviews.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-white border-2 border-black rounded-lg">
                        <div className="flex-1">
                          <p className="text-sm font-bold">{file.name}</p>
                          <p className="text-xs text-black/60">
                            {(file.size / 1024).toFixed(1)} KB
                          </p>
                        </div>
                        {!isUploading && (
                          <button
                            type="button"
                            onClick={() => removeSamplePreview(index)}
                            className="text-red-600 font-bold hover:underline text-sm"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                
                <input
                  type="file"
                  id="sample-preview-upload"
                  multiple
                  accept=".png,.jpg,.jpeg,.gif,.svg,.webp,.txt,.csv,.json,.wav,.mp3,.mp4"
                  onChange={handleSamplePreviewChange}
                  disabled={isUploading || samplePreviews.length >= 10}
                  className="hidden"
                />
                <label
                  htmlFor="sample-preview-upload"
                  className={`
                    inline-block px-6 py-2 rounded-full border-2 border-black font-bold
                    ${samplePreviews.length >= 10 || isUploading
                      ? 'bg-gray-200 cursor-not-allowed opacity-50'
                      : 'bg-yellow-200 hover:bg-yellow-300 cursor-pointer'}
                  `}
                >
                  {samplePreviews.length === 0 ? 'Upload Sample Previews' : `Add More (${samplePreviews.length}/10)`}
                </label>
              </div>
            )}
            
            {/* README Content (Raw only) */}
            {curationLevel === 'raw' && (
              <div className="bg-orange-50 border-3 border-orange-400 rounded-xl p-4">
                <label className="block font-extrabold mb-2">
                  README Documentation <span className="text-red-500">* (100+ chars)</span>
                </label>
                <p className="text-xs font-semibold text-black/70 mb-2">
                  Describe your dataset structure, file formats, use cases, and any limitations. Markdown supported.
                </p>
                <textarea
                  value={readmeContent}
                  onChange={(e) => setReadmeContent(e.target.value)}
                  disabled={isUploading}
                  className="w-full px-4 py-3 border-2 border-black rounded-lg font-mono text-sm disabled:bg-gray-100"
                  rows="8"
                  placeholder="# Dataset Overview&#10;&#10;This dataset contains...&#10;&#10;## File Structure&#10;- images/ - Raw image files&#10;- metadata.csv - File descriptions&#10;&#10;## Use Cases&#10;- Computer vision training&#10;- Object detection&#10;&#10;## Limitations&#10;- Images are not labeled&#10;- Some files may need preprocessing"
                  required
                />
                <p className="text-xs font-semibold text-black/60 mt-1">
                  {readmeContent.length} / 100+ characters
                  {readmeContent.length >= 100 && <span className="text-green-600"> ✓</span>}
                </p>
              </div>
            )}
            
            {/* Metadata Completeness (Partial only) */}
            {curationLevel === 'partial' && (
              <div className="bg-yellow-50 border-3 border-yellow-400 rounded-xl p-4">
                <label className="block font-extrabold mb-2">
                  Metadata Completeness: {metadataCompleteness}%
                </label>
                <p className="text-xs font-semibold text-black/70 mb-3">
                  What percentage of your files have complete labels/metadata?
                </p>
                <input
                  type="range"
                  min="20"
                  max="80"
                  value={metadataCompleteness}
                  onChange={(e) => setMetadataCompleteness(parseInt(e.target.value))}
                  disabled={isUploading}
                  className="w-full h-3 bg-gray-300 rounded-lg appearance-none cursor-pointer slider"
                />
                <div className="flex justify-between text-xs font-bold mt-2">
                  <span>20% (Partially labeled)</span>
                  <span>80% (Mostly complete)</span>
                </div>
              </div>
            )}
            
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
                  accept=".csv,.json,.parquet,.xlsx,.xls,.zip,.rar,.7z,.tar,.gz,.txt,.md,.pdf,.wav,.mp3,.mp4,.avi,.mov,.mkv,.png,.jpg,.jpeg,.gif,.svg,.webp,.sql,.db,.sqlite,.h5,.hdf5,.npy,.npz,.pickle,.pkl,.arrow,.feather,.xml,.yaml,.yml,.tsv,.avro,.orc"
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
            
            {/* Week 2: CSV Analysis Loading */}
            {isAnalyzing && (
              <div className="bg-blue-50 border-2 border-blue-500 rounded-lg p-6 text-center">
                <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-3"></div>
                <p className="font-bold text-blue-900">Analyzing your CSV...</p>
                <p className="text-sm text-blue-700 mt-1">
                  Detecting platform, scanning for PII, calculating pricing...
                </p>
              </div>
            )}
            
            {/* Week 2: Setique Social Explainer - Show when CSV detected */}
            {!isAnalyzing && schemaDetection.analysis && (
              <SetiqueSeocialExplainer />
            )}
            
            {/* Week 2: Schema Analysis Results */}
            {!isAnalyzing && schemaDetection.analysis && (
              <div className="space-y-4">
                <SchemaAnalysisResults
                  analysis={schemaDetection.analysis}
                  isLoading={schemaDetection.isLoading}
                  error={schemaDetection.error}
                />
                
                {/* Version Selector (only if extended fields detected) */}
                {schemaDetection.extendedFields?.length > 0 && (
                  <VersionSelector
                    selectedVersion={datasetVersion}
                    onVersionChange={setDatasetVersion}
                    pricing={{
                      standard: pricingSuggestion.suggestedPrice || 0,
                      extended: (pricingSuggestion.suggestedPrice || 0) * 2,
                      both: (pricingSuggestion.suggestedPrice || 0) * 2.5
                    }}
                    extendedFields={schemaDetection.extendedFields}
                    disabled={isUploading}
                  />
                )}
                
                {/* Hygiene Report */}
                {hygieneReport && (
                  <HygieneReport
                    report={hygieneReport}
                    isLoading={false}
                    error={null}
                  />
                )}
                
                {/* Pricing Suggestion */}
                {pricingSuggestion.pricing && (
                  <PricingSuggestionCard
                    pricing={pricingSuggestion.pricing}
                    isLoading={pricingSuggestion.isLoading}
                    error={pricingSuggestion.error}
                    onAcceptPrice={(suggestedPrice) => {
                      setPrice(suggestedPrice.toString())
                    }}
                  />
                )}
              </div>
            )}
            
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
                className="flex-1 bg-[linear-gradient(90deg,#ffea00,#00ffff)] text-black font-extrabold px-6 py-3 rounded-full border-2 border-black hover:scale-105 transition disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed"
                title={!isFormValid ? 'Please complete all required fields' : ''}
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
            
            {/* Validation Checklist */}
            {!isFormValid && !isUploading && (
              <div className="bg-yellow-50 border-2 border-yellow-500 rounded-lg p-4">
                <p className="font-extrabold text-sm mb-2">📋 Checklist (complete to publish):</p>
                <div className="space-y-1 text-xs font-semibold">
                  <div className={title.trim() !== '' ? 'text-green-600' : 'text-red-600'}>
                    {title.trim() !== '' ? '✓' : '✗'} Title filled
                  </div>
                  <div className={description.trim() !== '' ? 'text-green-600' : 'text-red-600'}>
                    {description.trim() !== '' ? '✓' : '✗'} Description filled
                  </div>
                  <div className={!isNaN(numericPrice) && numericPrice >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {!isNaN(numericPrice) && numericPrice >= 0 ? '✓' : '✗'} Valid price (0 or higher)
                  </div>
                  <div className={uploadFile !== null ? 'text-green-600' : 'text-red-600'}>
                    {uploadFile !== null ? '✓' : '✗'} Dataset file selected
                  </div>
                  {curationLevel === 'raw' && (
                    <>
                      <div className={samplePreviews.length >= 3 && samplePreviews.length <= 10 ? 'text-green-600' : 'text-red-600'}>
                        {samplePreviews.length >= 3 && samplePreviews.length <= 10 ? '✓' : '✗'} Sample previews (3-10 files) - Currently: {samplePreviews.length}
                      </div>
                      <div className={readmeContent.trim().length >= 100 ? 'text-green-600' : 'text-red-600'}>
                        {readmeContent.trim().length >= 100 ? '✓' : '✗'} README content (100+ chars) - Currently: {readmeContent.trim().length}
                      </div>
                    </>
                  )}
                  {curationLevel === 'partial' && (
                    <div className={samplePreviews.length >= 3 && samplePreviews.length <= 10 ? 'text-green-600' : 'text-red-600'}>
                      {samplePreviews.length >= 3 && samplePreviews.length <= 10 ? '✓' : '✗'} Sample previews (3-10 files) - Currently: {samplePreviews.length}
                    </div>
                  )}
                </div>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  )
}
