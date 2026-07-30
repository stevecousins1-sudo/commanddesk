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
  error: string | null
  setView: (view: View) => void
  setSelectedProject: (id: number | null) => void
  setSelectedEmployee: (id: number | null) => void
  setSearchOpen: (open: boolean) => void
  navigateToProject: (id: number) => void
  navigateToEmployee: (id: number) => void
  toggleTheme: () => void
  showError: (message: string) => void
  clearError: () => void
}

export const useAppStore = create<AppState>((set) => ({
  view: 'dashboard',
  selectedProjectId: null,
  selectedEmployeeId: null,
  searchOpen: false,
  theme: storedTheme,
  error: null,
  setView: (view) => set({ view }),
  setSelectedProject: (id) => set({ selectedProjectId: id }),
  setSelectedEmployee: (id) => set({ selectedEmployeeId: id }),
  setSearchOpen: (open) => set({ searchOpen: open }),
  showError: (message) => set({ error: message }),
  clearError: () => set({ error: null }),
  navigateToProject: (id) => set({ view: 'project', selectedProjectId: id }),
  navigateToEmployee: (id) => set({ view: 'employee', selectedEmployeeId: id }),
  toggleTheme: () => set((state) => {
    const next: Theme = state.theme === 'dark' ? 'light' : 'dark'
    localStorage.setItem('theme', next)
    document.documentElement.setAttribute('data-theme', next)
    return { theme: next }
  }),
}))

/**
 * Surfaces a failed background mutation to the user.
 *
 * Handlers that fire a write and refresh a query have no form to show an inline
 * error in; without this they would swallow the failure (or reject unhandled) and
 * leave the UI silently stale. Callable outside React so handlers stay terse.
 */
export function reportError(err: unknown, fallback: string): void {
  const message = err instanceof Error && err.message ? err.message : fallback
  useAppStore.getState().showError(message)
}
