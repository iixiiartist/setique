import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { X } from './Icons';

export default function CurationRequestModal({ isOpen, onClose, onSuccess }) {
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetQuality, setTargetQuality] = useState('');
  const [budgetMin, setBudgetMin] = useState('');
  const [budgetMax, setBudgetMax] = useState('');
  const [specialtiesNeeded, setSpecialtiesNeeded] = useState([]);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!title || !description || !targetQuality || specialtiesNeeded.length === 0) {
      alert('Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('curation_requests')
        .insert([{
          creator_id: user.id,
          title: title,
          description: description,
          target_quality: targetQuality,
          budget_min: budgetMin ? parseFloat(budgetMin) : null,
          budget_max: budgetMax ? parseFloat(budgetMax) : null,
          specialties_needed: specialtiesNeeded,
          status: 'open'
        }]);

      if (error) {
        console.error('Supabase error:', error);
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
        console.error('Error details:', error.details);
        console.error('Error hint:', error.hint);
        throw error;
      }

      alert('Curation request posted successfully!');
      resetForm();
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error posting request:', error);
      const errorMsg = error.message || error.hint || 'Unknown error';
      alert(`Failed to post request: ${errorMsg}`);
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setTargetQuality('');
    setBudgetMin('');
    setBudgetMax('');
    setSpecialtiesNeeded([]);
  };

  const toggleSpecialty = (specialty) => {
    setSpecialtiesNeeded(prev => 
      prev.includes(specialty)
        ? prev.filter(s => s !== specialty)
        : [...prev, specialty]
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white border-4 border-black rounded-3xl shadow-[16px_16px_0_#000] max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-yellow-300 to-pink-300 border-b-4 border-black p-6 flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-extrabold text-black">Request Professional Curation</h2>
            <p className="text-sm font-semibold text-black/70 mt-1">
              Post your needs and get proposals from certified Pro Curators
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
          {/* Title */}
          <div>
            <label className="block text-sm font-extrabold text-black mb-2">
              Request Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 border-2 border-black rounded-lg font-semibold focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="e.g., Need help cleaning and annotating 5,000 medical images"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-extrabold text-black mb-2">
              Detailed Description *
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={6}
              className="w-full px-4 py-3 border-2 border-black rounded-lg font-semibold focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Describe your raw data, what cleaning/annotation is needed, quality standards, timeline expectations, etc."
              required
            />
          </div>

          {/* Target Quality */}
          <div>
            <label className="block text-sm font-extrabold text-black mb-2">
              Target Quality Level *
            </label>
            <select
              value={targetQuality}
              onChange={(e) => setTargetQuality(e.target.value)}
              className="w-full px-4 py-3 border-2 border-black rounded-lg font-semibold focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              required
            >
              <option value="">Select quality level...</option>
              <option value="basic">Basic - Quick cleaning, basic labels</option>
              <option value="standard">Standard - Thorough cleaning, detailed annotations</option>
              <option value="premium">Premium - Expert-level curation, research-grade quality</option>
            </select>
          </div>

          {/* Specialties Needed */}
          <div>
            <label className="block text-sm font-extrabold text-black mb-2">
              Specialties Needed * (Select at least one)
            </label>
            <div className="grid grid-cols-2 gap-2">
              {specialtyOptions.map(specialty => (
                <label 
                  key={specialty} 
                  className="flex items-center space-x-2 p-3 border-2 border-black rounded-lg cursor-pointer hover:bg-yellow-100 transition"
                >
                  <input
                    type="checkbox"
                    checked={specialtiesNeeded.includes(specialty)}
                    onChange={() => toggleSpecialty(specialty)}
                    className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                  />
                  <span className="text-sm font-bold text-black">
                    {specialty.replace(/_/g, ' ')}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Budget Range */}
          <div>
            <label className="block text-sm font-extrabold text-black mb-2">
              Budget Range (Optional)
            </label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-gray-500 font-bold">$</span>
                  <input
                    type="number"
                    value={budgetMin}
                    onChange={(e) => setBudgetMin(e.target.value)}
                    className="w-full pl-8 pr-4 py-3 border-2 border-black rounded-lg font-semibold focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Min"
                    min="0"
                    step="1"
                  />
                </div>
              </div>
              <div>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-gray-500 font-bold">$</span>
                  <input
                    type="number"
                    value={budgetMax}
                    onChange={(e) => setBudgetMax(e.target.value)}
                    className="w-full pl-8 pr-4 py-3 border-2 border-black rounded-lg font-semibold focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Max"
                    min="0"
                    step="1"
                  />
                </div>
              </div>
            </div>
            <p className="text-xs text-gray-600 mt-2 font-semibold">
              Optional budget for initial curation work. Once live, you and your curator will split revenue 50/50 (you get 40% of sales, curator gets 40%, platform 20%).
            </p>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border-2 border-blue-500 rounded-lg p-4">
            <h4 className="font-extrabold text-sm text-blue-900 mb-2">How it works:</h4>
            <ol className="text-xs font-semibold text-blue-800 space-y-1 list-decimal list-inside">
              <li>Post your curation request with detailed requirements</li>
              <li>Pro Curators submit proposals with their approach and pricing</li>
              <li>Review proposals and accept one to create a partnership</li>
              <li>Work together on the dataset (50/50 revenue split on all sales)</li>
              <li>Launch curated dataset and earn from every purchase</li>
            </ol>
          </div>

          {/* Submit Button */}
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 bg-indigo-600 text-white px-6 py-3 rounded-lg font-extrabold border-2 border-black shadow-[4px_4px_0_#000] hover:translate-y-1 hover:shadow-[2px_2px_0_#000] transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Posting...' : 'Post Curation Request'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 border-2 border-black text-black rounded-lg font-extrabold hover:bg-gray-100 transition"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
