import { createContext, useContext, useState, useEffect, useCallback } from 'react';

interface ThemeContextValue {
  mode: string;
  isDark: boolean;
  setTheme: (mode: string) => void;
  cycleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({} as ThemeContextValue);

// Auto dark mode: system preference OR time-based (8PM - 7AM)
const shouldBeDark = () => {
  // First check system preference
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return true;
  }
  // Fallback: time-based (8 PM to 7 AM)
  const hour = new Date().getHours();
  return hour >= 20 || hour < 7;
};

export const ThemeProvider = ({ children }) => {
  const [mode, setMode] = useState(() => {
    // Restore from localStorage: 'light' | 'dark' | 'auto'
    return localStorage.getItem('theme-mode') || 'auto';
  });

  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('theme-mode') || 'auto';
    if (saved === 'dark') return true;
    if (saved === 'light') return false;
    return shouldBeDark();
  });

  // Apply dark class to <html>
  const applyTheme = useCallback((dark) => {
    const root = document.documentElement;
    if (dark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    setIsDark(dark);
  }, []);

  // When mode changes, persist and apply
  useEffect(() => {
    localStorage.setItem('theme-mode', mode);

    if (mode === 'dark') {
      applyTheme(true);
    } else if (mode === 'light') {
      applyTheme(false);
    } else {
      // Auto mode
      applyTheme(shouldBeDark());
    }
  }, [mode, applyTheme]);

  // In auto mode, listen for system preference changes
  useEffect(() => {
    if (mode !== 'auto') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e) => {
      applyTheme(e.matches || shouldBeDark());
    };

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, [mode, applyTheme]);

  // In auto mode, re-check every 5 minutes for time-based transitions
  useEffect(() => {
    if (mode !== 'auto') return;

    const interval = setInterval(() => {
      applyTheme(shouldBeDark());
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [mode, applyTheme]);

  const setTheme = (newMode) => {
    setMode(newMode);
  };

  // Cycle: auto -> light -> dark -> auto
  const cycleTheme = () => {
    setMode((prev) => {
      if (prev === 'auto') return 'light';
      if (prev === 'light') return 'dark';
      return 'auto';
    });
  };

  return (
    <ThemeContext.Provider value={{ mode, isDark, setTheme, cycleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export default ThemeContext;
