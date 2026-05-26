import React, { createContext, useReducer, useCallback } from 'react';
import type { UserSettings, CitationFormat, ThemeMode } from '@/types';
import { useLocalStorage } from '@/hooks/useLocalStorage';

interface SettingsState extends UserSettings {}

type SettingsAction =
  | { type: 'SET_THEME'; payload: ThemeMode }
  | { type: 'SET_CITATION_FORMAT'; payload: CitationFormat }
  | { type: 'SET_NOTIFICATION'; key: keyof UserSettings['notifications']; value: boolean }
  | { type: 'RESET' };

interface SettingsContextType extends SettingsState {
  setTheme: (theme: ThemeMode) => void;
  setCitationFormat: (format: CitationFormat) => void;
  setNotification: (key: keyof UserSettings['notifications'], value: boolean) => void;
  resetSettings: () => void;
}

export const SettingsContext = createContext<SettingsContextType | null>(null);

const defaultSettings: UserSettings = {
  theme: 'system',
  citationFormat: 'ieee',
  notifications: {
    newPapers: true,
    readingReminders: true,
    projectUpdates: true,
    pointsChange: false,
  },
};

function settingsReducer(state: SettingsState, action: SettingsAction): SettingsState {
  switch (action.type) {
    case 'SET_THEME':
      return { ...state, theme: action.payload };
    case 'SET_CITATION_FORMAT':
      return { ...state, citationFormat: action.payload };
    case 'SET_NOTIFICATION':
      return { ...state, notifications: { ...state.notifications, [action.key]: action.value } };
    case 'RESET':
      return defaultSettings;
    default:
      return state;
  }
}

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [storedSettings, setStoredSettings] = useLocalStorage<UserSettings>('joan_academic_settings', defaultSettings);
  const [state, dispatch] = useReducer(settingsReducer, storedSettings);

  const syncToStorage = useCallback((newState: SettingsState) => {
    setStoredSettings(newState);
  }, [setStoredSettings]);

  const setTheme = useCallback((theme: ThemeMode) => {
    dispatch({ type: 'SET_THEME', payload: theme });
    syncToStorage({ ...state, theme });
  }, [state, syncToStorage]);

  const setCitationFormat = useCallback((format: CitationFormat) => {
    dispatch({ type: 'SET_CITATION_FORMAT', payload: format });
    syncToStorage({ ...state, citationFormat: format });
  }, [state, syncToStorage]);

  const setNotification = useCallback((key: keyof UserSettings['notifications'], value: boolean) => {
    dispatch({ type: 'SET_NOTIFICATION', key, value });
    syncToStorage({ ...state, notifications: { ...state.notifications, [key]: value } });
  }, [state, syncToStorage]);

  const resetSettings = useCallback(() => {
    dispatch({ type: 'RESET' });
    syncToStorage(defaultSettings);
  }, [syncToStorage]);

  return (
    <SettingsContext.Provider value={{ ...state, setTheme, setCitationFormat, setNotification, resetSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = React.useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
