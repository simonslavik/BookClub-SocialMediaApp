import { useEffect } from 'react';

/**
 * Lock the document body to a dark background while the calling page is
 * mounted, then restore the previous value on unmount.
 *
 * Used by chat surfaces (bookclub, DM, bookclub settings) which render with
 * a hard `bg-gray-900` regardless of the user's theme. Without this, the
 * lighter body briefly shows through during page transitions and produces a
 * white flash.
 *
 * Reads the actual rendered `--color-gray-900` so the lock honours the
 * current cozy-warm palette (and any future palette changes).
 */
export const useDarkBodyLock = () => {
  useEffect(() => {
    const body = document.body;
    const previous = body.style.backgroundColor;

    const dark = getComputedStyle(document.documentElement)
      .getPropertyValue('--color-gray-900')
      .trim() || '#1c1814';

    body.style.backgroundColor = dark;

    return () => {
      body.style.backgroundColor = previous;
    };
  }, []);
};

export default useDarkBodyLock;
