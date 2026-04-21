import { useDroppable } from '@dnd-kit/core'
import { Task, TaskStatus } from '../../types'
import KanbanCard from './KanbanCard'

const COLUMN_COLORS: Record<TaskStatus, string> = {
  todo: 'var(--text-3)',
  inprogress: 'var(--blue)',
  review: 'var(--amber)',
  done: 'var(--green)',
}

interface Props {
  id: TaskStatus
  label: string
  tasks: Task[]
  onAddTask?: () => void
  onDeleteTask?: (id: number) => void
  onEditTask?: (id: number) => void
  onCardClick?: (id: number) => void
  onToggleToday?: (id: number) => void
}

export default function KanbanColumn({ id, label, tasks, onAddTask, onDeleteTask, onEditTask, onCardClick, onToggleToday }: Props) {
  const { setNodeRef, isOver } = useDroppable({ id })

  return (
    <div
      className="flex flex-col flex-shrink-0 rounded-xl"
      style={{
        width: 280,
        background: isOver ? 'var(--bg-elevated)' : 'var(--bg-surface)',
        border: `1px solid ${isOver ? 'var(--border-light)' : 'var(--border)'}`,
        transition: 'background 0.15s, border-color 0.15s',
        minHeight: 400,
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: COLUMN_COLORS[id] }} />
          <span className="text-sm font-medium" style={{ color: 'var(--text-1)' }}>{label}</span>
          <span
            className="font-mono text-xs px-1.5 py-0.5 rounded"
            style={{ background: 'var(--bg-card)', color: 'var(--text-3)' }}
          >
            {tasks.length}
          </span>
        </div>
        {onAddTask && (
          <button
            onClick={onAddTask}
            className="w-6 h-6 flex items-center justify-center rounded text-sm transition-colors"
            style={{ color: 'var(--text-3)' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-1)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-3)')}
          >
            +
          </button>
        )}
      </div>

      {/* Cards */}
      <div ref={setNodeRef} className="flex-1 p-3 space-y-2 overflow-y-auto" style={{ minHeight: 80 }}>
        {tasks.map(task => (
          <KanbanCard key={task.id} task={task} onDelete={onDeleteTask ? () => onDeleteTask(task.id) : undefined} onEdit={onEditTask ? () => onEditTask(task.id) : undefined} onCardClick={onCardClick ? () => onCardClick(task.id) : undefined} onToggleToday={onToggleToday ? () => onToggleToday(task.id) : undefined} />
        ))}
        {tasks.length === 0 && (
          <div
            className="flex items-center justify-center h-16 rounded-lg text-xs"
            style={{ border: '1px dashed var(--border)', color: 'var(--text-3)' }}
          >
            Drop here
          </div>
        )}
      </div>
    </div>
  )
}
