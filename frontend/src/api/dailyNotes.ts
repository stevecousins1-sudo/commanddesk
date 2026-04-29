import { api } from './client'
import { DailyNote } from '../types'

export const dailyNotesApi = {
  getAll: () => api.get<DailyNote[]>('/daily-notes'),
  add: (text: string) => api.post<DailyNote>('/daily-notes', { text }),
}
