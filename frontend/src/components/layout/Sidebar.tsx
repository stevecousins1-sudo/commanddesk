import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAppStore } from '../../store/useAppStore'
import { projectsApi } from '../../api/projects'
import { employeesApi } from '../../api/employees'
import { tasksApi } from '../../api/tasks'
import NewProjectModal from '../modals/NewProjectModal'
import AddEmployeeModal from '../modals/AddEmployeeModal'

const SectionHeader = ({
  label,
  count,
  open,
  onToggle,
  onAdd,
}: {
  label: string
  count: number
  open: boolean
  onToggle: () => void
  onAdd: () => void
}) => (
  <div className="flex items-center justify-between px-3 py-1.5 group">
    <button
      onClick={onToggle}
      className="flex items-center gap-1.5 text-xs font-mono font-medium uppercase tracking-widest transition-colors"
      style={{ color: 'var(--text-3)' }}
    >
      <span style={{ fontSize: 8, transform: open ? 'rotate(90deg)' : 'none', display: 'inline-block', transition: 'transform 0.15s' }}>▶</span>
      {label}
      <span className="ml-1" style={{ color: 'var(--text-3)' }}>{count}</span>
    </button>
    <button
      onClick={onAdd}
      className="w-5 h-5 flex items-center justify-center rounded transition-colors opacity-0 group-hover:opacity-100"
      style={{ color: 'var(--text-3)' }}
      onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-1)')}
      onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-3)')}
    >
      +
    </button>
  </div>
)

const NavItem = ({
  label,
  active,
  onClick,
  badge,
  dot,
  icon,
  indent,
  color,
}: {
  label: string
  active: boolean
  onClick: () => void
  badge?: number
  dot?: boolean
  icon?: string
  indent?: boolean
  color?: string
}) => (
  <button
    onClick={onClick}
    className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors text-left"
    style={{
      paddingLeft: indent ? '28px' : undefined,
      background: active ? 'var(--bg-card)' : 'transparent',
      color: active ? 'var(--text-1)' : 'var(--text-2)',
    }}
    onMouseEnter={e => { if (!active) e.currentTarget.style.color = 'var(--text-1)' }}
    onMouseLeave={e => { if (!active) e.currentTarget.style.color = 'var(--text-2)' }}
  >
    {color && (
      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
    )}
    {!color && icon && <span className="flex-shrink-0" style={{ fontSize: 13 }}>{icon}</span>}
    <span className="flex-1 truncate text-sm">{label}</span>
    {dot && (
      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: 'var(--amber)' }} />
    )}
    {badge !== undefined && badge > 0 && (
      <span
        className="text-xs font-mono px-1.5 py-0.5 rounded-md flex-shrink-0"
        style={{ background: 'rgba(248,113,113,0.2)', color: 'var(--red)', border: '1px solid rgba(248,113,113,0.3)', fontSize: 10 }}
      >
        {badge}
      </span>
    )}
  </button>
)

