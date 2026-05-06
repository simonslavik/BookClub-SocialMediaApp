import { useState, useCallback, useEffect } from 'react';

/**
 * View state machine for the bookclub page.
 *
 * Replaces the five separate boolean flags (showBooksHistory, showCalendar,
 * showSuggestions, showMeetings, showSettings) with a single `activeView` enum
 * and provides setter helpers.
 *
 * Possible views: 'chat' | 'books' | 'calendar' | 'suggestions' | 'meetings' | 'settings'
 */
const VIEWS = ['chat', 'books', 'calendar', 'suggestions', 'meetings', 'settings'];

export function useBookclubViews(bookClubId) {
  const [activeView, setActiveView] = useState('chat');
  const [previousView, setPreviousView] = useState(null);

  // Reset to chat when navigating between clubs.
  // Runs in the cleanup phase of the previous bookClubId, so the new
  // render starts with 'chat'.
  useEffect(() => {
    return () => {
      setActiveView('chat');
      setPreviousView(null);
    };
  }, [bookClubId]);

  const switchView = useCallback((view) => {
    if (!VIEWS.includes(view)) return;
    setActiveView(view);
  }, []);

  const openSettings = useCallback(() => {
    setPreviousView(activeView);
    setActiveView('settings');
  }, [activeView]);

  const closeSettings = useCallback(() => {
    setActiveView(previousView || 'chat');
    setPreviousView(null);
  }, [previousView]);

  // Convenience boolean getter — keeps JSX readable
  const is = (view) => activeView === view;

  // Whether we are in a non-chat view — used to hide typing / message input
  const isSpecialView = activeView !== 'chat';

  return {
    activeView,
    switchView,
    openSettings,
    closeSettings,
    is,
    isSpecialView,
    VIEWS,
  };
}
