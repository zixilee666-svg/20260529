import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useEffect } from 'react';
import type { ThemeMode } from '@/types';

interface ThemeState {
  mode: ThemeMode;
  resolvedMode: 'light' | 'dark';
  setMode: (mode: ThemeMode) => void;
  resolveSystem: () => void;
}

// Helper to get system preference
const getSystemPreference = (): 'light' | 'dark' => {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

// Helper to apply theme to document
const applyTheme = (mode: 'light' | 'dark') => {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  if (mode === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
};

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      mode: 'system',
      resolvedMode: getSystemPreference(),

      setMode: (mode) => {
        const resolved = mode === 'system' ? getSystemPreference() : mode;
        applyTheme(resolved);
        set({ mode, resolvedMode: resolved });
      },

      resolveSystem: () => {
        const { mode } = get();
        if (mode === 'system') {
          const resolved = getSystemPreference();
          applyTheme(resolved);
          set({ resolvedMode: resolved });
        }
      },
    }),
    {
      name: 'joan_academic_theme',
      partialize: (state) => ({ mode: state.mode }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          const resolved = state.mode === 'system' ? getSystemPreference() : state.mode;
          applyTheme(resolved);
          state.resolvedMode = resolved;
        }
      },
    }
  )
);

// Hook for components to sync DOM with store
export function useThemeSync() {
  const { mode, resolvedMode, resolveSystem } = useThemeStore();

  useEffect(() => {
    // Apply initial theme
    applyTheme(resolvedMode);

    // Listen for system preference changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (mode === 'system') {
        resolveSystem();
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [mode, resolvedMode, resolveSystem]);
}

// Helper to check if dark mode
export function useIsDark() {
  const { resolvedMode } = useThemeStore();
  return resolvedMode === 'dark';
}
