/**
 * Dynamic Pricing Service
 * AI-powered pricing suggestions based on 5 factors
 * Part of: 30-Day MVP Implementation (Week 1 - Foundation)
 * 
 * Pricing Factors (Weighted):
 * 1. Row Count (25%) - More data = more value
 * 2. Date Range (15%) - Recent data = premium pricing
 * 3. Field Count (20%) - More metrics = richer insights
 * 4. Extended Fields (15%) - Platform-specific = 2x multiplier
 * 5. Platform (10%) - Some platforms more valuable
 * 6. Curation (10%) - Pro Curator verified = 1.3x multiplier
 * 7. Engagement (5%) - High engagement = premium
 * 
 * Base Price: $25-$150 (logarithmic scale by row count)
 * Final Price: Base × Multipliers
 */

// Base price tiers by row count (logarithmic scale)
const BASE_PRICE_TIERS = [
  { maxRows: 100, basePrice: 25 },
  { maxRows: 500, basePrice: 50 },
  { maxRows: 1000, basePrice: 75 },
  { maxRows: 5000, basePrice: 100 },
  { maxRows: 10000, basePrice: 125 },
  { maxRows: Infinity, basePrice: 150 }
];

// Platform value multipliers
const PLATFORM_MULTIPLIERS = {
  tiktok: 1.3,        // High demand for TikTok analytics
  youtube: 1.4,       // YouTube creator economy is huge
  instagram: 1.2,     // Established market
  linkedin: 1.5,      // B2B premium
  shopify: 1.4,       // E-commerce valuable
  spotify: 1.3,       // Music industry insights
  twitter: 1.1,       // Lower baseline
  facebook: 1.0,      // Standard
  other: 0.9          // Unknown platform discount
};

// Date range freshness multipliers
const DATE_RANGE_MULTIPLIERS = {
  'last_7_days': 1.8,     // Ultra fresh
  'last_30_days': 1.5,    // Very fresh
  'last_90_days': 1.3,    // Fresh
  'last_6_months': 1.1,   // Recent
  'last_year': 1.0,       // Standard
  'older': 0.8            // Historical discount
};

/**
 * Calculate base price from row count
 * @param {number} rowCount - Number of data rows
 * @returns {number} Base price
 */
export const calculateBasePrice = (rowCount) => {
  const tier = BASE_PRICE_TIERS.find(t => rowCount <= t.maxRows);
  return tier ? tier.basePrice : 150;
};

/**
 * Determine date range category from dataset dates
 * @param {Array<string>} dates - Array of date strings
 * @returns {string} Date range category
 */
export const determineDateRange = (dates) => {
  if (!dates || dates.length === 0) return 'unknown';

  const validDates = dates
    .map(d => new Date(d))
    .filter(d => !isNaN(d.getTime()));

  if (validDates.length === 0) return 'unknown';

  const mostRecentDate = new Date(Math.max(...validDates));
  const now = new Date();
  
  const daysSinceMostRecent = (now - mostRecentDate) / (1000 * 60 * 60 * 24);

  if (daysSinceMostRecent <= 7) return 'last_7_days';
  if (daysSinceMostRecent <= 30) return 'last_30_days';
  if (daysSinceMostRecent <= 90) return 'last_90_days';
  if (daysSinceMostRecent <= 180) return 'last_6_months';
  if (daysSinceMostRecent <= 365) return 'last_year';
  return 'older';
};

/**
 * Calculate platform multiplier
 * @param {string} platform - Detected platform
 * @returns {number} Multiplier (0.9-1.5)
 */
export const getPlatformMultiplier = (platform) => {
  return PLATFORM_MULTIPLIERS[platform] || PLATFORM_MULTIPLIERS.other;
};

/**
 * Calculate date freshness multiplier
 * @param {string} dateRange - Date range category
 * @returns {number} Multiplier (0.8-1.8)
 */
export const getDateMultiplier = (dateRange) => {
  return DATE_RANGE_MULTIPLIERS[dateRange] || 1.0;
};

/**
 * Calculate extended fields multiplier
 * @param {boolean} hasExtendedFields - Whether dataset has platform-specific fields
 * @param {number} extendedFieldCount - Number of extended fields
 * @returns {number} Multiplier (1.0 or 2.0)
 */
export const getExtendedFieldsMultiplier = (hasExtendedFields, extendedFieldCount) => {
  if (!hasExtendedFields || extendedFieldCount === 0) return 1.0;
  
  // Extended version = 2x pricing
  return 2.0;
};

/**
 * Calculate curation multiplier
 * @param {boolean} isCurated - Whether dataset is Pro Curator verified
 * @returns {number} Multiplier (1.0 or 1.3)
 */
export const getCurationMultiplier = (isCurated) => {
  return isCurated ? 1.3 : 1.0;
};

/**
 * Calculate engagement quality multiplier
 * @param {Array<Object>} rows - Data rows
 * @param {Object} canonicalFields - Field mappings
 * @returns {number} Multiplier (0.9-1.2)
 */
