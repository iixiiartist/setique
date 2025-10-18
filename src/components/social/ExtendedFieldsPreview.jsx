/**
 * ExtendedFieldsPreview Component
 * Displays a collapsible list of platform-specific extended fields
 * Part of: Phase 3 - Marketplace Integration
 */

import { useState } from 'react'
import { ChevronDown, ChevronRight, Database, CheckCircle } from '../Icons'

/**
 * Field type icons and colors
 */
const FIELD_TYPE_CONFIG = {
  engagement: {
    label: 'Engagement',
    color: 'text-pink-600',
    bgColor: 'bg-pink-100'
  },
  content: {
    label: 'Content',
    color: 'text-purple-600',
    bgColor: 'bg-purple-100'
  },
  creator: {
    label: 'Creator',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100'
  },
  performance: {
    label: 'Performance',
    color: 'text-green-600',
    bgColor: 'bg-green-100'
  },
  metadata: {
    label: 'Metadata',
    color: 'text-gray-600',
    bgColor: 'bg-gray-100'
  }
}

/**
 * Parse field name to display name
 * Example: 'tiktok_sound_name' -> 'Sound Name'
 */
const formatFieldName = (fieldName) => {
  return fieldName
    .replace(/^(tiktok|youtube|instagram|linkedin|shopify)_/, '') // Remove platform prefix
    .replace(/_/g, ' ') // Replace underscores with spaces
    .replace(/\b\w/g, char => char.toUpperCase()) // Capitalize first letter of each word
}

/**
 * Guess field type from field name
 */
const guessFieldType = (fieldName) => {
  const lowerName = fieldName.toLowerCase()
  
  if (lowerName.includes('like') || lowerName.includes('comment') || 
      lowerName.includes('share') || lowerName.includes('view') ||
      lowerName.includes('engagement')) {
    return 'engagement'
  }
  
  if (lowerName.includes('sound') || lowerName.includes('music') ||
      lowerName.includes('caption') || lowerName.includes('hashtag') ||
      lowerName.includes('description') || lowerName.includes('title')) {
    return 'content'
  }
  
  if (lowerName.includes('follower') || lowerName.includes('creator') ||
      lowerName.includes('author') || lowerName.includes('channel')) {
    return 'creator'
  }
  
  if (lowerName.includes('ctr') || lowerName.includes('rate') ||
      lowerName.includes('score') || lowerName.includes('performance') ||
      lowerName.includes('viral')) {
    return 'performance'
  }
  
  return 'metadata'
}

/**
 * ExtendedFieldsPreview Component
 * @param {Array<string>} fields - Array of extended field names
 * @param {number} count - Number of extended fields
 * @param {string} platform - Platform name for context
 * @param {boolean} defaultExpanded - Whether to show expanded by default
 * @param {string} className - Additional CSS classes
 */
export default function ExtendedFieldsPreview({ 
  fields = [], 
  count = 0,
  platform = '',
  defaultExpanded = false,
  className = '' 
}) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)
  
  // Use count if provided, otherwise use fields length
  const fieldCount = count || fields.length
  
  // Don't render if no extended fields
  if (fieldCount === 0) return null

  // Parse fields if they're provided as JSONB array
  let parsedFields = fields
  if (typeof fields === 'string') {
    try {
      parsedFields = JSON.parse(fields)
    } catch {
      parsedFields = []
    }
  }

  return (
    <div className={`border-2 border-black bg-white rounded-lg overflow-hidden ${className}`}>
      {/* Header - Always visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-cyan-600" />
          <span className="font-bold text-sm text-black">
            Extended Fields
          </span>
          <span className="px-2 py-0.5 bg-cyan-100 text-cyan-800 text-xs font-bold rounded-full border border-cyan-600">
            +{fieldCount}
          </span>
          {platform && (
            <span className="text-xs text-gray-600 font-semibold">
              {platform}-specific
            </span>
          )}
        </div>
        {isExpanded ? (
          <ChevronDown className="w-4 h-4 text-gray-600" />
        ) : (
          <ChevronRight className="w-4 h-4 text-gray-600" />
        )}
      </button>

      {/* Expanded content */}
      {isExpanded && parsedFields.length > 0 && (
        <div className="border-t-2 border-black px-4 py-3 bg-gray-50">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {parsedFields.map((field, index) => {
              const fieldType = guessFieldType(field)
              const typeConfig = FIELD_TYPE_CONFIG[fieldType]
              
              return (
                <div
                  key={`${field}-${index}`}
                  className="flex items-center gap-2 p-2 bg-white border border-gray-200 rounded"
                >
                  <CheckCircle className={`w-3.5 h-3.5 ${typeConfig.color}`} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-black truncate" title={field}>
                      {formatFieldName(field)}
                    </div>
                    <div className={`text-xs font-semibold ${typeConfig.color}`}>
                      {typeConfig.label}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
          
          {/* Help text */}
          <div className="mt-3 pt-3 border-t border-gray-200">
            <p className="text-xs text-gray-600 font-semibold">
              💡 Extended fields are platform-specific data beyond the USS v1.0 core fields, 
              providing deeper insights for {platform || 'this platform'}.
            </p>
          </div>
        </div>
      )}

      {/* Collapsed preview - show count only */}
      {!isExpanded && (
        <div className="px-4 py-2 bg-gray-50 border-t border-gray-200">
          <p className="text-xs text-gray-600 font-semibold">
            Click to see {fieldCount} additional platform-specific fields →
          </p>
        </div>
      )}
    </div>
  )
}

/**
 * ExtendedFieldsBadge Component
 * Simple badge to indicate extended fields presence
 * @param {number} count - Number of extended fields
 * @param {boolean} showCount - Whether to show the count
 */
export function ExtendedFieldsBadge({ count = 0, showCount = true }) {
  if (count === 0) return null

  return (
    <span className="inline-flex items-center gap-1 px-2 py-1 bg-cyan-100 text-cyan-800 text-xs font-bold rounded-full border-2 border-cyan-600">
      <Database className="w-3 h-3" />
      {showCount ? (
        <span>+{count} Extended</span>
      ) : (
        <span>Extended Fields</span>
      )}
    </span>
  )
}
