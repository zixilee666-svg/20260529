import { apiClient } from './api';
import type { Material } from '@/types';

export const materialService = {
  list: (params?: { category?: string; search?: string }) => {
    const query = new URLSearchParams();
    if (params?.category) query.set('category', params.category);
    if (params?.search) query.set('search', params.search);
    const qs = query.toString();
    return apiClient.get<Material[]>(`/materials${qs ? `?${qs}` : ''}`);
  },

  get: (id: string) => apiClient.get<Material>(`/materials/${id}`),

  create: (material: Partial<Material>) => apiClient.post<Material>('/materials', material),

  update: (id: string, material: Partial<Material>) =>
    apiClient.put<Material>(`/materials/${id}`, material),

  delete: (id: string) => apiClient.delete<null>(`/materials/${id}`),

  toggleFavorite: (id: string) => apiClient.post<Material>(`/materials/${id}/favorite`),
};
