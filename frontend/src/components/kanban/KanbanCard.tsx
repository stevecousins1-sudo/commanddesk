import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { Task } from '../../types'
import PriorityBadge from '../common/PriorityBadge'

const PRIORITY_DOT: Record<string, string> = {
  Critical: 'var(--red)',
  High: 'var(--amber)',
  Medium: 'var(--blue)',
  Low: 'var(--green)',
}

interface Props {
  task: Task
  isDragging?: boolean
  onDelete?: () => void
  onEdit?: () => void
  onCardClick?: () => void
}

export default function KanbanCard({ task, isDragging, onDelete, onEdit, onCardClick }: Props) {
  const { attributes, listeners, setNodeRef, transform, isDragging: dragging } = useDraggable({
    id: task.id,
  })

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    opacity: dragging ? 0.4 : 1,
    cursor: dragging ? 'grabbing' : 'grab',
  }

  const isOverdue = task.due_date && task.status !== 'done' && new Date(task.due_date) < new Date()

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        background: isDragging ? 'var(--bg-elevated)' : 'var(--bg-card)',
        border: `1px solid ${isDragging ? 'var(--border-light)' : 'var(--border)'}`,
        borderRadius: 10,
        padding: '10px 12px',
        boxShadow: isDragging ? '0 8px 24px rgba(0,0,0,0.5)' : 'none',
      }}
      {...attributes}
      {...listeners}
      onClick={onCardClick}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className="text-sm leading-snug" style={{ color: 'var(--text-1)', fontWeight: 500 }}>
          {task.title}
        </span>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span className="w-2 h-2 rounded-full" style={{ background: PRIORITY_DOT[task.priority] || 'var(--blue)' }} />
          {onEdit && (
            <button
              onPointerDown={e => e.stopPropagation()}
              onClick={e => { e.stopPropagation(); onEdit() }}
              title="Edit task"
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', fontSize: 11, lineHeight: 1, padding: '1px 3px', borderRadius: 3 }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--blue-bright)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-3)')}
            >✎</button>
          )}
          {onDelete && (
            <button
              onPointerDown={e => e.stopPropagation()}
              onClick={e => { e.stopPropagation(); onDelete() }}
              title="Delete task"
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', fontSize: 12, lineHeight: 1, padding: '1px 3px', borderRadius: 3 }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--red)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-3)')}
            >✕</button>
          )}
        </div>
      </div>
      <div className="flex items-center flex-wrap gap-1.5">
        <PriorityBadge priority={task.priority as any} />
        {task.project_name && (
          <span
            className="font-mono text-xs px-1.5 py-0.5 rounded"
            style={{ background: 'rgba(96,165,250,0.1)', color: 'var(--blue-bright)', border: '1px solid rgba(96,165,250,0.2)', fontSize: 10 }}
          >
            {task.project_name}
          </span>
        )}
        {task.due_date && (
          <span
            className="font-mono text-xs"
            style={{ color: isOverdue ? 'var(--red)' : 'var(--text-3)', fontSize: 10 }}
          >
            {isOverdue ? '⚠ ' : ''}{new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </span>
        )}
        {task.assignee && (
          <span
            className="font-mono text-xs px-1.5 py-0.5 rounded"
            style={{ background: 'rgba(74,144,217,0.12)', color: 'var(--text-2)', border: '1px solid rgba(74,144,217,0.2)', fontSize: 10 }}
          >
            {task.assignee}
          </span>
        )}
      </div>
      {task.status_updates?.length > 0 && (
        <div className="mt-2 pt-2" style={{ borderTop: '1px solid var(--border)' }}>
          <p className="text-xs truncate" style={{ color: 'var(--text-3)', fontStyle: 'italic' }}>
            ↳ {task.status_updates[0].text}
          </p>
        </div>
      )}
    </div>
  )
}
