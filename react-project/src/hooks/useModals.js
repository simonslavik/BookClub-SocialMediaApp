import { useState, useCallback } from 'react';

/**
 * Manages multiple modal open/close states via a single hook.
 *
 * Usage:
 *   const { isOpen, open, close, toggle } = useModals([
 *     'invite', 'settings', 'addBook', 'calendar'
 *   ]);
 *
 *   <button onClick={() => open('invite')}>Open Invite</button>
 *   {isOpen('invite') && <InviteModal onClose={() => close('invite')} />}
 */
export function useModals(modalNames = []) {
  const initial = {};
  modalNames.forEach((name) => {
    initial[name] = false;
  });

  const [modals, setModals] = useState(initial);

  const open = useCallback((name) => {
    setModals((prev) => ({ ...prev, [name]: true }));
  }, []);

  const close = useCallback((name) => {
    setModals((prev) => ({ ...prev, [name]: false }));
  }, []);

  const toggle = useCallback((name) => {
    setModals((prev) => ({ ...prev, [name]: !prev[name] }));
  }, []);

  const isOpen = useCallback(
    (name) => !!modals[name],
    [modals],
  );

  return { modals, open, close, toggle, isOpen };
}
