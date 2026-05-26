import { apiClient } from './api';
import type { Library } from '@/types';

export const libraryService = {
  list: () => apiClient.get<Library[]>('/libraries'),

  get: (id: string) => apiClient.get<Library>(`/libraries/${id}`),

  create: (library: Partial<Library>) => apiClient.post<Library>('/libraries', library),

  update: (id: string, library: Partial<Library>) =>
    apiClient.put<Library>(`/libraries/${id}`, library),

  delete: (id: string) => apiClient.delete<null>(`/libraries/${id}`),

  addPaper: (libraryId: string, paperId: string) =>
    apiClient.post<Library>(`/libraries/${libraryId}/papers`, { paperId }),

  removePaper: (libraryId: string, paperId: string) =>
    apiClient.delete<Library>(`/libraries/${libraryId}/papers/${paperId}`),
};
