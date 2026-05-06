import React, { createContext, useState, useCallback, useRef } from 'react';
import ConfirmDialog from '@components/common/ConfirmDialog';
import ToastContainer from '@components/common/ToastContainer';

interface UIFeedbackContextValue {
  confirm: (message: string, options?: Record<string, any>) => Promise<boolean>;
  toast: (message: string, options?: Record<string, any>) => number;
  toastSuccess: (msg: string, opts?: Record<string, any>) => number;
  toastError: (msg: string, opts?: Record<string, any>) => number;
  toastWarning: (msg: string, opts?: Record<string, any>) => number;
  toastInfo: (msg: string, opts?: Record<string, any>) => number;
}

const UIFeedbackContext = createContext<UIFeedbackContextValue>({} as UIFeedbackContextValue);

let toastIdCounter = 0;

export const UIFeedbackProvider = ({ children }) => {
  // ── Confirm Dialog State ──
  const [confirmState, setConfirmState] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmLabel: 'Confirm',
    cancelLabel: 'Cancel',
    variant: 'default',
  });
  const resolveRef = useRef(null);

  const confirm = useCallback(
    (message: string, options: Record<string, any> = {}) => {
      return new Promise<boolean>((resolve) => {
        resolveRef.current = resolve;
        setConfirmState({
          isOpen: true,
          title: options.title || 'Confirm',
          message,
          confirmLabel: options.confirmLabel || 'Confirm',
          cancelLabel: options.cancelLabel || 'Cancel',
          variant: options.variant || 'default',
        });
      });
    },
    []
  );

  const handleConfirm = useCallback(() => {
    resolveRef.current?.(true);
    resolveRef.current = null;
    setConfirmState((s) => ({ ...s, isOpen: false }));
  }, []);

  const handleCancel = useCallback(() => {
    resolveRef.current?.(false);
    resolveRef.current = null;
    setConfirmState((s) => ({ ...s, isOpen: false }));
  }, []);

  // ── Toast State ──
  const [toasts, setToasts] = useState([]);

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (message: string, options: Record<string, any> = {}) => {
      const id = ++toastIdCounter;
      const newToast = {
        id,
        message,
        type: options.type || 'info',
        duration: options.duration ?? 4000,
      };
      setToasts((prev) => [...prev, newToast]);
      return id;
    },
    []
  );

  // Convenience methods
  const toastSuccess = useCallback((msg, opts) => toast(msg, { ...opts, type: 'success' }), [toast]);
  const toastError = useCallback((msg, opts) => toast(msg, { ...opts, type: 'error' }), [toast]);
  const toastWarning = useCallback((msg, opts) => toast(msg, { ...opts, type: 'warning' }), [toast]);
  const toastInfo = useCallback((msg, opts) => toast(msg, { ...opts, type: 'info' }), [toast]);

  const value: UIFeedbackContextValue = {
    confirm,
    toast,
    toastSuccess,
    toastError,
    toastWarning,
    toastInfo,
  };

  return (
    <UIFeedbackContext.Provider value={value}>
      {children}

      <ConfirmDialog
        isOpen={confirmState.isOpen}
        title={confirmState.title}
        message={confirmState.message}
        confirmLabel={confirmState.confirmLabel}
        cancelLabel={confirmState.cancelLabel}
        variant={confirmState.variant}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </UIFeedbackContext.Provider>
  );
};

export default UIFeedbackContext;
