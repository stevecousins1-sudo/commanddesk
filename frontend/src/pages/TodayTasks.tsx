import { useState, useRef, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { tasksApi } from '../api/tasks'
import { dailyNotesApi } from '../api/dailyNotes'
import PriorityBadge from '../components/common/PriorityBadge'
import EditTaskModal from '../components/modals/EditTaskModal'
import TaskDetailModal from '../components/modals/TaskDetailModal'
import { Task, DailyNote } from '../types'

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

interface NoteGroup {
  dateLabel: string
  isToday: boolean
  notes: DailyNote[]
}

function groupNotesByDate(notes: DailyNote[]): NoteGroup[] {
  const today = new Date().toDateString()
  const map = new Map<string, NoteGroup>()
  for (const note of notes) {
    const d = new Date(note.created_at)
    const key = d.toDateString()
    const isToday = key === today
    const dateLabel = isToday
      ? 'Today'
      : d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
    if (!map.has(key)) map.set(key, { dateLabel, isToday, notes: [] })
    map.get(key)!.notes.push(note)
  }
  return Array.from(map.values())
}

function formatTime(ts: string) {
  return new Date(ts).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
}

export default function TodayTasks() {
  const qc = useQueryClient()
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [detailTask, setDetailTask] = useState<Task | null>(null)
  const [noteText, setNoteText] = useState('')
  const [addingNote, setAddingNote] = useState(false)
  const historyRef = useRef<HTMLDivElement>(null)

  const { data: tasks = [], isLoading } = useQuery({ queryKey: ['tasks'], queryFn: () => tasksApi.getAll() })
  const { data: dailyNotes = [] } = useQuery({ queryKey: ['daily-notes'], queryFn: dailyNotesApi.getAll })

  const todayTasks = tasks.filter(t => t.today && t.status !== 'done')
  const noteGroups = groupNotesByDate(dailyNotes)
  const canPost = noteText.trim().length > 0 && !addingNote

  // Scroll history to top after a new note is added
  useEffect(() => {
    if (historyRef.current) historyRef.current.scrollTop = 0
  }, [dailyNotes.length])

  const handleComplete = async (task: Task) => {
    await tasksApi.complete(task.id)
    qc.invalidateQueries({ queryKey: ['tasks'] })
  }

  const handleRemove = async (task: Task) => {
    await tasksApi.setToday(task.id, false)
    qc.invalidateQueries({ queryKey: ['tasks'] })
  }

  const handleAddNote = async () => {
    if (!canPost) return
    setAddingNote(true)
    try {
      await dailyNotesApi.add(noteText.trim())
      qc.invalidateQueries({ queryKey: ['daily-notes'] })
      setNoteText('')
    } finally {
      setAddingNote(false)
    }
  }

  const TaskRow = ({ task, onEdit }: { task: Task; onEdit: () => void }) => (
    <div
      className="flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer"
      style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
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
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate" style={{ color: 'var(--text-1)' }}>{task.title}</div>
        {task.project_name && (
          <div className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>{task.project_name}</div>
        )}
      </div>
      <PriorityBadge priority={task.priority as any} />
      <span
        className="font-mono text-xs px-1.5 py-0.5 rounded flex-shrink-0"
        style={{ color: STATUS_COLOR[task.status], background: 'var(--bg-elevated)', border: '1px solid var(--border-light)', fontSize: 10 }}
      >
        {STATUS_LABEL[task.status]}
      </span>
      {task.assignee && (
        <span
          className="font-mono text-xs px-1.5 py-0.5 rounded flex-shrink-0"
          style={{ background: 'rgba(74,144,217,0.12)', color: 'var(--text-2)', border: '1px solid rgba(74,144,217,0.2)', fontSize: 10 }}
        >
          {task.assignee}
        </span>
      )}
      {task.due_date && (
        <span className="font-mono text-xs flex-shrink-0" style={{ color: 'var(--text-2)' }}>
          {new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </span>
      )}
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
    <div style={{ display: 'flex', gap: 24, height: '100%', minHeight: 0 }}>

      {/* ── Left: Task list ── */}
      <div style={{ flex: 1, minWidth: 0, overflowY: 'auto', paddingRight: 4 }}>
        <div style={{ marginBottom: 24 }}>
          <h1 className="font-syne font-bold text-2xl" style={{ color: 'var(--text-1)' }}>Things to do Today</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-2)' }}>
            {todayTasks.length === 0 ? 'No tasks for today' : `${todayTasks.length} task${todayTasks.length !== 1 ? 's' : ''} to focus on`}
          </p>
        </div>

        {todayTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20" style={{ color: 'var(--text-3)' }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>☀</div>
            <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-2)' }}>Nothing planned for today yet</p>
            <p className="text-xs">Use the ☀ button on any task card to add it here</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <p
              className="text-xs font-mono uppercase tracking-widest"
              style={{ color: 'var(--amber)', marginBottom: 4 }}
            >
              Today — {todayTasks.length}
            </p>
            {todayTasks.map(t => (
              <TaskRow key={t.id} task={t} onEdit={() => setEditingTask(t)} />
            ))}
          </div>
        )}
      </div>

      {/* ── Right: Daily Notes panel ── */}
      <div
        style={{
          width: 340,
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          borderRadius: 16,
          overflow: 'hidden',
        }}
      >
        {/* Panel header */}
        <div style={{ padding: '16px 18px 12px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
          <p style={{ fontFamily: 'DM Mono, monospace', fontSize: 10, color: 'var(--text-3)', letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 2px 0' }}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
          <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 15, color: 'var(--text-1)', margin: 0 }}>
            Daily Notes
          </h2>
        </div>

        {/* Note input */}
        <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
          <textarea
            rows={3}
            placeholder="What's on your mind…"
            value={noteText}
            onChange={e => setNoteText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleAddNote() }}
            style={{
              width: '100%',
              padding: '9px 12px',
              borderRadius: 8,
              fontSize: 13,
              fontFamily: 'DM Sans, sans-serif',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border)',
              color: 'var(--text-1)',
              outline: 'none',
              resize: 'none',
              boxSizing: 'border-box',
              lineHeight: 1.55,
            }}
          />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
            <span style={{ fontSize: 10, fontFamily: 'DM Mono, monospace', color: 'var(--text-3)' }}>
              ⌘ + Enter to save
            </span>
            <button
              onClick={handleAddNote}
              disabled={!canPost}
              style={{
                padding: '6px 14px',
                borderRadius: 7,
                fontSize: 13,
                fontWeight: 600,
                fontFamily: 'DM Sans, sans-serif',
                background: 'var(--blue)',
                color: '#fff',
                border: 'none',
                cursor: canPost ? 'pointer' : 'not-allowed',
                opacity: canPost ? 1 : 0.45,
                transition: 'opacity 0.15s',
              }}
            >
              {addingNote ? 'Saving…' : 'Add Note'}
            </button>
          </div>
        </div>

        {/* Note history */}
        <div ref={historyRef} style={{ flex: 1, overflowY: 'auto', padding: '12px 18px' }}>
          {noteGroups.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-3)', textAlign: 'center', padding: '20px 0' }}>
              <div style={{ fontSize: 28, marginBottom: 10 }}>📋</div>
              <p style={{ fontSize: 13, color: 'var(--text-2)', margin: '0 0 4px 0' }}>No notes yet</p>
              <p style={{ fontSize: 12, margin: 0 }}>Write your first note above</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {noteGroups.map(group => (
                <div key={group.dateLabel}>
                  {/* Date divider */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                    <span style={{
                      fontSize: 10,
                      fontFamily: 'DM Mono, monospace',
                      fontWeight: 600,
                      color: group.isToday ? 'var(--amber)' : 'var(--text-3)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      whiteSpace: 'nowrap',
                    }}>
                      {group.dateLabel}
                    </span>
                    <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                  </div>

                  {/* Notes in this group */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {group.notes.map(note => (
                      <div
                        key={note.id}
                        style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}
                      >
                        {/* Bullet */}
                        <span style={{
                          marginTop: 6,
                          width: 6,
                          height: 6,
                          borderRadius: '50%',
                          flexShrink: 0,
                          background: group.isToday ? 'var(--amber)' : 'var(--text-3)',
                        }} />
                        {/* Content */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{
                            fontSize: 13,
                            color: 'var(--text-1)',
                            lineHeight: 1.6,
                            margin: 0,
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-word',
                          }}>
                            {note.text}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

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
