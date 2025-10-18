import { Check, Info, Sparkles } from 'lucide-react';

/**
 * VersionSelector Component
 * 
 * Radio button selector for dataset version (standard, extended, both).
 * Shows pricing comparison and extended fields preview.
 * 
 * @component
 * @param {Object} props
 * @param {string} props.selectedVersion - Currently selected version ('standard', 'extended', 'both')
 * @param {Function} props.onVersionChange - Callback when version selection changes
 * @param {Object} props.pricing - Pricing comparison for each version
 * @param {Array} props.extendedFields - List of extended field names
 * @param {boolean} props.disabled - Disable selector (e.g., during upload)
 */
const VersionSelector = ({ 
  selectedVersion = 'standard', 
  onVersionChange, 
  pricing = {}, 
  extendedFields = [],
  disabled = false 
}) => {
  const versions = [
    {
      id: 'standard',
      name: 'Standard Version',
      description: 'USS v1.0 core fields only (7 canonical fields)',
      icon: '📊',
      price: pricing.standard || 0,
      benefits: [
        'Universal compatibility',
        'Clean, normalized data',
        'Fast analysis & insights',
        'Lower file size'
      ]
    },
    {
      id: 'extended',
      name: 'Extended Version',
      description: `Core fields + ${extendedFields.length} platform-specific fields`,
      icon: '🚀',
      price: pricing.extended || 0,
      benefits: [
        'Maximum data depth',
        'Platform-specific insights',
        'Premium pricing potential',
        'Advanced analytics'
      ],
      highlighted: true
    },
    {
      id: 'both',
      name: 'Both Versions',
      description: 'Sell standard and extended as separate datasets',
      icon: '💎',
      price: pricing.both || 0,
      benefits: [
        'Reach more buyers',
        'Maximize revenue',
        'Flexibility for buyers',
        'Best value proposition'
      ],
      recommended: true
    }
  ];

  const handleVersionChange = (versionId) => {
    if (!disabled && onVersionChange) {
      onVersionChange(versionId);
    }
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-gray-900">Choose Dataset Version</h3>
        <div className="flex items-center gap-1 text-xs text-gray-600">
          <Info className="w-3 h-3" />
          <span>Extended fields unlock 2x higher pricing</span>
        </div>
      </div>

      {/* Version Cards */}
      <div className="grid gap-3">
        {versions.map((version) => {
          const isSelected = selectedVersion === version.id;
          const showPrice = version.price > 0;

          return (
            <button
              key={version.id}
              onClick={() => handleVersionChange(version.id)}
              disabled={disabled}
              className={`
                relative w-full text-left p-4 rounded-lg border-2 transition-all
                ${isSelected 
                  ? 'border-blue-600 bg-blue-50 shadow-md' 
                  : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                }
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                ${version.highlighted && !isSelected ? 'border-purple-300 bg-purple-50/30' : ''}
              `}
            >
              {/* Recommended Badge */}
              {version.recommended && (
                <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-yellow-400 to-orange-400 text-white text-xs font-semibold rounded-full">
                  <Sparkles className="w-3 h-3" />
                  RECOMMENDED
                </div>
              )}

              {/* Selection Indicator */}
              <div className="flex items-start gap-3">
                <div className={`
                  w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5
                  ${isSelected 
                    ? 'border-blue-600 bg-blue-600' 
                    : 'border-gray-300 bg-white'
                  }
                `}>
                  {isSelected && <Check className="w-3 h-3 text-white" />}
                </div>

                <div className="flex-1">
                  {/* Header */}
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">{version.icon}</span>
                    <h4 className={`font-semibold ${isSelected ? 'text-blue-900' : 'text-gray-900'}`}>
                      {version.name}
                    </h4>
                    {showPrice && (
                      <span className={`
                        ml-auto px-2 py-0.5 rounded text-sm font-bold
                        ${isSelected ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}
                      `}>
                        ${version.price.toFixed(2)}
                      </span>
                    )}
                  </div>

                  {/* Description */}
                  <p className={`text-xs mb-2 ${isSelected ? 'text-blue-800' : 'text-gray-600'}`}>
                    {version.description}
                  </p>

                  {/* Benefits */}
                  <ul className="space-y-1">
                    {version.benefits.map((benefit, index) => (
                      <li key={index} className={`flex items-center gap-2 text-xs ${isSelected ? 'text-blue-700' : 'text-gray-600'}`}>
                        <span className="text-green-600">✓</span>
                        {benefit}
                      </li>
                    ))}
                  </ul>

                  {/* Extended Fields Preview */}
                  {version.id === 'extended' && extendedFields.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-purple-200">
                      <p className="text-xs text-purple-700 font-medium mb-1">
                        Includes {extendedFields.length} extended fields:
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {extendedFields.slice(0, 6).map((field) => (
                          <span key={field} className="px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded text-xs">
                            {field.replace(/^(tiktok_|youtube_|instagram_|linkedin_|shopify_)/, '')}
                          </span>
                        ))}
                        {extendedFields.length > 6 && (
                          <span className="px-1.5 py-0.5 bg-purple-200 text-purple-800 rounded text-xs font-semibold">
                            +{extendedFields.length - 6} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Helper Text */}
      <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-xs text-gray-700 leading-relaxed">
          <span className="font-semibold">💡 Pro Tip:</span> Most creators choose &quot;Both Versions&quot; to maximize revenue. 
          Standard version attracts quick buyers, while extended version commands premium prices from advanced analysts.
        </p>
      </div>
    </div>
  );
};

export default VersionSelector;
