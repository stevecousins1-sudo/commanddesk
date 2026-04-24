import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { tasksApi } from '../api/tasks'
import { projectsApi } from '../api/projects'
import { employeesApi } from '../api/employees'
import { TaskStatus } from '../types'
import KanbanBoard from '../components/kanban/KanbanBoard'
import AddTaskModal from '../components/modals/AddTaskModal'

export default function AllTasks() {
  const qc = useQueryClient()
  const [showAdd, setShowAdd] = useState(false)
  const [defaultStatus, setDefaultStatus] = useState<TaskStatus>('todo')
  const [assigneeFilter, setAssigneeFilter] = useState('')

  const { data: tasks = [], isLoading } = useQuery({ queryKey: ['tasks'], queryFn: () => tasksApi.getAll() })
  const { data: projects = [] } = useQuery({ queryKey: ['projects'], queryFn: projectsApi.getAll })
  const { data: employees = [] } = useQuery({ queryKey: ['employees'], queryFn: employeesApi.getAll })

  const handleAddTask = (status: TaskStatus) => {
    setDefaultStatus(status)
    setShowAdd(true)
  }

  const filteredTasks = assigneeFilter
    ? tasks.filter(t => t.assignee === assigneeFilter)
    : tasks

  return (
    <div className="flex flex-col h-full min-h-0 gap-4">
      <div className="flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="font-syne font-bold text-2xl" style={{ color: 'var(--text-1)' }}>All Tasks</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-2)' }}>
            {filteredTasks.length}{assigneeFilter ? ` of ${tasks.length}` : ''} tasks
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={assigneeFilter}
            onChange={e => setAssigneeFilter(e.target.value)}
            style={{
              padding: '7px 12px',
              borderRadius: 8,
              fontSize: 14,
              fontFamily: 'DM Sans, sans-serif',
              background: 'var(--bg-elevated)',
              border: `1px solid ${assigneeFilter ? 'var(--blue)' : 'var(--border)'}`,
              color: assigneeFilter ? 'var(--blue)' : 'var(--text-2)',
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            <option value="">All Assignees</option>
            <option value="Me">Me</option>
            {employees.map(emp => (
              <option key={emp.id} value={emp.name}>{emp.name}</option>
            ))}
          </select>
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-opacity"
            style={{ background: 'var(--blue)', color: '#fff' }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
          >
            + Add Task
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-40">
          <span style={{ color: 'var(--text-3)' }}>Loading tasks...</span>
        </div>
      ) : (
        <div className="flex-1 min-h-0">
          <KanbanBoard
            tasks={filteredTasks}
            onAddTask={handleAddTask}
            onTaskUpdated={() => qc.invalidateQueries({ queryKey: ['tasks'] })}
          />
        </div>
      )}

      {showAdd && (
        <AddTaskModal
          onClose={() => setShowAdd(false)}
          onCreated={() => { qc.invalidateQueries({ queryKey: ['tasks'] }); setShowAdd(false) }}
          defaultCategory="proj"
          projects={projects}
        />
      )}
    </div>
  )
}
