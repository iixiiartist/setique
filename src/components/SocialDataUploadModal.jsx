import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { logDatasetPublished } from '../lib/activityTracking'
import { X, Upload, TrendingUp } from './Icons'
import { TagInput } from './TagInput'
import Papa from 'papaparse'
// Setique Social components
import SchemaAnalysisResults from './upload/SchemaAnalysisResults'
import PricingSuggestionCard from './upload/PricingSuggestionCard'
import VersionSelector from './upload/VersionSelector'
import HygieneReport from './upload/HygieneReport'
import SetiqueSeocialExplainer from './upload/SetiqueSeocialExplainer'
import { useSchemaDetection } from '@/hooks/useSchemaDetection'
import { usePricingSuggestion } from '@/hooks/usePricingSuggestion'
import { processDataset } from '@/services/hygieneService'

/**
 * SocialDataUploadModal
 * 
 * Dedicated upload flow for social media analytics data (TikTok, Instagram, YouTube, etc.)
 * Simpler than traditional DatasetUploadModal - only handles CSV files.
 * 
 * Features:
 * - Automatic platform detection
 * - PII hygiene scanning
 * - Pricing suggestions
 * - Version selection (standard/extended/both)
 * - USS v1.0 normalization
 */
export function SocialDataUploadModal({ isOpen, onClose, onSuccess }) {
  const { user } = useAuth()
  
  // Basic form state
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [tags, setTags] = useState(['social-analytics'])
  
  // File upload state
  const [uploadFile, setUploadFile] = useState(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  
  // Social analytics state
  const [datasetVersion, setDatasetVersion] = useState('standard')
  const [hygieneReport, setHygieneReport] = useState(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  
  // Custom hooks
  const schemaDetection = useSchemaDetection()
  const pricingSuggestion = usePricingSuggestion()
  
  // Validation
  const numericPrice = price === '' ? NaN : parseFloat(price)
  const isFormValid = 
    title.trim() !== '' && 
    description.trim() !== '' && 
    !isNaN(numericPrice) && 
    numericPrice >= 0 && 
    uploadFile !== null

  const handleClose = () => {
    if (!isUploading) {
      // Reset form
      setTitle('')
      setDescription('')
      setPrice('')
      setTags(['social-analytics'])
      setUploadFile(null)
      setUploadProgress(0)
      setUploadError('')
      setDatasetVersion('standard')
      setHygieneReport(null)
      setIsAnalyzing(false)
      schemaDetection.resetAnalysis()
      pricingSuggestion.resetPricing()
      onClose()
    }
  }

  const handleFileChange = async (e) => {
    const file = e.target.files[0]
    if (file) {
      // Only accept CSV files
      if (!file.name.endsWith('.csv')) {
        setUploadError('Social data uploads must be CSV files. Export your analytics from your platform.')
        return
      }
      
      setUploadFile(file)
      setUploadError('')
      setIsAnalyzing(true)
      
      // Parse CSV file
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: async (results) => {
          try {
            if (results.data && results.data.length > 0) {
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
          console.error('CSV parsing error:', error)
          setUploadError('Failed to parse CSV file. Please check the format.')
          setIsAnalyzing(false)
        }
      })
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!user) {
      alert('You must be signed in to upload datasets')
      return
    }

    if (!uploadFile) {
      setUploadError('Please select a CSV file to upload')
      return
    }

    setIsUploading(true)
    setUploadProgress(0)
    setUploadError('')
    
    try {
      // Step 1: Upload CSV file to Supabase Storage
      const fileExt = uploadFile.name.split('.').pop()
      const fileName = `${user.id}/${Date.now()}.${fileExt}`
      
      const { error: uploadError } = await supabase.storage
        .from('datasets')
        .upload(fileName, uploadFile, {
          onUploadProgress: (progress) => {
            const percent = (progress.loaded / progress.total) * 100
            setUploadProgress(percent)
          }
        })

      if (uploadError) throw uploadError

      // Step 2: Insert dataset record with social analytics metadata
      const { data: dataset, error: insertError } = await supabase
        .from('datasets')
        .insert({
          user_id: user.id,
          title: title.trim(),
          description: description.trim(),
          price: numericPrice,
          tags: tags,
          download_url: fileName,
          file_size: uploadFile.size,
          modality: 'text', // Social analytics is text data
          curation_level: 'curated', // Social data is typically clean
          // Social analytics fields
          platform: schemaDetection.platform || 'other',
          data_type: 'social_analytics',
          has_extended_fields: schemaDetection.extendedFields?.length > 0,
          extended_field_count: schemaDetection.extendedFields?.length || 0,
          extended_fields_list: schemaDetection.extendedFields || [],
          dataset_version: datasetVersion,
          schema_detected: !!schemaDetection.analysis,
          schema_confidence: schemaDetection.confidence || null,
          canonical_fields: schemaDetection.canonicalFields || {},
          hygiene_version: 'v1.0',
          hygiene_passed: hygieneReport?.passed || false,
          pii_issues_found: hygieneReport?.issuesFound || 0,
          hygiene_report: hygieneReport || {},
          suggested_price: pricingSuggestion.suggestedPrice || null,
          price_confidence: pricingSuggestion.confidence || null,
          pricing_factors: pricingSuggestion.factors || {}
        })
        .select()
        .single()

      if (insertError) throw insertError

      // Step 3: Log activity
      await logDatasetPublished(dataset.id, 'social_analytics')

      // Success!
      alert('✅ Social analytics dataset uploaded successfully!')
      
      // Reset form
      setTitle('')
      setDescription('')
      setPrice('')
      setTags(['social-analytics'])
      setUploadFile(null)
      setUploadProgress(0)
      setDatasetVersion('standard')
      setHygieneReport(null)
      schemaDetection.resetAnalysis()
      pricingSuggestion.resetPricing()
      
      if (onSuccess) onSuccess(dataset)
      onClose()
    } catch (error) {
      console.error('Upload failed:', error)
      console.error('Error details:', JSON.stringify(error, null, 2))
      setUploadError(error.message || 'Upload failed. Please try again.')
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-xl border-4 border-black max-w-4xl w-full my-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        {/* Header with Setique Social branding */}
        <div className="flex justify-between items-center p-6 border-b-4 border-black bg-gradient-to-r from-purple-100 via-pink-100 to-blue-100">
          <div>
            <h2 className="text-2xl font-extrabold flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-purple-600" />
              Upload Social Analytics Data
            </h2>
            <p className="text-sm text-gray-700 mt-1">
              Turn your TikTok, Instagram, YouTube analytics into income
            </p>
          </div>
          <button
            onClick={handleClose}
            disabled={isUploading}
            className="p-2 hover:bg-gray-200 rounded-lg transition disabled:opacity-50"
            aria-label="Close modal"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto">
          {/* Basic Info */}
          <div className="space-y-4">
            <div>
              <label className="block font-bold mb-2">
                Dataset Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={isUploading}
                placeholder="e.g., TikTok Creator Analytics Oct 2025"
                className="w-full px-4 py-2 border-2 border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
                required
              />
            </div>

            <div>
              <label className="block font-bold mb-2">
                Description *
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isUploading}
                placeholder="Describe your social analytics data: time period, metrics included, audience demographics, etc."
                className="w-full px-4 py-2 border-2 border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 min-h-[100px]"
                required
              />
            </div>

            <div>
              <label className="block font-bold mb-2">
                Price (USD) *
              </label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                disabled={isUploading}
                placeholder="0.00"
                step="0.01"
                min="0"
                className="w-full px-4 py-2 border-2 border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
                required
              />
              <p className="text-xs text-gray-600 mt-1">
                💡 We&apos;ll suggest a price after you upload your CSV
              </p>
            </div>

            <div>
              <label className="block font-bold mb-2">
                Tags
              </label>
              <TagInput
                tags={tags}
                setTags={setTags}
                disabled={isUploading}
                placeholder="Add tags (e.g., tiktok, influencer, engagement)"
              />
            </div>
          </div>

          {/* CSV Upload */}
          <div>
            <label className="block font-bold mb-2">
              CSV File * <span className="text-sm font-normal text-gray-600">(Export from your social platform)</span>
            </label>
            <div
              className={`border-4 border-dashed ${uploadFile ? 'border-purple-500 bg-purple-50' : 'border-black'} rounded-lg p-8 text-center cursor-pointer hover:bg-gray-50 transition ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
              onClick={() => !uploadFile && document.getElementById('social-csv-upload').click()}
            >
              {uploadFile ? (
                <div>
                  <Upload className="h-12 w-12 mx-auto mb-2 text-purple-600" />
                  <p className="font-bold text-purple-900">{uploadFile.name}</p>
                  <p className="text-sm text-gray-600">
                    {(uploadFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                  {!isUploading && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        setUploadFile(null)
                        schemaDetection.resetAnalysis()
                        pricingSuggestion.resetPricing()
                        setHygieneReport(null)
                      }}
                      className="mt-2 text-sm font-bold text-red-600 hover:underline"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ) : (
                <div>
                  <Upload className="h-12 w-12 mx-auto mb-2 text-black/30" />
                  <p className="font-bold mb-2">Click to upload your CSV export</p>
                  <p className="text-xs text-black/60">
                    TikTok, Instagram, YouTube, LinkedIn, Shopify exports
                  </p>
                </div>
              )}
              <input
                type="file"
                onChange={handleFileChange}
                disabled={isUploading}
                className="hidden"
                id="social-csv-upload"
                accept=".csv"
              />
              {!uploadFile && (
                <label
                  htmlFor="social-csv-upload"
                  className="mt-3 inline-block bg-purple-500 hover:bg-purple-600 text-white font-bold px-6 py-2 rounded-full border-2 border-black cursor-pointer transition"
                >
                  Choose CSV File
                </label>
              )}
            </div>
            {uploadError && (
              <p className="text-red-600 font-semibold text-sm mt-2">⚠️ {uploadError}</p>
            )}
          </div>
          
          {/* CSV Analysis Loading */}
          {isAnalyzing && (
            <div className="bg-purple-50 border-2 border-purple-500 rounded-lg p-6 text-center">
              <div className="animate-spin h-8 w-8 border-4 border-purple-600 border-t-transparent rounded-full mx-auto mb-3"></div>
              <p className="font-bold text-purple-900">Analyzing your CSV...</p>
              <p className="text-sm text-purple-700 mt-1">
                Detecting platform, scanning for PII, calculating pricing...
              </p>
            </div>
          )}
          
          {/* Setique Social Explainer */}
          {!isAnalyzing && schemaDetection.analysis && (
            <SetiqueSeocialExplainer />
          )}
          
          {/* Analysis Results */}
          {!isAnalyzing && schemaDetection.analysis && (
            <div className="space-y-4">
              <SchemaAnalysisResults
                analysis={schemaDetection.analysis}
                isLoading={schemaDetection.isLoading}
                error={schemaDetection.error}
              />
              
              {/* Version Selector */}
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
                />
              )}
              
              {/* Hygiene Report */}
              {hygieneReport && (
                <HygieneReport
                  passed={hygieneReport.passed}
                  issuesFound={hygieneReport.issuesFound}
                  patternsSummary={hygieneReport.patternsSummary}
                  recommendations={hygieneReport.recommendations}
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
            <div className="bg-purple-50 border-2 border-purple-500 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-purple-900">Uploading...</span>
                <span className="text-sm font-medium text-purple-700">{Math.round(uploadProgress)}%</span>
              </div>
              <div className="w-full bg-purple-200 rounded-full h-3 overflow-hidden border-2 border-black">
                <div
                  className="bg-purple-600 h-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t-4 border-black">
            <button
              type="button"
              onClick={handleClose}
              disabled={isUploading}
              className="flex-1 bg-white text-black font-bold px-6 py-3 rounded-full border-2 border-black hover:scale-105 transition disabled:opacity-50 disabled:hover:scale-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!isFormValid || isUploading}
              className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-bold px-6 py-3 rounded-full border-2 border-black hover:scale-105 transition disabled:opacity-50 disabled:hover:scale-100"
            >
              {isUploading ? 'Uploading...' : 'Publish Social Data'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
