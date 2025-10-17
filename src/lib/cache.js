/**
 * Service Cache Utility
 * Provides intelligent caching with TTL (time-to-live) and pattern-based invalidation
 * Used by service layer to reduce redundant API calls
 */

class ServiceCache {
  /**
   * Create a new cache instance
   * @param {number} ttl - Time to live in milliseconds (default: 30000 = 30 seconds)
   */
  constructor(ttl = 30000) {
    this.cache = new Map()
    this.ttl = ttl
  }

  /**
   * Get cached data if not expired
   * @param {string} key - Cache key
   * @returns {any|null} Cached data or null if expired/missing
   */
  get(key) {
    const entry = this.cache.get(key)
    if (!entry) return null

    // Check if expired
    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key)
      return null
    }

    return entry.data
  }

  /**
   * Set cached data with current timestamp
   * @param {string} key - Cache key
   * @param {any} data - Data to cache
   */
  set(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    })
  }

  /**
   * Invalidate a specific cache entry
   * @param {string} key - Cache key to invalidate
   */
  invalidate(key) {
    this.cache.delete(key)
  }

  /**
   * Invalidate all cache entries matching a pattern
   * @param {string} pattern - Pattern to match (e.g., 'datasets:')
   */
  invalidatePattern(pattern) {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key)
      }
    }
  }

  /**
   * Clear all cache entries
   */
  clear() {
    this.cache.clear()
  }

  /**
   * Get cache statistics
   * @returns {Object} Cache stats (size, keys)
   */
  getStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    }
  }
}

// Export singleton instances for each service domain
export const dashboardCache = new ServiceCache(30000) // 30s TTL
export const datasetCache = new ServiceCache(30000)
export const bountyCache = new ServiceCache(30000)
export const stripeCache = new ServiceCache(60000) // 60s TTL for Stripe (less frequent changes)

// Export class for testing
export { ServiceCache }