export const getEngagementMultiplier = (rows, canonicalFields) => {
  if (!rows || rows.length === 0) return 1.0;

  // Find engagement fields (views, likes, comments, shares)
  const reverseMapping = Object.fromEntries(
    Object.entries(canonicalFields).map(([orig, canonical]) => [canonical, orig])
  );

  const viewsField = reverseMapping.views;
  const likesField = reverseMapping.likes;
  const commentsField = reverseMapping.comments;

  if (!viewsField) return 1.0;

  // Calculate average engagement rate
  let totalEngagementRate = 0;
  let validRows = 0;

  rows.forEach(row => {
    const views = parseFloat(row[viewsField]) || 0;
    if (views === 0) return;

    const likes = parseFloat(row[likesField]) || 0;
    const comments = parseFloat(row[commentsField]) || 0;
    
    const engagementRate = ((likes + comments) / views) * 100;
    
    if (!isNaN(engagementRate)) {
      totalEngagementRate += engagementRate;
      validRows++;
    }
  });

  if (validRows === 0) return 1.0;

  const avgEngagementRate = totalEngagementRate / validRows;

  // High engagement (>5%) = premium
  if (avgEngagementRate > 5) return 1.2;
  // Medium engagement (2-5%) = standard
  if (avgEngagementRate > 2) return 1.0;
  // Low engagement (<2%) = slight discount
  return 0.9;
};

/**
 * Generate pricing reasoning for transparency
 * @param {Object} factors - All pricing factors
 * @returns {Array<string>} Array of reasoning strings
 */
export const generatePricingReasoning = (factors) => {
  const reasoning = [];

  // Base price reasoning
  reasoning.push(
    `Base price: $${factors.basePrice} for ${factors.rowCount.toLocaleString()} rows of data`
  );

  // Date freshness reasoning
  if (factors.dateMultiplier > 1.0) {
    reasoning.push(
      `+${((factors.dateMultiplier - 1) * 100).toFixed(0)}% for ${factors.dateRange.replace(/_/g, ' ')} data (fresh data premium)`
    );
  } else if (factors.dateMultiplier < 1.0) {
    reasoning.push(
      `${((factors.dateMultiplier - 1) * 100).toFixed(0)}% for ${factors.dateRange.replace(/_/g, ' ')} data (historical discount)`
    );
  }

  // Extended fields reasoning
  if (factors.hasExtendedFields) {
    reasoning.push(
      `+100% for ${factors.extendedFieldCount} platform-specific extended fields (2x multiplier)`
    );
  }

  // Platform reasoning
  if (factors.platformMultiplier > 1.0) {
    reasoning.push(
      `+${((factors.platformMultiplier - 1) * 100).toFixed(0)}% for ${factors.platform} platform (high demand)`
    );
  }

  // Curation reasoning
  if (factors.isCurated) {
    reasoning.push(
      `+30% for Pro Curator verification (quality guarantee)`
    );
  }

  // Engagement reasoning
  if (factors.engagementMultiplier > 1.0) {
    reasoning.push(
      `+${((factors.engagementMultiplier - 1) * 100).toFixed(0)}% for high engagement rate (valuable audience)`
    );
  } else if (factors.engagementMultiplier < 1.0) {
    reasoning.push(
      `${((factors.engagementMultiplier - 1) * 100).toFixed(0)}% for lower engagement rate`
    );
  }

  return reasoning;
};

/**
 * Calculate suggested price with full factor breakdown
 * @param {Object} dataset - Dataset metadata and rows
 * @param {Object} schemaAnalysis - Schema detection results
 * @returns {Object} Price suggestion with factors and reasoning
 */
export const calculateSuggestedPrice = (dataset, schemaAnalysis) => {
  const {
    rows = [],
    dateField = null,
    isCurated = false
  } = dataset;

  const {
    platform = 'other',
    hasExtendedFields = false,
    extendedFieldCount = 0,
    canonicalFields = {}
  } = schemaAnalysis;

  // Factor 1: Base price from row count (25% weight)
  const rowCount = rows.length;
  const basePrice = calculateBasePrice(rowCount);

  // Factor 2: Date range freshness (15% weight)
  let dates = [];
  if (dateField && canonicalFields) {
    const reverseMapping = Object.fromEntries(
      Object.entries(canonicalFields).map(([orig, canonical]) => [canonical, orig])
    );
    const dateFieldName = reverseMapping.date;
    if (dateFieldName) {
      dates = rows.map(row => row[dateFieldName]).filter(Boolean);
    }
  }
  const dateRange = determineDateRange(dates);
  const dateMultiplier = getDateMultiplier(dateRange);

  // Factor 3: Platform value (10% weight)
  const platformMultiplier = getPlatformMultiplier(platform);

  // Factor 4: Extended fields (15% weight)
  const extendedFieldsMultiplier = getExtendedFieldsMultiplier(hasExtendedFields, extendedFieldCount);

  // Factor 5: Curation quality (10% weight)
  const curationMultiplier = getCurationMultiplier(isCurated);

  // Factor 6: Engagement quality (5% weight)
  const engagementMultiplier = getEngagementMultiplier(rows, canonicalFields);

  // Calculate final price
  const finalPrice = basePrice 
    * dateMultiplier 
    * platformMultiplier 
    * extendedFieldsMultiplier 
    * curationMultiplier 
    * engagementMultiplier;

  // Round to nearest $5
  const suggestedPrice = Math.round(finalPrice / 5) * 5;

  // Calculate confidence based on data quality
  const confidence = calculatePriceConfidence(rows, dates, platform);

  // Compile all factors
  const factors = {
    basePrice,
    rowCount,
    dateRange,
    dateMultiplier,
    platform,
    platformMultiplier,
    hasExtendedFields,
    extendedFieldCount,
    extendedFieldsMultiplier,
    isCurated,
    curationMultiplier,
    engagementMultiplier,
    finalMultiplier: (dateMultiplier * platformMultiplier * extendedFieldsMultiplier * curationMultiplier * engagementMultiplier).toFixed(2)
  };

  const reasoning = generatePricingReasoning(factors);

  return {
    suggestedPrice,
    confidence,
    factors,
    reasoning,
    priceRange: {
      min: Math.round(suggestedPrice * 0.8 / 5) * 5,
      max: Math.round(suggestedPrice * 1.2 / 5) * 5
    },
    marketComparables: generateMarketComparables(platform, rowCount, hasExtendedFields)
  };
};

