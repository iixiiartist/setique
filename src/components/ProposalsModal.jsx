import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { X, Star, Clock, DollarSign } from './Icons';

export default function ProposalsModal({ isOpen, onClose, request, onAccept }) {
  const [accepting, setAccepting] = useState(null);
  const [rejecting, setRejecting] = useState(null);

  if (!isOpen || !request) return null;

  const proposals = request.curator_proposals || [];
  const pendingProposals = proposals.filter(p => p.status === 'pending');
  const acceptedProposal = proposals.find(p => p.status === 'accepted');
  const rejectedProposals = proposals.filter(p => p.status === 'rejected');

  const handleAcceptProposal = async (proposal) => {
    if (!confirm(`Accept proposal from ${proposal.pro_curators?.display_name}? This will reject all other proposals and assign them to this request.`)) {
      return;
    }

    setAccepting(proposal.id);
    try {
      // Create partnership
      const { error: partnershipError } = await supabase
        .from('dataset_partnerships')
        .insert([{
          dataset_id: request.dataset_id, // If request has a dataset
          owner_id: request.creator_id,
          curator_id: proposal.curator_id,
          curator_user_id: proposal.pro_curators?.user_id,
          split_percentage: 50,
          status: 'active',
          agreement_terms: `Curation request: ${request.title}`
        }])
        .select()
        .single();

      if (partnershipError) throw partnershipError;

      // Update request status
      const { error: requestError } = await supabase
        .from('curation_requests')
        .update({
          status: 'in_progress',
          assigned_curator_id: proposal.curator_id
        })
        .eq('id', request.id);

      if (requestError) throw requestError;

      // Accept this proposal
      const { error: acceptError } = await supabase
        .from('curator_proposals')
        .update({ status: 'accepted' })
        .eq('id', proposal.id);

      if (acceptError) throw acceptError;

      // Reject all other proposals
      const otherProposalIds = proposals
        .filter(p => p.id !== proposal.id && p.status === 'pending')
        .map(p => p.id);

      if (otherProposalIds.length > 0) {
        const { error: rejectError } = await supabase
          .from('curator_proposals')
          .update({ status: 'rejected' })
          .in('id', otherProposalIds);

        if (rejectError) console.error('Error rejecting other proposals:', rejectError);
      }

      alert('✅ Proposal accepted! Partnership created.');
      onAccept?.();
      onClose();
    } catch (error) {
      console.error('Error accepting proposal:', error);
      alert(`Failed to accept proposal: ${error.message}`);
    } finally {
      setAccepting(null);
    }
  };

  const handleRejectProposal = async (proposalId) => {
    if (!confirm('Reject this proposal? This cannot be undone.')) {
      return;
    }

    setRejecting(proposalId);
    try {
      const { error } = await supabase
        .from('curator_proposals')
        .update({ status: 'rejected' })
        .eq('id', proposalId);

      if (error) throw error;

      alert('Proposal rejected.');
      onAccept?.(); // Refresh data
    } catch (error) {
      console.error('Error rejecting proposal:', error);
      alert(`Failed to reject proposal: ${error.message}`);
    } finally {
      setRejecting(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white border-4 border-black rounded-3xl shadow-[16px_16px_0_#000] max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-cyan-300 to-pink-300 border-b-4 border-black p-6 flex justify-between items-start">
          <div className="flex-1">
            <h2 className="text-3xl font-extrabold text-black mb-2">{request.title}</h2>
            <p className="text-sm font-semibold text-black/70">
              {proposals.length} proposal{proposals.length !== 1 ? 's' : ''} received
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-black/10 rounded-full transition"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
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
                  ${request.budget_min || '0'} - ${request.budget_max || '∞'}
                </span>
              )}
            </div>
          </div>

          {/* Accepted Proposal */}
          {acceptedProposal && (
            <div className="bg-green-50 border-4 border-green-500 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <Star className="h-6 w-6 text-green-600 fill-green-600" />
                <h3 className="text-xl font-extrabold text-green-900">Accepted Proposal</h3>
              </div>
              {renderProposal(acceptedProposal)}
            </div>
          )}

          {/* Pending Proposals */}
          {pendingProposals.length > 0 && (
            <div>
              <h3 className="text-xl font-extrabold mb-4">
                Pending Proposals ({pendingProposals.length})
              </h3>
              <div className="space-y-4">
                {pendingProposals.map(proposal => (
                  <div
                    key={proposal.id}
                    className="bg-white border-2 border-black rounded-xl p-6 hover:shadow-[4px_4px_0_#000] transition"
                  >
                    {renderProposal(proposal)}
                    
                    {/* Action Buttons */}
                    {request.status === 'open' && (
                      <div className="flex gap-2 mt-4">
                        <button
                          onClick={() => handleAcceptProposal(proposal)}
                          disabled={accepting === proposal.id}
                          className="flex-1 bg-[linear-gradient(90deg,#00ff00,#00cc00)] text-white font-extrabold px-6 py-3 rounded-full border-2 border-black hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {accepting === proposal.id ? 'Accepting...' : '✓ Accept Proposal'}
                        </button>
                        <button
                          onClick={() => handleRejectProposal(proposal.id)}
                          disabled={rejecting === proposal.id}
                          className="px-6 py-3 bg-red-500 text-white font-extrabold rounded-full border-2 border-black hover:bg-red-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {rejecting === proposal.id ? 'Rejecting...' : '✗ Reject'}
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Rejected Proposals */}
          {rejectedProposals.length > 0 && (
            <details className="bg-gray-100 border-2 border-black rounded-xl p-4">
              <summary className="font-extrabold cursor-pointer">
                Rejected Proposals ({rejectedProposals.length})
              </summary>
              <div className="space-y-4 mt-4">
                {rejectedProposals.map(proposal => (
                  <div
                    key={proposal.id}
                    className="bg-white border-2 border-gray-300 rounded-xl p-6 opacity-60"
                  >
                    {renderProposal(proposal)}
                  </div>
                ))}
              </div>
            </details>
          )}

          {/* No Proposals */}
          {proposals.length === 0 && (
            <div className="text-center py-12">
              <p className="text-xl font-bold text-black/60 mb-2">
                No proposals yet
              </p>
              <p className="text-sm text-black/50">
                Pro Curators will submit proposals soon. You&apos;ll be notified when they do.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  function renderProposal(proposal) {
    const curator = proposal.pro_curators;
    if (!curator) return null;

    return (
      <>
        {/* Curator Info */}
        <div className="flex items-start gap-4 mb-4">
          <div className="bg-gradient-to-br from-purple-400 to-pink-400 rounded-full w-16 h-16 flex items-center justify-center text-2xl font-extrabold text-white border-2 border-black">
            {curator.display_name?.charAt(0) || '?'}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="text-lg font-extrabold">{curator.display_name}</h4>
              {curator.badge_level && (
                <span className={`px-2 py-1 rounded text-xs font-bold border border-black ${
                  curator.badge_level === 'master' ? 'bg-yellow-100 text-yellow-800' :
                  curator.badge_level === 'expert' ? 'bg-purple-100 text-purple-800' :
                  'bg-blue-100 text-blue-800'
                }`}>
                  {curator.badge_level.toUpperCase()}
                </span>
              )}
            </div>
            <div className="flex items-center gap-4 text-sm text-black/70">
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span className="font-bold">{curator.rating?.toFixed(1) || 'N/A'}</span>
              </div>
              <span>•</span>
              <span className="font-semibold">{curator.total_projects || 0} projects</span>
            </div>
            {curator.specialties && curator.specialties.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {curator.specialties.map((spec, i) => (
                  <span key={i} className="px-2 py-0.5 bg-gray-100 text-xs font-semibold rounded">
                    {spec.replace(/_/g, ' ')}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Proposal Details */}
        <div className="bg-gray-50 border-2 border-black rounded-lg p-4 mb-4">
          <h5 className="font-extrabold mb-2">Proposal</h5>
          <p className="text-sm text-black/80 whitespace-pre-wrap">{proposal.proposal_text}</p>
        </div>

        {/* Timeline & Price */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-3 bg-white border-2 border-black rounded-lg p-3">
            <Clock className="h-8 w-8 text-blue-600" />
            <div>
              <div className="text-sm font-bold text-black/60">Timeline</div>
              <div className="text-lg font-extrabold">
                {proposal.estimated_completion_days || 'TBD'} days
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-white border-2 border-black rounded-lg p-3">
            <DollarSign className="h-8 w-8 text-green-600" />
            <div>
              <div className="text-sm font-bold text-black/60">Suggested Price</div>
              <div className="text-lg font-extrabold">
                ${proposal.suggested_price?.toFixed(2) || 'TBD'}
              </div>
            </div>
          </div>
        </div>

        {/* Submitted Date */}
        <p className="text-xs text-black/50 mt-3">
          Submitted {new Date(proposal.created_at).toLocaleDateString()}
        </p>
      </>
    );
  }
}
