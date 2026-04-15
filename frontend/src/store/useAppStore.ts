import { create } from 'zustand'
import { View } from '../types'

interface AppState {
  view: View
  selectedProjectId: number | null
  selectedEmployeeId: number | null
  searchOpen: boolean
  setView: (view: View) => void
  setSelectedProject: (id: number | null) => void
  setSelectedEmployee: (id: number | null) => void
  setSearchOpen: (open: boolean) => void
  navigateToProject: (id: number) => void
  navigateToEmployee: (id: number) => void
}

export const useAppStore = create<AppState>((set) => ({
  view: 'dashboard',
  selectedProjectId: null,
  selectedEmployeeId: null,
  searchOpen: false,
  setView: (view) => set({ view }),
  setSelectedProject: (id) => set({ selectedProjectId: id }),
  setSelectedEmployee: (id) => set({ selectedEmployeeId: id }),
  setSearchOpen: (open) => set({ searchOpen: open }),
  navigateToProject: (id) => set({ view: 'project', selectedProjectId: id }),
  navigateToEmployee: (id) => set({ view: 'employee', selectedEmployeeId: id }),
}))
