import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export default function CurationRequestBoard() {
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState([]);
  const [filter, setFilter] = useState('all'); // all, open, in_progress
  const [selectedSpecialty, setSelectedSpecialty] = useState('all');

  const specialtyOptions = [
    'all',
    'handwritten_text',
    'audio_transcription',
    'video_annotation',
    'image_labeling',
    'text_classification',
    'sensor_data',
    'financial_data',
    'medical_imaging'
  ];

  const qualityLabels = {
    basic: { label: 'Basic', color: 'bg-gray-100 text-gray-800' },
    standard: { label: 'Standard', color: 'bg-blue-100 text-blue-800' },
    premium: { label: 'Premium', color: 'bg-purple-100 text-purple-800' }
  };

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('curation_requests')
        .select(`
          *,
          profiles:creator_id (username, full_name),
          curator_proposals(count)
        `)
        .order('created_at', { ascending: false });

      // Apply status filter
      if (filter !== 'all') {
        query = query.eq('status', filter);
      } else {
        query = query.in('status', ['open', 'in_progress']);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Apply specialty filter on client side
      let filteredData = data || [];
      if (selectedSpecialty !== 'all') {
        filteredData = filteredData.filter(req => 
          req.specialties_needed?.includes(selectedSpecialty)
        );
      }

      setRequests(filteredData);
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setLoading(false);
    }
  }, [filter, selectedSpecialty]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const getTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);

    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-3xl font-extrabold text-black mb-2">Curation Marketplace</h2>
        <p className="text-gray-600 font-semibold">
          Browse curation requests from data owners and submit proposals to earn 50/50 revenue splits
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white border-2 border-black rounded-lg p-4 mb-6">
        <div className="grid md:grid-cols-2 gap-4">
          {/* Status Filter */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Status</label>
            <div className="flex gap-2">
              {['all', 'open', 'in_progress'].map(status => (
                <button
                  key={status}
                  onClick={() => setFilter(status)}
                  className={`px-4 py-2 rounded-lg font-bold text-sm border-2 transition ${
                    filter === status
                      ? 'bg-indigo-600 text-white border-black'
                      : 'bg-white text-black border-gray-300 hover:border-black'
                  }`}
                >
                  {status === 'all' ? 'All' : status.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Specialty Filter */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Specialty</label>
            <select
              value={selectedSpecialty}
              onChange={(e) => setSelectedSpecialty(e.target.value)}
              className="w-full px-4 py-2 border-2 border-black rounded-lg font-semibold focus:ring-2 focus:ring-indigo-500"
            >
              {specialtyOptions.map(specialty => (
                <option key={specialty} value={specialty}>
                  {specialty === 'all' ? 'All Specialties' : specialty.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Request Cards */}
      {requests.length > 0 ? (
        <div className="space-y-4">
          {requests.map(request => (
            <div
              key={request.id}
              className="bg-white border-2 border-black rounded-lg p-6 hover:shadow-[4px_4px_0_#000] transition"
            >
              {/* Header */}
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <h3 className="text-xl font-extrabold text-black mb-1">{request.title}</h3>
                  <p className="text-sm font-semibold text-gray-600">
                    Posted by {request.profiles?.username || 'Anonymous'} • {getTimeAgo(request.created_at)}
                  </p>
                </div>
                <div className="flex gap-2 ml-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${qualityLabels[request.target_quality]?.color || 'bg-gray-100 text-gray-800'}`}>
                    {qualityLabels[request.target_quality]?.label || request.target_quality}
                  </span>
                  {request.status === 'open' && (
                    <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-bold">
                      Open
                    </span>
                  )}
                  {request.status === 'in_progress' && (
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-bold">
                      In Progress
                    </span>
                  )}
                </div>
              </div>

              {/* Description */}
              <p className="text-sm text-gray-700 font-medium mb-4 line-clamp-2">
                {request.description}
              </p>

              {/* Specialties */}
              <div className="flex flex-wrap gap-2 mb-4">
                {request.specialties_needed?.map(specialty => (
                  <span
                    key={specialty}
                    className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-bold"
                  >
                    {specialty.replace(/_/g, ' ')}
                  </span>
                ))}
              </div>

              {/* Footer */}
              <div className="flex justify-between items-center pt-4 border-t-2 border-gray-200">
                <div className="flex gap-4 text-sm font-bold text-gray-600">
                  {request.budget_min && request.budget_max && (
                    <span>💰 ${request.budget_min} - ${request.budget_max}</span>
                  )}
                  {request.curator_proposals?.[0]?.count > 0 && (
                    <span>📝 {request.curator_proposals[0].count} proposals</span>
                  )}
                </div>
                <button
                  className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold border-2 border-black hover:bg-indigo-700 transition"
                  onClick={() => {
                    // TODO: Open proposal modal or details view
                    alert('Proposal submission coming soon!');
                  }}
                >
                  {request.status === 'open' ? 'Submit Proposal' : 'View Details'}
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white border-2 border-black border-dashed rounded-lg p-12 text-center">
          <p className="text-xl font-bold text-gray-600 mb-2">No requests found</p>
          <p className="text-sm text-gray-500 font-medium">
            {filter === 'all' 
              ? 'There are no active curation requests at the moment.'
              : `No ${filter.replace('_', ' ')} requests matching your filters.`}
          </p>
        </div>
      )}
    </div>
  );
}
