import React, { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Wraps route content with a smooth fade+slide entrance animation.
 * Triggered on route change via React Router's `useLocation`.
 *
 * Uses two effects to be resilient to React.lazy / Suspense:
 *  1. Route-change effect → sets `visible=false`
 *  2. Recovery effect → whenever `visible` is false, schedules rAF to fade in
 *
 * If Suspense cleans up the recovery rAF while loading a chunk, the next
 * commit will see `visible` is still false and retry automatically.
 */
const PageTransition = ({ children }) => {
  const location = useLocation();
  const [visible, setVisible] = useState(true);
  const prevPath = useRef(location.pathname);

  // 1) Trigger exit animation on route change (skip initial mount)
  useEffect(() => {
    if (prevPath.current !== location.pathname) {
      prevPath.current = location.pathname;
      setVisible(false);
    }
  }, [location.pathname]);

  // 2) Self-healing entrance: whenever visible is false, animate in
  useEffect(() => {
    if (!visible) {
      const raf = requestAnimationFrame(() => {
        requestAnimationFrame(() => setVisible(true));
      });
      return () => cancelAnimationFrame(raf);
    }
  }, [visible]);

  return (
    <div
      className={`transition-all duration-300 ease-out ${
        visible
          ? 'opacity-100 translate-y-0'
          : 'opacity-0 translate-y-2'
      }`}
    >
      {children}
    </div>
  );
};

export default PageTransition;
