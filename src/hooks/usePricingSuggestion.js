import { useState, useCallback } from 'react';
import { calculateSuggestedPrice } from '@/services/pricingService';

/**
 * usePricingSuggestion Hook
 * 
 * Custom hook for AI-powered pricing calculation.
 * Integrates with pricingService and provides real-time updates.
 * 
 * @returns {Object} Pricing state and methods
 */
export const usePricingSuggestion = () => {
  const [pricing, setPricing] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Calculate suggested price based on dataset and schema analysis
   * @param {Object} dataset - Dataset metadata (rows, dates, etc.)
   * @param {Object} schemaAnalysis - Schema analysis result
   * @returns {Promise<Object>} Pricing result
   */
  const calculatePricing = useCallback(async (dataset, schemaAnalysis) => {
    if (!dataset) {
      setError(new Error('No dataset provided'));
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await calculateSuggestedPrice(dataset, schemaAnalysis);
      setPricing(result);
      return result;
    } catch (err) {
      console.error('Pricing calculation failed:', err);
      setError(err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Reset pricing state
   */
  const resetPricing = useCallback(() => {
    setPricing(null);
    setError(null);
    setIsLoading(false);
  }, []);

  /**
   * Get confidence level category
   * @returns {string} 'high' | 'medium' | 'low'
   */
  const getConfidenceLevel = useCallback(() => {
    if (!pricing?.confidence) return 'low';
    if (pricing.confidence >= 0.8) return 'high';
    if (pricing.confidence >= 0.6) return 'medium';
    return 'low';
  }, [pricing]);

  /**
   * Check if pricing has extended fields bonus
   * @returns {boolean} True if extended fields multiplier > 1
   */
  const hasExtendedBonus = useCallback(() => {
    return pricing?.factors?.extendedFieldsMultiplier > 1;
  }, [pricing]);

  return {
    // State
    pricing,
    isLoading,
    error,
    
    // Methods
    calculatePricing,
    resetPricing,
    
    // Convenience getters
    getConfidenceLevel,
    hasExtendedBonus,
    
    // Quick access properties
    suggestedPrice: pricing?.suggestedPrice,
    confidence: pricing?.confidence,
    factors: pricing?.factors,
    reasoning: pricing?.reasoning,
    priceRange: pricing?.priceRange
  };
};

export default usePricingSuggestion;
