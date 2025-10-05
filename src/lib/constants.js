// =====================================================
// SHARED CONSTANTS
// Centralized constants used across the application
// =====================================================

// Pro Curator Badge Colors
export const BADGE_COLORS = {
  verified: 'bg-blue-100 text-blue-800 border-blue-800',
  expert: 'bg-purple-100 text-purple-800 border-purple-800',
  master: 'bg-yellow-100 text-yellow-800 border-yellow-800'
};

// Curator Specialty Options
export const SPECIALTY_OPTIONS = [
  'handwritten_text',
  'audio_transcription',
  'video_annotation',
  'image_labeling',
  'text_classification',
  'sensor_data',
  'financial_data',
  'medical_imaging'
];

// Specialty Display Labels
export const SPECIALTY_LABELS = {
  handwritten_text: 'Handwritten Text',
  audio_transcription: 'Audio Transcription',
  video_annotation: 'Video Annotation',
  image_labeling: 'Image Labeling',
  text_classification: 'Text Classification',
  sensor_data: 'Sensor Data',
  financial_data: 'Financial Data',
  medical_imaging: 'Medical Imaging'
};

// Quality Level Options
export const QUALITY_LEVELS = {
  basic: { label: 'Basic', color: 'bg-gray-100 text-gray-800', description: 'Quick cleaning, basic labels' },
  standard: { label: 'Standard', color: 'bg-blue-100 text-blue-800', description: 'Thorough cleaning, detailed annotations' },
  premium: { label: 'Premium', color: 'bg-purple-100 text-purple-800', description: 'Expert-level curation, research-grade quality' }
};

// Curation Request Status Options
export const REQUEST_STATUS = {
  open: 'open',
  in_progress: 'in_progress',
  completed: 'completed',
  cancelled: 'cancelled'
};

// Proposal Status Options
export const PROPOSAL_STATUS = {
  pending: 'pending',
  accepted: 'accepted',
  rejected: 'rejected'
};

// Partnership Status Options
export const PARTNERSHIP_STATUS = {
  active: 'active',
  completed: 'completed',
  terminated: 'terminated'
};

// Platform Revenue Split
export const PLATFORM_FEE_PERCENTAGE = 0.20; // 20%
export const CREATOR_SHARE_PERCENTAGE = 0.80; // 80%
export const PARTNERSHIP_SPLIT_PERCENTAGE = 0.50; // 50/50 split of creator share

// Badge Level Thresholds
export const BADGE_THRESHOLDS = {
  expert: { projects: 10, rating: 4.5 },
  master: { projects: 50, rating: 4.8 }
};
