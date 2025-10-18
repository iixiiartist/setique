/**
 * PII Hygiene Service
 * Automated detection and removal of Personally Identifiable Information (PII)
 * Part of: 30-Day MVP Implementation (Week 1 - Foundation)
 * 
 * Features:
 * - 7 PII pattern types (email, phone, SSN, credit card, URL, username, IP address)
 * - Severity levels (critical, high, medium)
 * - Automated removal with configurable replacement
 * - Hygiene report generation (v1.0 format)
 * - CSV processing pipeline
 */

// PII Pattern Definitions with Severity Levels
const PII_PATTERNS = {
  email: {
    pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
    severity: 'critical',
    replacement: '[EMAIL_REMOVED]',
    description: 'Email addresses'
  },
  phone: {
    pattern: /(\+?1[-.\s]?)?(\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?\d{4}\b/g,
    severity: 'critical',
    replacement: '[PHONE_REMOVED]',
    description: 'Phone numbers (US format)'
  },
  ssn: {
    pattern: /\b\d{3}-\d{2}-\d{4}\b/g,
    severity: 'critical',
    replacement: '[SSN_REMOVED]',
    description: 'Social Security Numbers'
  },
  creditCard: {
    pattern: /\b(?:\d{4}[-\s]?){3}\d{4}\b/g,
    severity: 'critical',
    replacement: '[CARD_REMOVED]',
    description: 'Credit card numbers'
  },
  url: {
    pattern: /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)/g,
    severity: 'medium',
    replacement: '[URL_REMOVED]',
    description: 'URLs (may contain tracking IDs)'
  },
  username: {
    pattern: /@[a-zA-Z0-9_]{1,15}\b/g,
    severity: 'high',
    replacement: '[USERNAME_REMOVED]',
    description: 'Social media usernames'
  },
  ipAddress: {
    pattern: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g,
    severity: 'high',
    replacement: '[IP_REMOVED]',
    description: 'IP addresses'
  }
};

/**
 * Scan text for PII patterns
 * @param {string} text - Text to scan
 * @returns {Array} Array of PII matches { type, pattern, match, severity, position }
 */
export const scanForPII = (text) => {
  if (!text || typeof text !== 'string') return [];

  const findings = [];

  Object.entries(PII_PATTERNS).forEach(([type, config]) => {
    const matches = [...text.matchAll(config.pattern)];
    
    matches.forEach(match => {
      findings.push({
        type,
        pattern: config.description,
        match: match[0],
        severity: config.severity,
        position: match.index
      });
    });
  });

  return findings;
};

/**
 * Remove PII from text
 * @param {string} text - Text to clean
 * @param {Array<string>} piiTypes - Which PII types to remove (default: all)
 * @returns {Object} { cleanedText, removedCount, changes }
 */
export const removePII = (text, piiTypes = null) => {
  if (!text || typeof text !== 'string') {
    return { cleanedText: text, removedCount: 0, changes: [] };
  }

  let cleanedText = text;
  let totalRemovedCount = 0;
  const changes = [];

  // Determine which patterns to apply
  const typesToRemove = piiTypes || Object.keys(PII_PATTERNS);

  typesToRemove.forEach(type => {
    const config = PII_PATTERNS[type];
    if (!config) return;

    const matches = [...cleanedText.matchAll(config.pattern)];
    
    if (matches.length > 0) {
      cleanedText = cleanedText.replace(config.pattern, config.replacement);
      totalRemovedCount += matches.length;
      
      changes.push({
        type,
        count: matches.length,
        severity: config.severity,
        pattern: config.description
      });
    }
  });

  return {
    cleanedText,
    removedCount: totalRemovedCount,
    changes
  };
};

/**
 * Process entire CSV row object
 * @param {Object} row - CSV row object
 * @param {Array<string>} fieldsToCheck - Which fields to check (default: all)
 * @returns {Object} { cleanedRow, piiFound, report }
 */
