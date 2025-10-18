/**
 * Schema Detector Service
 * Automatically detects platform, normalizes headers to USS v1.0, identifies extended fields
 * Part of: 30-Day MVP Implementation (Week 1 - Foundation)
 * 
 * Features:
 * - Platform detection (TikTok, YouTube, Instagram, LinkedIn, Shopify)
 * - Header normalization to Universal Schema Standard (USS) v1.0
 * - Extended field detection (platform-specific fields beyond core)
 * - Row validation and quality checks
 * - Confidence scoring
 */

import { platformConfigs } from '../lib/platformConfigs';

// USS v1.0 Core Fields (7 fields required for Standard version)
const USS_CORE_FIELDS = [
  'date',           // Temporal
  'views',          // Engagement
  'likes',          // Engagement
  'comments',       // Engagement
  'shares',         // Engagement
  'followers',      // Audience
  'revenue'         // Commerce
];

/**
 * Detect platform from CSV headers and sample data
 * @param {Array<string>} headers - CSV column headers
 * @param {Array<Object>} sampleRows - First 10 rows for signature matching
 * @returns {Object} { platform: string, confidence: number, reasoning: string[] }
 */
export const detectPlatform = (headers, sampleRows = []) => {
  const scores = {};
  const reasoning = {};

  // Normalize headers for comparison
  const normalizedHeaders = headers.map(h => h.toLowerCase().trim());

  // Score each platform based on signature matching
  Object.entries(platformConfigs).forEach(([platform, config]) => {
    let score = 0;
    const reasons = [];

    // Check required headers
    const requiredMatches = config.requiredHeaders.filter(req =>
      normalizedHeaders.some(h => h === req || config.headerAliases[req]?.includes(h))
    );
    score += requiredMatches.length * 10;
    if (requiredMatches.length > 0) {
      reasons.push(`${requiredMatches.length}/${config.requiredHeaders.length} required headers found`);
    }

    // Check optional headers (bonus points)
    const optionalMatches = config.optionalHeaders.filter(opt =>
      normalizedHeaders.some(h => h === opt || config.headerAliases[opt]?.includes(h))
    );
    score += optionalMatches.length * 5;
    if (optionalMatches.length > 0) {
      reasons.push(`${optionalMatches.length} optional headers found`);
    }

    // Check platform-specific patterns in headers
    Object.entries(config.patterns).forEach(([fieldName, pattern]) => {
      const regex = new RegExp(pattern, 'i');
      if (normalizedHeaders.some(h => regex.test(h))) {
        score += 15;
        reasons.push(`Platform pattern "${fieldName}" detected`);
      }
    });

    // Check data patterns in sample rows (if provided)
    if (sampleRows.length > 0) {
      const dataPatternMatches = checkDataPatterns(sampleRows, config);
      score += dataPatternMatches.score;
      if (dataPatternMatches.reasons.length > 0) {
        reasons.push(...dataPatternMatches.reasons);
      }
    }

    scores[platform] = score;
    reasoning[platform] = reasons;
  });

  // Find highest scoring platform
  const sortedPlatforms = Object.entries(scores).sort(([, a], [, b]) => b - a);
  const [topPlatform, topScore] = sortedPlatforms[0];
  const [, secondScore] = sortedPlatforms[1] || ['none', 0];

  // Calculate confidence (0-1 scale)
  const maxPossibleScore = 100; // Approximate max based on all checks
  const confidence = Math.min(topScore / maxPossibleScore, 1.0);

  // If confidence too low or scores too close, mark as 'other'
  const isConfident = confidence >= 0.5 && (topScore - secondScore) >= 20;

  return {
    platform: isConfident ? topPlatform : 'other',
    confidence: parseFloat(confidence.toFixed(2)),
    reasoning: reasoning[topPlatform] || [],
    allScores: scores
  };
};

/**
 * Check data patterns in sample rows
 * @param {Array<Object>} rows - Sample rows
 * @param {Object} config - Platform config
 * @returns {Object} { score: number, reasons: string[] }
 */
const checkDataPatterns = (rows, config) => {
  let score = 0;
  const reasons = [];

  // Check URL patterns
  if (config.patterns.url) {
    const urlRegex = new RegExp(config.patterns.url, 'i');
    const hasMatchingUrls = rows.some(row =>
      Object.values(row).some(val => typeof val === 'string' && urlRegex.test(val))
    );
    if (hasMatchingUrls) {
      score += 10;
      reasons.push('Platform-specific URL patterns found in data');
    }
  }

  // Check ID patterns
  if (config.patterns.id) {
    const idRegex = new RegExp(config.patterns.id, 'i');
    const hasMatchingIds = rows.some(row =>
      Object.values(row).some(val => typeof val === 'string' && idRegex.test(val))
    );
    if (hasMatchingIds) {
      score += 10;
      reasons.push('Platform-specific ID patterns found in data');
    }
  }

  return { score, reasons };
};

