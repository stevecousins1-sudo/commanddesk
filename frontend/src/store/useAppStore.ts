import { create } from 'zustand'
import { View } from '../types'

type Theme = 'dark' | 'light'

const storedTheme = (localStorage.getItem('theme') as Theme) || 'dark'
document.documentElement.setAttribute('data-theme', storedTheme)

interface AppState {
  view: View
  selectedProjectId: number | null
  selectedEmployeeId: number | null
  searchOpen: boolean
  theme: Theme
  setView: (view: View) => void
  setSelectedProject: (id: number | null) => void
  setSelectedEmployee: (id: number | null) => void
  setSearchOpen: (open: boolean) => void
  navigateToProject: (id: number) => void
  navigateToEmployee: (id: number) => void
  toggleTheme: () => void
}

export const useAppStore = create<AppState>((set) => ({
  view: 'dashboard',
  selectedProjectId: null,
  selectedEmployeeId: null,
  searchOpen: false,
  theme: storedTheme,
  setView: (view) => set({ view }),
  setSelectedProject: (id) => set({ selectedProjectId: id }),
  setSelectedEmployee: (id) => set({ selectedEmployeeId: id }),
  setSearchOpen: (open) => set({ searchOpen: open }),
  navigateToProject: (id) => set({ view: 'project', selectedProjectId: id }),
  navigateToEmployee: (id) => set({ view: 'employee', selectedEmployeeId: id }),
  toggleTheme: () => set((state) => {
    const next: Theme = state.theme === 'dark' ? 'light' : 'dark'
    localStorage.setItem('theme', next)
    document.documentElement.setAttribute('data-theme', next)
    return { theme: next }
  }),
}))
