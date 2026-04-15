import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { staffCallsApi } from '../api/staffCalls'
import { StaffCall, SimpleAgendaItem } from '../types'
import Modal from '../components/common/Modal'

function StaffCallCard({ call, onUpdate }: { call: StaffCall; onUpdate: () => void }) {
  const qc = useQueryClient()
  const [newItem, setNewItem] = useState('')

  const handleDelete = async () => {
    if (!confirm(`Delete "${call.name}"? This cannot be undone.`)) return
    await staffCallsApi.delete(call.id)
    qc.invalidateQueries({ queryKey: ['staff-calls'] })
  }

  const toggleItem = async (idx: number) => {
    const updated = call.agenda_items.map((a, i) => i === idx ? { ...a, done: !a.done } : a)
    await staffCallsApi.updateAgendaItems(call.id, updated)
    qc.invalidateQueries({ queryKey: ['staff-calls'] })
  }

  const addItem = async () => {
    if (!newItem.trim()) return
    const updated = [...call.agenda_items, { text: newItem.trim(), done: false }]
    await staffCallsApi.updateAgendaItems(call.id, updated)
    qc.invalidateQueries({ queryKey: ['staff-calls'] })
    setNewItem('')
  }

  const pending = call.agenda_items.filter(a => !a.done).length

  return (
    <div className="rounded-xl p-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-syne font-semibold text-sm" style={{ color: 'var(--text-1)' }}>{call.name}</h3>
          {call.schedule && <p className="text-xs mt-0.5" style={{ color: 'var(--text-2)' }}>{call.schedule}</p>}
          {call.next_date && (
            <p className="font-mono text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>
              Next: {new Date(call.next_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {pending > 0 && (
            <span className="font-mono text-xs px-1.5 py-0.5 rounded" style={{ background: 'rgba(245,158,11,0.15)', color: 'var(--amber)', border: '1px solid rgba(245,158,11,0.3)', fontSize: 10 }}>
              {pending} pending
            </span>
          )}
          <button
            onClick={handleDelete}
            title="Delete staff call"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', fontSize: 14, padding: '2px 4px', borderRadius: 4 }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--red)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-3)')}
          >✕</button>
        </div>
      </div>

      <div className="flex gap-2 mb-3">
        <input
          className="flex-1 px-3 py-1.5 rounded-lg text-sm outline-none"
          style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-1)', fontFamily: 'DM Sans' }}
          placeholder="Add agenda item..."
          value={newItem}
          onChange={e => setNewItem(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') addItem() }}
        />
        <button
          onClick={addItem}
          style={{ padding: '6px 12px', borderRadius: 8, background: 'var(--blue)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13 }}
        >+</button>
      </div>

      <div className="space-y-1.5">
        {call.agenda_items.length === 0 && (
          <p className="text-xs" style={{ color: 'var(--text-3)' }}>No agenda items</p>
        )}
        {call.agenda_items.map((item, i) => (
          <div key={i} className="flex items-center gap-2">
            <button
              onClick={() => toggleItem(i)}
              className="w-4 h-4 rounded flex-shrink-0 border flex items-center justify-center"
              style={{
                borderColor: item.done ? 'var(--green)' : 'var(--border-light)',
                background: item.done ? 'rgba(52,211,153,0.15)' : 'transparent',
              }}
            >
              {item.done && <span style={{ fontSize: 8, color: 'var(--green)' }}>✓</span>}
            </button>
            <span className="text-sm" style={{ color: item.done ? 'var(--text-3)' : 'var(--text-1)', textDecoration: item.done ? 'line-through' : 'none' }}>
              {item.text}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function NewStaffCallModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({ name: '', schedule: '', next_date: '' })
  const [loading, setLoading] = useState(false)

  const inputStyle = {
    width: '100%', padding: '8px 12px', borderRadius: 8,
    background: 'var(--bg-card)', border: '1px solid var(--border)',
    color: 'var(--text-1)', fontSize: 14, fontFamily: 'DM Sans, sans-serif', outline: 'none',
  }
  const labelStyle = { fontSize: 12, color: 'var(--text-3)', marginBottom: 4, display: 'block', fontFamily: 'DM Mono, monospace' }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) return
    setLoading(true)
    try {
      await staffCallsApi.create(form)
      onCreated()
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal title="New Staff Call" onClose={onClose}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <label style={labelStyle}>Call Name *</label>
          <input style={inputStyle} placeholder="e.g. Engineering Standup" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} autoFocus />
        </div>
        <div>
          <label style={labelStyle}>Schedule</label>
          <input style={inputStyle} placeholder="e.g. Weekly, Every Monday" value={form.schedule} onChange={e => setForm(f => ({ ...f, schedule: e.target.value }))} />
        </div>
        <div>
          <label style={labelStyle}>Next Date</label>
          <input type="date" style={{ ...inputStyle, colorScheme: 'dark' }} value={form.next_date} onChange={e => setForm(f => ({ ...f, next_date: e.target.value }))} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button type="button" onClick={onClose} style={{ padding: '8px 16px', borderRadius: 8, fontSize: 14, background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-2)', cursor: 'pointer' }}>Cancel</button>
          <button type="submit" disabled={loading} style={{ padding: '8px 20px', borderRadius: 8, fontSize: 14, fontWeight: 600, background: 'var(--blue)', color: '#fff', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}>
            {loading ? 'Creating...' : 'Create'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

export default function StaffCalls() {
  const qc = useQueryClient()
  const [showNew, setShowNew] = useState(false)
  const { data: calls = [], isLoading } = useQuery({ queryKey: ['staff-calls'], queryFn: staffCallsApi.getAll })

  if (isLoading) return <div className="flex items-center justify-center h-40"><span style={{ color: 'var(--text-3)' }}>Loading...</span></div>

  return (
    <div className="max-w-4xl space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-syne font-bold text-2xl" style={{ color: 'var(--text-1)' }}>Staff Calls</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-2)' }}>{calls.length} recurring calls</p>
        </div>
        {calls.length === 0 && (
          <button
            onClick={() => setShowNew(true)}
            className="px-4 py-2 rounded-lg text-sm font-medium"
            style={{ background: 'var(--blue)', color: '#fff' }}
          >
            + New Call
          </button>
        )}
      </div>

      {calls.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20" style={{ color: 'var(--text-3)' }}>
          <div className="text-4xl mb-3">◎</div>
          <p className="text-sm">No staff calls yet. Add one to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {calls.map(call => (
            <StaffCallCard key={call.id} call={call} onUpdate={() => qc.invalidateQueries({ queryKey: ['staff-calls'] })} />
          ))}
        </div>
      )}

      {showNew && (
        <NewStaffCallModal
          onClose={() => setShowNew(false)}
          onCreated={() => { qc.invalidateQueries({ queryKey: ['staff-calls'] }); setShowNew(false) }}
        />
      )}
    </div>
  )
}
