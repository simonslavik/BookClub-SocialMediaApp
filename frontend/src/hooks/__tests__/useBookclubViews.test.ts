import { renderHook, act } from '@testing-library/react';
import { useBookclubViews } from '@hooks/useBookclubViews';

describe('useBookclubViews', () => {
  it('starts with "chat" as the active view', () => {
    const { result } = renderHook(() => useBookclubViews('club-1'));
    expect(result.current.activeView).toBe('chat');
    expect(result.current.isSpecialView).toBe(false);
  });

  it('switches to a valid view', () => {
    const { result } = renderHook(() => useBookclubViews('club-1'));

    act(() => result.current.switchView('calendar'));

    expect(result.current.activeView).toBe('calendar');
    expect(result.current.is('calendar')).toBe(true);
    expect(result.current.is('chat')).toBe(false);
    expect(result.current.isSpecialView).toBe(true);
  });

  it('ignores invalid view names', () => {
    const { result } = renderHook(() => useBookclubViews('club-1'));

    act(() => result.current.switchView('nonexistent'));

    expect(result.current.activeView).toBe('chat');
  });

  it('openSettings stores the previous view and switches to settings', () => {
    const { result } = renderHook(() => useBookclubViews('club-1'));

    // Navigate to books first
    act(() => result.current.switchView('books'));
    expect(result.current.activeView).toBe('books');

    // Open settings
    act(() => result.current.openSettings());
    expect(result.current.activeView).toBe('settings');
    expect(result.current.is('settings')).toBe(true);
  });

  it('closeSettings restores the previous view', () => {
    const { result } = renderHook(() => useBookclubViews('club-1'));

    // books → settings → close should go back to books
    act(() => result.current.switchView('books'));
    act(() => result.current.openSettings());
    act(() => result.current.closeSettings());

    expect(result.current.activeView).toBe('books');
  });

  it('closeSettings falls back to chat when there is no previous view', () => {
    const { result } = renderHook(() => useBookclubViews('club-1'));

    // Open settings directly from chat (default view)
    act(() => result.current.openSettings());
    act(() => result.current.closeSettings());

    expect(result.current.activeView).toBe('chat');
  });

  it('resets to chat when bookClubId changes', () => {
    const { result, rerender } = renderHook(
      ({ id }) => useBookclubViews(id),
      { initialProps: { id: 'club-1' } },
    );

    act(() => result.current.switchView('meetings'));
    expect(result.current.activeView).toBe('meetings');

    // Navigate to a different club
    rerender({ id: 'club-2' });

    // The cleanup effect resets to 'chat'
    expect(result.current.activeView).toBe('chat');
  });
});
