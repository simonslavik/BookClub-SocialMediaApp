import React, { useEffect, useRef } from 'react';
import { FiAlertTriangle, FiInfo, FiX } from 'react-icons/fi';

const variantStyles = {
  danger: {
    icon: <FiAlertTriangle className="text-red-400" size={24} />,
    confirmBtn: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
  },
  warning: {
    icon: <FiAlertTriangle className="text-stone-400" size={24} />,
    confirmBtn: 'bg-stone-600 hover:bg-stone-700 focus:ring-stone-500',
  },
  default: {
    icon: <FiInfo className="text-stone-400" size={24} />,
    confirmBtn: 'bg-stone-700 hover:bg-stone-800 focus:ring-stone-500',
  },
};

const ConfirmDialog = ({
  isOpen,
  title = 'Confirm',
  message = 'Are you sure?',
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'default',
  onConfirm,
  onCancel,
}) => {
  const confirmBtnRef = useRef(null);
  const dialogRef = useRef(null);

  // Focus trap & escape key
  useEffect(() => {
    if (!isOpen) return;

    // Focus the cancel-safe confirm button on open
    confirmBtnRef.current?.focus();

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onCancel();
      }
      // Trap focus within the dialog
      if (e.key === 'Tab' && dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    // Prevent body scroll
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  const styles = variantStyles[variant] || variantStyles.default;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
        onClick={onCancel}
      />

      {/* Dialog */}
      <div
        ref={dialogRef}
        className="relative bg-[#1e1e2e] border border-white/10 rounded-xl shadow-2xl w-full max-w-md animate-scale-in"
      >
        {/* Header */}
        <div className="flex items-center gap-3 p-5 pb-0">
          {styles.icon}
          <h3 id="confirm-dialog-title" className="text-lg font-semibold text-white flex-1">
            {title}
          </h3>
          <button
            onClick={onCancel}
            className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Close"
          >
            <FiX size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4">
          <p className="text-gray-300 text-sm leading-relaxed">{message}</p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 px-5 pb-5">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-300 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-white/20"
          >
            {cancelLabel}
          </button>
          <button
            ref={confirmBtnRef}
            onClick={onConfirm}
            className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#1e1e2e] ${styles.confirmBtn}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
