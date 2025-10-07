/**
 * Development-only logger utility
 * 
 * Only logs in development mode to keep production console clean.
 * Use this instead of console.log/error/warn directly.
 * 
 * @example
 * import { logger } from '@/lib/logger';
 * 
 * logger.log('User logged in:', user);
 * logger.error('Failed to fetch data:', error);
 * logger.warn('Deprecated API usage detected');
 */

const isDevelopment = import.meta.env.DEV || import.meta.env.MODE === 'development';

export const logger = {
  /**
   * Log informational messages (development only)
   */
  log: (...args) => {
    if (isDevelopment) {
      console.log(...args);
    }
  },

  /**
   * Log error messages (development only)
   */
  error: (...args) => {
    if (isDevelopment) {
      console.error(...args);
    }
    // TODO: Send to error tracking service in production
    // Example: Sentry.captureException(args[1])
  },

  /**
   * Log warning messages (development only)
   */
  warn: (...args) => {
    if (isDevelopment) {
      console.warn(...args);
    }
  },

  /**
   * Log debug messages (development only)
   */
  debug: (...args) => {
    if (isDevelopment) {
      console.debug(...args);
    }
  },

  /**
   * Log informational messages with custom styling (development only)
   */
  info: (...args) => {
    if (isDevelopment) {
      console.info(...args);
    }
  },

  /**
   * Group related logs together (development only)
   */
  group: (label, fn) => {
    if (isDevelopment) {
      console.group(label);
      fn();
      console.groupEnd();
    } else {
      fn();
    }
  },

  /**
   * Time an operation (development only)
   */
  time: (label) => {
    if (isDevelopment) {
      console.time(label);
    }
  },

  /**
   * End timing an operation (development only)
   */
  timeEnd: (label) => {
    if (isDevelopment) {
      console.timeEnd(label);
    }
  }
};

/**
 * Production-safe error handler for Supabase operations
 * 
 * @param {Error} error - The error object
 * @param {string} context - Description of what was being attempted
 * @returns {object} Standardized error response
 * 
 * @example
 * try {
 *   const { data, error } = await supabase.from('datasets').select('*');
 *   if (error) throw error;
 * } catch (error) {
 *   const result = handleSupabaseError(error, 'fetchDatasets');
 *   setError(result.message);
 * }
 */
export const handleSupabaseError = (error, context) => {
  logger.error(`Error in ${context}:`, error);
  
  // TODO: Send to error tracking service
  // trackError(error, { context, timestamp: Date.now() })
  
  return {
    success: false,
    message: error.message || 'An unexpected error occurred',
    code: error.code,
    details: error.details
  };
};
