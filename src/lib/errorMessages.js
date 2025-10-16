/**
 * User-friendly error messages for common operations
 * Maps error contexts to human-readable messages
 * 
 * Usage:
 * import { ERROR_MESSAGES } from '@/lib/errorMessages';
 * setError(ERROR_MESSAGES.FETCH_DASHBOARD);
 */

export const ERROR_MESSAGES = {
  // Dashboard Data
  FETCH_DASHBOARD: 'Unable to load dashboard data. Please refresh the page.',
  FETCH_DATASETS: 'Failed to load your datasets. Please try again.',
  FETCH_PURCHASES: 'Failed to load purchase history. Please try again.',
  FETCH_EARNINGS: 'Failed to load earnings data. Please try again.',
  FETCH_FAVORITES: 'Failed to load favorites. Please try again.',
  
  // Dataset Operations
  UPLOAD_DATASET: 'Failed to upload dataset. Please check your file and try again.',
  UPDATE_DATASET: 'Failed to update dataset. Please try again.',
  DELETE_DATASET: 'Failed to delete dataset. Please try again.',
  TOGGLE_DATASET: 'Failed to update dataset status. Please try again.',
  DOWNLOAD_DATASET: 'Failed to download dataset. Please try again.',
  REQUEST_DELETION: 'Failed to submit deletion request. Please try again.',
  
  // Bounty Operations
  CREATE_BOUNTY: 'Failed to create bounty. Please check your information and try again.',
  CLOSE_BOUNTY: 'Failed to close bounty. Please try again.',
  DELETE_BOUNTY: 'Failed to delete bounty. Please try again.',
  DELETE_BOUNTY_SUBMISSION: 'Failed to delete submission. Please try again.',
  
  // Stripe/Payment
  STRIPE_CONNECT: 'Failed to connect to Stripe. Please try again later.',
  STRIPE_VERIFY: 'Failed to verify Stripe account. Please try again.',
  
  // Admin Operations
  FETCH_ADMIN_DATA: 'Failed to load admin dashboard data. Please refresh the page.',
  APPROVE_CURATOR: 'Failed to approve curator. Please try again.',
  REJECT_CURATOR: 'Failed to reject curator. Please try again.',
  SUSPEND_CURATOR: 'Failed to suspend curator. Please try again.',
  TOGGLE_FEATURED: 'Failed to update featured status. Please try again.',
  APPROVE_DELETION: 'Failed to approve deletion request. Please try again.',
  REJECT_DELETION: 'Failed to reject deletion request. Please try again.',
  APPROVE_SUBMISSION: 'Failed to approve submission. Please try again.',
  REJECT_SUBMISSION: 'Failed to reject submission. Please try again.',
  
  // Curation
  CLOSE_REQUEST: 'Failed to close curation request. Please try again.',
  
  // Activity Feed
  FETCH_ACTIVITY: 'Failed to load activity feed. Please try again.',
  
  // Beta Access
  CHECK_BETA_ACCESS: 'Failed to check beta access. Please try again.',
  
  // Auth
  AUTH_CALLBACK: 'Authentication failed. Please try logging in again.',
  EMAIL_CONFIRMATION: 'Email confirmation failed. Please try again.',
  
  // Generic
  NETWORK_ERROR: 'Network error. Please check your connection and try again.',
  UNKNOWN_ERROR: 'An unexpected error occurred. Please try again.',
  PERMISSION_DENIED: 'You do not have permission to perform this action.',
};

/**
 * Get a user-friendly error message
 * Falls back to generic message if specific message not found
 * 
 * @param {string} context - Error context key (e.g., 'FETCH_DASHBOARD')
 * @param {string} [fallback] - Optional custom fallback message
 * @returns {string} User-friendly error message
 */
export const getErrorMessage = (context, fallback) => {
  return ERROR_MESSAGES[context] || fallback || ERROR_MESSAGES.UNKNOWN_ERROR;
};
