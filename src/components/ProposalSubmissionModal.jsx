import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { X, Clock, DollarSign } from './Icons';

export default function ProposalSubmissionModal({ isOpen, onClose, request, curatorProfile, userProfile, onSuccess }) {
  const [submitting, setSubmitting] = useState(false);
  
  const [proposalText, setProposalText] = useState('');
  const [estimatedDays, setEstimatedDays] = useState('');
  const [suggestedPrice, setSuggestedPrice] = useState('');

  // Tier hierarchy for validation
  const tierHierarchy = {
    newcomer: 0,
    verified: 1,
    expert: 2,
    master: 3
  };

  const tierDisplayNames = {
    newcomer: 'Newcomer',
    verified: 'Verified',
    expert: 'Expert',
    master: 'Master'
  };

  const tierBadgeInfo = {
    newcomer: { label: 'Open to All', badge: '🌟', color: 'bg-gray-100 text-gray-800 border-gray-600' },
    verified: { label: 'Verified+', badge: '✓', color: 'bg-blue-100 text-blue-800 border-blue-600' },
    expert: { label: 'Expert+', badge: '✓✓', color: 'bg-purple-100 text-purple-800 border-purple-600' },
    master: { label: 'Master Only', badge: '⭐', color: 'bg-yellow-100 text-yellow-800 border-yellow-600' }
  };

  if (!isOpen || !request) return null;

  // Map trust_level integer to tier string
  const trustLevelMap = ['newcomer', 'verified', 'expert', 'master'];
  const userTierString = trustLevelMap[userProfile?.trust_level || 0];
  
  // Check if user meets tier requirement
  const requiredTier = request.minimum_curator_tier || 'newcomer';
  const meetsTierRequirement = tierHierarchy[userTierString] >= tierHierarchy[requiredTier];
  const tierInfo = tierBadgeInfo[requiredTier];

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!proposalText || !estimatedDays || !suggestedPrice) {
      alert('Please fill in all fields');
      return;
    }

    if (!curatorProfile || curatorProfile.certification_status !== 'approved') {
      alert('⚠️ You must be an approved Pro Curator to submit proposals.\n\nBounties can only be fulfilled by certified Pro Curators who have completed the verification process.\n\nVisit the Pro Curator section to apply!');
      return;
    }

    // Check tier requirements using trust_level
    const requiredTier = request.minimum_curator_tier || 'newcomer';
    const trustLevelMap = ['newcomer', 'verified', 'expert', 'master'];
    const userTierString = trustLevelMap[userProfile?.trust_level || 0];
    
    if (tierHierarchy[userTierString] < tierHierarchy[requiredTier]) {
      alert(`⚠️ Tier Requirement Not Met\n\nThis bounty requires ${tierDisplayNames[requiredTier]}+ trust level.\n\nYour current trust level: ${tierDisplayNames[userTierString]}\n\n💡 Rank up by:\n• Uploading quality datasets\n• Getting positive feedback\n• Completing more transactions\n\nHigher trust levels unlock access to premium bounties with better rewards!`);
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('curator_proposals')
        .insert([{
          request_id: request.id,
          curator_id: curatorProfile.id,
          proposal_text: proposalText,
          estimated_completion_days: parseInt(estimatedDays),
          suggested_price: parseFloat(suggestedPrice),
          status: 'pending'
        }]);

      if (error) throw error;

      alert('✅ Proposal submitted successfully!');
      resetForm();
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error submitting proposal:', error);
      alert(`Failed to submit proposal: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setProposalText('');
    setEstimatedDays('');
    setSuggestedPrice('');
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white border-4 border-black rounded-3xl shadow-[16px_16px_0_#000] max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-purple-300 to-pink-300 border-b-4 border-black p-6 flex justify-between items-start">
          <div className="flex-1">
            <h2 className="text-3xl font-extrabold text-black mb-2">Submit Proposal</h2>
            <p className="text-sm font-semibold text-black/70">
              {request.title}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-black/10 rounded-full transition"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Tier Requirement Warning */}
          {!meetsTierRequirement && (
            <div className="bg-yellow-50 border-2 border-yellow-600 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <span className="text-2xl">⚠️</span>
                <div>
                  <h3 className="font-extrabold text-yellow-900 mb-1">Tier Requirement Not Met</h3>
                  <p className="text-sm text-yellow-800 mb-2">
                    This bounty requires <span className="font-bold">{tierDisplayNames[requiredTier]}+</span> trust level.
                  </p>
                  <p className="text-sm text-yellow-800">
                    Your current trust level: <span className="font-bold">{tierDisplayNames[userTierString]}</span>
                  </p>
                  <p className="text-xs text-yellow-700 mt-2 font-semibold">
                    💡 Upload quality datasets and earn positive feedback to rank up and unlock premium bounties!
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Request Details */}
          <div className="bg-gray-50 border-2 border-black rounded-xl p-4">
            <h3 className="font-extrabold mb-2">Request Details</h3>
            <p className="text-sm text-black/70 mb-3">{request.description}</p>
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1 bg-white border-2 border-black rounded-full text-xs font-bold">
                {request.target_quality.toUpperCase()}
              </span>
              {(request.budget_min || request.budget_max) && (
                <span className="px-3 py-1 bg-white border-2 border-black rounded-full text-xs font-bold">
                  Budget: ${request.budget_min || '0'} - ${request.budget_max || '∞'}
                </span>
              )}
              <span className={`px-3 py-1 border-2 rounded-full text-xs font-bold ${tierInfo.color}`}>
                {tierInfo.badge} {tierInfo.label}
              </span>
            </div>
          </div>

          {/* Proposal Text */}
          <div>
            <label className="block text-sm font-extrabold text-black mb-2">
              Your Proposal *
            </label>
            <p className="text-xs text-black/60 mb-2">
              Explain your approach, relevant experience, and why you&apos;re the best fit for this project
            </p>
            <textarea
              value={proposalText}
              onChange={(e) => setProposalText(e.target.value)}
              rows={8}
              className="w-full px-4 py-3 border-2 border-black rounded-lg font-semibold focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="I have extensive experience with similar projects... My approach would be to... I can deliver high-quality results because..."
              required
            />
          </div>

          {/* Timeline */}
          <div>
            <label className="block text-sm font-extrabold text-black mb-2">
              Estimated Timeline *
            </label>
            <div className="relative">
              <Clock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="number"
                value={estimatedDays}
                onChange={(e) => setEstimatedDays(e.target.value)}
                min="1"
                className="w-full pl-12 pr-4 py-3 border-2 border-black rounded-lg font-semibold focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Number of days to complete"
                required
              />
            </div>
            <p className="text-xs text-black/60 mt-1">
              How many days will it take you to complete this curation project?
            </p>
          </div>

          {/* Suggested Price */}
          <div>
            <label className="block text-sm font-extrabold text-black mb-2">
              Suggested Dataset Price *
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="number"
                value={suggestedPrice}
                onChange={(e) => setSuggestedPrice(e.target.value)}
                min="0"
                step="0.01"
                className="w-full pl-12 pr-4 py-3 border-2 border-black rounded-lg font-semibold focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="0.00"
                required
              />
            </div>
            <p className="text-xs text-black/60 mt-1">
              What price do you recommend for the final curated dataset? (You&apos;ll earn 50% of this from each sale)
            </p>
          </div>

          {/* Revenue Split Info */}
          <div className="bg-gradient-to-r from-green-50 to-blue-50 border-2 border-black rounded-xl p-4">
            <h4 className="font-extrabold mb-2">💰 Revenue Split</h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-black/70">Data Owner (40% of total)</span>
                <span className="font-bold">${suggestedPrice ? (parseFloat(suggestedPrice) * 0.4).toFixed(2) : '0.00'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-black/70">You as Curator (40% of total)</span>
                <span className="font-bold text-green-700">${suggestedPrice ? (parseFloat(suggestedPrice) * 0.4).toFixed(2) : '0.00'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-black/70">Platform Fee (20% of total)</span>
                <span className="font-bold">${suggestedPrice ? (parseFloat(suggestedPrice) * 0.2).toFixed(2) : '0.00'}</span>
              </div>
              <div className="border-t-2 border-black/20 mt-2 pt-2 flex justify-between">
                <span className="font-extrabold">Total Dataset Price</span>
                <span className="font-extrabold">${suggestedPrice ? parseFloat(suggestedPrice).toFixed(2) : '0.00'}</span>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-gray-200 text-black font-extrabold rounded-full border-2 border-black hover:bg-gray-300 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !meetsTierRequirement}
              className="flex-1 bg-[linear-gradient(90deg,#ff00c3,#00ffff)] text-white font-extrabold px-6 py-3 rounded-full border-2 border-black hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
              title={!meetsTierRequirement ? `Requires ${tierDisplayNames[requiredTier]}+ curator status` : ''}
            >
              {submitting ? 'Submitting...' : !meetsTierRequirement ? '🔒 Tier Requirement Not Met' : '🚀 Submit Proposal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
