import { useAppStore } from '../../store/useAppStore'
import { useQuery } from '@tanstack/react-query'
import { projectsApi } from '../../api/projects'
import { employeesApi } from '../../api/employees'

const VIEW_LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  'all-tasks': 'All Tasks',
  'due-this-week': 'Due This Week',
  'adhoc-tasks': 'Ad-hoc Tasks',
  'staff-calls': 'Staff Calls',
}

export default function Topbar() {
  const { view, selectedProjectId, selectedEmployeeId } = useAppStore()

  const { data: projects = [] } = useQuery({ queryKey: ['projects'], queryFn: projectsApi.getAll, enabled: view === 'project' })
  const { data: employees = [] } = useQuery({ queryKey: ['employees'], queryFn: employeesApi.getAll, enabled: view === 'employee' })

  const getLabel = () => {
    if (view === 'project') {
      const p = projects.find(p => p.id === selectedProjectId)
      return p?.name || 'Project'
    }
    if (view === 'employee') {
      const e = employees.find(e => e.id === selectedEmployeeId)
      return e?.name || 'Employee'
    }
    return VIEW_LABELS[view] || view
  }

  const getCrumb = () => {
    if (view === 'project') return ['Projects', getLabel()]
    if (view === 'employee') return ['People', getLabel()]
    return ['Overview', getLabel()]
  }

  const crumb = getCrumb()

  return (
    <div
      className="flex items-center gap-2 px-6 py-3 flex-shrink-0"
      style={{
        background: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border)',
        minHeight: 52,
      }}
    >
      <div className="flex items-center gap-1.5 flex-1 min-w-0">
        {crumb.map((c, i) => (
          <span key={i} className="flex items-center gap-1.5">
            {i > 0 && <span style={{ color: 'var(--text-3)', fontSize: 12 }}>/</span>}
            <span
              className="text-sm"
              style={{ color: i === crumb.length - 1 ? 'var(--text-1)' : 'var(--text-3)' }}
            >
              {c}
            </span>
          </span>
        ))}
      </div>
    </div>
  )
}
