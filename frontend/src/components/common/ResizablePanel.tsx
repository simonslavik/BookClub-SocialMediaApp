import { useState, useRef, useCallback, useEffect } from 'react';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';

/**
 * Resizable panel wrapper — adds a drag handle on one side.
 * Supports collapsing: drag below the collapse threshold to hide the panel.
 * A small tab appears to re-expand it.
 *
 * Uses direct DOM manipulation during drag for buttery-smooth resizing
 * (no React re-renders until mouse-up).
 *
 * Props:
 *  - side            'left' | 'right'   Which edge gets the resize handle
 *  - defaultWidth    number (px)        Starting width
 *  - minWidth        number (px)        Minimum allowed width (before collapse)
 *  - maxWidth        number (px)        Maximum allowed width
 *  - collapseThreshold number (px)      Below this width the panel snaps shut (default: minWidth * 0.6)
 *  - storageKey      string?            localStorage key to persist width
 *  - className       string?            Extra classes on the outer wrapper
 *  - children        ReactNode
 */
const ResizablePanel = ({
  side = 'right',
  defaultWidth = 256,
  minWidth = 140,
  maxWidth = 480,
  collapseThreshold,
  storageKey,
  className = '',
  children,
}: any) => {
  const threshold = collapseThreshold ?? Math.round(minWidth * 0.6);

  const [width, setWidth] = useState(() => {
    if (storageKey) {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const v = Number(saved);
        if (v === 0) return 0; // collapsed
        return Math.max(minWidth, Math.min(maxWidth, v));
      }
    }
    return defaultWidth;
  });

  const collapsed = width === 0;

  const panelRef = useRef(null);
  const dragging = useRef(false);
  const startX = useRef(0);
  const startWidth = useRef(width);
  const currentWidth = useRef(width); // tracks live width during drag
  const lastWidthBeforeCollapse = useRef(defaultWidth);
  const rafId = useRef(null);

  // Keep track of width before collapse so we can restore it
  useEffect(() => {
    if (width > 0) lastWidthBeforeCollapse.current = width;
    currentWidth.current = width;
  }, [width]);

  // Persist on change
  useEffect(() => {
    if (storageKey) localStorage.setItem(storageKey, String(width));
  }, [width, storageKey]);

  const expand = useCallback(() => {
    setWidth(lastWidthBeforeCollapse.current || defaultWidth);
  }, [defaultWidth]);

  const onMouseDown = useCallback(
    (e) => {
      e.preventDefault();
      dragging.current = true;
      startX.current = e.clientX;
      startWidth.current = collapsed ? 0 : currentWidth.current;

      // Remove transition during drag for instant response
      if (panelRef.current) {
        panelRef.current.style.transition = 'none';
      }

      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    },
    [collapsed]
  );

  useEffect(() => {
    const onMouseMove = (e) => {
      if (!dragging.current) return;

      const delta = e.clientX - startX.current;
      const raw =
        side === 'right'
          ? startWidth.current + delta
          : startWidth.current - delta;

      let newWidth;
      if (raw < threshold) {
        newWidth = 0;
      } else {
        newWidth = Math.max(minWidth, Math.min(maxWidth, raw));
      }

      currentWidth.current = newWidth;

      // Direct DOM write — no React re-render
      if (rafId.current) cancelAnimationFrame(rafId.current);
      rafId.current = requestAnimationFrame(() => {
        if (panelRef.current) {
          panelRef.current.style.width = `${newWidth}px`;
        }
      });
    };

    const onMouseUp = () => {
      if (!dragging.current) return;
      dragging.current = false;
      if (rafId.current) cancelAnimationFrame(rafId.current);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';

      // Restore transition
      if (panelRef.current) {
        panelRef.current.style.transition = '';
      }

      // Commit final width to React state (single re-render)
      setWidth(currentWidth.current);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  }, [side, minWidth, maxWidth, threshold]);

  /* ── Expand tab (shown when collapsed) ── */
  if (collapsed) {
    return (
      <div className="relative flex-shrink-0 h-full" style={{ width: 0 }}>
        <button
          onClick={expand}
          className={`absolute top-1/2 -translate-y-1/2 z-20 flex items-center justify-center
            w-5 h-12 rounded-md bg-gray-800 hover:bg-stone-700 text-white/80 hover:text-white
            shadow-lg transition-colors ${
              side === 'right' ? 'right-0 translate-x-full rounded-l-none' : 'left-0 -translate-x-full rounded-r-none'
            }`}
          title="Expand panel"
        >
          {side === 'right' ? <FiChevronRight size={14} /> : <FiChevronLeft size={14} />}
        </button>
      </div>
    );
  }

  /* ── Normal (expanded) state ── */
  const handle = (
    <div
      onMouseDown={onMouseDown}
      className="group absolute top-0 bottom-0 z-10 flex items-center"
      style={{
        width: '8px',
        cursor: 'col-resize',
        ...(side === 'right' ? { right: '-4px' } : { left: '-4px' }),
      }}
    >
      {/* Visible line on hover / drag */}
      <div className="w-[2px] h-full bg-transparent group-hover:bg-stone-500/60 transition-colors" />
    </div>
  );

  return (
    <div
      ref={panelRef}
      className={`relative flex-shrink-0 h-full overflow-hidden transition-[width] duration-150 ease-out ${className}`}
      style={{ width: `${width}px` }}
    >
      {children}
      {handle}
    </div>
  );
};

export default ResizablePanel;
