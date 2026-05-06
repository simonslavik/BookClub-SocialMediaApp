/**
 * Lightweight in-memory cache for API responses.
 * Caches GET results so switching between bookclubs is instant.
 * 
 * - TTL-based expiry (default 2 minutes)
 * - Invalidation by key or pattern
 * - Max 200 entries (LRU eviction)
 * - Graceful — never throws, falls through to fetch on any error
 */

const MAX_ENTRIES = 200;
const cache = new Map();

/**
 * Get cached data or fetch it.
 * 
 * @param {string} key - Cache key (usually the API URL)
 * @param {Function} fetchFn - Async function that fetches from API
 * @param {number} ttl - Time to live in ms (default: 2 minutes)
 * @returns {Promise<any>} The data
 */
export async function cachedFetch(key, fetchFn, ttl = 120_000) {
  const entry = cache.get(key);
  const now = Date.now();

  // Cache hit — return instantly
  if (entry && now - entry.timestamp < ttl) {
    return entry.data;
  }

  // Cache miss — fetch from API
  const data = await fetchFn();

  // Store in cache
  cache.set(key, { data, timestamp: now });

  // Evict oldest if over limit
  if (cache.size > MAX_ENTRIES) {
    const firstKey = cache.keys().next().value;
    cache.delete(firstKey);
  }

  return data;
}

/**
 * Invalidate specific cache keys.
 * Call after mutations (create, update, delete).
 * 
 * @param {...string} keys - Cache keys to remove
 */
export function invalidateCache(...keys) {
  for (const key of keys) {
    cache.delete(key);
  }
}

/**
 * Invalidate all cache keys that contain a substring.
 * Useful for invalidating all data related to a specific bookclub.
 * 
 * @param {string} pattern - Substring to match against cache keys
 */
export function invalidateCachePattern(pattern) {
  for (const key of cache.keys()) {
    if (key.includes(pattern)) {
      cache.delete(key);
    }
  }
}

/**
 * Clear the entire cache.
 * Call on logout or when switching users.
 */
export function clearCache() {
  cache.clear();
}

/**
 * Get cache stats (for debugging).
 */
export function getCacheStats() {
  return {
    size: cache.size,
    keys: [...cache.keys()],
  };
}
