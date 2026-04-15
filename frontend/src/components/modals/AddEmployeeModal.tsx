import { useState } from 'react'
import Modal from '../common/Modal'
import { employeesApi } from '../../api/employees'

const COLORS = ['#60a5fa', '#34d399', '#f59e0b', '#f87171', '#22d3ee', '#a78bfa', '#fb923c']

interface Props {
  onClose: () => void
  onCreated: () => void
}

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

export default function AddEmployeeModal({ onClose, onCreated }: Props) {
  const [form, setForm] = useState({ name: '', role: '', initials: '', color: '#60a5fa' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const setF = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim() || !form.role.trim()) { setError('Name and role are required'); return }
    setLoading(true)
    try {
      await employeesApi.create({
        ...form,
        initials: form.initials || getInitials(form.name),
      })
      onCreated()
    } catch {
      setError('Failed to add team member')
      setLoading(false)
    }
  }

  const inputStyle = {
    width: '100%', padding: '8px 12px', borderRadius: 8,
    background: 'var(--bg-card)', border: '1px solid var(--border)',
    color: 'var(--text-1)', fontSize: 14, fontFamily: 'DM Sans, sans-serif', outline: 'none',
  }
  const labelStyle = { fontSize: 12, color: 'var(--text-3)', marginBottom: 4, display: 'block', fontFamily: 'DM Mono, monospace' }

  return (
    <Modal title="Add Team Member" onClose={onClose}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <label style={labelStyle}>Full Name *</label>
          <input
            style={inputStyle}
            placeholder="e.g. Alex Johnson"
            value={form.name}
            onChange={e => setF('name', e.target.value)}
            autoFocus
          />
        </div>
        <div>
          <label style={labelStyle}>Role *</label>
          <input
            style={inputStyle}
            placeholder="e.g. Senior Engineer"
            value={form.role}
            onChange={e => setF('role', e.target.value)}
          />
        </div>
        <div>
          <label style={labelStyle}>Initials (optional)</label>
          <input
            style={{ ...inputStyle, maxWidth: 80, textTransform: 'uppercase' }}
            placeholder="AJ"
            maxLength={2}
            value={form.initials}
            onChange={e => setF('initials', e.target.value.toUpperCase())}
          />
        </div>
        <div>
          <label style={labelStyle}>Color</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {COLORS.map(c => (
              <button
                key={c}
                type="button"
                onClick={() => setF('color', c)}
                style={{
                  width: 28, height: 28, borderRadius: '50%', background: c,
                  border: form.color === c ? '3px solid var(--text-1)' : '3px solid transparent',
                  outline: form.color === c ? '2px solid var(--border-light)' : 'none',
                  cursor: 'pointer',
                }}
              />
            ))}
          </div>
        </div>
        {error && <p style={{ color: 'var(--red)', fontSize: 13 }}>{error}</p>}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button type="button" onClick={onClose} style={{ padding: '8px 16px', borderRadius: 8, fontSize: 14, background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-2)', cursor: 'pointer' }}>Cancel</button>
          <button type="submit" disabled={loading} style={{ padding: '8px 20px', borderRadius: 8, fontSize: 14, fontWeight: 600, background: 'var(--blue)', color: '#fff', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}>
            {loading ? 'Adding...' : 'Add Member'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
