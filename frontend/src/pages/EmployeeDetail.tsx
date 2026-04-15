import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAppStore } from '../store/useAppStore'
import { employeesApi } from '../api/employees'
import { AgendaItem } from '../types'

export default function EmployeeDetail() {
  const { selectedEmployeeId, setView } = useAppStore()
  const qc = useQueryClient()
  const [newAgendaText, setNewAgendaText] = useState('')
  const [meetingDate, setMeetingDate] = useState('')
  const [meetingSummary, setMeetingSummary] = useState('')
  const [savingMeeting, setSavingMeeting] = useState(false)
  const [showMeetingForm, setShowMeetingForm] = useState(false)

  const { data: employees = [] } = useQuery({ queryKey: ['employees'], queryFn: employeesApi.getAll })
  const employee = employees.find(e => e.id === selectedEmployeeId)

  if (!employee) {
    return (
      <div className="flex items-center justify-center h-40">
        <span style={{ color: 'var(--text-3)' }}>Select a team member from the sidebar</span>
      </div>
    )
  }

  const pendingItems = employee.agenda_items.filter(a => !a.done)
  const doneItems = employee.agenda_items.filter(a => a.done)

  const toggleAgendaItem = async (idx: number) => {
    const updated = employee.agenda_items.map((item, i) =>
      i === idx ? { ...item, done: !item.done } : item
    )
    await employeesApi.updateAgendaItems(employee.id, updated)
    qc.invalidateQueries({ queryKey: ['employees'] })
  }

  const addAgendaItem = async () => {
    if (!newAgendaText.trim()) return
    const newItem: AgendaItem = {
      text: newAgendaText.trim(),
      done: false,
      date_added: new Date().toISOString(),
      notes: [],
    }
    await employeesApi.updateAgendaItems(employee.id, [...employee.agenda_items, newItem])
    qc.invalidateQueries({ queryKey: ['employees'] })
    setNewAgendaText('')
  }

  const deleteAgendaItem = async (idx: number) => {
    const updated = employee.agenda_items.filter((_, i) => i !== idx)
    await employeesApi.updateAgendaItems(employee.id, updated)
    qc.invalidateQueries({ queryKey: ['employees'] })
  }

  const handleDelete = async () => {
    if (!employee || !confirm(`Remove "${employee.name}" from the team? This cannot be undone.`)) return
    await employeesApi.delete(employee.id)
    qc.invalidateQueries({ queryKey: ['employees'] })
    setView('dashboard')
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
    } finally {
      setSavingMeeting(false)
    }
  }

  const cardStyle = { background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12 }
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
              Last 1:1: {new Date(employee.last_meeting).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
          )}
        </div>
        <button
          onClick={handleDelete}
          title="Remove team member"
          className="ml-auto px-3 py-1.5 rounded-lg text-sm font-medium flex-shrink-0"
          style={{ background: 'rgba(248,113,113,0.1)', color: 'var(--red)', border: '1px solid rgba(248,113,113,0.3)' }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(248,113,113,0.2)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'rgba(248,113,113,0.1)')}
        >
          Remove
        </button>
      </div>

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
            {employee.agenda_items.length === 0 && (
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
            {doneItems.length > 0 && (
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
                  {new Date(note.date).toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' })}
                </p>
                {note.summary && <p className="text-sm" style={{ color: 'var(--text-1)' }}>{note.summary}</p>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
