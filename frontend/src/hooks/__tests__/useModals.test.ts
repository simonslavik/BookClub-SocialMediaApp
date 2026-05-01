import { renderHook, act } from '@testing-library/react';
import { useModals } from '@hooks/useModals';

describe('useModals', () => {
  it('initialises all modals as closed', () => {
    const { result } = renderHook(() => useModals(['invite', 'settings', 'addBook']));

    expect(result.current.isOpen('invite')).toBe(false);
    expect(result.current.isOpen('settings')).toBe(false);
    expect(result.current.isOpen('addBook')).toBe(false);
  });

  it('opens a specific modal without affecting others', () => {
    const { result } = renderHook(() => useModals(['invite', 'settings']));

    act(() => result.current.open('invite'));

    expect(result.current.isOpen('invite')).toBe(true);
    expect(result.current.isOpen('settings')).toBe(false);
  });

  it('closes an open modal', () => {
    const { result } = renderHook(() => useModals(['invite']));

    act(() => result.current.open('invite'));
    expect(result.current.isOpen('invite')).toBe(true);

    act(() => result.current.close('invite'));
    expect(result.current.isOpen('invite')).toBe(false);
  });

  it('toggles modal state', () => {
    const { result } = renderHook(() => useModals(['invite']));

    act(() => result.current.toggle('invite'));
    expect(result.current.isOpen('invite')).toBe(true);

    act(() => result.current.toggle('invite'));
    expect(result.current.isOpen('invite')).toBe(false);
  });

  it('returns false for unknown modal names', () => {
    const { result } = renderHook(() => useModals(['invite']));
    expect(result.current.isOpen('nonexistent')).toBe(false);
  });

  it('works with an empty modal list', () => {
    const { result } = renderHook(() => useModals([]));
    expect(result.current.isOpen('anything')).toBe(false);
  });
});
