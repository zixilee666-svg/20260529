import { apiClient } from './api';
import type { ReadingStats } from '@/types';

export const statsService = {
  getReading: () => apiClient.get<ReadingStats>('/stats/reading'),
};
