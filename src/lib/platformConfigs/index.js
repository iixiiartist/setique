/**
 * Platform Configurations Index
 * Exports all platform configs for schema detection
 * Part of: 30-Day MVP Implementation (Week 1 - Foundation)
 */

import tiktok from './tiktok.json';
import youtube from './youtube.json';
import instagram from './instagram.json';
import linkedin from './linkedin.json';
import shopify from './shopify.json';

// Default config for unknown platforms
const other = {
  platform: 'other',
  displayName: 'Other',
  description: 'Generic data format',
  dataType: 'other',
  requiredHeaders: [],
  optionalHeaders: [],
  headerAliases: {
    date: ['date', 'timestamp', 'time', 'day'],
    views: ['views', 'impressions', 'pageviews'],
    likes: ['likes', 'favorites', 'upvotes'],
    comments: ['comments', 'replies'],
    shares: ['shares', 'retweets', 'forwards'],
    followers: ['followers', 'subscribers', 'fans'],
    revenue: ['revenue', 'sales', 'earnings']
  },
  patterns: {},
  extendedFields: [],
  piiRules: {
    removeUsernames: true,
    removeUrls: true,
    strictMode: false,
    customPatterns: []
  },
  qualityChecks: [],
  exportInstructions: 'Export your data as CSV from your platform\'s analytics section.',
  valueProps: []
};

// Export all configs as a single object
export const platformConfigs = {
  tiktok,
  youtube,
  instagram,
  linkedin,
  shopify,
  other
};

// Export individual configs for direct imports
export { tiktok, youtube, instagram, linkedin, shopify, other };

// Helper to get config by platform name
export const getPlatformConfig = (platformName) => {
  return platformConfigs[platformName] || platformConfigs.other;
};

// Get list of all supported platforms
export const getSupportedPlatforms = () => {
  return Object.keys(platformConfigs).filter(p => p !== 'other');
};

// Get platforms by data type
export const getPlatformsByDataType = (dataType) => {
  return Object.entries(platformConfigs)
    .filter(([, config]) => config.dataType === dataType)
    .map(([platform]) => platform);
};

export default platformConfigs;