export const cleanRow = (row, fieldsToCheck = null) => {
  const cleanedRow = { ...row };
  const piiFound = [];
  const fieldReports = {};

  const fields = fieldsToCheck || Object.keys(row);

  fields.forEach(field => {
    const originalValue = row[field];
    if (!originalValue) return;

    const valueStr = originalValue.toString();
    const findings = scanForPII(valueStr);

    if (findings.length > 0) {
      const { cleanedText, removedCount, changes } = removePII(valueStr);
      cleanedRow[field] = cleanedText;
      
      piiFound.push(...findings.map(f => ({ ...f, field })));
      fieldReports[field] = {
        originalValue: valueStr,
        cleanedValue: cleanedText,
        piiRemoved: removedCount,
        changes
      };
    }
  });

  return {
    cleanedRow,
    piiFound,
    fieldReports,
    hasPII: piiFound.length > 0
  };
};

/**
 * Process entire CSV dataset
 * @param {Array<Object>} rows - All CSV rows
 * @param {Object} options - Processing options
 * @returns {Object} Complete hygiene report
 */
export const processDataset = (rows, options = {}) => {
  const {
    fieldsToCheck = null,
    removeUsernames = true,
    removeUrls = true,
    strictMode = false // If true, removes medium severity items too
  } = options;

  const cleanedRows = [];
  const allPIIFound = [];
  const rowReports = [];
  let affectedRowCount = 0;

  // Determine which PII types to remove based on options
  let piiTypesToRemove = ['email', 'phone', 'ssn', 'creditCard', 'ipAddress'];
  if (removeUsernames) piiTypesToRemove.push('username');
  if (removeUrls || strictMode) piiTypesToRemove.push('url');

  rows.forEach((row, index) => {
    const { cleanedRow, piiFound, fieldReports, hasPII } = cleanRow(row, fieldsToCheck);
    
    cleanedRows.push(cleanedRow);
    
    if (hasPII) {
      affectedRowCount++;
      allPIIFound.push(...piiFound);
      rowReports.push({
        rowIndex: index,
        piiCount: piiFound.length,
        fields: Object.keys(fieldReports),
        details: fieldReports
      });
    }
  });

  // Generate summary statistics
  const piiByType = {};
  const piiByField = {};
  const piiByDeverity = { critical: 0, high: 0, medium: 0 };

  allPIIFound.forEach(item => {
    // Count by type
    piiByType[item.type] = (piiByType[item.type] || 0) + 1;
    
    // Count by field
    piiByField[item.field] = (piiByField[item.field] || 0) + 1;
    
    // Count by severity
    piiByDeverity[item.severity] = (piiByDeverity[item.severity] || 0) + 1;
  });

  // Calculate pass/fail
  const criticalIssues = piiByDeverity.critical;
  const passed = criticalIssues === 0;

  return {
    version: 'v1.0',
    timestamp: new Date().toISOString(),
    passed,
    summary: {
      totalRows: rows.length,
      affectedRows: affectedRowCount,
      affectedPercentage: parseFloat(((affectedRowCount / rows.length) * 100).toFixed(2)),
      totalPIIFound: allPIIFound.length,
      criticalIssues,
      highSeverityIssues: piiByDeverity.high,
      mediumSeverityIssues: piiByDeverity.medium
    },
    piiByType,
    piiByField,
    piiByDeverity,
    options: {
      strictMode,
      removeUsernames,
      removeUrls,
      fieldsChecked: fieldsToCheck || 'all'
    },
    rowReports: rowReports.slice(0, 10), // First 10 affected rows for review
    cleanedData: cleanedRows,
    recommendations: generateHygieneRecommendations(piiByType, piiByDeverity, affectedRowCount, rows.length)
  };
};

/**
 * Generate hygiene recommendations based on findings
 */
