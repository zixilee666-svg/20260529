import { apiClient } from './api';
import { api as libApi } from '@/lib/api';
import type { Material } from '@/types';

export interface SpaceConfig {
  username: string;
  displayName: string;
  institution?: string;
  researchField?: string;
  avatar?: string;
  bio?: string;
  isPublic: boolean;
  paperCount: number;
  projectCount: number;
  viewCount: number;
  popularity: number;
  lastActiveAt: string;
  createdAt: string;
  theme?: {
    primaryColor?: string;
    layout?: string;
    showPapers?: boolean;
    showProjects?: boolean;
    showStats?: boolean;
  };
}

// Mock模式：使用lib/api.ts中的mock数据
const IS_MOCK = import.meta.env.VITE_MOCK_MODE !== 'false';

export const spaceService = {
  list: async (params?: { search?: string; field?: string; sort?: string; page?: number; limit?: number }) => {
    if (IS_MOCK) {
      // Mock模式：直接使用lib/api的mock数据
      return libApi.getSpaces({
        search: params?.search,
        field: params?.field,
        sort: params?.sort,
        page: params?.page,
        limit: params?.limit || 12,
      });
    }

    // 真实API请求
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    if (params?.field) query.set('field', params.field);
    if (params?.sort) query.set('sort', params.sort);
    if (params?.page) query.set('page', String(params.page));
    query.set('limit', '12');
    return apiClient.get<{ spaces: SpaceConfig[]; total: number }>(`/spaces?${query}`);
  },

  getProfile: (username: string) => apiClient.get<SpaceConfig>(`/spaces/${username}`),

  getMaterials: (username: string) =>
    apiClient.get<{ success: boolean; data: Material[] }>(`/spaces/${username}/materials`),

  getTheme: (username: string) => apiClient.get<any>(`/spaces/${username}/theme`),

  updateConfig: (config: Partial<SpaceConfig>) =>
    apiClient.put<SpaceConfig>('/spaces/me', config),

  recordView: (username: string) =>
    apiClient.post<null>(`/spaces/${username}/view`),
};
