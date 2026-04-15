import { api } from './client'
import { StaffCall, SimpleAgendaItem } from '../types'

export const staffCallsApi = {
  getAll: () => api.get<StaffCall[]>('/staff-calls'),
  create: (data: Partial<StaffCall>) => api.post<StaffCall>('/staff-calls', data),
  update: (id: number, data: Partial<StaffCall>) => api.put<StaffCall>(`/staff-calls/${id}`, data),
  updateAgendaItems: (id: number, agenda_items: SimpleAgendaItem[]) =>
    api.patch<StaffCall>(`/staff-calls/${id}/agenda-items`, { agenda_items }),
  delete: (id: number) => api.delete<void>(`/staff-calls/${id}`),
}
