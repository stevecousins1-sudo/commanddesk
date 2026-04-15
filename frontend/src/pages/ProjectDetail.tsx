import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAppStore } from '../store/useAppStore'
import { projectsApi } from '../api/projects'
import { tasksApi } from '../api/tasks'
import PriorityBadge from '../components/common/PriorityBadge'
import KanbanBoard from '../components/kanban/KanbanBoard'
import AddTaskModal from '../components/modals/AddTaskModal'

export default function ProjectDetail() {
  const { selectedProjectId, setView } = useAppStore()
  const qc = useQueryClient()
  const [showAddTask, setShowAddTask] = useState(false)
  const [noteText, setNoteText] = useState('')
  const [addingNote, setAddingNote] = useState(false)

  const { data: projects = [] } = useQuery({ queryKey: ['projects'], queryFn: projectsApi.getAll })
  const { data: allTasks = [] } = useQuery({ queryKey: ['tasks'], queryFn: () => tasksApi.getAll() })

  const project = projects.find(p => p.id === selectedProjectId)
  const tasks = allTasks.filter(t => t.project_id === selectedProjectId)

  const handleDelete = async () => {
    if (!project || !confirm(`Delete project "${project.name}"? This cannot be undone.`)) return
    await projectsApi.delete(project.id)
    qc.invalidateQueries({ queryKey: ['projects'] })
    qc.invalidateQueries({ queryKey: ['tasks'] })
    setView('dashboard')
  }

  const handleAddNote = async () => {
    if (!noteText.trim() || !project) return
    setAddingNote(true)
    try {
      await projectsApi.addNote(project.id, noteText.trim())
      qc.invalidateQueries({ queryKey: ['projects'] })
      setNoteText('')
    } finally {
      setAddingNote(false)
    }
  }

  if (!project) {
    return (
      <div className="flex items-center justify-center h-40">
        <span style={{ color: 'var(--text-3)' }}>Select a project from the sidebar</span>
      </div>
    )
  }

  const statuses = ['todo', 'inprogress', 'review', 'done'] as const
  const statusLabels = { todo: 'To Do', inprogress: 'In Progress', review: 'Review', done: 'Done' }

  return (
    <div className="flex flex-col h-full min-h-0 gap-5">
      {/* Header */}
      <div className="flex-shrink-0">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex-shrink-0" style={{ background: project.color + '33', border: `2px solid ${project.color}` }}>
              <div className="w-full h-full rounded-xl" style={{ background: project.color, opacity: 0.7 }} />
            </div>
            <div>
              <h1 className="font-syne font-bold text-2xl" style={{ color: 'var(--text-1)' }}>{project.name}</h1>
              {project.client && <p className="text-sm" style={{ color: 'var(--text-2)' }}>{project.client}</p>}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <PriorityBadge priority={project.priority as any} size="md" />
            {project.due_date && (
              <span className="font-mono text-xs px-2 py-1 rounded" style={{ background: 'var(--bg-card)', color: 'var(--text-2)', border: '1px solid var(--border)' }}>
                Due {new Date(project.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            )}
            <button
              onClick={() => setShowAddTask(true)}
              className="px-3 py-1.5 rounded-lg text-sm font-medium"
              style={{ background: 'var(--blue)', color: '#fff' }}
            >
              + Task
            </button>
            <button
              onClick={handleDelete}
              title="Delete project"
              className="px-3 py-1.5 rounded-lg text-sm font-medium"
              style={{ background: 'rgba(248,113,113,0.1)', color: 'var(--red)', border: '1px solid rgba(248,113,113,0.3)' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(248,113,113,0.2)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'rgba(248,113,113,0.1)')}
            >
              Delete
            </button>
          </div>
        </div>
        {project.description && (
          <p className="mt-3 text-sm" style={{ color: 'var(--text-2)', maxWidth: 700 }}>{project.description}</p>
        )}
        {/* Task counts */}
        <div className="flex gap-4 mt-3">
          {statuses.map(s => (
            <div key={s} className="text-sm">
              <span className="font-mono" style={{ color: 'var(--text-3)' }}>{statusLabels[s]}: </span>
              <span style={{ color: 'var(--text-1)' }}>{tasks.filter(t => t.status === s).length}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Kanban */}
      <div className="flex-1 min-h-0">
        <KanbanBoard
          tasks={tasks}
          onTaskUpdated={() => qc.invalidateQueries({ queryKey: ['tasks'] })}
          onAddTask={() => setShowAddTask(true)}
        />
      </div>

      {/* Notes */}
      <div className="flex-shrink-0 rounded-xl p-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <h3 className="font-syne font-semibold text-sm mb-3" style={{ color: 'var(--text-1)' }}>Project Notes</h3>
        <div className="flex gap-2 mb-3">
          <input
            className="flex-1 px-3 py-2 rounded-lg text-sm outline-none"
            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-1)', fontFamily: 'DM Sans, sans-serif' }}
            placeholder="Add a note..."
            value={noteText}
            onChange={e => setNoteText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleAddNote() }}
          />
          <button
            onClick={handleAddNote}
            disabled={addingNote || !noteText.trim()}
            className="px-3 py-2 rounded-lg text-sm font-medium"
            style={{ background: 'var(--blue)', color: '#fff', opacity: addingNote || !noteText.trim() ? 0.5 : 1 }}
          >
            Add
          </button>
        </div>
        {project.notes.length > 0 && (
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {[...project.notes].reverse().map((note, i) => (
              <div key={i} className="text-sm px-3 py-2 rounded-lg" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
                <p style={{ color: 'var(--text-1)' }}>{note.text}</p>
                <p className="font-mono text-xs mt-1" style={{ color: 'var(--text-3)' }}>
                  {new Date(note.timestamp).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {showAddTask && (
        <AddTaskModal
          onClose={() => setShowAddTask(false)}
          onCreated={() => { qc.invalidateQueries({ queryKey: ['tasks'] }); setShowAddTask(false) }}
          defaultCategory="proj"
          defaultProjectId={project.id}
          defaultProjectName={project.name}
          projects={projects}
        />
      )}
    </div>
  )
}
