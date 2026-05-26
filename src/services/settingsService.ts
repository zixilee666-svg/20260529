import { apiClient } from './api';
import type { UserSettings } from '@/types';

export const settingsService = {
  get: () => apiClient.get<UserSettings>('/settings'),

  update: (settings: Partial<UserSettings>) =>
    apiClient.put<UserSettings>('/settings', settings),
};
