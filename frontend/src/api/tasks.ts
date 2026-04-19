import { api } from './client'
import { Task, TaskStatus } from '../types'

export const tasksApi = {
  getAll: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : ''
    return api.get<Task[]>(`/tasks${qs}`)
  },
  create: (data: Partial<Task>) => api.post<Task>('/tasks', data),
  update: (id: number, data: Partial<Task>) => api.put<Task>(`/tasks/${id}`, data),
  updateStatus: (id: number, status: TaskStatus) =>
    api.patch<Task>(`/tasks/${id}/status`, { status }),
  complete: (id: number) => api.patch<Task>(`/tasks/${id}/complete`, {}),
  addNote: (id: number, text: string, by?: string) =>
    api.post<Task>(`/tasks/${id}/notes`, { text, by }),
  delete: (id: number) => api.delete<void>(`/tasks/${id}`),
  addStatusUpdate: (id: number, text: string) => api.post<Task>(`/tasks/${id}/status-updates`, { text }),
}
