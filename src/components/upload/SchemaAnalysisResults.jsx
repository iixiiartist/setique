import { CheckCircle2, AlertCircle, TrendingUp, Database } from 'lucide-react';

/**
 * SchemaAnalysisResults Component
 * 
 * Displays automatic platform detection and schema analysis results during dataset upload.
 * Shows platform badge, confidence score, canonical field mappings, and extended fields.
 * 
 * @component
 * @param {Object} props
 * @param {Object} props.analysis - Schema analysis result from schemaDetectorService
 * @param {boolean} props.isLoading - Loading state while analysis is running
 * @param {Error} props.error - Error object if analysis failed
 */
const SchemaAnalysisResults = ({ analysis, isLoading, error }) => {
  // Loading state
  if (isLoading) {
    return (
      <div className="bg-gray-50 rounded-lg p-6 border border-gray-200 animate-pulse">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-5 h-5 bg-gray-300 rounded"></div>
          <div className="h-6 bg-gray-300 rounded w-48"></div>
        </div>
        <div className="space-y-2">
          <div className="h-4 bg-gray-300 rounded w-full"></div>
          <div className="h-4 bg-gray-300 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-red-50 rounded-lg p-6 border border-red-200">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-red-900 mb-1">Schema Analysis Failed</h3>
            <p className="text-sm text-red-700">{error.message}</p>
          </div>
        </div>
      </div>
    );
  }

  // No analysis yet
  if (!analysis) {
    return null;
  }

  const { platform, confidence, canonicalFields, extendedFields, validation } = analysis;

  // Confidence level styling
  const getConfidenceColor = (score) => {
    if (score >= 0.8) return 'text-green-700 bg-green-100';
    if (score >= 0.6) return 'text-yellow-700 bg-yellow-100';
    return 'text-red-700 bg-red-100';
  };

  // Platform badge styling
  const getPlatformBadge = (platformName) => {
    const badges = {
      tiktok: { color: 'bg-black text-white', emoji: '🎵' },
      youtube: { color: 'bg-red-600 text-white', emoji: '▶️' },
      instagram: { color: 'bg-gradient-to-r from-purple-600 to-pink-600 text-white', emoji: '📷' },
      linkedin: { color: 'bg-blue-700 text-white', emoji: '💼' },
      shopify: { color: 'bg-green-700 text-white', emoji: '🛍️' },
      other: { color: 'bg-gray-600 text-white', emoji: '📊' }
    };
    return badges[platformName] || badges.other;
  };

  const platformBadge = getPlatformBadge(platform);
  const confidenceColor = getConfidenceColor(confidence);

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            <h3 className="font-semibold text-gray-900">Schema Detected</h3>
          </div>
          <span className={`px-2 py-1 rounded text-xs font-medium ${confidenceColor}`}>
            {Math.round(confidence * 100)}% Confidence
          </span>
        </div>

        {/* Platform Badge */}
        <div className="flex items-center gap-2">
          <span className={`px-3 py-1.5 rounded-md text-sm font-semibold ${platformBadge.color} flex items-center gap-2`}>
            <span>{platformBadge.emoji}</span>
            {platform.toUpperCase()}
          </span>
          {extendedFields?.length > 0 && (
            <span className="px-2 py-1 rounded-md text-xs font-medium bg-purple-100 text-purple-700">
              +{extendedFields.length} Extended Fields
            </span>
          )}
        </div>
      </div>

      {/* Canonical Fields Mapping */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center gap-2 mb-3">
          <Database className="w-4 h-4 text-gray-600" />
          <h4 className="font-medium text-gray-900 text-sm">USS v1.0 Core Fields</h4>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(canonicalFields).map(([canonical, detected]) => (
            <div key={canonical} className="flex items-center gap-2 text-xs">
              <span className="text-gray-600">{canonical}:</span>
              <span className="font-mono bg-gray-100 px-2 py-0.5 rounded text-gray-800">
                {detected}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Extended Fields */}
      {extendedFields?.length > 0 && (
        <div className="p-4 border-b border-gray-100 bg-purple-50/30">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-purple-600" />
            <h4 className="font-medium text-gray-900 text-sm">Platform-Specific Fields</h4>
            <span className="text-xs text-gray-600">
              (These unlock higher pricing 💰)
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {extendedFields.map((field) => (
              <span
                key={field}
                className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-medium"
              >
                {field}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Validation Status */}
      {validation && (
        <div className="p-4 bg-gray-50">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Data Quality</span>
            <div className="flex items-center gap-4">
              <span className="text-green-700 font-medium">
                ✓ {validation.validRows || 0} Valid Rows
              </span>
              {validation.errors?.length > 0 && (
                <span className="text-yellow-700 font-medium">
                  ⚠ {validation.errors.length} Warnings
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SchemaAnalysisResults;
