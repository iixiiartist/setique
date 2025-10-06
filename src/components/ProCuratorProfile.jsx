import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export default function ProCuratorProfile() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [curatorProfile, setCuratorProfile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setSaving] = useState(false);
  
  // Form state with localStorage persistence
  const [displayName, setDisplayName] = useState(() => {
    return localStorage.getItem('draft_curator_display_name') || '';
  });
  const [bio, setBio] = useState(() => {
    return localStorage.getItem('draft_curator_bio') || '';
  });
  const [specialties, setSpecialties] = useState(() => {
    const saved = localStorage.getItem('draft_curator_specialties');
    return saved ? JSON.parse(saved) : [];
  });
  const [portfolioSamples, setPortfolioSamples] = useState(() => {
    const saved = localStorage.getItem('draft_curator_portfolio');
    return saved ? JSON.parse(saved) : ['', '', ''];
  });
  
  const specialtyOptions = [
    'handwritten_text',
    'audio_transcription',
    'video_annotation',
    'image_labeling',
    'text_classification',
    'sensor_data',
    'financial_data',
    'medical_imaging'
  ];

  // Auto-save form data to localStorage
  useEffect(() => {
    localStorage.setItem('draft_curator_display_name', displayName);
  }, [displayName]);

  useEffect(() => {
    localStorage.setItem('draft_curator_bio', bio);
  }, [bio]);

  useEffect(() => {
    localStorage.setItem('draft_curator_specialties', JSON.stringify(specialties));
  }, [specialties]);

  useEffect(() => {
    localStorage.setItem('draft_curator_portfolio', JSON.stringify(portfolioSamples));
  }, [portfolioSamples]);

  const badgeColors = {
    verified: 'bg-blue-100 text-blue-800',
    expert: 'bg-purple-100 text-purple-800',
    master: 'bg-yellow-100 text-yellow-800'
  };

  const fetchCuratorProfile = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('pro_curators')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) { // maybeSingle returns null instead of error when no rows
        console.error('Error fetching curator profile:', error);
        // If table doesn't exist (406 error), just skip loading
        if (error.code === 'PGRST106' || error.message?.includes('406')) {
          console.warn('pro_curators table may not exist. Please run the migration.');
        }
      }

      if (data) {
        setCuratorProfile(data);
        // Only update form fields if there's no draft in localStorage
        if (!localStorage.getItem('draft_curator_display_name')) {
          setDisplayName(data.display_name || '');
        }
        if (!localStorage.getItem('draft_curator_bio')) {
          setBio(data.bio || '');
        }
        if (!localStorage.getItem('draft_curator_specialties')) {
          setSpecialties(data.specialties || []);
        }
        if (!localStorage.getItem('draft_curator_portfolio')) {
          setPortfolioSamples(data.portfolio_samples || ['']);
        }
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchCuratorProfile();
    }
  }, [user, fetchCuratorProfile]);

  const handleApplyCertification = async () => {
    if (!displayName || !bio || specialties.length === 0) {
      alert('Please fill in all required fields (name, bio, and at least one specialty)');
      return;
    }

    setSaving(true);
    try {
      const profileData = {
        user_id: user.id,
        display_name: displayName,
        bio: bio,
        specialties: specialties,
        portfolio_samples: portfolioSamples.filter(s => s.trim() !== ''),
        certification_status: 'pending'
      };

      const { data, error } = await supabase
        .from('pro_curators')
        .insert([profileData])
        .select();

      if (error) {
        console.error('Supabase error details:', error);
        throw error;
      }
      
      const createdProfile = data?.[0] || data;

      setCuratorProfile(createdProfile);
      setIsEditing(false);
      
      // Clear localStorage draft after successful submission
      localStorage.removeItem('draft_curator_display_name');
      localStorage.removeItem('draft_curator_bio');
      localStorage.removeItem('draft_curator_specialties');
      localStorage.removeItem('draft_curator_portfolio');
      
      alert('Certification application submitted! We\'ll review your profile and get back to you soon.');
    } catch (error) {
      console.error('Error applying for certification:', error);
      // Show detailed error message
      const errorMessage = error.message || error.hint || 'Unknown error occurred';
      alert(`Failed to submit application: ${errorMessage}\n\nPlease check the console for details.`);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateProfile = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('pro_curators')
        .update({
          display_name: displayName,
          bio: bio,
          specialties: specialties,
          portfolio_samples: portfolioSamples.filter(s => s.trim() !== '')
        })
        .eq('user_id', user.id);

      if (error) throw error;

      await fetchCuratorProfile();
      setIsEditing(false);
      
      // Clear localStorage draft after successful update
      localStorage.removeItem('draft_curator_display_name');
      localStorage.removeItem('draft_curator_bio');
      localStorage.removeItem('draft_curator_specialties');
      localStorage.removeItem('draft_curator_portfolio');
      
      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const toggleSpecialty = (specialty) => {
    setSpecialties(prev => 
      prev.includes(specialty)
        ? prev.filter(s => s !== specialty)
        : [...prev, specialty]
    );
  };

  const addPortfolioSample = () => {
    setPortfolioSamples([...portfolioSamples, '']);
  };

  const updatePortfolioSample = (index, value) => {
    const updated = [...portfolioSamples];
    updated[index] = value;
    setPortfolioSamples(updated);
  };

  const removePortfolioSample = (index) => {
    setPortfolioSamples(portfolioSamples.filter((_, i) => i !== index));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // Not a curator yet - show application form
  if (!curatorProfile) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="mb-6">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Become a Pro Curator</h2>
            <p className="text-gray-600">
              Join our professional curator program and partner with data owners on a 50/50 revenue split.
              Earn money by applying your expertise to clean, annotate, and enhance datasets.
            </p>
          </div>

          <div className="space-y-6">
            {/* Display Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Display Name *
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Your professional name"
              />
            </div>

            {/* Bio */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bio *
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Tell us about your experience with data annotation, curation, and relevant expertise..."
              />
            </div>

            {/* Specialties */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Specialties * (Select at least one)
              </label>
              <div className="grid grid-cols-2 gap-2">
                {specialtyOptions.map(specialty => (
                  <label key={specialty} className="flex items-center space-x-2 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={specialties.includes(specialty)}
                      onChange={() => toggleSpecialty(specialty)}
                      className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                    />
                    <span className="text-sm text-gray-700">{specialty.replace(/_/g, ' ')}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Portfolio Samples */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Portfolio Samples (Optional)
              </label>
              <p className="text-sm text-gray-500 mb-3">Add links to your previous work, datasets, or portfolio</p>
              {portfolioSamples.map((sample, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <input
                    type="url"
                    value={sample}
                    onChange={(e) => updatePortfolioSample(index, e.target.value)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="https://example.com/my-work"
                  />
                  {portfolioSamples.length > 1 && (
                    <button
                      onClick={() => removePortfolioSample(index)}
                      className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
              <button
                onClick={addPortfolioSample}
                className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
              >
                + Add another sample
              </button>
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <button
                onClick={handleApplyCertification}
                disabled={isSaving}
                className="w-full bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? 'Submitting...' : 'Apply for Certification'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Existing curator - show profile
  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-8">
        {/* Header with Badge */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-3xl font-bold text-gray-900">{curatorProfile.display_name}</h2>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase ${badgeColors[curatorProfile.badge_level]}`}>
                {curatorProfile.badge_level}
              </span>
              {curatorProfile.certification_status === 'pending' && (
                <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-semibold">
                  Pending Review
                </span>
              )}
              {curatorProfile.certification_status === 'rejected' && (
                <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-semibold">
                  Rejected
                </span>
              )}
            </div>
            <p className="text-gray-600">{curatorProfile.bio}</p>
          </div>
          
          {curatorProfile.certification_status === 'approved' && !isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="ml-4 px-4 py-2 text-indigo-600 hover:bg-indigo-50 rounded-lg font-medium"
            >
              Edit Profile
            </button>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-gray-900">{curatorProfile.total_projects || 0}</div>
            <div className="text-sm text-gray-600">Projects</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-gray-900">{curatorProfile.rating?.toFixed(1) || 'N/A'}</div>
            <div className="text-sm text-gray-600">Rating</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-gray-900">${curatorProfile.total_earnings?.toFixed(2) || '0.00'}</div>
            <div className="text-sm text-gray-600">Total Earned</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-gray-900">40%</div>
            <div className="text-sm text-gray-600">Revenue Share</div>
          </div>
        </div>

        {isEditing ? (
          // Edit Mode
          <div className="space-y-6 pt-6 border-t">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Display Name</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Specialties</label>
              <div className="grid grid-cols-2 gap-2">
                {specialtyOptions.map(specialty => (
                  <label key={specialty} className="flex items-center space-x-2 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={specialties.includes(specialty)}
                      onChange={() => toggleSpecialty(specialty)}
                      className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                    />
                    <span className="text-sm text-gray-700">{specialty.replace(/_/g, ' ')}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Portfolio Samples</label>
              {portfolioSamples.map((sample, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <input
                    type="url"
                    value={sample}
                    onChange={(e) => updatePortfolioSample(index, e.target.value)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="https://example.com/my-work"
                  />
                  {portfolioSamples.length > 1 && (
                    <button
                      onClick={() => removePortfolioSample(index)}
                      className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
              <button
                onClick={addPortfolioSample}
                className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
              >
                + Add another sample
              </button>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleUpdateProfile}
                disabled={isSaving}
                className="flex-1 bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                onClick={() => {
                  setIsEditing(false);
                  // Reset form to current profile data
                  setDisplayName(curatorProfile.display_name || '');
                  setBio(curatorProfile.bio || '');
                  setSpecialties(curatorProfile.specialties || []);
                  setPortfolioSamples(curatorProfile.portfolio_samples || ['']);
                }}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          // View Mode
          <div className="space-y-6 pt-6 border-t">
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Specialties</h3>
              <div className="flex flex-wrap gap-2">
                {curatorProfile.specialties?.map(specialty => (
                  <span key={specialty} className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm">
                    {specialty.replace(/_/g, ' ')}
                  </span>
                ))}
              </div>
            </div>

            {curatorProfile.portfolio_samples?.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Portfolio</h3>
                <div className="space-y-2">
                  {curatorProfile.portfolio_samples.map((sample, index) => (
                    <a
                      key={index}
                      href={sample}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-indigo-600 hover:text-indigo-700 hover:underline"
                    >
                      {sample}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
