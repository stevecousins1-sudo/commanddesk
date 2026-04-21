import { useEffect, useState } from 'react'
import { useAppStore } from './store/useAppStore'
import Sidebar from './components/layout/Sidebar'
import Topbar from './components/layout/Topbar'
import SearchOverlay from './components/common/SearchOverlay'
import Dashboard from './pages/Dashboard'
import AllTasks from './pages/AllTasks'
import DueThisWeek from './pages/DueThisWeek'
import ProjectDetail from './pages/ProjectDetail'
import AdHocTasks from './pages/AdHocTasks'
import EmployeeDetail from './pages/EmployeeDetail'
import StaffCalls from './pages/StaffCalls'
import TodayTasks from './pages/TodayTasks'
import PinAuth from './components/PinAuth'

export default function App() {
  const { view, searchOpen, setSearchOpen, theme } = useAppStore()
  const [isAuthenticated, setIsAuthenticated] = useState(
    sessionStorage.getItem('commanddesk_auth') === 'true'
  )

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setSearchOpen(true)
      }
      if (e.key === 'Escape') setSearchOpen(false)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [setSearchOpen])

  const renderView = () => {
    switch (view) {
      case 'dashboard': return <Dashboard />
      case 'all-tasks': return <AllTasks />
      case 'today': return <TodayTasks />
      case 'due-this-week': return <DueThisWeek />
      case 'project': return <ProjectDetail />
      case 'adhoc-tasks': return <AdHocTasks />
      case 'employee': return <EmployeeDetail />
      case 'staff-calls': return <StaffCalls />
      default: return <Dashboard />
    }
  }

  if (!isAuthenticated) {
    return <PinAuth onSuccess={() => setIsAuthenticated(true)} />
  }

  return (
    <div className="flex h-full" style={{ background: 'var(--bg-base)' }}>
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0">
        <Topbar />
        <main className="flex-1 overflow-auto p-6" style={{ background: 'var(--bg-base)' }}>
          {renderView()}
        </main>
      </div>
      {searchOpen && <SearchOverlay onClose={() => setSearchOpen(false)} />}
    </div>
  )
}
