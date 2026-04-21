import { useState } from 'react'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core'
import { useQueryClient } from '@tanstack/react-query'
import { Task, TaskStatus } from '../../types'
import { tasksApi } from '../../api/tasks'
import KanbanColumn from './KanbanColumn'
import KanbanCard from './KanbanCard'
import EditTaskModal from '../modals/EditTaskModal'
import TaskDetailModal from '../modals/TaskDetailModal'

const COLUMNS: { id: TaskStatus; label: string }[] = [
  { id: 'todo', label: 'To Do' },
  { id: 'inprogress', label: 'In Progress' },
  { id: 'review', label: 'Review' },
  { id: 'done', label: 'Done' },
]

interface Props {
  tasks: Task[]
  onTaskUpdated?: () => void
  onAddTask?: (status: TaskStatus) => void
  onTaskDeleted?: () => void
}

export default function KanbanBoard({ tasks, onTaskUpdated, onAddTask, onTaskDeleted }: Props) {
  const [activeId, setActiveId] = useState<number | null>(null)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [detailTask, setDetailTask] = useState<Task | null>(null)
  const qc = useQueryClient()

  const handleDeleteTask = async (taskId: number) => {
    if (!confirm('Delete this task? This cannot be undone.')) return
    await tasksApi.delete(taskId)
    qc.invalidateQueries({ queryKey: ['tasks'] })
    onTaskDeleted?.()
  }

  const handleToggleToday = async (taskId: number) => {
    const task = tasks.find(t => t.id === taskId)
    if (!task) return
    await tasksApi.setToday(taskId, !task.today)
    qc.invalidateQueries({ queryKey: ['tasks'] })
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  const activeTask = activeId ? tasks.find(t => t.id === activeId) : null

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as number)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveId(null)
    const { active, over } = event
    if (!over) return

    const taskId = active.id as number
    const newStatus = over.id as TaskStatus

    const task = tasks.find(t => t.id === taskId)
    if (!task || task.status === newStatus) return

    try {
      await tasksApi.updateStatus(taskId, newStatus)
      qc.invalidateQueries({ queryKey: ['tasks'] })
      onTaskUpdated?.()
    } catch (err) {
      console.error('Failed to update task status', err)
    }
  }

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 h-full min-h-0" style={{ overflowX: 'auto', paddingBottom: 8 }}>
          {COLUMNS.map(col => (
            <KanbanColumn
              key={col.id}
              id={col.id}
              label={col.label}
              tasks={tasks.filter(t => t.status === col.id)}
              onAddTask={onAddTask ? () => onAddTask(col.id) : undefined}
              onDeleteTask={handleDeleteTask}
              onEditTask={(id) => setEditingTask(tasks.find(t => t.id === id) ?? null)}
              onCardClick={(id) => setDetailTask(tasks.find(t => t.id === id) ?? null)}
              onToggleToday={handleToggleToday}
            />
          ))}
        </div>
        <DragOverlay>
          {activeTask ? <KanbanCard task={activeTask} isDragging /> : null}
        </DragOverlay>
      </DndContext>
      {detailTask && (
        <TaskDetailModal
          task={detailTask}
          onClose={() => setDetailTask(null)}
          onUpdated={() => {
            qc.invalidateQueries({ queryKey: ['tasks'] })
            // keep modal open but refresh task data
            const refreshed = tasks.find(t => t.id === detailTask.id)
            if (refreshed) setDetailTask(refreshed)
          }}
        />
      )}
      {editingTask && (
        <EditTaskModal
          task={editingTask}
          onClose={() => setEditingTask(null)}
          onSaved={() => {
            qc.invalidateQueries({ queryKey: ['tasks'] })
            onTaskUpdated?.()
            setEditingTask(null)
          }}
        />
      )}
    </>
  )
}
