import React, { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Wraps route content with a smooth fade+slide entrance animation.
 *
 * Only animates when crossing route SECTIONS (e.g. /home → /bookclub/X), not
 * when params change within the same section (e.g. /bookclub/A → /bookclub/B).
 * Param-only navigations re-render the same component instantly with no fade,
 * which avoids a perceptible white flash when switching between bookclubs or
 * DM conversations.
 *
 * Resilient to React.lazy / Suspense:
 *  1. Section-change effect → sets `visible=false`
 *  2. Recovery effect → whenever `visible` is false, schedules rAF to fade in
 */
const sectionOf = (pathname: string): string => pathname.split('/')[1] || '';

const PageTransition = ({ children }) => {
  const location = useLocation();
  const [visible, setVisible] = useState(true);
  const prevSection = useRef(sectionOf(location.pathname));

  // 1) Trigger exit animation only on SECTION change (skip param-only nav)
  useEffect(() => {
    const next = sectionOf(location.pathname);
    if (prevSection.current !== next) {
      prevSection.current = next;
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
      className={`transition-all duration-200 ease-out ${
        visible
          ? 'opacity-100 translate-y-0'
          : 'opacity-0 translate-y-1'
      }`}
    >
      {children}
    </div>
  );
};

export default PageTransition;
