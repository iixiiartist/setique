import { useState } from 'react';
import { Shield, ShieldCheck, ShieldAlert, AlertTriangle, ChevronDown, ChevronUp, Info } from 'lucide-react';

/**
 * HygieneReport Component
 * 
 * Displays PII hygiene scan results with pass/fail status, issues found,
 * pattern breakdown by severity, and recommendations.
 * 
 * @component
 * @param {Object} props
 * @param {Object} props.report - Hygiene report from hygieneService
 * @param {boolean} props.isLoading - Loading state while scanning
 * @param {Error} props.error - Error object if scan failed
 */
const HygieneReport = ({ report, isLoading, error }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Loading state
  if (isLoading) {
    return (
      <div className="bg-gray-50 rounded-lg p-6 border border-gray-200 animate-pulse">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-6 h-6 bg-gray-300 rounded-full"></div>
          <div className="h-6 bg-gray-300 rounded w-48"></div>
        </div>
        <div className="space-y-2">
          <div className="h-4 bg-gray-300 rounded w-full"></div>
          <div className="h-4 bg-gray-300 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-red-50 rounded-lg p-6 border border-red-200">
        <div className="flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-red-900 mb-1">Hygiene Scan Failed</h3>
            <p className="text-sm text-red-700">{error.message}</p>
          </div>
        </div>
      </div>
    );
  }

  // No report yet
  if (!report) {
    return null;
  }

  const { passed, issuesFound, patternsSummary, recommendations, version } = report;

  // Severity level styling
  const getSeverityStyle = (severity) => {
    switch (severity) {
      case 'critical':
        return { bg: 'bg-red-100', text: 'text-red-800', icon: '🔴' };
      case 'high':
        return { bg: 'bg-orange-100', text: 'text-orange-800', icon: '🟠' };
      case 'medium':
        return { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: '🟡' };
      case 'low':
        return { bg: 'bg-blue-100', text: 'text-blue-800', icon: '🔵' };
      default:
        return { bg: 'bg-gray-100', text: 'text-gray-800', icon: '⚪' };
    }
  };

  return (
    <div className={`rounded-lg border-2 overflow-hidden ${passed ? 'border-green-200 bg-green-50' : 'border-yellow-200 bg-yellow-50'}`}>
      {/* Header */}
      <div className={`p-4 ${passed ? 'bg-gradient-to-r from-green-100 to-emerald-100' : 'bg-gradient-to-r from-yellow-100 to-orange-100'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {passed ? (
              <ShieldCheck className="w-6 h-6 text-green-700" />
            ) : (
              <Shield className="w-6 h-6 text-yellow-700" />
            )}
            <div>
              <h3 className={`font-semibold ${passed ? 'text-green-900' : 'text-yellow-900'}`}>
                {passed ? '✓ Hygiene Check Passed' : '⚠ PII Issues Detected'}
              </h3>
              <p className={`text-xs ${passed ? 'text-green-700' : 'text-yellow-700'}`}>
                Hygiene Version {version}
              </p>
            </div>
          </div>

          {/* Issues Count Badge */}
          <div className={`px-3 py-1 rounded-full text-sm font-semibold ${passed ? 'bg-green-700 text-white' : 'bg-yellow-700 text-white'}`}>
            {issuesFound === 0 ? 'Clean' : `${issuesFound} Issue${issuesFound !== 1 ? 's' : ''}`}
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="p-4 border-b border-gray-200 bg-white">
        {passed ? (
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-gray-700">
              Your dataset passed all PII hygiene checks. No personally identifiable information (emails, phone numbers, SSNs, credit cards, etc.) was detected.
            </p>
          </div>
        ) : (
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-gray-700">
              We detected <span className="font-semibold">{issuesFound} PII pattern{issuesFound !== 1 ? 's' : ''}</span> in your dataset. 
              These have been automatically removed or anonymized to protect privacy.
            </p>
          </div>
        )}
      </div>

      {/* Pattern Breakdown */}
      {patternsSummary && Object.keys(patternsSummary).length > 0 && (
        <div className="p-4 bg-white border-b border-gray-200">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full flex items-center justify-between text-left mb-2"
          >
            <h4 className="font-medium text-gray-900 text-sm">PII Patterns Detected</h4>
            {isExpanded ? (
              <ChevronUp className="w-4 h-4 text-gray-600" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-600" />
            )}
          </button>

          {isExpanded && (
            <div className="space-y-2 mt-3">
              {Object.entries(patternsSummary).map(([patternType, data]) => {
                const severityStyle = getSeverityStyle(data.severity);
                return (
                  <div key={patternType} className={`p-3 rounded-lg ${severityStyle.bg}`}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span>{severityStyle.icon}</span>
                        <span className={`font-semibold text-sm ${severityStyle.text}`}>
                          {patternType.toUpperCase().replace('_', ' ')}
                        </span>
                      </div>
                      <span className={`text-xs font-medium ${severityStyle.text}`}>
                        {data.count} found
                      </span>
                    </div>
                    <p className={`text-xs ${severityStyle.text.replace('800', '700')}`}>
                      {data.description || `Detected ${data.count} instance${data.count !== 1 ? 's' : ''} of ${patternType}`}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Recommendations */}
      {recommendations && recommendations.length > 0 && (
        <div className="p-4 bg-blue-50">
          <h4 className="font-medium text-gray-900 text-sm mb-2">Recommendations</h4>
          <ul className="space-y-2">
            {recommendations.map((rec, index) => (
              <li key={index} className="flex items-start gap-2 text-xs text-gray-700">
                <span className="text-blue-600 flex-shrink-0">•</span>
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Clean Data Guarantee */}
      {passed && (
        <div className="p-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white">
          <p className="text-sm font-medium flex items-center gap-2">
            <ShieldCheck className="w-4 h-4" />
            Clean Data Guarantee: This dataset is safe to publish and complies with privacy best practices.
          </p>
        </div>
      )}
    </div>
  );
};

export default HygieneReport;
