import { useState, useCallback } from 'react';
import logger from '../utils/logger';

/**
 * Wraps any async operation with loading / error state.
 *
 * Usage:
 *   const { execute, loading, error } = useAsync();
 *   const handleSubmit = () => execute(async () => {
 *     await bookclubAPI.create(data);
 *     toast.success('Created!');
 *   });
 */
export function useAsync() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const execute = useCallback(async (asyncFn) => {
    setLoading(true);
    setError(null);

    try {
      const result = await asyncFn();
      return result;
    } catch (err) {
      const message = err?.response?.data?.message || err?.message || 'Something went wrong';
      setError(message);
      logger.error('Async operation failed', err);
      return undefined;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return { execute, loading, error, clearError };
}
