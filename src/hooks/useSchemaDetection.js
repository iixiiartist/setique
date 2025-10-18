import { useState, useCallback } from 'react';
import { analyzeSchema } from '../../services/schemaDetectorService';

/**
 * useSchemaDetection Hook
 * 
 * Custom hook for integrating schema detection service with React components.
 * Handles loading states, error handling, and provides convenience methods.
 * 
 * @returns {Object} Schema detection state and methods
 */
export const useSchemaDetection = () => {
  const [analysis, setAnalysis] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Analyze CSV data to detect platform and schema
   * @param {Array<Object>} csvData - Parsed CSV data with headers
   * @returns {Promise<Object>} Analysis result
   */
  const detectSchema = useCallback(async (csvData) => {
    if (!csvData || csvData.length === 0) {
      setError(new Error('No CSV data provided'));
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Extract headers from first row
      const headers = Object.keys(csvData[0]);
      
      // Use first 100 rows for analysis (performance optimization)
      const sampleRows = csvData.slice(0, 100);

      // Run schema detection
      const result = await analyzeSchema(headers, sampleRows);

      setAnalysis(result);
      return result;
    } catch (err) {
      console.error('Schema detection failed:', err);
      setError(err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Reset analysis state
   */
  const resetAnalysis = useCallback(() => {
    setAnalysis(null);
    setError(null);
    setIsLoading(false);
  }, []);

  /**
   * Get extended fields list from analysis
   * @returns {Array<string>} Extended field names
   */
  const getExtendedFields = useCallback(() => {
    return analysis?.extendedFields || [];
  }, [analysis]);

  /**
   * Check if analysis detected a supported platform
   * @returns {boolean} True if platform is supported
   */
  const isSupportedPlatform = useCallback(() => {
    return analysis?.platform && analysis.platform !== 'other';
  }, [analysis]);

  /**
   * Get confidence level category
   * @returns {string} 'high' | 'medium' | 'low'
   */
  const getConfidenceLevel = useCallback(() => {
    if (!analysis?.confidence) return 'low';
    if (analysis.confidence >= 0.8) return 'high';
    if (analysis.confidence >= 0.6) return 'medium';
    return 'low';
  }, [analysis]);

  return {
    // State
    analysis,
    isLoading,
    error,
    
    // Methods
    detectSchema,
    resetAnalysis,
    
    // Convenience getters
    getExtendedFields,
    isSupportedPlatform,
    getConfidenceLevel,
    
    // Quick access properties
    platform: analysis?.platform,
    confidence: analysis?.confidence,
    canonicalFields: analysis?.canonicalFields,
    extendedFields: analysis?.extendedFields,
    validation: analysis?.validation
  };
};

export default useSchemaDetection;