const generateHygieneRecommendations = (piiByType, piiByDeverity, affectedRows, totalRows) => {
  const recommendations = [];

  // Critical issues
  if (piiByDeverity.critical > 0) {
    recommendations.push({
      type: 'critical',
      message: `${piiByDeverity.critical} critical PII items found (emails, phones, SSNs, credit cards)`,
      action: 'All critical PII has been automatically removed. Review cleaned dataset before publishing.'
    });
  }

  // High severity issues
  if (piiByDeverity.high > 0) {
    recommendations.push({
      type: 'warning',
      message: `${piiByDeverity.high} high-severity items found (usernames, IP addresses)`,
      action: 'Consider if these identifiers are necessary for your dataset value proposition.'
    });
  }

  // High affected row percentage
  if (affectedRows / totalRows > 0.5) {
    recommendations.push({
      type: 'warning',
      message: `${((affectedRows / totalRows) * 100).toFixed(0)}% of rows contained PII`,
      action: 'Review your export settings - you may be exporting more personal data than needed.'
    });
  }

  // Passed hygiene
  if (piiByDeverity.critical === 0) {
    recommendations.push({
      type: 'success',
      message: 'Dataset passed hygiene verification ✓',
      action: 'Ready for marketplace publication!'
    });
  }

  // Specific type recommendations
  if (piiByType.email && piiByType.email > 10) {
    recommendations.push({
      type: 'info',
      message: `${piiByType.email} email addresses removed`,
      action: 'If you meant to include contact data, consider creating a separate contact-focused dataset.'
    });
  }

  if (piiByType.username && piiByType.username > 50) {
    recommendations.push({
      type: 'info',
      message: `${piiByType.username} social usernames removed`,
      action: 'Usernames were removed to protect privacy. Aggregate metrics remain intact.'
    });
  }

  return recommendations;
};

/**
 * Compare original vs cleaned dataset statistics
 * @param {Array<Object>} originalRows
 * @param {Array<Object>} cleanedRows
 * @returns {Object} Comparison report
 */
export const compareDatasets = (originalRows, cleanedRows) => {
  const originalSize = JSON.stringify(originalRows).length;
  const cleanedSize = JSON.stringify(cleanedRows).length;
  const sizeDiff = originalSize - cleanedSize;
  const sizeReduction = ((sizeDiff / originalSize) * 100).toFixed(2);

  return {
    originalRows: originalRows.length,
    cleanedRows: cleanedRows.length,
    originalSize: `${(originalSize / 1024).toFixed(2)} KB`,
    cleanedSize: `${(cleanedSize / 1024).toFixed(2)} KB`,
    sizeReduction: `${sizeReduction}%`,
    rowsRemoved: originalRows.length - cleanedRows.length,
    dataIntegrityMaintained: originalRows.length === cleanedRows.length
  };
};

/**
 * Export hygiene report as JSON
 * @param {Object} report - Hygiene report object
 * @returns {string} JSON string
 */
export const exportReport = (report) => {
  return JSON.stringify(report, null, 2);
};

/**
 * Generate human-readable hygiene summary
 * @param {Object} report - Hygiene report
 * @returns {string} Markdown-formatted summary
 */
export const generateSummary = (report) => {
  const { summary, piiByType, recommendations } = report;
  
  let markdown = `# PII Hygiene Report (${report.version})\n\n`;
  markdown += `**Timestamp**: ${new Date(report.timestamp).toLocaleString()}\n`;
  markdown += `**Status**: ${report.passed ? '✓ PASSED' : '✗ FAILED'}\n\n`;
  
  markdown += `## Summary\n`;
  markdown += `- Total Rows: ${summary.totalRows}\n`;
  markdown += `- Affected Rows: ${summary.affectedRows} (${summary.affectedPercentage}%)\n`;
  markdown += `- Total PII Found: ${summary.totalPIIFound}\n`;
  markdown += `- Critical Issues: ${summary.criticalIssues}\n`;
  markdown += `- High Severity: ${summary.highSeverityIssues}\n`;
  markdown += `- Medium Severity: ${summary.mediumSeverityIssues}\n\n`;
  
  if (Object.keys(piiByType).length > 0) {
    markdown += `## PII Found by Type\n`;
    Object.entries(piiByType).forEach(([type, count]) => {
      markdown += `- ${type}: ${count}\n`;
    });
    markdown += `\n`;
  }
  
  if (recommendations.length > 0) {
    markdown += `## Recommendations\n`;
    recommendations.forEach(rec => {
      markdown += `### ${rec.type.toUpperCase()}\n`;
      markdown += `${rec.message}\n\n`;
      markdown += `**Action**: ${rec.action}\n\n`;
    });
  }
  
  return markdown;
};

export default {
  scanForPII,
  removePII,
  cleanRow,
  processDataset,
  compareDatasets,
  exportReport,
  generateSummary,
  PII_PATTERNS
};