export default function Sidebar() {
  const { view, selectedProjectId, selectedEmployeeId, setView, setSearchOpen, navigateToProject, navigateToEmployee, theme, toggleTheme } = useAppStore()
  const qc = useQueryClient()

  const [projectsOpen, setProjectsOpen] = useState(true)
  const [peopleOpen, setPeopleOpen] = useState(true)
  const [showNewProject, setShowNewProject] = useState(false)
  const [showAddEmployee, setShowAddEmployee] = useState(false)

  const { data: projects = [] } = useQuery({ queryKey: ['projects'], queryFn: projectsApi.getAll })
  const { data: employees = [] } = useQuery({ queryKey: ['employees'], queryFn: employeesApi.getAll })
  const { data: tasks = [] } = useQuery({ queryKey: ['tasks'], queryFn: () => tasksApi.getAll() })

  const dueThisWeekCount = tasks.filter(t => {
    if (!t.due_date || t.status === 'done') return false
    const due = new Date(t.due_date)
    const now = new Date()
    const week = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    return due >= now && due <= week
  }).length

  const todayCount = tasks.filter(t => t.today && t.status !== 'done').length

  const adhocCount = tasks.filter(t => t.category === 'adhoc' && t.status !== 'done').length

  const hasBlockedTask = (projectId: number) =>
    tasks.some(t => t.project_id === projectId && t.status === 'review')

  const hasPendingAgenda = (employee: { agenda_items: { done: boolean }[] }) =>
    employee.agenda_items.some(a => !a.done)

  return (
    <>
      <aside
        className="flex flex-col flex-shrink-0 h-full"
        style={{
          width: 256,
          background: 'var(--bg-surface)',
          borderRight: '1px solid var(--border)',
        }}
      >
        {/* Logo */}
        <div className="px-4 py-4 flex-shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'var(--blue)', fontSize: 14 }}>
              ⌘
            </div>
            <span className="font-syne font-bold text-base" style={{ color: 'var(--text-1)' }}>CommandDesk</span>
          </div>
        </div>

        {/* Search */}
        <div className="px-3 py-3 flex-shrink-0">
          <button
            onClick={() => setSearchOpen(true)}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors"
            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-3)' }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--border-light)')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
          >
            <span style={{ fontSize: 13 }}>⌕</span>
            <span className="flex-1 text-left">Search...</span>
            <kbd className="font-mono text-xs" style={{ color: 'var(--text-3)' }}>⌘K</kbd>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 pb-2 space-y-1 min-h-0">
          {/* Overview */}
          <div className="mb-2">
            <p className="px-3 py-1.5 text-xs font-mono uppercase tracking-widest" style={{ color: 'var(--text-3)' }}>Overview</p>
            <NavItem label="Dashboard" active={view === 'dashboard'} onClick={() => setView('dashboard')} icon="▣" />
            <NavItem label="All Tasks" active={view === 'all-tasks'} onClick={() => setView('all-tasks')} icon="⊞" />
            <NavItem
              label="Things to do Today"
              active={view === 'today'}
              onClick={() => setView('today')}
              icon="☀"
              badge={todayCount}
            />
            <NavItem
              label="Due This Week"
              active={view === 'due-this-week'}
              onClick={() => setView('due-this-week')}
              icon="◷"
              badge={dueThisWeekCount}
            />
          </div>

          {/* Projects */}
          <div className="mb-2">
            <SectionHeader
              label="Projects"
              count={projects.length}
              open={projectsOpen}
              onToggle={() => setProjectsOpen(o => !o)}
              onAdd={() => setShowNewProject(true)}
            />
            {projectsOpen && (
              <div className="overflow-y-auto" style={{ maxHeight: 220 }}>
                {projects.map(p => (
                  <NavItem
                    key={p.id}
                    label={p.name}
                    active={view === 'project' && selectedProjectId === p.id}
                    onClick={() => navigateToProject(p.id)}
                    dot={hasBlockedTask(p.id)}
                    color={p.color}
                    indent
                  />
                ))}
                {projects.length === 0 && (
                  <p className="px-7 py-1 text-xs" style={{ color: 'var(--text-3)' }}>No projects yet</p>
                )}
              </div>
            )}
          </div>

          {/* Tasks */}
          <div className="mb-2">
            <p className="px-3 py-1.5 text-xs font-mono uppercase tracking-widest" style={{ color: 'var(--text-3)' }}>Tasks</p>
            <NavItem
              label="Ad-hoc Tasks"
              active={view === 'adhoc-tasks'}
              onClick={() => setView('adhoc-tasks')}
              icon="◈"
              badge={adhocCount}
            />
            <NavItem
              label="Staff Calls"
              active={view === 'staff-calls'}
              onClick={() => setView('staff-calls')}
              icon="◎"
            />
          </div>

          {/* People */}
          <div>
            <SectionHeader
              label="People"
              count={employees.length}
              open={peopleOpen}
              onToggle={() => setPeopleOpen(o => !o)}
              onAdd={() => setShowAddEmployee(true)}
            />
            {peopleOpen && (
              <div className="overflow-y-auto" style={{ maxHeight: 220 }}>
                {employees.map(e => (
                  <NavItem
                    key={e.id}
                    label={e.name}
                    active={view === 'employee' && selectedEmployeeId === e.id}
                    onClick={() => navigateToEmployee(e.id)}
                    dot={hasPendingAgenda(e)}
                    color={e.color}
                    indent
                  />
                ))}
                {employees.length === 0 && (
                  <p className="px-7 py-1 text-xs" style={{ color: 'var(--text-3)' }}>No team members yet</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Theme toggle */}
        <div className="px-3 py-3 flex-shrink-0" style={{ borderTop: '1px solid var(--border)' }}>
          <button
            onClick={toggleTheme}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors"
            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-2)' }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--border-light)')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
          >
            <span style={{ fontSize: 15 }}>{theme === 'dark' ? '☀' : '☽'}</span>
            <span style={{ fontFamily: 'DM Sans, sans-serif' }}>{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>
          </button>
        </div>
      </aside>

      {showNewProject && (
        <NewProjectModal
          onClose={() => setShowNewProject(false)}
          onCreated={() => { qc.invalidateQueries({ queryKey: ['projects'] }); setShowNewProject(false) }}
        />
      )}
      {showAddEmployee && (
        <AddEmployeeModal
          onClose={() => setShowAddEmployee(false)}
          onCreated={() => { qc.invalidateQueries({ queryKey: ['employees'] }); setShowAddEmployee(false) }}
        />
      )}
    </>
  )
}
