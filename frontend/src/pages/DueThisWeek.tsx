import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { tasksApi } from '../api/tasks'
import PriorityBadge from '../components/common/PriorityBadge'
import EditTaskModal from '../components/modals/EditTaskModal'
import TaskDetailModal from '../components/modals/TaskDetailModal'
import { Task } from '../types'
import { reportError } from '../store/useAppStore'
import { formatShortDate, isDueWithin, isOverdue } from '../utils/date'

export default function DueThisWeek() {
  const qc = useQueryClient()
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [detailTask, setDetailTask] = useState<Task | null>(null)
  const { data: tasks = [], isLoading } = useQuery({ queryKey: ['tasks'], queryFn: () => tasksApi.getAll() })

  const todayTasks = tasks.filter(t => t.today && t.status !== 'done')
  const todayIds = new Set(todayTasks.map(t => t.id))

  // A task due today belongs in "due this week", not "overdue".
  const dueThisWeek = tasks.filter(t => {
    if (todayIds.has(t.id) || t.status === 'done') return false
    return isDueWithin(t.due_date, 7)
  })

  const overdue = tasks.filter(t => {
    if (todayIds.has(t.id) || t.status === 'done') return false
    return isOverdue(t.due_date)
  })

  const handleComplete = async (task: Task) => {
    try {
      await tasksApi.complete(task.id)
      qc.invalidateQueries({ queryKey: ['tasks'] })
    } catch (err) {
      reportError(err, 'Failed to complete task')
    }
  }

  const handleToggleToday = async (task: Task) => {
    try {
      await tasksApi.setToday(task.id, !task.today)
      qc.invalidateQueries({ queryKey: ['tasks'] })
    } catch (err) {
      reportError(err, 'Failed to update Today flag')
    }
  }

  const TaskRow = ({ task, isOv, onEdit }: { task: Task; isOv?: boolean; onEdit: () => void }) => (
    <div
      className="flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer"
      style={{ background: 'var(--bg-card)', border: `1px solid ${isOv ? 'rgba(248,113,113,0.2)' : 'var(--border)'}` }}
      onClick={() => setDetailTask(task)}
    >
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
      <button
        onClick={e => { e.stopPropagation(); onEdit() }}
        title="Edit task"
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', fontSize: 13, padding: '0 4px' }}
        onMouseEnter={e => (e.currentTarget.style.color = 'var(--blue-bright)')}
        onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-3)')}
      >✎</button>
      <button
        onClick={e => { e.stopPropagation(); handleToggleToday(task) }}
        title={task.today ? 'Remove from Today' : 'Add to Today'}
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: task.today ? 'var(--amber)' : 'var(--text-3)', fontSize: 14, padding: '0 2px' }}
        onMouseEnter={e => (e.currentTarget.style.color = 'var(--amber)')}
        onMouseLeave={e => (e.currentTarget.style.color = task.today ? 'var(--amber)' : 'var(--text-3)')}
      >☀</button>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate" style={{ color: 'var(--text-1)' }}>{task.title}</div>
        {task.project_name && (
          <div className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>{task.project_name}</div>
        )}
      </div>
      <PriorityBadge priority={task.priority as any} />
      {task.assignee && (
        <span className="font-mono text-xs px-1.5 py-0.5 rounded flex-shrink-0" style={{ background: 'rgba(74,144,217,0.12)', color: 'var(--text-2)', border: '1px solid rgba(74,144,217,0.2)', fontSize: 10 }}>
          {task.assignee}
        </span>
      )}
      {task.due_date && (
        <span
          className="font-mono text-xs flex-shrink-0"
          style={{ color: isOv ? 'var(--red)' : 'var(--text-2)' }}
        >
          {isOv ? '⚠ ' : ''}{formatShortDate(task.due_date)}
        </span>
      )}
    </div>
  )

  if (isLoading) return <div className="flex items-center justify-center h-40"><span style={{ color: 'var(--text-3)' }}>Loading...</span></div>

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="font-syne font-bold text-2xl" style={{ color: 'var(--text-1)' }}>Due This Week</h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text-2)' }}>{todayTasks.length + dueThisWeek.length + overdue.length} tasks need attention</p>
      </div>

      {todayTasks.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-xs font-mono uppercase tracking-widest" style={{ color: 'var(--amber)' }}>Today — {todayTasks.length}</h2>
          {todayTasks.map(t => <TaskRow key={t.id} task={t} onEdit={() => setEditingTask(t)} />)}
        </div>
      )}

      {overdue.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-xs font-mono uppercase tracking-widest" style={{ color: 'var(--red)' }}>Overdue — {overdue.length}</h2>
          {overdue.map(t => <TaskRow key={t.id} task={t} isOv onEdit={() => setEditingTask(t)} />)}
        </div>
      )}

      {dueThisWeek.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-xs font-mono uppercase tracking-widest" style={{ color: 'var(--text-3)' }}>Due this week — {dueThisWeek.length}</h2>
          {dueThisWeek.map(t => <TaskRow key={t.id} task={t} onEdit={() => setEditingTask(t)} />)}
        </div>
      )}

      {todayTasks.length === 0 && dueThisWeek.length === 0 && overdue.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20" style={{ color: 'var(--text-3)' }}>
          <div className="text-4xl mb-3">✓</div>
          <p className="text-sm">All caught up! Nothing due this week.</p>
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
