import React, { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Wraps route content with a smooth fade+slide entrance animation.
 * Triggered on route change via React Router's `useLocation`.
 *
 * Usage — wrap around <Routes> in App.jsx:
 *   <PageTransition>
 *     <Routes>...</Routes>
 *   </PageTransition>
 */
const PageTransition = ({ children }) => {
  const location = useLocation();
  const [visible, setVisible] = useState(true);
  const prevPath = useRef(location.pathname);

  useEffect(() => {
    if (prevPath.current !== location.pathname) {
      prevPath.current = location.pathname;
      // Reset to hidden, then trigger entrance on next frame
      setVisible(false);
      const raf = requestAnimationFrame(() => {
        requestAnimationFrame(() => setVisible(true));
      });
      return () => cancelAnimationFrame(raf);
    }
  }, [location.pathname]);

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