/**
 * Calculate price confidence score
 * @param {Array<Object>} rows - Data rows
 * @param {Array<string>} dates - Date values
 * @param {string} platform - Detected platform
 * @returns {number} Confidence (0-1)
 */
const calculatePriceConfidence = (rows, dates, platform) => {
  let confidence = 0.5; // Base confidence

  // More rows = higher confidence
  if (rows.length >= 100) confidence += 0.2;
  if (rows.length >= 500) confidence += 0.1;

  // Valid dates = higher confidence
  if (dates.length > 0) confidence += 0.1;
  if (dates.length / rows.length > 0.9) confidence += 0.1; // 90%+ have dates

  // Known platform = higher confidence
  if (platform !== 'other') confidence += 0.1;

  return Math.min(confidence, 1.0);
};

/**
 * Generate market comparables (mock data for MVP)
 * @param {string} platform - Platform type
 * @param {number} rowCount - Row count
 * @param {boolean} hasExtendedFields - Has extended fields
 * @returns {Array<Object>} Similar datasets with prices
 */
const generateMarketComparables = (platform, rowCount, hasExtendedFields) => {
  // Mock comparables for MVP - replace with real marketplace data later
  const version = hasExtendedFields ? 'Extended' : 'Standard';
  const avgPrice = calculateBasePrice(rowCount) * (hasExtendedFields ? 2.0 : 1.0);

  return [
    {
      title: `Similar ${platform} dataset (${rowCount} rows)`,
      version,
      rowCount,
      price: Math.round(avgPrice * 0.9 / 5) * 5,
      soldDate: '2 weeks ago'
    },
    {
      title: `${platform} analytics (${Math.round(rowCount * 1.2)} rows)`,
      version,
      rowCount: Math.round(rowCount * 1.2),
      price: Math.round(avgPrice * 1.1 / 5) * 5,
      soldDate: '1 month ago'
    },
    {
      title: `${platform} creator data (${Math.round(rowCount * 0.8)} rows)`,
      version,
      rowCount: Math.round(rowCount * 0.8),
      price: Math.round(avgPrice * 0.85 / 5) * 5,
      soldDate: '3 weeks ago'
    }
  ];
};

/**
 * Compare Standard vs Extended pricing
 * @param {Object} dataset - Dataset metadata
 * @param {Object} schemaAnalysis - Schema analysis
 * @returns {Object} Both pricing options
 */
export const comparePricingVersions = (dataset, schemaAnalysis) => {
  // Standard version (core fields only)
  const standardAnalysis = { ...schemaAnalysis, hasExtendedFields: false, extendedFieldCount: 0 };
  const standardPricing = calculateSuggestedPrice(dataset, standardAnalysis);

  // Extended version (core + platform fields)
  const extendedPricing = calculateSuggestedPrice(dataset, schemaAnalysis);

  return {
    standard: {
      ...standardPricing,
      version: 'Standard',
      description: 'USS v1.0 core fields only (7 fields)'
    },
    extended: {
      ...extendedPricing,
      version: 'Extended',
      description: `Core fields + ${schemaAnalysis.extendedFieldCount} platform-specific fields`
    },
    recommendation: extendedPricing.suggestedPrice > standardPricing.suggestedPrice * 1.5
      ? 'Publish both versions - Extended offers significant value premium'
      : 'Publish Standard version - Extended premium may not justify complexity'
  };
};

export default {
  calculateBasePrice,
  determineDateRange,
  getPlatformMultiplier,
  getDateMultiplier,
  getExtendedFieldsMultiplier,
  getCurationMultiplier,
  getEngagementMultiplier,
  calculateSuggestedPrice,
  comparePricingVersions,
  generatePricingReasoning
};
