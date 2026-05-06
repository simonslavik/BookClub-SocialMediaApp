import { useContext } from 'react';
import UIFeedbackContext from '@context/UIFeedbackContext';

/**
 * Hook to show a styled confirmation dialog.
 *
 * Usage:
 *   const { confirm } = useConfirm();
 *   const ok = await confirm('Delete this item?', { title: 'Delete', variant: 'danger', confirmLabel: 'Delete' });
 *   if (ok) { ... }
 */
export const useConfirm = () => {
  const { confirm } = useContext(UIFeedbackContext);
  if (!confirm) {
    throw new Error('useConfirm must be used within a UIFeedbackProvider');
  }
  return { confirm };
};

/**
 * Hook to show toast notifications.
 *
 * Usage:
 *   const { toastSuccess, toastError } = useToast();
 *   toastSuccess('Item created!');
 *   toastError('Something went wrong');
 */
export const useToast = () => {
  const { toast, toastSuccess, toastError, toastWarning, toastInfo } = useContext(UIFeedbackContext);
  if (!toast) {
    throw new Error('useToast must be used within a UIFeedbackProvider');
  }
  return { toast, toastSuccess, toastError, toastWarning, toastInfo };
};