/**
 * Normalize CSV headers to USS v1.0 canonical field names
 * @param {Array<string>} headers - Original CSV headers
 * @param {string} platform - Detected platform
 * @returns {Object} { canonicalFields: Object, unmappedFields: Array }
 */
export const normalizeHeaders = (headers, platform) => {
  const config = platformConfigs[platform] || platformConfigs.other;
  const canonicalFields = {};
  const unmappedFields = [];

  headers.forEach(header => {
    const normalized = header.toLowerCase().trim();
    let mapped = false;

    // Check if header maps to a USS core field
    for (const coreField of USS_CORE_FIELDS) {
      const aliases = config.headerAliases[coreField] || [];
      if (normalized === coreField || aliases.includes(normalized)) {
        canonicalFields[header] = coreField;
        mapped = true;
        break;
      }
    }

    // If not a core field, might be an extended field
    if (!mapped) {
      // Check if it's a known extended field for this platform
      const extendedFieldName = `${platform}_${normalized.replace(/[^a-z0-9_]/g, '_')}`;
      canonicalFields[header] = extendedFieldName;
      unmappedFields.push({
        original: header,
        suggested: extendedFieldName,
        isExtended: true
      });
    }
  });

  return { canonicalFields, unmappedFields };
};

/**
 * Identify extended fields (platform-specific fields beyond USS core)
 * @param {Object} canonicalFields - Mapped field names
 * @returns {Array<string>} List of extended field names
 */
export const identifyExtendedFields = (canonicalFields) => {
  const extendedFields = [];

  Object.values(canonicalFields).forEach(canonicalName => {
    // If not in USS core fields, it's an extended field
    if (!USS_CORE_FIELDS.includes(canonicalName)) {
      extendedFields.push(canonicalName);
    }
  });

  return extendedFields;
};

/**
 * Validate row data quality
 * @param {Array<Object>} rows - All CSV rows
 * @param {Object} canonicalFields - Field mappings
 * @param {string} platform - Detected platform
 * @returns {Object} { passed: boolean, errors: Array, warnings: Array }
 */
export const validateRows = (rows, canonicalFields, platform) => {
  const config = platformConfigs[platform] || platformConfigs.other;
  const errors = [];
  const warnings = [];

  // Check minimum row count
  if (rows.length < 10) {
    warnings.push(`Low row count: ${rows.length} rows (recommend 100+ for meaningful insights)`);
  }

  // Check for empty rows
  const emptyRows = rows.filter(row =>
    Object.values(row).every(val => !val || val.toString().trim() === '')
  );
  if (emptyRows.length > 0) {
    warnings.push(`${emptyRows.length} empty rows found`);
  }

  // Check for required core fields presence
  const coreFieldsPresent = USS_CORE_FIELDS.filter(field =>
    Object.values(canonicalFields).includes(field)
  );
  if (coreFieldsPresent.length < 3) {
    errors.push(`Too few core fields mapped: ${coreFieldsPresent.length}/7 (need at least 3)`);
  }

  // Check data types for core numeric fields
  const numericFields = ['views', 'likes', 'comments', 'shares', 'followers', 'revenue'];
  const reverseMapping = Object.fromEntries(
    Object.entries(canonicalFields).map(([orig, canonical]) => [canonical, orig])
  );

  numericFields.forEach(field => {
    if (reverseMapping[field]) {
      const originalHeader = reverseMapping[field];
      const nonNumericRows = rows.filter(row => {
        const val = row[originalHeader];
        return val && isNaN(parseFloat(val.toString().replace(/,/g, '')));
      });

      if (nonNumericRows.length > rows.length * 0.1) {
        errors.push(`Field "${originalHeader}" (${field}) has ${nonNumericRows.length} non-numeric values`);
      }
    }
  });

  // Check date field format
  if (reverseMapping.date) {
    const dateHeader = reverseMapping.date;
    const invalidDates = rows.filter(row => {
      const val = row[dateHeader];
      return val && isNaN(Date.parse(val));
    });

    if (invalidDates.length > rows.length * 0.1) {
      warnings.push(`Date field "${dateHeader}" has ${invalidDates.length} invalid date formats`);
    }
  }

  // Platform-specific quality checks
  if (config.qualityChecks) {
    config.qualityChecks.forEach(check => {
      const result = performQualityCheck(rows, check, canonicalFields);
      if (!result.passed) {
        warnings.push(result.message);
      }
    });
  }

  return {
    passed: errors.length === 0,
    errors,
    warnings,
    stats: {
      totalRows: rows.length,
      emptyRows: emptyRows.length,
      coreFieldsPresent: coreFieldsPresent.length,
      extendedFieldsPresent: Object.values(canonicalFields).length - coreFieldsPresent.length
    }
  };
};

