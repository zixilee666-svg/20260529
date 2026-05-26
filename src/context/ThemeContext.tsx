import React, { createContext, useReducer, useCallback, useEffect } from 'react';
import type { ThemeMode } from '@/types';

interface ThemeState {
  mode: ThemeMode;
  resolvedMode: 'light' | 'dark';
}

type ThemeAction =
  | { type: 'SET_MODE'; payload: ThemeMode }
  | { type: 'RESOLVE_SYSTEM'; payload: 'light' | 'dark' };

interface ThemeContextType extends ThemeState {
  setMode: (mode: ThemeMode) => void;
}

export const ThemeContext = createContext<ThemeContextType | null>(null);

function themeReducer(state: ThemeState, action: ThemeAction): ThemeState {
  switch (action.type) {
    case 'SET_MODE':
      return { ...state, mode: action.payload };
    case 'RESOLVE_SYSTEM':
      if (state.mode === 'system') {
        return { ...state, resolvedMode: action.payload };
      }
      return state;
    default:
      return state;
  }
}

function getInitialMode(): ThemeMode {
  try {
    const stored = localStorage.getItem('joan_academic_theme');
    if (stored === 'light' || stored === 'dark' || stored === 'system') return stored;
  } catch { /* ignore */ }
  return 'system';
}

function resolveMode(mode: ThemeMode): 'light' | 'dark' {
  if (mode === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return mode;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const initialMode = getInitialMode();
  const [state, dispatch] = useReducer(themeReducer, {
    mode: initialMode,
    resolvedMode: resolveMode(initialMode),
  });

  const setMode = useCallback((mode: ThemeMode) => {
    localStorage.setItem('joan_academic_theme', mode);
    dispatch({ type: 'SET_MODE', payload: mode });
  }, []);

  useEffect(() => {
    dispatch({ type: 'RESOLVE_SYSTEM', payload: resolveMode(state.mode) });
  }, [state.mode]);

  useEffect(() => {
    const root = document.documentElement;
    if (state.resolvedMode === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [state.resolvedMode]);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => {
      if (state.mode === 'system') {
        dispatch({ type: 'RESOLVE_SYSTEM', payload: e.matches ? 'dark' : 'light' });
      }
    };
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, [state.mode]);

  return (
    <ThemeContext.Provider value={{ ...state, setMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = React.useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
