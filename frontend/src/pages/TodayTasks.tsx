import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { tasksApi } from '../api/tasks'
import PriorityBadge from '../components/common/PriorityBadge'
import EditTaskModal from '../components/modals/EditTaskModal'
import TaskDetailModal from '../components/modals/TaskDetailModal'
import { Task } from '../types'

const STATUS_LABEL: Record<string, string> = {
  todo: 'To Do',
  inprogress: 'In Progress',
  review: 'Review',
  done: 'Done',
}
const STATUS_COLOR: Record<string, string> = {
  todo: 'var(--text-3)',
  inprogress: 'var(--blue)',
  review: 'var(--amber)',
  done: 'var(--green)',
}

export default function TodayTasks() {
  const qc = useQueryClient()
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [detailTask, setDetailTask] = useState<Task | null>(null)
  const { data: tasks = [], isLoading } = useQuery({ queryKey: ['tasks'], queryFn: () => tasksApi.getAll() })

  const todayTasks = tasks.filter(t => t.today && t.status !== 'done')

  const handleComplete = async (task: Task) => {
    await tasksApi.complete(task.id)
    qc.invalidateQueries({ queryKey: ['tasks'] })
  }

  const handleRemove = async (task: Task) => {
    await tasksApi.setToday(task.id, false)
    qc.invalidateQueries({ queryKey: ['tasks'] })
  }

  const TaskRow = ({ task, onEdit }: { task: Task; onEdit: () => void }) => (
    <div
      className="flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer"
      style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
      onClick={() => setDetailTask(task)}
    >
      {/* Complete */}
      <button
        onClick={e => { e.stopPropagation(); handleComplete(task) }}
        className="w-5 h-5 rounded flex-shrink-0 flex items-center justify-center border transition-colors"
        style={{ borderColor: 'var(--border-light)' }}
        title="Mark complete"
        onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--green)')}
        onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border-light)')}
      >
        <span style={{ fontSize: 10, color: 'var(--text-3)' }}>✓</span>
      </button>

      {/* Edit */}
      <button
        onClick={e => { e.stopPropagation(); onEdit() }}
        title="Edit task"
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', fontSize: 13, padding: '0 4px' }}
        onMouseEnter={e => (e.currentTarget.style.color = 'var(--blue-bright)')}
        onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-3)')}
      >✎</button>

      {/* Task info */}
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate" style={{ color: 'var(--text-1)' }}>{task.title}</div>
        {task.project_name && (
          <div className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>{task.project_name}</div>
        )}
      </div>

      {/* Priority */}
      <PriorityBadge priority={task.priority as any} />

      {/* Status */}
      <span
        className="font-mono text-xs px-1.5 py-0.5 rounded flex-shrink-0"
        style={{ color: STATUS_COLOR[task.status], background: 'var(--bg-elevated)', border: '1px solid var(--border-light)', fontSize: 10 }}
      >
        {STATUS_LABEL[task.status]}
      </span>

      {/* Assignee */}
      {task.assignee && (
        <span
          className="font-mono text-xs px-1.5 py-0.5 rounded flex-shrink-0"
          style={{ background: 'rgba(74,144,217,0.12)', color: 'var(--text-2)', border: '1px solid rgba(74,144,217,0.2)', fontSize: 10 }}
        >
          {task.assignee}
        </span>
      )}

      {/* Due date */}
      {task.due_date && (
        <span className="font-mono text-xs flex-shrink-0" style={{ color: 'var(--text-2)' }}>
          {new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </span>
      )}

      {/* Remove from Today */}
      <button
        onClick={e => { e.stopPropagation(); handleRemove(task) }}
        title="Remove from Today"
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', fontSize: 13, padding: '0 4px' }}
        onMouseEnter={e => (e.currentTarget.style.color = 'var(--red)')}
        onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-3)')}
      >✕</button>
    </div>
  )

  if (isLoading) return (
    <div className="flex items-center justify-center h-40">
      <span style={{ color: 'var(--text-3)' }}>Loading...</span>
    </div>
  )

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="font-syne font-bold text-2xl" style={{ color: 'var(--text-1)' }}>Things to do Today</h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text-2)' }}>
          {todayTasks.length === 0 ? 'No tasks for today' : `${todayTasks.length} task${todayTasks.length !== 1 ? 's' : ''} to focus on`}
        </p>
      </div>

      {todayTasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20" style={{ color: 'var(--text-3)' }}>
          <div className="text-4xl mb-3">☀</div>
          <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-2)' }}>Nothing planned for today yet</p>
          <p className="text-xs">Use the ☀ button on any task card to add it here</p>
        </div>
      ) : (
        <div className="space-y-2">
          <h2
            className="text-xs font-mono uppercase tracking-widest"
            style={{ color: 'var(--amber)' }}
          >
            Today — {todayTasks.length}
          </h2>
          {todayTasks.map(t => (
            <TaskRow key={t.id} task={t} onEdit={() => setEditingTask(t)} />
          ))}
        </div>
      )}

      {editingTask && (
        <EditTaskModal
          task={editingTask}
          onClose={() => setEditingTask(null)}
          onSaved={() => { qc.invalidateQueries({ queryKey: ['tasks'] }); setEditingTask(null) }}
        />
      )}
      {detailTask && (
        <TaskDetailModal
          task={detailTask}
          onClose={() => setDetailTask(null)}
          onUpdated={() => qc.invalidateQueries({ queryKey: ['tasks'] })}
        />
      )}
    </div>
  )
}
