import { useState, useRef, useCallback, useEffect } from 'react';

/**
 * Resizable panel wrapper — adds a drag handle on one side.
 *
 * Props:
 *  - side        'left' | 'right'   Which edge gets the resize handle
 *  - defaultWidth  number (px)      Starting width
 *  - minWidth      number (px)      Minimum allowed width
 *  - maxWidth      number (px)      Maximum allowed width
 *  - storageKey    string?          localStorage key to persist width
 *  - className     string?          Extra classes on the outer wrapper
 *  - children      ReactNode
 */
const ResizablePanel = ({
  side = 'right',
  defaultWidth = 256,
  minWidth = 140,
  maxWidth = 480,
  storageKey,
  className = '',
  children,
}) => {
  const [width, setWidth] = useState(() => {
    if (storageKey) {
      const saved = localStorage.getItem(storageKey);
      if (saved) return Math.max(minWidth, Math.min(maxWidth, Number(saved)));
    }
    return defaultWidth;
  });

  const dragging = useRef(false);
  const startX = useRef(0);
  const startWidth = useRef(width);

  // Persist on change
  useEffect(() => {
    if (storageKey) localStorage.setItem(storageKey, String(width));
  }, [width, storageKey]);

  const onMouseDown = useCallback(
    (e) => {
      e.preventDefault();
      dragging.current = true;
      startX.current = e.clientX;
      startWidth.current = width;
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    },
    [width]
  );

  useEffect(() => {
    const onMouseMove = (e) => {
      if (!dragging.current) return;
      const delta = e.clientX - startX.current;
      // If handle is on the right, dragging right = bigger
      // If handle is on the left, dragging left = bigger
      const newWidth =
        side === 'right'
          ? startWidth.current + delta
          : startWidth.current - delta;
      setWidth(Math.max(minWidth, Math.min(maxWidth, newWidth)));
    };

    const onMouseUp = () => {
      if (!dragging.current) return;
      dragging.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [side, minWidth, maxWidth]);

  const handle = (
    <div
      onMouseDown={onMouseDown}
      className="group absolute top-0 bottom-0 z-10 flex items-center"
      style={{
        width: '6px',
        cursor: 'col-resize',
        ...(side === 'right' ? { right: '-3px' } : { left: '-3px' }),
      }}
    >
      {/* Visible line on hover / drag */}
      <div className="w-[2px] h-full bg-transparent group-hover:bg-stone-500/60 transition-colors" />
    </div>
  );

  return (
    <div
      className={`relative flex-shrink-0 h-full ${className}`}
      style={{ width: `${width}px` }}
    >
      {children}
      {handle}
    </div>
  );
};

export default ResizablePanel;
