/**
 * Curator Tier System Constants
 * 
 * Defines the tier hierarchy and display information for the curator trust level system.
 * Used across bounty creation, proposal submission, and tier badge displays.
 */

export const CURATOR_TIERS = {
  NEWCOMER: 'newcomer',
  VERIFIED: 'verified',
  EXPERT: 'expert',
  MASTER: 'master'
};

/**
 * Tier hierarchy for comparison and validation
 * Higher number = higher tier
 */
export const tierHierarchy = {
  [CURATOR_TIERS.NEWCOMER]: 0,
  [CURATOR_TIERS.VERIFIED]: 1,
  [CURATOR_TIERS.EXPERT]: 2,
  [CURATOR_TIERS.MASTER]: 3
};

/**
 * Display names for each tier
 */
export const tierDisplayNames = {
  [CURATOR_TIERS.NEWCOMER]: 'Newcomer',
  [CURATOR_TIERS.VERIFIED]: 'Verified',
  [CURATOR_TIERS.EXPERT]: 'Expert',
  [CURATOR_TIERS.MASTER]: 'Master'
};

/**
 * Complete tier display information including badges and colors
 * Used for consistent tier badge rendering across the application
 */
export const tierDisplayInfo = {
  [CURATOR_TIERS.NEWCOMER]: {
    label: 'Open to All',
    badge: '🌟',
    color: 'bg-gray-100 text-gray-800 border-gray-600'
  },
  [CURATOR_TIERS.VERIFIED]: {
    label: 'Verified+',
    badge: '✓',
    color: 'bg-blue-100 text-blue-800 border-blue-600'
  },
  [CURATOR_TIERS.EXPERT]: {
    label: 'Expert+',
    badge: '✓✓',
    color: 'bg-purple-100 text-purple-800 border-purple-600'
  },
  [CURATOR_TIERS.MASTER]: {
    label: 'Master Only',
    badge: '⭐',
    color: 'bg-yellow-100 text-yellow-800 border-yellow-600'
  }
};

/**
 * Check if a curator meets the tier requirement for a bounty
 * @param {string} curatorTier - The curator's current tier (badge_level)
 * @param {string} requiredTier - The minimum tier required for the bounty
 * @returns {boolean} - True if curator meets or exceeds the requirement
 */
export function meetsTierRequirement(curatorTier, requiredTier) {
  const userLevel = tierHierarchy[curatorTier] ?? 0;
  const requiredLevel = tierHierarchy[requiredTier] ?? 0;
  return userLevel >= requiredLevel;
}

/**
 * Get tier info for display
 * @param {string} tier - The tier level
 * @returns {object} - Display info object with label, badge, and color
 */
export function getTierInfo(tier) {
  return tierDisplayInfo[tier] || tierDisplayInfo[CURATOR_TIERS.NEWCOMER];
}
