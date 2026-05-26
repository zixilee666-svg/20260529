import { apiClient } from './api';
import type { Paper, Note, Highlight, PaginatedResponse } from '@/types';

export const paperService = {
  list: (params?: {
    search?: string;
    tag?: string;
    page?: number;
    pageSize?: number;
    favorite?: boolean;
  }) => {
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    if (params?.tag) query.set('tag', params.tag);
    if (params?.page) query.set('page', String(params.page));
    if (params?.pageSize) query.set('pageSize', String(params.pageSize));
    if (params?.favorite) query.set('favorite', 'true');
    const qs = query.toString();
    return apiClient.get<PaginatedResponse<Paper>>(`/papers${qs ? `?${qs}` : ''}`);
  },

  get: (id: string) => apiClient.get<Paper>(`/papers/${id}`),

  create: (paper: Partial<Paper>) => apiClient.post<Paper>('/papers', paper),

  update: (id: string, paper: Partial<Paper>) => apiClient.put<Paper>(`/papers/${id}`, paper),

  delete: (id: string) => apiClient.delete<null>(`/papers/${id}`),

  toggleFavorite: (id: string) => apiClient.post<Paper>(`/papers/${id}/favorite`),

  // Notes
  getNotes: (paperId: string) => apiClient.get<Note[]>(`/papers/${paperId}/notes`),
  addNote: (paperId: string, content: string) =>
    apiClient.post<Note>(`/papers/${paperId}/notes`, { content }),

  // Highlights
  getHighlights: (paperId: string) => apiClient.get<Highlight[]>(`/papers/${paperId}/highlights`),
  addHighlight: (paperId: string, highlight: Omit<Highlight, 'id' | 'createdAt'>) =>
    apiClient.post<Highlight>(`/papers/${paperId}/highlights`, highlight),
};
