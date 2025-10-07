/**
 * Validation utility functions used across the application
 * All validators return { valid: boolean, error?: string }
 */

/**
 * Validates email format using RFC 5322 simplified regex
 * @param {string} email - Email address to validate
 * @returns {object} Validation result with valid flag and optional error message
 */
export function validateEmail(email) {
  if (!email || typeof email !== 'string') {
    return { valid: false, error: 'Email is required' };
  }

  const trimmed = email.trim();
  
  if (trimmed === '') {
    return { valid: false, error: 'Email is required' };
  }

  // RFC 5322 simplified email regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!emailRegex.test(trimmed)) {
    return { valid: false, error: 'Invalid email format' };
  }

  return { valid: true };
}

/**
 * Validates price value
 * @param {string|number} price - Price to validate
 * @param {object} options - Validation options
 * @param {boolean} options.allowZero - Whether to allow price of 0 (for free/demo datasets)
 * @param {number} options.maxPrice - Maximum allowed price
 * @returns {object} Validation result with valid flag and optional error message
 */
export function validatePrice(price, options = {}) {
  const { allowZero = true, maxPrice = 999999 } = options;

  if (price === '' || price === null || price === undefined) {
    return { valid: false, error: 'Price is required' };
  }

  const numericPrice = typeof price === 'string' ? parseFloat(price) : price;

  if (isNaN(numericPrice)) {
    return { valid: false, error: 'Price must be a valid number' };
  }

  if (!allowZero && numericPrice === 0) {
    return { valid: false, error: 'Price must be greater than 0' };
  }

  if (numericPrice < 0) {
    return { valid: false, error: 'Price cannot be negative' };
  }

  if (numericPrice > maxPrice) {
    return { valid: false, error: `Price cannot exceed $${maxPrice}` };
  }

  return { valid: true };
}

/**
 * Validates file based on modality type
 * @param {File} file - File object to validate
 * @param {string} modality - Dataset modality (vision, audio, text, video, nlp)
 * @param {object} options - Validation options
 * @param {number} options.maxSize - Maximum file size in bytes (default 500MB)
 * @returns {object} Validation result with valid flag and optional error message
 */
export function validateFile(file, modality, options = {}) {
  const { maxSize = 500 * 1024 * 1024 } = options; // 500MB default

  if (!file) {
    return { valid: false, error: 'File is required' };
  }

  if (!(file instanceof File)) {
    return { valid: false, error: 'Invalid file object' };
  }

  const allowedTypes = {
    vision: ['image/jpeg', 'image/png', 'application/zip', 'application/x-tar', 'application/gzip'],
    audio: ['audio/mpeg', 'audio/wav', 'audio/flac', 'application/zip'],
    text: ['text/csv', 'application/json', 'application/zip', 'text/plain'],
    video: ['video/mp4', 'video/quicktime', 'application/zip'],
    nlp: ['text/csv', 'application/json', 'application/zip']
  };

  if (!modality || !allowedTypes[modality]) {
    return { valid: false, error: 'Invalid modality specified' };
  }

  const allowed = allowedTypes[modality];

  // Allow empty file type (some browsers don't set it for certain files)
  if (file.type !== '' && !allowed.includes(file.type)) {
    return { 
      valid: false, 
      error: `Invalid file type for ${modality}. Allowed: ${allowed.join(', ')}` 
    };
  }

  if (file.size > maxSize) {
    const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
    const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(0);
    return { 
      valid: false, 
      error: `File too large. Maximum size is ${maxSizeMB}MB. Your file: ${fileSizeMB}MB` 
    };
  }

  return { valid: true };
}

/**
 * Validates file size
 * @param {number} size - File size in bytes
 * @param {object} options - Validation options
 * @param {number} options.maxSize - Maximum allowed size in bytes
 * @param {number} options.minSize - Minimum allowed size in bytes
 * @returns {object} Validation result with valid flag and optional error message
 */
