/**
 * PlatformBadge Component
 * Displays a platform badge with icon and name for social analytics datasets
 * Part of: Phase 3 - Marketplace Integration
 */

import { 
  TrendingUp, // TikTok
  Play, // YouTube  
  Camera, // Instagram
  Briefcase, // LinkedIn
  ShoppingBag, // Shopify
  Twitter, // Twitter/X
  Share2, // Facebook
  Music, // Spotify
  Database // Other/Generic
} from '../Icons'

// Platform configuration with colors and icons
const PLATFORM_CONFIG = {
  tiktok: {
    name: 'TikTok',
    icon: TrendingUp,
    bgColor: 'bg-black',
    textColor: 'text-white',
    borderColor: 'border-black',
    hoverColor: 'hover:bg-gray-800'
  },
  youtube: {
    name: 'YouTube',
    icon: Play,
    bgColor: 'bg-red-500',
    textColor: 'text-white',
    borderColor: 'border-red-700',
    hoverColor: 'hover:bg-red-600'
  },
  instagram: {
    name: 'Instagram',
    icon: Camera,
    bgColor: 'bg-gradient-to-br from-purple-500 via-pink-500 to-yellow-500',
    textColor: 'text-white',
    borderColor: 'border-purple-700',
    hoverColor: 'hover:opacity-90'
  },
  linkedin: {
    name: 'LinkedIn',
    icon: Briefcase,
    bgColor: 'bg-blue-600',
    textColor: 'text-white',
    borderColor: 'border-blue-800',
    hoverColor: 'hover:bg-blue-700'
  },
  shopify: {
    name: 'Shopify',
    icon: ShoppingBag,
    bgColor: 'bg-green-600',
    textColor: 'text-white',
    borderColor: 'border-green-800',
    hoverColor: 'hover:bg-green-700'
  },
  twitter: {
    name: 'Twitter/X',
    icon: Twitter,
    bgColor: 'bg-black',
    textColor: 'text-white',
    borderColor: 'border-black',
    hoverColor: 'hover:bg-gray-800'
  },
  facebook: {
    name: 'Facebook',
    icon: Share2,
    bgColor: 'bg-blue-500',
    textColor: 'text-white',
    borderColor: 'border-blue-700',
    hoverColor: 'hover:bg-blue-600'
  },
  spotify: {
    name: 'Spotify',
    icon: Music,
    bgColor: 'bg-green-500',
    textColor: 'text-white',
    borderColor: 'border-green-700',
    hoverColor: 'hover:bg-green-600'
  },
  other: {
    name: 'Other',
    icon: Database,
    bgColor: 'bg-gray-500',
    textColor: 'text-white',
    borderColor: 'border-gray-700',
    hoverColor: 'hover:bg-gray-600'
  }
}

/**
 * PlatformBadge Component
 * @param {string} platform - Platform identifier (tiktok, youtube, instagram, etc.)
 * @param {string} size - Badge size: 'sm', 'md', 'lg' (default: 'md')
 * @param {boolean} showIcon - Whether to show platform icon (default: true)
 * @param {boolean} showName - Whether to show platform name (default: true)
 * @param {string} className - Additional CSS classes
 */
export default function PlatformBadge({ 
  platform, 
  size = 'md', 
  showIcon = true, 
  showName = true,
  className = '' 
}) {
  // Get platform config or fallback to 'other'
  const config = PLATFORM_CONFIG[platform?.toLowerCase()] || PLATFORM_CONFIG.other
  const Icon = config.icon

  // Size configurations
  const sizeClasses = {
    sm: {
      container: 'px-2 py-1 text-xs gap-1',
      icon: 'w-3 h-3',
      text: 'text-xs'
    },
    md: {
      container: 'px-3 py-1.5 text-sm gap-1.5',
      icon: 'w-4 h-4',
      text: 'text-sm'
    },
    lg: {
      container: 'px-4 py-2 text-base gap-2',
      icon: 'w-5 h-5',
      text: 'text-base'
    }
  }

  const sizes = sizeClasses[size] || sizeClasses.md

  // Don't render if no platform provided
  if (!platform) return null

  return (
    <span
      className={`
        inline-flex items-center
        ${sizes.container}
        ${config.bgColor}
        ${config.textColor}
        ${config.borderColor}
        border-2
        rounded-full
        font-bold
        shadow-[2px_2px_0_rgba(0,0,0,0.5)]
        transition-all
        ${config.hoverColor}
        ${className}
      `.trim()}
      title={`${config.name} Analytics`}
    >
      {showIcon && <Icon className={sizes.icon} />}
      {showName && <span className={sizes.text}>{config.name}</span>}
    </span>
  )
}

/**
 * PlatformBadgeList Component
 * Displays multiple platform badges (for datasets with multiple platform data)
 * @param {Array<string>} platforms - Array of platform identifiers
 * @param {string} size - Badge size
 * @param {number} maxDisplay - Maximum number of badges to show (default: 3)
 */
export function PlatformBadgeList({ platforms = [], size = 'sm', maxDisplay = 3 }) {
  if (!platforms || platforms.length === 0) return null

  const visiblePlatforms = platforms.slice(0, maxDisplay)
  const hiddenCount = platforms.length - maxDisplay

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {visiblePlatforms.map((platform, index) => (
        <PlatformBadge 
          key={`${platform}-${index}`}
          platform={platform} 
          size={size}
          showName={size !== 'sm'}
        />
      ))}
      {hiddenCount > 0 && (
        <span className="text-xs font-bold text-gray-600 ml-1">
          +{hiddenCount} more
        </span>
      )}
    </div>
  )
}
