import { api } from './client'
import { Project } from '../types'

export const projectsApi = {
  getAll: () => api.get<Project[]>('/projects'),
  create: (data: Partial<Project>) => api.post<Project>('/projects', data),
  update: (id: number, data: Partial<Project>) => api.put<Project>(`/projects/${id}`, data),
  delete: (id: number) => api.delete<void>(`/projects/${id}`),
  addNote: (id: number, text: string, by?: string) =>
    api.post<Project>(`/projects/${id}/notes`, { text, by }),
}