export function validateFileSize(size, options = {}) {
  const { maxSize = 500 * 1024 * 1024, minSize = 0 } = options;

  if (typeof size !== 'number' || size < 0) {
    return { valid: false, error: 'Invalid file size' };
  }

  if (size < minSize) {
    return { valid: false, error: `File size must be at least ${minSize} bytes` };
  }

  if (size > maxSize) {
    const sizeMB = (size / (1024 * 1024)).toFixed(2);
    const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(0);
    return { 
      valid: false, 
      error: `File too large. Maximum: ${maxSizeMB}MB. Current: ${sizeMB}MB` 
    };
  }

  return { valid: true };
}

/**
 * Validates URL format
 * @param {string} url - URL to validate
 * @param {object} options - Validation options
 * @param {boolean} options.requireHttps - Whether to require HTTPS protocol
 * @returns {object} Validation result with valid flag and optional error message
 */
export function validateUrl(url, options = {}) {
  const { requireHttps = false } = options;

  if (!url || typeof url !== 'string') {
    return { valid: false, error: 'URL is required' };
  }

  const trimmed = url.trim();

  if (trimmed === '') {
    return { valid: false, error: 'URL is required' };
  }

  try {
    const urlObj = new URL(trimmed);
    
    if (requireHttps && urlObj.protocol !== 'https:') {
      return { valid: false, error: 'URL must use HTTPS protocol' };
    }

    if (urlObj.protocol !== 'http:' && urlObj.protocol !== 'https:') {
      return { valid: false, error: 'URL must use HTTP or HTTPS protocol' };
    }

    return { valid: true };
  } catch {
    return { valid: false, error: 'Invalid URL format' };
  }
}

/**
 * Validates string is not empty after trimming
 * @param {string} value - String to validate
 * @param {string} fieldName - Name of the field for error messages
 * @param {object} options - Validation options
 * @param {number} options.minLength - Minimum required length
 * @param {number} options.maxLength - Maximum allowed length
 * @returns {object} Validation result with valid flag and optional error message
 */
export function validateRequired(value, fieldName = 'Field', options = {}) {
  const { minLength = 1, maxLength = Infinity } = options;

  if (value === null || value === undefined) {
    return { valid: false, error: `${fieldName} is required` };
  }

  if (typeof value !== 'string') {
    return { valid: false, error: `${fieldName} must be a string` };
  }

  const trimmed = value.trim();

  if (trimmed.length === 0) {
    return { valid: false, error: `${fieldName} cannot be empty` };
  }

  if (trimmed.length < minLength) {
    return { valid: false, error: `${fieldName} must be at least ${minLength} characters` };
  }

  if (trimmed.length > maxLength) {
    return { valid: false, error: `${fieldName} must not exceed ${maxLength} characters` };
  }

  return { valid: true };
}

/**
 * Validates dataset title
 * @param {string} title - Dataset title to validate
 * @returns {object} Validation result with valid flag and optional error message
 */
export function validateDatasetTitle(title) {
  return validateRequired(title, 'Dataset title', { minLength: 3, maxLength: 200 });
}

/**
 * Validates dataset description
 * @param {string} description - Dataset description to validate
 * @returns {object} Validation result with valid flag and optional error message
 */
export function validateDatasetDescription(description) {
  return validateRequired(description, 'Dataset description', { minLength: 10, maxLength: 2000 });
}

/**
 * Validates username format
 * @param {string} username - Username to validate
 * @returns {object} Validation result with valid flag and optional error message
 */
export function validateUsername(username) {
  if (!username || typeof username !== 'string') {
    return { valid: false, error: 'Username is required' };
  }

  const trimmed = username.trim();

  if (trimmed.length < 3) {
    return { valid: false, error: 'Username must be at least 3 characters' };
  }

  if (trimmed.length > 30) {
    return { valid: false, error: 'Username must not exceed 30 characters' };
  }

  // Alphanumeric, underscores, and hyphens only
  const usernameRegex = /^[a-zA-Z0-9_-]+$/;

  if (!usernameRegex.test(trimmed)) {
    return { valid: false, error: 'Username can only contain letters, numbers, underscores, and hyphens' };
  }

  return { valid: true };
}