/**
 * Perform platform-specific quality check
 * @param {Array<Object>} rows - Data rows
 * @param {Object} check - Quality check config
 * @param {Object} canonicalFields - Field mappings
 * @returns {Object} { passed: boolean, message: string }
 */
const performQualityCheck = (rows, check, canonicalFields) => {
  // Find the original header name for the canonical field
  const originalHeader = Object.keys(canonicalFields).find(
    key => canonicalFields[key] === check.field
  );

  if (!originalHeader) {
    return { passed: true, message: '' };
  }

  const failedRows = rows.filter(row => {
    const val = row[originalHeader];
    if (!val) return check.required;

    switch (check.type) {
      case 'range': {
        const num = parseFloat(val.toString().replace(/,/g, ''));
        return num < check.min || num > check.max;
      }
      case 'length':
        return val.toString().length < check.min || val.toString().length > check.max;
      case 'pattern':
        return !new RegExp(check.pattern).test(val.toString());
      default:
        return false;
    }
  });

  const passed = failedRows.length < rows.length * 0.1; // Allow 10% failure rate

  return {
    passed,
    message: passed
      ? ''
      : `Quality check failed for "${originalHeader}": ${failedRows.length} rows don't meet criteria`
  };
};

/**
 * Main schema detection function (orchestrates all steps)
 * @param {Array<string>} headers - CSV headers
 * @param {Array<Object>} rows - CSV data rows
 * @returns {Object} Complete schema analysis
 */
export const analyzeSchema = (headers, rows) => {
  // Step 1: Detect platform
  const sampleRows = rows.slice(0, 10);
  const platformDetection = detectPlatform(headers, sampleRows);

  // Step 2: Normalize headers
  const { canonicalFields } = normalizeHeaders(headers, platformDetection.platform);

  // Step 3: Identify extended fields
  const extendedFields = identifyExtendedFields(canonicalFields);

  // Step 4: Validate rows
  const validation = validateRows(rows, canonicalFields, platformDetection.platform);

  // Step 5: Determine data type
  const dataType = determineDataType(platformDetection.platform);

  return {
    platform: platformDetection.platform,
    platformConfidence: platformDetection.confidence,
    platformReasoning: platformDetection.reasoning,
    dataType,
    canonicalFields,
    extendedFields,
    extendedFieldCount: extendedFields.length,
    hasExtendedFields: extendedFields.length > 0,
    validation,
    recommendations: generateRecommendations(platformDetection, validation, extendedFields)
  };
};

/**
 * Determine data type based on platform
 */
const determineDataType = (platform) => {
  const socialPlatforms = ['tiktok', 'youtube', 'instagram', 'twitter', 'facebook', 'linkedin', 'spotify'];
  const ecommercePlatforms = ['shopify', 'amazon', 'ebay'];

  if (socialPlatforms.includes(platform)) return 'social_analytics';
  if (ecommercePlatforms.includes(platform)) return 'ecommerce';
  if (platform === 'linkedin') return 'professional';
  return 'other';
};

/**
 * Generate recommendations for creators
 */
const generateRecommendations = (platformDetection, validation, extendedFields) => {
  const recommendations = [];

  // Platform confidence recommendations
  if (platformDetection.confidence < 0.7) {
    recommendations.push({
      type: 'warning',
      message: 'Low platform detection confidence. Verify your export source.',
      action: 'Review export instructions for your platform'
    });
  }

  // Validation recommendations
  if (!validation.passed) {
    recommendations.push({
      type: 'error',
      message: `Data quality issues found: ${validation.errors.join(', ')}`,
      action: 'Fix data issues before uploading'
    });
  }

  if (validation.warnings.length > 0) {
    recommendations.push({
      type: 'warning',
      message: `Data quality warnings: ${validation.warnings.join(', ')}`,
      action: 'Consider cleaning data for better buyer experience'
    });
  }

  // Extended fields recommendations
  if (extendedFields.length > 0) {
    recommendations.push({
      type: 'success',
      message: `${extendedFields.length} platform-specific fields detected!`,
      action: 'Consider publishing Extended version for 2x higher price'
    });
  }

  return recommendations;
};

export default {
  detectPlatform,
  normalizeHeaders,
  identifyExtendedFields,
  validateRows,
  analyzeSchema
};
