import React, { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAppStore } from '../store/useAppStore'
import { projectsApi } from '../api/projects'
import { tasksApi } from '../api/tasks'
import PriorityBadge from '../components/common/PriorityBadge'
import KanbanBoard from '../components/kanban/KanbanBoard'
import AddTaskModal from '../components/modals/AddTaskModal'

function formatTimestamp(ts: string) {
  return new Date(ts).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit', hour12: true,
  })
}

export default function ProjectDetail() {
  const { selectedProjectId, setView } = useAppStore()
  const qc = useQueryClient()
  const [showAddTask, setShowAddTask] = useState(false)
  const [noteText, setNoteText] = useState('')
  const [addingNote, setAddingNote] = useState(false)
  const [notesOpen, setNotesOpen] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState({ name: '', client: '', description: '', due_date: '', priority: 'Medium', color: '#60a5fa' })
  const [saving, setSaving] = useState(false)

  const { data: projects = [] } = useQuery({ queryKey: ['projects'], queryFn: projectsApi.getAll })
  const { data: allTasks = [] } = useQuery({ queryKey: ['tasks'], queryFn: () => tasksApi.getAll() })

  const project = projects.find(p => p.id === selectedProjectId)
  const tasks = allTasks.filter(t => t.project_id === selectedProjectId)

  const startEdit = () => {
    setEditForm({
      name: project!.name,
      client: project!.client || '',
      description: project!.description || '',
      due_date: project!.due_date || '',
      priority: project!.priority,
      color: project!.color,
    })
    setEditing(true)
  }

  const saveEdit = async () => {
    if (!editForm.name.trim() || !project) return
    setSaving(true)
    try {
      await projectsApi.update(project.id, { ...editForm, priority: editForm.priority as any })
      qc.invalidateQueries({ queryKey: ['projects'] })
      setEditing(false)
    } finally {
      setSaving(false)
    }
  }

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

  const editInputStyle: React.CSSProperties = {
    padding: '7px 10px', borderRadius: 8, fontSize: 13,
    background: 'var(--bg-elevated)', border: '1px solid var(--border)',
    color: 'var(--text-1)', fontFamily: 'DM Sans, sans-serif', outline: 'none', width: '100%',
  }

  const noteCount = project.notes.length

  return (
    <div className="flex flex-col h-full min-h-0 gap-5">
      {/* Header */}
      <div className="flex-shrink-0">
        {editing ? (
          <div className="rounded-xl p-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <div className="flex gap-2 mb-3">
              <input
                style={{ ...editInputStyle, flex: 1 }}
                value={editForm.name}
                onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Project name"
              />
              <input
                type="color"
                value={editForm.color}
                onChange={e => setEditForm(f => ({ ...f, color: e.target.value }))}
                style={{ width: 38, height: 36, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-elevated)', cursor: 'pointer', padding: 2, flexShrink: 0 }}
                title="Project color"
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
              <input
                style={editInputStyle}
                value={editForm.client}
                onChange={e => setEditForm(f => ({ ...f, client: e.target.value }))}
                placeholder="Client (optional)"
              />
              <select
                style={editInputStyle}
                value={editForm.priority}
                onChange={e => setEditForm(f => ({ ...f, priority: e.target.value }))}
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
            </div>
            <div className="mb-3">
              <input
                type="date"
                style={editInputStyle}
                value={editForm.due_date}
                onChange={e => setEditForm(f => ({ ...f, due_date: e.target.value }))}
              />
            </div>
            <div className="mb-4">
              <textarea
                style={{ ...editInputStyle, resize: 'vertical', minHeight: 72 }}
                value={editForm.description}
                onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Description (optional)"
                rows={3}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setEditing(false)}
                className="px-3 py-1.5 rounded-lg text-sm font-medium"
                style={{ background: 'var(--bg-card)', color: 'var(--text-2)', border: '1px solid var(--border)' }}
              >
                Cancel
              </button>
              <button
                onClick={saveEdit}
                disabled={saving || !editForm.name.trim()}
                className="px-3 py-1.5 rounded-lg text-sm font-medium"
                style={{ background: 'var(--blue)', color: '#fff', opacity: saving || !editForm.name.trim() ? 0.5 : 1 }}
              >
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        ) : (
          <>
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
                {/* Notes button */}
                <button
                  onClick={() => setNotesOpen(o => !o)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium"
                  style={{
                    background: notesOpen ? 'var(--bg-elevated)' : 'var(--bg-card)',
                    color: notesOpen ? 'var(--text-1)' : 'var(--text-2)',
                    border: `1px solid ${notesOpen ? 'var(--border-light)' : 'var(--border)'}`,
                    transition: 'all 0.15s',
                  }}
                >
                  <span style={{ fontSize: 13 }}>📝</span>
                  Notes
                  {noteCount > 0 && (
                    <span
                      style={{
                        background: 'var(--bg-elevated)',
                        border: '1px solid var(--border)',
                        color: 'var(--text-3)',
                        borderRadius: 10,
                        fontSize: 10,
                        fontFamily: 'DM Mono, monospace',
                        padding: '1px 6px',
                      }}
                    >
                      {noteCount}
                    </span>
                  )}
                </button>
                <button
                  onClick={startEdit}
                  className="px-3 py-1.5 rounded-lg text-sm font-medium"
                  style={{ background: 'var(--bg-card)', color: 'var(--text-2)', border: '1px solid var(--border)' }}
                >
                  Edit
                </button>
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
          </>
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

      {/* Notes slide-in panel */}
      <>
        {/* Backdrop */}
        {notesOpen && (
          <div
            onClick={() => setNotesOpen(false)}
            style={{
              position: 'fixed', inset: 0,
              zIndex: 39,
              background: 'rgba(0,0,0,0.25)',
            }}
          />
        )}

        {/* Panel */}
        <div
          style={{
            position: 'fixed',
            top: 0,
            right: 0,
            bottom: 0,
            width: 400,
            zIndex: 40,
            display: 'flex',
            flexDirection: 'column',
            background: 'var(--bg-surface)',
            borderLeft: '1px solid var(--border)',
            boxShadow: notesOpen ? '-12px 0 48px rgba(0,0,0,0.3)' : 'none',
            transform: notesOpen ? 'translateX(0)' : 'translateX(100%)',
            transition: 'transform 0.25s cubic-bezier(0.4,0,0.2,1)',
          }}
        >
          {/* Panel header */}
          <div
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '18px 20px',
              borderBottom: '1px solid var(--border)',
              flexShrink: 0,
            }}
          >
            <div>
              <h3 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 16, color: 'var(--text-1)', margin: 0 }}>
                Project Notes
              </h3>
              <p style={{ fontSize: 12, color: 'var(--text-3)', margin: '3px 0 0 0', fontFamily: 'DM Mono, monospace' }}>
                {project.name} · {noteCount} note{noteCount !== 1 ? 's' : ''}
              </p>
            </div>
            <button
              onClick={() => setNotesOpen(false)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--text-3)', fontSize: 18, lineHeight: 1,
                width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
                borderRadius: 8,
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'var(--bg-elevated)'
                e.currentTarget.style.color = 'var(--text-1)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'none'
                e.currentTarget.style.color = 'var(--text-3)'
              }}
            >
              ✕
            </button>
          </div>

          {/* Add note */}
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
            <textarea
              rows={3}
              placeholder="Write a note…"
              value={noteText}
              onChange={e => setNoteText(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleAddNote()
              }}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 8,
                fontSize: 14,
                fontFamily: 'DM Sans, sans-serif',
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border)',
                color: 'var(--text-1)',
                outline: 'none',
                resize: 'vertical',
                marginBottom: 10,
                boxSizing: 'border-box',
              }}
            />
            <button
              onClick={handleAddNote}
              disabled={addingNote || !noteText.trim()}
              style={{
                width: '100%',
                padding: '9px 16px',
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 600,
                fontFamily: 'DM Sans, sans-serif',
                background: 'var(--blue)',
                color: '#fff',
                border: 'none',
                cursor: addingNote || !noteText.trim() ? 'not-allowed' : 'pointer',
                opacity: addingNote || !noteText.trim() ? 0.5 : 1,
                transition: 'opacity 0.15s',
              }}
            >
              {addingNote ? 'Adding…' : 'Add Note'}
            </button>
            <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 6, textAlign: 'right', fontFamily: 'DM Mono, monospace' }}>
              ⌘ + Enter to save
            </p>
          </div>

          {/* Notes list */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
            {noteCount === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-3)' }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>📝</div>
                <p style={{ fontSize: 13, color: 'var(--text-2)', fontWeight: 500, margin: '0 0 4px 0' }}>No notes yet</p>
                <p style={{ fontSize: 12, margin: 0 }}>Write the first note above</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[...project.notes].reverse().map((note, i) => (
                  <div
                    key={i}
                    style={{
                      background: 'var(--bg-elevated)',
                      border: '1px solid var(--border)',
                      borderRadius: 10,
                      padding: '12px 14px',
                    }}
                  >
                    <p style={{
                      fontSize: 14,
                      color: 'var(--text-1)',
                      lineHeight: 1.6,
                      margin: '0 0 8px 0',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                    }}>
                      {note.text}
                    </p>
                    <p style={{
                      fontSize: 11,
                      fontFamily: 'DM Mono, monospace',
                      color: 'var(--text-3)',
                      margin: 0,
                    }}>
                      {formatTimestamp(note.timestamp)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </>

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
