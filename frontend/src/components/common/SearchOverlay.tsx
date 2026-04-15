import { useState, useRef, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { projectsApi } from '../../api/projects'
import { tasksApi } from '../../api/tasks'
import { employeesApi } from '../../api/employees'
import { useAppStore } from '../../store/useAppStore'

interface Props {
  onClose: () => void
}

export default function SearchOverlay({ onClose }: Props) {
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const { navigateToProject, navigateToEmployee, setView } = useAppStore()

  const { data: projects = [] } = useQuery({ queryKey: ['projects'], queryFn: projectsApi.getAll })
  const { data: tasks = [] } = useQuery({ queryKey: ['tasks'], queryFn: () => tasksApi.getAll() })
  const { data: employees = [] } = useQuery({ queryKey: ['employees'], queryFn: employeesApi.getAll })

  useEffect(() => { inputRef.current?.focus() }, [])

  const q = query.toLowerCase().trim()
  const results = q === '' ? [] : [
    ...projects.filter(p => p.name.toLowerCase().includes(q) || p.client?.toLowerCase().includes(q))
      .map(p => ({ type: 'project' as const, id: p.id, label: p.name, sub: p.client || 'Project' })),
    ...tasks.filter(t => t.title.toLowerCase().includes(q))
      .map(t => ({ type: 'task' as const, id: t.id, label: t.title, sub: t.project_name || 'Task' })),
    ...employees.filter(e => e.name.toLowerCase().includes(q) || e.role.toLowerCase().includes(q))
      .map(e => ({ type: 'employee' as const, id: e.id, label: e.name, sub: e.role })),
  ].slice(0, 8)

  const handleSelect = (item: typeof results[0]) => {
    if (item.type === 'project') navigateToProject(item.id)
    else if (item.type === 'employee') navigateToEmployee(item.id)
    else { setView('all-tasks') }
    onClose()
  }

  const typeIcon = { project: '◈', task: '◻', employee: '◉' }
  const typeColor = { project: 'var(--blue-bright)', task: 'var(--text-2)', employee: 'var(--green)' }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-24"
      style={{ background: 'rgba(7,9,15,0.85)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="w-full rounded-xl overflow-hidden"
        style={{
          maxWidth: '560px',
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border-light)',
          boxShadow: '0 24px 64px rgba(0,0,0,0.7)',
        }}
      >
        <div className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: results.length ? '1px solid var(--border)' : 'none' }}>
          <span style={{ color: 'var(--text-3)', fontSize: 16 }}>⌕</span>
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search projects, tasks, people..."
            className="flex-1 bg-transparent outline-none text-sm"
            style={{ color: 'var(--text-1)', fontFamily: 'DM Sans, sans-serif' }}
          />
          <kbd className="font-mono text-xs px-1.5 py-0.5 rounded" style={{ background: 'var(--bg-card)', color: 'var(--text-3)', border: '1px solid var(--border)' }}>Esc</kbd>
        </div>
        {results.length > 0 && (
          <div className="py-2">
            {results.map((item, i) => (
              <button
                key={i}
                onClick={() => handleSelect(item)}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors"
                style={{ color: 'var(--text-1)' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-card)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <span style={{ color: typeColor[item.type], fontSize: 14 }}>{typeIcon[item.type]}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm truncate">{item.label}</div>
                  <div className="text-xs truncate" style={{ color: 'var(--text-3)' }}>{item.sub}</div>
                </div>
                <span className="font-mono text-xs" style={{ color: 'var(--text-3)' }}>{item.type}</span>
              </button>
            ))}
          </div>
        )}
        {q && results.length === 0 && (
          <div className="px-4 py-8 text-center text-sm" style={{ color: 'var(--text-3)' }}>
            No results for "{query}"
          </div>
        )}
      </div>
    </div>
  )
}
