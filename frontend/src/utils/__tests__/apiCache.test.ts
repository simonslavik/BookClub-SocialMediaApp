import { cachedFetch, invalidateCache, invalidateCachePattern, clearCache, getCacheStats } from '@utils/apiCache';

describe('apiCache', () => {
  beforeEach(() => {
    clearCache();
  });

  it('calls fetchFn on a cache miss and returns the data', async () => {
    const fetchFn = vi.fn().mockResolvedValue({ id: 1, title: 'Book' });

    const result = await cachedFetch('/api/books/1', fetchFn);

    expect(result).toEqual({ id: 1, title: 'Book' });
    expect(fetchFn).toHaveBeenCalledOnce();
  });

  it('returns cached data on a cache hit without calling fetchFn again', async () => {
    const fetchFn = vi.fn().mockResolvedValue({ id: 1 });

    await cachedFetch('/api/books/1', fetchFn);
    const result = await cachedFetch('/api/books/1', fetchFn);

    expect(result).toEqual({ id: 1 });
    expect(fetchFn).toHaveBeenCalledOnce(); // only the first call
  });

  it('re-fetches after TTL expires', async () => {
    const fetchFn = vi.fn()
      .mockResolvedValueOnce({ version: 1 })
      .mockResolvedValueOnce({ version: 2 });

    await cachedFetch('/api/data', fetchFn, 0); // TTL = 0 → immediately stale

    // Small delay so Date.now() advances
    await new Promise((r) => setTimeout(r, 5));

    const result = await cachedFetch('/api/data', fetchFn, 0);

    expect(result).toEqual({ version: 2 });
    expect(fetchFn).toHaveBeenCalledTimes(2);
  });

  it('invalidateCache removes specific keys', async () => {
    const fetchFn = vi.fn().mockResolvedValue('data');

    await cachedFetch('/api/a', fetchFn);
    await cachedFetch('/api/b', fetchFn);
    expect(getCacheStats().size).toBe(2);

    invalidateCache('/api/a');

    expect(getCacheStats().size).toBe(1);
    expect(getCacheStats().keys).toEqual(['/api/b']);
  });

  it('invalidateCachePattern removes all matching keys', async () => {
    const fetchFn = vi.fn().mockResolvedValue('data');

    await cachedFetch('/api/bookclub/1/rooms', fetchFn);
    await cachedFetch('/api/bookclub/1/books', fetchFn);
    await cachedFetch('/api/users/me', fetchFn);

    invalidateCachePattern('bookclub/1');

    expect(getCacheStats().size).toBe(1);
    expect(getCacheStats().keys).toEqual(['/api/users/me']);
  });

  it('clearCache empties everything', async () => {
    const fetchFn = vi.fn().mockResolvedValue('data');

    await cachedFetch('/api/a', fetchFn);
    await cachedFetch('/api/b', fetchFn);

    clearCache();

    expect(getCacheStats().size).toBe(0);
  });

  it('evicts oldest entry when exceeding max size', async () => {
    const fetchFn = vi.fn().mockResolvedValue('data');

    // The cache has MAX_ENTRIES = 200. Fill it + 1 to trigger eviction.
    for (let i = 0; i <= 200; i++) {
      await cachedFetch(`/api/item/${i}`, fetchFn);
    }

    const stats = getCacheStats();
    expect(stats.size).toBe(200); // oldest was evicted
    expect(stats.keys).not.toContain('/api/item/0'); // first entry evicted
    expect(stats.keys).toContain('/api/item/200'); // newest kept
  });
});
