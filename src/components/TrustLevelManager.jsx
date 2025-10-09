import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export default function TrustLevelManager({ userId, currentLevel, onUpdate }) {
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [approvedCount, setApprovedCount] = useState(0);

  const fetchHistory = useCallback(async () => {
    const { data } = await supabase
      .from('trust_level_history')
      .select(`
        *,
        changed_by_profile:profiles!trust_level_history_changed_by_fkey(username, display_name)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);

    setHistory(data || []);
  }, [userId]);

  const fetchApprovedCount = useCallback(async () => {
    const { count } = await supabase
      .from('datasets')
      .select('id', { count: 'exact', head: true })
      .eq('creator_id', userId)
      .eq('moderation_status', 'approved')
      .eq('is_published', true);

    setApprovedCount(count || 0);
  }, [userId]);

  useEffect(() => {
    if (showHistory) {
      fetchHistory();
    }
    fetchApprovedCount();
  }, [showHistory, userId, fetchHistory, fetchApprovedCount]);

  async function handleSetTrustLevel(newLevel, reason) {
    try {
      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      
      // Use the admin function
      const { error } = await supabase.rpc('admin_set_trust_level', {
        target_user_id: userId,
        new_level: newLevel,
        admin_id: user.id,
        change_reason: reason
      });

      if (error) throw error;

      alert(`Trust level updated to ${newLevel}!`);
      onUpdate();
    } catch (error) {
      console.error('Error updating trust level:', error);
      alert('Failed to update trust level');
    } finally {
      setLoading(false);
    }
  }

  const levelNames = {
    0: 'New User',
    1: 'Verified',
    2: 'Trusted',
    3: 'Moderator'
  };

  const levelColors = {
    0: 'bg-gray-100 text-gray-800',
    1: 'bg-blue-100 text-blue-800',
    2: 'bg-green-100 text-green-800',
    3: 'bg-purple-100 text-purple-800'
  };

  const getProgressToNext = () => {
    if (currentLevel === 0) {
      return { next: 1, needed: 3 - approvedCount, nextName: 'Verified' };
    } else if (currentLevel === 1) {
      return { next: 2, needed: 10 - approvedCount, nextName: 'Trusted' };
    }
    return null;
  };

  const progress = getProgressToNext();

  return (
    <div className="border-2 border-purple-500 rounded-lg p-4 bg-purple-50">
      <h4 className="font-bold mb-3 text-lg">Trust Level Management</h4>

      {/* Current Level Display */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-sm font-bold text-gray-600">Current Level:</span>
          <span className={`px-3 py-1 rounded-full font-bold text-sm border-2 border-black ${levelColors[currentLevel]}`}>
            Level {currentLevel} - {levelNames[currentLevel]}
          </span>
        </div>
        
        {/* Stats */}
        <div className="bg-white border-2 border-black rounded p-3 mb-3">
          <div className="text-sm">
            <div className="font-bold mb-1">📊 Statistics:</div>
            <div>Approved Datasets: <span className="font-bold">{approvedCount}</span></div>
            
            {progress && progress.needed > 0 && (
              <div className="mt-2 text-green-600">
                <div className="font-bold">Next Level: {progress.nextName}</div>
                <div className="text-sm">Need {progress.needed} more approved datasets</div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                  <div 
                    className="bg-green-500 h-2 rounded-full transition-all"
                    style={{ width: `${Math.min(100, (approvedCount / (currentLevel === 0 ? 3 : 10)) * 100)}%` }}
                  />
                </div>
              </div>
            )}
            
            {progress && progress.needed <= 0 && currentLevel < 2 && (
              <div className="mt-2 text-orange-600 font-bold">
                ⚠️ Eligible for auto-upgrade! Will upgrade on next dataset approval.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Manual Level Controls */}
      <div className="mb-3">
        <div className="text-sm font-bold text-gray-600 mb-2">Manual Override:</div>
        <div className="flex gap-2 flex-wrap">
          {[0, 1, 2, 3].map((level) => (
            <button
              key={level}
              onClick={() => {
                const reason = prompt(`Set trust level to ${level} (${levelNames[level]}). Reason:`);
                if (reason) handleSetTrustLevel(level, reason);
              }}
              disabled={loading || currentLevel === level}
              className={`px-3 py-2 rounded border-2 border-black font-bold text-sm transition ${
                currentLevel === level
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-white hover:bg-gray-100'
              }`}
            >
              Set Level {level}
            </button>
          ))}
        </div>
      </div>

      {/* History Toggle */}
      <button
        onClick={() => setShowHistory(!showHistory)}
        className="text-sm font-bold text-purple-600 hover:text-purple-800 underline"
      >
        {showHistory ? '▼ Hide History' : '▶ View History'}
      </button>

      {/* History Display */}
      {showHistory && (
        <div className="mt-3 bg-white border-2 border-black rounded p-3 max-h-60 overflow-y-auto">
          <div className="text-sm font-bold mb-2">Trust Level History:</div>
          {history.length === 0 ? (
            <p className="text-gray-500 text-sm">No history available</p>
          ) : (
            <div className="space-y-2">
              {history.map((entry) => (
                <div key={entry.id} className="border-b border-gray-200 pb-2 last:border-0">
                  <div className="flex items-center gap-2 text-xs">
                    <span className={`px-2 py-1 rounded ${levelColors[entry.previous_level]}`}>
                      L{entry.previous_level}
                    </span>
                    <span>→</span>
                    <span className={`px-2 py-1 rounded ${levelColors[entry.new_level]}`}>
                      L{entry.new_level}
                    </span>
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    {entry.reason}
                  </div>
                  <div className="text-xs text-gray-500">
                    {entry.changed_by_profile ? 
                      `By ${entry.changed_by_profile.display_name || entry.changed_by_profile.username}` : 
                      'Automatic'
                    } • {new Date(entry.created_at).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Level Descriptions */}
      <div className="mt-3 text-xs text-gray-600 bg-white border border-gray-300 rounded p-2">
        <div className="font-bold mb-1">Level Descriptions:</div>
        <div><strong>0 - New:</strong> First uploads need review</div>
        <div><strong>1 - Verified:</strong> Auto-approve uploads (3+ approved)</div>
        <div><strong>2 - Trusted:</strong> Skip all checks (10+ approved)</div>
        <div><strong>3 - Moderator:</strong> Full moderation access</div>
      </div>
    </div>
  );
}
