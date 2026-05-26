import { apiClient } from './api';
import type { Project } from '@/types';

export const projectService = {
  list: () => apiClient.get<Project[]>('/projects'),

  get: (id: string) => apiClient.get<Project>(`/projects/${id}`),

  create: (project: Partial<Project>) => apiClient.post<Project>('/projects', project),

  update: (id: string, project: Partial<Project>) =>
    apiClient.put<Project>(`/projects/${id}`, project),

  delete: (id: string) => apiClient.delete<null>(`/projects/${id}`),
};
