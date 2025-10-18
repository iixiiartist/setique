import { Sparkles, TrendingUp, DollarSign, Shield } from 'lucide-react';

/**
 * SetiqueSeocialExplainer Component
 * 
 * Explains the Setique Social feature to creators during CSV upload.
 * Shows value proposition and how the automated analysis helps them.
 * 
 * @component
 */
const SetiqueSeocialExplainer = () => {
  return (
    <div className="bg-gradient-to-r from-purple-50 via-pink-50 to-blue-50 rounded-lg border-2 border-purple-200 p-5 mb-6">
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
          <Sparkles className="w-6 h-6 text-white" />
        </div>

        {/* Content */}
        <div className="flex-1">
          <h3 className="text-lg font-bold text-gray-900 mb-2">
            🎉 Setique Social: Sell Your Social Media Analytics Data
          </h3>
          
          <p className="text-sm text-gray-700 mb-3">
            Turn your TikTok, Instagram, YouTube, or other platform analytics into income! 
            We automatically analyze your CSV export and help you price it fairly.
          </p>

          {/* Features Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
            {/* Feature 1: Auto-Detection */}
            <div className="flex items-start gap-2">
              <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-purple-600" />
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-900">Auto-Detection</p>
                <p className="text-xs text-gray-600">We identify your platform & fields</p>
              </div>
            </div>

            {/* Feature 2: Pricing Help */}
            <div className="flex items-start gap-2">
              <div className="flex-shrink-0 w-8 h-8 bg-pink-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-4 h-4 text-pink-600" />
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-900">Pricing Guidance</p>
                <p className="text-xs text-gray-600">Suggested price (you decide final)</p>
              </div>
            </div>

            {/* Feature 3: PII Check */}
            <div className="flex items-start gap-2">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <Shield className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-900">Privacy Check</p>
                <p className="text-xs text-gray-600">We scan for personal info</p>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="bg-white border border-purple-200 rounded-lg px-3 py-2">
            <p className="text-xs text-gray-700">
              <strong>📤 Just upload your CSV export</strong> and we&apos;ll handle the rest. 
              Review everything before publishing - you&apos;re always in control!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SetiqueSeocialExplainer;
