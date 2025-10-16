import { Package, Wrench, Tag, Shield } from './Icons'

/**
 * CurationLevelBadge Component
 * 
 * Displays a visual badge indicating the curation level of a dataset
 * (raw, partial, curated) with optional verified indicator for Pro Curator approval.
 * 
 * @param {string} level - 'raw', 'partial', or 'curated'
 * @param {boolean} verified - true if verified by Pro Curator
 * @param {string} size - 'sm', 'md', or 'lg'
 */
export function CurationLevelBadge({ level, verified = false, size = 'md' }) {
  const config = {
    raw: {
      icon: Package,
      label: 'Raw Data',
      bg: 'bg-orange-200',
      text: 'text-orange-900',
      border: 'border-orange-400',
      description: 'Unprocessed, no labels'
    },
    partial: {
      icon: Wrench,
      label: 'Partially Curated',
      bg: 'bg-yellow-200',
      text: 'text-yellow-900',
      border: 'border-yellow-400',
      description: 'Some labeling done'
    },
    curated: {
      icon: Tag,
      label: 'Fully Curated',
      bg: 'bg-green-200',
      text: 'text-green-900',
      border: 'border-green-400',
      description: 'Production-ready'
    }
  }

  const sizeConfig = {
    sm: {
      container: 'px-2 py-1 text-xs gap-1',
      icon: 'h-3 w-3',
      verifiedIcon: 'h-3 w-3',
      borderWidth: 'border-2'
    },
    md: {
      container: 'px-3 py-1.5 text-sm gap-1.5',
      icon: 'h-4 w-4',
      verifiedIcon: 'h-4 w-4',
      borderWidth: 'border-2'
    },
    lg: {
      container: 'px-4 py-2 text-base gap-2',
      icon: 'h-5 w-5',
      verifiedIcon: 'h-5 w-5',
      borderWidth: 'border-3'
    }
  }

  const badgeConfig = config[level] || config.curated
  const badgeSize = sizeConfig[size] || sizeConfig.md
  const IconComponent = badgeConfig.icon

  return (
    <span
      className={`
        inline-flex items-center 
        ${badgeConfig.bg} 
        ${badgeConfig.text} 
        ${badgeConfig.border} 
        ${badgeSize.borderWidth}
        ${badgeSize.container}
        border-black rounded-full font-extrabold
        shadow-[2px_2px_0_#000]
      `}
      title={badgeConfig.description}
    >
      <IconComponent className={badgeSize.icon} />
      <span>{badgeConfig.label}</span>
      
      {verified && (
        <Shield 
          className={`${badgeSize.verifiedIcon} text-purple-600 ml-1`}
          title="Verified by Pro Curator"
        />
      )}
    </span>
  )
}

/**
 * CurationLevelIndicator Component
 * 
 * Shows a more detailed curation level indicator with metadata completeness
 * and quality score. Used in dataset detail views.
 * 
 * @param {string} level - 'raw', 'partial', or 'curated'
 * @param {number} metadataCompleteness - 0-100
 * @param {number} qualityScore - 1-5 stars (optional)
 * @param {boolean} verified - true if verified by Pro Curator
 */
export function CurationLevelIndicator({ 
  level, 
  metadataCompleteness = 100, 
  qualityScore = null,
  verified = false 
}) {
  const config = {
    raw: {
      bg: 'bg-orange-100',
      border: 'border-orange-400',
      text: 'text-orange-900'
    },
    partial: {
      bg: 'bg-yellow-100',
      border: 'border-yellow-400',
      text: 'text-yellow-900'
    },
    curated: {
      bg: 'bg-green-100',
      border: 'border-green-400',
      text: 'text-green-900'
    }
  }

  const indicatorConfig = config[level] || config.curated

  return (
    <div className={`
      ${indicatorConfig.bg}
      ${indicatorConfig.border}
      ${indicatorConfig.text}
      border-4 border-black rounded-xl p-4
    `}>
      <div className="flex items-center justify-between mb-2">
        <CurationLevelBadge level={level} verified={verified} size="md" />
        
        {qualityScore && (
          <div className="flex items-center gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <span 
                key={i} 
                className={`text-lg ${i < qualityScore ? 'text-yellow-500' : 'text-gray-300'}`}
              >
                ★
              </span>
            ))}
          </div>
        )}
      </div>

      {level !== 'curated' && (
        <div className="mt-3">
          <div className="flex justify-between text-xs font-bold mb-1">
            <span>Metadata Completeness</span>
            <span>{metadataCompleteness}%</span>
          </div>
          <div className="w-full bg-gray-300 rounded-full h-2 border-2 border-black">
            <div 
              className={`
                h-full rounded-full
                ${level === 'raw' ? 'bg-orange-500' : 'bg-yellow-500'}
              `}
              style={{ width: `${metadataCompleteness}%` }}
            />
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * ReviewStatusBadge Component
 * 
 * Shows admin review status for raw uploads.
 * Only visible to dataset creator and admins.
 * 
 * @param {string} status - 'pending', 'approved', or 'rejected'
 * @param {string} reviewNotes - Admin feedback (if rejected)
 */
export function ReviewStatusBadge({ status, reviewNotes = null }) {
  const config = {
    pending: {
      bg: 'bg-blue-200',
      text: 'text-blue-900',
      border: 'border-blue-400',
      label: '⏳ Pending Review',
      message: 'Your upload is being reviewed by our team (typically 24-48 hours)'
    },
    approved: {
      bg: 'bg-green-200',
      text: 'text-green-900',
      border: 'border-green-400',
      label: '✅ Approved',
      message: 'This dataset has been approved and is live on the marketplace'
    },
    rejected: {
      bg: 'bg-red-200',
      text: 'text-red-900',
      border: 'border-red-400',
      label: '❌ Needs Improvement',
      message: 'Please review the feedback below and resubmit'
    }
  }

  const statusConfig = config[status] || config.pending

  return (
    <div className={`
      ${statusConfig.bg}
      ${statusConfig.text}
      ${statusConfig.border}
      border-4 border-black rounded-xl p-4 mb-4
    `}>
      <div className="font-extrabold text-lg mb-2">
        {statusConfig.label}
      </div>
      <p className="text-sm font-semibold mb-2">
        {statusConfig.message}
      </p>
      
      {status === 'rejected' && reviewNotes && (
        <div className="mt-3 p-3 bg-white border-2 border-black rounded-lg">
          <div className="font-bold text-xs mb-1">Admin Feedback:</div>
          <div className="text-sm whitespace-pre-wrap">{reviewNotes}</div>
        </div>
      )}
    </div>
  )
}

export default CurationLevelBadge
