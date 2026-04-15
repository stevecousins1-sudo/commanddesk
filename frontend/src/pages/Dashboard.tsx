import { useQuery } from '@tanstack/react-query'
import { tasksApi } from '../api/tasks'
import { projectsApi } from '../api/projects'
import { employeesApi } from '../api/employees'
import { useAppStore } from '../store/useAppStore'

const StatCard = ({ label, value, color, onClick }: { label: string; value: number; color: string; onClick?: () => void }) => (
  <div
    onClick={onClick}
    className="rounded-xl p-5 flex flex-col gap-2"
    style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      cursor: onClick ? 'pointer' : 'default',
    }}
    onMouseEnter={e => { if (onClick) (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-light)' }}
    onMouseLeave={e => { if (onClick) (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)' }}
  >
    <span className="text-3xl font-syne font-bold" style={{ color }}>{value}</span>
    <span className="text-sm" style={{ color: 'var(--text-2)' }}>{label}</span>
  </div>
)

export default function Dashboard() {
  const { setView } = useAppStore()
  const { data: tasks = [] } = useQuery({ queryKey: ['tasks'], queryFn: () => tasksApi.getAll() })
  const { data: projects = [] } = useQuery({ queryKey: ['projects'], queryFn: projectsApi.getAll })
  const { data: employees = [] } = useQuery({ queryKey: ['employees'], queryFn: employeesApi.getAll })

  const todo = tasks.filter(t => t.status === 'todo').length
  const inprogress = tasks.filter(t => t.status === 'inprogress').length
  const review = tasks.filter(t => t.status === 'review').length
  const done = tasks.filter(t => t.status === 'done').length

  const now = new Date()
  const week = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
  const dueThisWeek = tasks.filter(t => {
    if (!t.due_date || t.status === 'done') return false
    const d = new Date(t.due_date)
    return d >= now && d <= week
  })

  const overdue = tasks.filter(t => {
    if (!t.due_date || t.status === 'done') return false
    return new Date(t.due_date) < now
  })

  const pendingAgenda = employees.filter(e => e.agenda_items.some(a => !a.done))

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="font-syne font-bold text-2xl mb-1" style={{ color: 'var(--text-1)' }}>Dashboard</h1>
        <p className="text-sm" style={{ color: 'var(--text-2)' }}>
          {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Task stats */}
      <div>
        <h2 className="text-xs font-mono uppercase tracking-widest mb-3" style={{ color: 'var(--text-3)' }}>Tasks</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard label="To Do" value={todo} color="var(--text-2)" onClick={() => setView('all-tasks')} />
          <StatCard label="In Progress" value={inprogress} color="var(--blue)" onClick={() => setView('all-tasks')} />
          <StatCard label="In Review" value={review} color="var(--amber)" onClick={() => setView('all-tasks')} />
          <StatCard label="Completed" value={done} color="var(--green)" onClick={() => setView('all-tasks')} />
        </div>
      </div>

      {/* Second row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <StatCard label="Projects" value={projects.length} color="var(--cyan)" />
        <StatCard label="Team Members" value={employees.length} color="var(--blue-bright)" />
        <StatCard label="Overdue Tasks" value={overdue.length} color="var(--red)" onClick={() => setView('due-this-week')} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Due this week */}
        <div className="rounded-xl p-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <h2 className="font-syne font-semibold text-sm mb-4" style={{ color: 'var(--text-1)' }}>Due This Week</h2>
          {dueThisWeek.length === 0 ? (
            <p className="text-sm" style={{ color: 'var(--text-3)' }}>Nothing due this week</p>
          ) : (
            <div className="space-y-2">
              {dueThisWeek.slice(0, 6).map(t => (
                <div key={t.id} className="flex items-center justify-between gap-2">
                  <span className="text-sm truncate" style={{ color: 'var(--text-1)' }}>{t.title}</span>
                  <span className="font-mono text-xs flex-shrink-0" style={{ color: 'var(--text-3)' }}>
                    {new Date(t.due_date!).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                </div>
              ))}
              {dueThisWeek.length > 6 && (
                <button className="text-xs" style={{ color: 'var(--blue)' }} onClick={() => setView('due-this-week')}>
                  +{dueThisWeek.length - 6} more
                </button>
              )}
            </div>
          )}
        </div>

        {/* Team agenda */}
        <div className="rounded-xl p-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <h2 className="font-syne font-semibold text-sm mb-4" style={{ color: 'var(--text-1)' }}>Pending 1:1 Agenda</h2>
          {pendingAgenda.length === 0 ? (
            <p className="text-sm" style={{ color: 'var(--text-3)' }}>All agenda items cleared</p>
          ) : (
            <div className="space-y-2">
              {pendingAgenda.slice(0, 5).map(e => {
                const count = e.agenda_items.filter(a => !a.done).length
                return (
                  <div key={e.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold font-mono"
                        style={{ background: e.color + '33', color: e.color, fontSize: 10 }}
                      >
                        {e.initials}
                      </div>
                      <span className="text-sm" style={{ color: 'var(--text-1)' }}>{e.name}</span>
                    </div>
                    <span
                      className="font-mono text-xs px-1.5 py-0.5 rounded"
                      style={{ background: 'rgba(245,158,11,0.15)', color: 'var(--amber)', border: '1px solid rgba(245,158,11,0.3)', fontSize: 10 }}
                    >
                      {count} item{count !== 1 ? 's' : ''}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
