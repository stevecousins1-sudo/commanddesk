import { api } from './client'
import { Employee, AgendaItem } from '../types'

export const employeesApi = {
  getAll: () => api.get<Employee[]>('/employees'),
  create: (data: Partial<Employee>) => api.post<Employee>('/employees', data),
  update: (id: number, data: Partial<Employee>) => api.put<Employee>(`/employees/${id}`, data),
  updateAgendaItems: (id: number, agenda_items: AgendaItem[]) =>
    api.patch<Employee>(`/employees/${id}/agenda-items`, { agenda_items }),
  addMeetingNote: (id: number, data: { date: string; summary?: string; items?: string[] }) =>
    api.post<Employee>(`/employees/${id}/meeting-notes`, data),
  delete: (id: number) => api.delete<void>(`/employees/${id}`),
}
