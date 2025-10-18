import { DollarSign, TrendingUp, Info, Sparkles } from 'lucide-react';

/**
 * PricingSuggestionCard Component
 * 
 * Displays AI-calculated pricing suggestions with confidence score and 5-factor breakdown.
 * Shows comparison between standard and extended version pricing.
 * 
 * @component
 * @param {Object} props
 * @param {Object} props.pricing - Pricing result from pricingService
 * @param {boolean} props.isLoading - Loading state while calculation is running
 * @param {Error} props.error - Error object if calculation failed
 * @param {Function} props.onAcceptPrice - Callback when user accepts suggested price
 */
const PricingSuggestionCard = ({ pricing, isLoading, error, onAcceptPrice }) => {
  // Loading state
  if (isLoading) {
    return (
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-6 border border-green-200 animate-pulse">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-6 h-6 bg-green-300 rounded"></div>
          <div className="h-6 bg-green-300 rounded w-48"></div>
        </div>
        <div className="h-12 bg-green-300 rounded w-32 mb-4"></div>
        <div className="space-y-2">
          <div className="h-4 bg-green-300 rounded w-full"></div>
          <div className="h-4 bg-green-300 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-red-50 rounded-lg p-6 border border-red-200">
        <div className="flex items-start gap-3">
          <DollarSign className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-red-900 mb-1">Pricing Calculation Failed</h3>
            <p className="text-sm text-red-700">{error.message}</p>
            <p className="text-xs text-red-600 mt-2">You can still set a manual price.</p>
          </div>
        </div>
      </div>
    );
  }

  // No pricing yet
  if (!pricing) {
    return null;
  }

  const { suggestedPrice, confidence, factors, reasoning, priceRange, marketComparables } = pricing;

  // Confidence level styling
  const getConfidenceColor = (score) => {
    if (score >= 0.8) return { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-300' };
    if (score >= 0.6) return { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-300' };
    return { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-300' };
  };

  const confidenceStyle = getConfidenceColor(confidence);

  // Format factor multiplier
  const formatMultiplier = (value) => {
    if (value > 1) return `+${Math.round((value - 1) * 100)}%`;
    if (value < 1) return `-${Math.round((1 - value) * 100)}%`;
    return '0%';
  };

  return (
    <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border-2 border-green-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            <h3 className="font-semibold">AI Pricing Suggestion</h3>
          </div>
          <span className={`px-2 py-1 rounded text-xs font-medium ${confidenceStyle.bg} ${confidenceStyle.text}`}>
            {Math.round(confidence * 100)}% Confidence
          </span>
        </div>
        
        {/* Suggested Price */}
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-bold">${suggestedPrice.toFixed(2)}</span>
          {priceRange && (
            <span className="text-sm text-green-100">
              Range: ${priceRange.min}-${priceRange.max}
            </span>
          )}
        </div>
      </div>

      {/* Pricing Factors Breakdown */}
      <div className="p-4 space-y-3">
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp className="w-4 h-4 text-gray-600" />
          <h4 className="font-medium text-gray-900 text-sm">Pricing Factors</h4>
        </div>

        <div className="space-y-2">
          {/* Base Price */}
          <div className="flex items-center justify-between text-sm bg-white p-2 rounded border border-gray-200">
            <span className="text-gray-700">Base Price (Row Count)</span>
            <span className="font-semibold text-gray-900">${factors.basePrice}</span>
          </div>

          {/* Date Range Multiplier */}
          <div className="flex items-center justify-between text-sm bg-white p-2 rounded border border-gray-200">
            <div className="flex items-center gap-1">
              <span className="text-gray-700">Data Recency</span>
              <Info className="w-3 h-3 text-gray-400" title="More recent data commands higher prices" />
            </div>
            <span className={`font-semibold ${factors.dateMultiplier >= 1 ? 'text-green-700' : 'text-orange-700'}`}>
              {formatMultiplier(factors.dateMultiplier)}
            </span>
          </div>

          {/* Platform Multiplier */}
          <div className="flex items-center justify-between text-sm bg-white p-2 rounded border border-gray-200">
            <div className="flex items-center gap-1">
              <span className="text-gray-700">Platform Value</span>
              <Info className="w-3 h-3 text-gray-400" title="Some platforms have higher market demand" />
            </div>
            <span className={`font-semibold ${factors.platformMultiplier >= 1 ? 'text-green-700' : 'text-orange-700'}`}>
              {formatMultiplier(factors.platformMultiplier)}
            </span>
          </div>

          {/* Extended Fields Multiplier */}
          {factors.extendedFieldsMultiplier > 1 && (
            <div className="flex items-center justify-between text-sm bg-purple-50 p-2 rounded border border-purple-200">
              <div className="flex items-center gap-1">
                <span className="text-purple-700 font-medium">Extended Fields Bonus</span>
                <Info className="w-3 h-3 text-purple-400" title="Platform-specific fields add significant value" />
              </div>
              <span className="font-semibold text-purple-700">
                {formatMultiplier(factors.extendedFieldsMultiplier)}
              </span>
            </div>
          )}

          {/* Curation Multiplier */}
          {factors.curationMultiplier > 1 && (
            <div className="flex items-center justify-between text-sm bg-blue-50 p-2 rounded border border-blue-200">
              <div className="flex items-center gap-1">
                <span className="text-blue-700 font-medium">Curation Bonus</span>
                <Info className="w-3 h-3 text-blue-400" title="Curated datasets get premium pricing" />
              </div>
              <span className="font-semibold text-blue-700">
                {formatMultiplier(factors.curationMultiplier)}
              </span>
            </div>
          )}

          {/* Engagement Multiplier */}
          {factors.engagementMultiplier !== undefined && factors.engagementMultiplier !== 1 && (
            <div className="flex items-center justify-between text-sm bg-white p-2 rounded border border-gray-200">
              <span className="text-gray-700">Engagement Quality</span>
              <span className={`font-semibold ${factors.engagementMultiplier >= 1 ? 'text-green-700' : 'text-orange-700'}`}>
                {formatMultiplier(factors.engagementMultiplier)}
              </span>
            </div>
          )}
        </div>

        {/* AI Reasoning */}
        {reasoning && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-xs text-blue-900 leading-relaxed">
              <span className="font-semibold">💡 AI Insight:</span> {reasoning}
            </p>
          </div>
        )}

        {/* Market Comparables */}
        {marketComparables && (
          <div className="mt-3 p-3 bg-gray-100 rounded-lg">
            <p className="text-xs text-gray-700">
              📊 Similar datasets on Setique sell for <span className="font-semibold">${marketComparables.avgPrice}</span> on average
            </p>
          </div>
        )}

        {/* Accept Button */}
        {onAcceptPrice && (
          <button
            onClick={() => onAcceptPrice(suggestedPrice)}
            className="w-full mt-4 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <DollarSign className="w-4 h-4" />
            Accept ${suggestedPrice.toFixed(2)}
          </button>
        )}
      </div>
    </div>
  );
};

export default PricingSuggestionCard;
