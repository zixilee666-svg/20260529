import { apiClient } from './api';
import type { User } from '@/types';

export interface AdminStats {
  totalUsers: number;
  totalPapers: number;
  totalProjects: number;
  totalSpaces: number;
  activeUsers: number;
  recentActivities: Array<{ type: string; description: string; timestamp: string }>;
}

export const adminService = {
  getStats: () => apiClient.get<AdminStats>('/admin/stats'),

  getUsers: (params?: { search?: string; page?: number }) => {
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    if (params?.page) query.set('page', String(params.page));
    return apiClient.get<User[]>(`/admin/users?${query}`);
  },

  getUser: (id: string) => apiClient.get<User>(`/admin/users/${id}`),

  updateUserStatus: (id: string, status: 'active' | 'suspended') =>
    apiClient.put<User>(`/admin/users/${id}`, { status }),

  getSpaces: () => apiClient.get<any[]>('/admin/spaces'),

  getLogs: (params?: { limit?: number }) => {
    const query = new URLSearchParams();
    if (params?.limit) query.set('limit', String(params.limit));
    return apiClient.get<any[]>(`/admin/logs?${query}`);
  },
};
