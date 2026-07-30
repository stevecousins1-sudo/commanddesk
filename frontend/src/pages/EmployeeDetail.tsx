import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAppStore, reportError } from '../store/useAppStore'
import { formatLongDate, formatShortDate, formatWeekdayDate, isOverdue } from '../utils/date'
import { employeesApi } from '../api/employees'
import { tasksApi } from '../api/tasks'
import { AgendaItem, Task } from '../types'
import PriorityBadge from '../components/common/PriorityBadge'
import EditTaskModal from '../components/modals/EditTaskModal'

export default function EmployeeDetail() {
  const { selectedEmployeeId, setView } = useAppStore()
  const qc = useQueryClient()
  const [newAgendaText, setNewAgendaText] = useState('')
  const [meetingDate, setMeetingDate] = useState('')
  const [meetingSummary, setMeetingSummary] = useState('')
  const [savingMeeting, setSavingMeeting] = useState(false)
  const [showMeetingForm, setShowMeetingForm] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState({ name: '', role: '', initials: '', color: '#60a5fa' })
  const [saving, setSaving] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)

  const { data: employees = [] } = useQuery({ queryKey: ['employees'], queryFn: employeesApi.getAll })
  const { data: allTasks = [] } = useQuery({ queryKey: ['tasks'], queryFn: () => tasksApi.getAll() })
  const employee = employees.find(e => e.id === selectedEmployeeId)

  if (!employee) {
    return (
      <div className="flex items-center justify-center h-40">
        <span style={{ color: 'var(--text-3)' }}>Select a team member from the sidebar</span>
      </div>
    )
  }

  const pendingItems = employee.agenda_items.filter(a => !a.done)
  const allDoneItems = employee.agenda_items.filter(a => a.done)

  // Completed items age out after 30 days. Legacy items have no completion date,
  // so they can't be aged out — cap those at the 10 most recent instead.
  const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000
  const undatedToKeep = new Set(allDoneItems.filter(a => !a.date_completed).slice(-10))
  const doneItems = allDoneItems.filter(a =>
    a.date_completed
      ? Date.now() - new Date(a.date_completed).getTime() <= THIRTY_DAYS_MS
      : undatedToKeep.has(a)
  )
  const hiddenDoneCount = allDoneItems.length - doneItems.length

  const toggleAgendaItem = async (idx: number) => {
    const updated = employee.agenda_items.map((item, i) => {
      if (i !== idx) return item
      const done = !item.done
      return { ...item, done, date_completed: done ? new Date().toISOString() : undefined }
    })
    try {
      await employeesApi.updateAgendaItems(employee.id, updated)
      qc.invalidateQueries({ queryKey: ['employees'] })
    } catch (err) {
      reportError(err, 'Failed to update agenda item')
    }
  }

  const addAgendaItem = async () => {
    if (!newAgendaText.trim()) return
    const newItem: AgendaItem = {
      text: newAgendaText.trim(),
      done: false,
      date_added: new Date().toISOString(),
      notes: [],
    }
    try {
      await employeesApi.updateAgendaItems(employee.id, [...employee.agenda_items, newItem])
      qc.invalidateQueries({ queryKey: ['employees'] })
      setNewAgendaText('')
    } catch (err) {
      reportError(err, 'Failed to add agenda item')
    }
  }

  const deleteAgendaItem = async (idx: number) => {
    const updated = employee.agenda_items.filter((_, i) => i !== idx)
    try {
      await employeesApi.updateAgendaItems(employee.id, updated)
      qc.invalidateQueries({ queryKey: ['employees'] })
    } catch (err) {
      reportError(err, 'Failed to delete agenda item')
    }
  }

  const startEdit = () => {
    setEditForm({ name: employee.name, role: employee.role, initials: employee.initials, color: employee.color })
    setEditing(true)
  }

  const saveEdit = async () => {
    if (!editForm.name.trim() || !employee) return
    setSaving(true)
    try {
      await employeesApi.update(employee.id, editForm)
      qc.invalidateQueries({ queryKey: ['employees'] })
      // A rename cascades to tasks.assignee server-side, so refresh tasks too.
      qc.invalidateQueries({ queryKey: ['tasks'] })
      setEditing(false)
    } catch (err) {
      reportError(err, 'Failed to save team member')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!employee || !confirm(`Remove "${employee.name}" from the team? This cannot be undone.`)) return
    try {
      await employeesApi.delete(employee.id)
      qc.invalidateQueries({ queryKey: ['employees'] })
      setView('dashboard')
    } catch (err) {
      reportError(err, 'Failed to remove team member')
    }
  }

  const saveMeetingNotes = async () => {
    if (!meetingDate) return
    setSavingMeeting(true)
    try {
      await employeesApi.addMeetingNote(employee.id, {
        date: meetingDate,
        summary: meetingSummary,
      })
      qc.invalidateQueries({ queryKey: ['employees'] })
      setMeetingDate('')
      setMeetingSummary('')
      setShowMeetingForm(false)
    } catch (err) {
      reportError(err, 'Failed to save meeting notes')
    } finally {
      setSavingMeeting(false)
    }
  }

  const handleCompleteTask = async (taskId: number) => {
    try {
      await tasksApi.complete(taskId)
      qc.invalidateQueries({ queryKey: ['tasks'] })
    } catch (err) {
      reportError(err, 'Failed to complete task')
    }
  }

  const STATUS_LABEL: Record<string, string> = { todo: 'To Do', inprogress: 'In Progress', review: 'Review' }
  const STATUS_COLOR: Record<string, string> = { todo: 'var(--text-3)', inprogress: 'var(--blue)', review: 'var(--amber)' }

  const assignedTasks = allTasks.filter(t => t.assignee === employee.name && t.status !== 'done')

  const fourteenDaysAgo = new Date()
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14)
  const recentlyCompleted = allTasks.filter(t =>
    t.assignee === employee.name &&
    t.status === 'done' &&
    t.completed_at &&
    new Date(t.completed_at) >= fourteenDaysAgo
  ).sort((a, b) => new Date(b.completed_at!).getTime() - new Date(a.completed_at!).getTime())

  const cardStyle = { background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12 }
  const editInputStyle = {
    padding: '7px 10px', borderRadius: 8, fontSize: 13, background: 'var(--bg-elevated)',
    border: '1px solid var(--border)', color: 'var(--text-1)', fontFamily: 'DM Sans, sans-serif',
    outline: 'none', width: '100%',
  }
  const inputStyle = {
    background: 'var(--bg-elevated)', border: '1px solid var(--border)',
    color: 'var(--text-1)', fontFamily: 'DM Sans, sans-serif',
    borderRadius: 8, padding: '8px 12px', fontSize: 14, outline: 'none', width: '100%',
  }

  return (
    <div className="max-w-4xl space-y-5">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center font-mono font-bold text-lg flex-shrink-0"
          style={{ background: employee.color + '22', color: employee.color, border: `2px solid ${employee.color}44` }}
        >
          {employee.initials}
        </div>
        <div>
          <h1 className="font-syne font-bold text-2xl" style={{ color: 'var(--text-1)' }}>{employee.name}</h1>
          <p className="text-sm" style={{ color: 'var(--text-2)' }}>{employee.role}</p>
          {employee.last_meeting && (
            <p className="text-xs font-mono mt-0.5" style={{ color: 'var(--text-3)' }}>
              Last 1:1: {formatLongDate(employee.last_meeting)}
            </p>
          )}
        </div>
        <div className="ml-auto flex items-center gap-2 flex-shrink-0">
          {!editing && (
            <button
              onClick={startEdit}
              className="px-3 py-1.5 rounded-lg text-sm font-medium"
              style={{ background: 'rgba(96,165,250,0.1)', color: 'var(--blue)', border: '1px solid rgba(96,165,250,0.3)' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(96,165,250,0.2)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'rgba(96,165,250,0.1)')}
            >
              Edit
            </button>
          )}
          <button
            onClick={handleDelete}
            title="Remove team member"
            className="px-3 py-1.5 rounded-lg text-sm font-medium"
            style={{ background: 'rgba(248,113,113,0.1)', color: 'var(--red)', border: '1px solid rgba(248,113,113,0.3)' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(248,113,113,0.2)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(248,113,113,0.1)')}
          >
            Remove
          </button>
        </div>
      </div>

      {editing && (
        <div className="p-4 rounded-xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label style={{ fontSize: 11, color: 'var(--text-3)', display: 'block', marginBottom: 4, fontFamily: 'DM Mono, monospace' }}>Name</label>
              <input style={editInputStyle} value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} placeholder="Name" />
            </div>
            <div>
              <label style={{ fontSize: 11, color: 'var(--text-3)', display: 'block', marginBottom: 4, fontFamily: 'DM Mono, monospace' }}>Role</label>
              <input style={editInputStyle} value={editForm.role} onChange={e => setEditForm(f => ({ ...f, role: e.target.value }))} placeholder="Role" />
            </div>
            <div>
              <label style={{ fontSize: 11, color: 'var(--text-3)', display: 'block', marginBottom: 4, fontFamily: 'DM Mono, monospace' }}>Initials</label>
              <input style={editInputStyle} value={editForm.initials} onChange={e => setEditForm(f => ({ ...f, initials: e.target.value }))} placeholder="Initials" maxLength={4} />
            </div>
            <div>
              <label style={{ fontSize: 11, color: 'var(--text-3)', display: 'block', marginBottom: 4, fontFamily: 'DM Mono, monospace' }}>Color</label>
              <input type="color" style={{ ...editInputStyle, padding: '3px 6px', height: 34, cursor: 'pointer' }} value={editForm.color} onChange={e => setEditForm(f => ({ ...f, color: e.target.value }))} />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={saveEdit}
              disabled={saving || !editForm.name.trim()}
              style={{ padding: '7px 16px', borderRadius: 8, background: 'var(--blue)', color: '#fff', border: 'none', cursor: saving ? 'not-allowed' : 'pointer', fontSize: 13, opacity: saving || !editForm.name.trim() ? 0.6 : 1 }}
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button
              onClick={() => setEditing(false)}
              style={{ padding: '7px 16px', borderRadius: 8, background: 'transparent', color: 'var(--text-2)', border: '1px solid var(--border)', cursor: 'pointer', fontSize: 13 }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Agenda Items */}
        <div style={cardStyle} className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-syne font-semibold text-sm" style={{ color: 'var(--text-1)' }}>
              Agenda Items
            </h2>
            {pendingItems.length > 0 && (
              <span className="font-mono text-xs px-1.5 py-0.5 rounded" style={{ background: 'rgba(245,158,11,0.15)', color: 'var(--amber)', border: '1px solid rgba(245,158,11,0.3)', fontSize: 10 }}>
                {pendingItems.length} pending
              </span>
            )}
          </div>

          <div className="flex gap-2 mb-4">
            <input
              style={{ ...inputStyle, flex: 1 }}
              placeholder="Add agenda item..."
              value={newAgendaText}
              onChange={e => setNewAgendaText(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') addAgendaItem() }}
            />
            <button
              onClick={addAgendaItem}
              disabled={!newAgendaText.trim()}
              style={{ padding: '8px 14px', borderRadius: 8, background: 'var(--blue)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 14, opacity: !newAgendaText.trim() ? 0.5 : 1 }}
            >
              +
            </button>
          </div>

          <div className="space-y-2">
            {pendingItems.length === 0 && doneItems.length === 0 && hiddenDoneCount === 0 && (
              <p className="text-sm" style={{ color: 'var(--text-3)' }}>No agenda items yet</p>
            )}
            {pendingItems.length > 0 && pendingItems.map((item) => {
              const idx = employee.agenda_items.indexOf(item)
              return (
                <div key={idx} className="flex items-start gap-2 group">
                  <button
                    onClick={() => toggleAgendaItem(idx)}
                    className="w-5 h-5 rounded flex-shrink-0 border mt-0.5 flex items-center justify-center transition-colors"
                    style={{ borderColor: 'var(--border-light)' }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--green)')}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border-light)')}
                  />
                  <span className="flex-1 text-sm" style={{ color: 'var(--text-1)' }}>{item.text}</span>
                  <button
                    onClick={() => deleteAgendaItem(idx)}
                    className="opacity-0 group-hover:opacity-100 text-xs transition-opacity"
                    style={{ color: 'var(--text-3)' }}
                  >✕</button>
                </div>
              )
            })}
            {(doneItems.length > 0 || hiddenDoneCount > 0) && (
              <>
                <p className="text-xs font-mono pt-2" style={{ color: 'var(--text-3)' }}>Completed</p>
                {doneItems.map((item) => {
                  const idx = employee.agenda_items.indexOf(item)
                  return (
                    <div key={idx} className="flex items-start gap-2 group">
                      <button
                        onClick={() => toggleAgendaItem(idx)}
                        className="w-5 h-5 rounded flex-shrink-0 border mt-0.5 flex items-center justify-center"
                        style={{ borderColor: 'var(--green)', background: 'rgba(52,211,153,0.15)' }}
                      >
                        <span style={{ fontSize: 10, color: 'var(--green)' }}>✓</span>
                      </button>
                      <span className="flex-1 text-sm line-through" style={{ color: 'var(--text-3)' }}>{item.text}</span>
                    </div>
                  )
                })}
                {hiddenDoneCount > 0 && (
                  <p className="text-xs font-mono pt-1" style={{ color: 'var(--text-3)', opacity: 0.7 }}>
                    {hiddenDoneCount} older completed item{hiddenDoneCount === 1 ? '' : 's'} hidden
                  </p>
                )}
              </>
            )}
          </div>
        </div>

        {/* Meeting Notes */}
        <div style={cardStyle} className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-syne font-semibold text-sm" style={{ color: 'var(--text-1)' }}>Meeting Notes</h2>
            <button
              onClick={() => setShowMeetingForm(f => !f)}
              style={{ fontSize: 13, color: 'var(--blue)', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              {showMeetingForm ? 'Cancel' : '+ Record 1:1'}
            </button>
          </div>

          {showMeetingForm && (
            <div className="space-y-3 mb-4 p-3 rounded-lg" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
              <div>
                <label style={{ fontSize: 11, color: 'var(--text-3)', display: 'block', marginBottom: 4, fontFamily: 'DM Mono, monospace' }}>Date</label>
                <input type="date" style={{ ...inputStyle, colorScheme: 'dark' }} value={meetingDate} onChange={e => setMeetingDate(e.target.value)} />
              </div>
              <div>
                <label style={{ fontSize: 11, color: 'var(--text-3)', display: 'block', marginBottom: 4, fontFamily: 'DM Mono, monospace' }}>Summary</label>
                <textarea style={{ ...inputStyle, minHeight: 64, resize: 'vertical' }} placeholder="Meeting summary..." value={meetingSummary} onChange={e => setMeetingSummary(e.target.value)} />
              </div>
              <button
                onClick={saveMeetingNotes}
                disabled={savingMeeting || !meetingDate}
                style={{ padding: '7px 16px', borderRadius: 8, background: 'var(--blue)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, opacity: !meetingDate ? 0.5 : 1 }}
              >
                {savingMeeting ? 'Saving...' : 'Save'}
              </button>
            </div>
          )}

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {employee.meeting_notes.length === 0 ? (
              <p className="text-sm" style={{ color: 'var(--text-3)' }}>No meeting notes yet</p>
            ) : employee.meeting_notes.map((note, i) => (
              <div key={i} className="p-3 rounded-lg" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
                <p className="font-mono text-xs mb-1" style={{ color: 'var(--blue-bright)' }}>
                  {formatWeekdayDate(note.date)}
                </p>
                {note.summary && <p className="text-sm" style={{ color: 'var(--text-1)' }}>{note.summary}</p>}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Assigned Tasks */}
      <div style={cardStyle} className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-syne font-semibold text-sm" style={{ color: 'var(--text-1)' }}>Assigned Tasks</h2>
          {assignedTasks.length > 0 && (
            <span className="font-mono text-xs px-1.5 py-0.5 rounded" style={{ background: 'rgba(74,144,217,0.12)', color: 'var(--blue)', border: '1px solid rgba(74,144,217,0.25)', fontSize: 10 }}>
              {assignedTasks.length} open
            </span>
          )}
        </div>

        {/* Open tasks */}
        {assignedTasks.length === 0 ? (
          <p className="text-sm" style={{ color: 'var(--text-3)' }}>No open tasks assigned to {employee.name}</p>
        ) : (
          <div className="space-y-2">
            {assignedTasks.map(task => {
              const overdue = isOverdue(task.due_date)
              return (
                <div
                  key={task.id}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg"
                  style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
                >
                  {/* Complete */}
                  <button
                    onClick={() => handleCompleteTask(task.id)}
                    className="w-5 h-5 rounded flex-shrink-0 border flex items-center justify-center transition-colors"
                    style={{ borderColor: 'var(--border-light)' }}
                    title="Mark complete"
                    onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--green)')}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border-light)')}
                  >
                    <span style={{ fontSize: 10, color: 'var(--text-3)' }}>✓</span>
                  </button>

                  {/* Title + project */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: 'var(--text-1)' }}>{task.title}</p>
                    {task.project_name && (
                      <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-3)' }}>{task.project_name}</p>
                    )}
                  </div>

                  {/* Badges */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <PriorityBadge priority={task.priority as any} />
                    <span
                      className="font-mono text-xs px-1.5 py-0.5 rounded"
                      style={{ fontSize: 10, color: STATUS_COLOR[task.status] || 'var(--text-3)', background: 'transparent', border: `1px solid ${STATUS_COLOR[task.status] || 'var(--border)'}` }}
                    >
                      {STATUS_LABEL[task.status] || task.status}
                    </span>
                    {task.due_date && (
                      <span className="font-mono text-xs" style={{ color: overdue ? 'var(--red)' : 'var(--text-3)', fontSize: 10 }}>
                        {overdue ? '⚠ ' : ''}{formatShortDate(task.due_date)}
                      </span>
                    )}
                  </div>

                  {/* Edit */}
                  <button
                    onClick={() => setEditingTask(task)}
                    title="Edit task"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', fontSize: 13, padding: '0 2px', flexShrink: 0 }}
                    onMouseEnter={e => (e.currentTarget.style.color = 'var(--blue-bright)')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-3)')}
                  >✎</button>
                </div>
              )
            })}
          </div>
        )}

        {/* Completed in last 14 days */}
        {recentlyCompleted.length > 0 && (
          <div className="mt-5">
            <p className="text-xs font-mono uppercase tracking-widest mb-3" style={{ color: 'var(--text-3)' }}>
              Completed · last 14 days
            </p>
            <div className="space-y-2">
              {recentlyCompleted.map(task => (
                <div
                  key={task.id}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg"
                  style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', opacity: 0.7 }}
                >
                  <span
                    className="w-5 h-5 rounded flex-shrink-0 flex items-center justify-center"
                    style={{ background: 'rgba(52,211,153,0.15)', border: '1px solid var(--green)' }}
                  >
                    <span style={{ fontSize: 10, color: 'var(--green)' }}>✓</span>
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate line-through" style={{ color: 'var(--text-2)' }}>{task.title}</p>
                    {task.project_name && (
                      <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-3)' }}>{task.project_name}</p>
                    )}
                  </div>
                  <span className="font-mono text-xs flex-shrink-0" style={{ color: 'var(--text-3)', fontSize: 10 }}>
                    {new Date(task.completed_at!).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      {editingTask && (
        <EditTaskModal
          task={editingTask}
          onClose={() => setEditingTask(null)}
          onSaved={() => { qc.invalidateQueries({ queryKey: ['tasks'] }); setEditingTask(null) }}
        />
      )}
    </div>
  )
}
