import { useState } from 'react'
import Modal from '../common/Modal'
import { projectsApi } from '../../api/projects'

const COLORS = ['#60a5fa', '#34d399', '#f59e0b', '#f87171', '#22d3ee', '#a78bfa', '#fb923c']
const PRIORITIES = ['Critical', 'High', 'Medium', 'Low']

interface Props {
  onClose: () => void
  onCreated: () => void
}

export default function NewProjectModal({ onClose, onCreated }: Props) {
  const [form, setForm] = useState({
    name: '',
    client: '',
    priority: 'Medium',
    color: '#60a5fa',
    description: '',
    due_date: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) { setError('Name is required'); return }
    setLoading(true)
    try {
      await projectsApi.create({ ...form, priority: form.priority as any })
      onCreated()
    } catch {
      setError('Failed to create project')
      setLoading(false)
    }
  }

  const inputStyle = {
    width: '100%',
    padding: '8px 12px',
    borderRadius: 8,
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    color: 'var(--text-1)',
    fontSize: 14,
    fontFamily: 'DM Sans, sans-serif',
    outline: 'none',
  }

  const labelStyle = { fontSize: 12, color: 'var(--text-3)', marginBottom: 4, display: 'block', fontFamily: 'DM Mono, monospace' }

  return (
    <Modal title="New Project" onClose={onClose}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <label style={labelStyle}>Project Name *</label>
          <input
            style={inputStyle}
            placeholder="e.g. Website Redesign"
            value={form.name}
            onChange={e => set('name', e.target.value)}
            autoFocus
          />
        </div>
        <div>
          <label style={labelStyle}>Client</label>
          <input
            style={inputStyle}
            placeholder="e.g. Acme Corp"
            value={form.client}
            onChange={e => set('client', e.target.value)}
          />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={labelStyle}>Priority</label>
            <select
              style={{ ...inputStyle, cursor: 'pointer' }}
              value={form.priority}
              onChange={e => set('priority', e.target.value)}
            >
              {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Due Date</label>
            <input
              type="date"
              style={{ ...inputStyle, colorScheme: 'dark' }}
              value={form.due_date}
              onChange={e => set('due_date', e.target.value)}
            />
          </div>
        </div>
        <div>
          <label style={labelStyle}>Color</label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {COLORS.map(c => (
              <button
                key={c}
                type="button"
                onClick={() => set('color', c)}
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
        <div>
          <label style={labelStyle}>Description</label>
          <textarea
            style={{ ...inputStyle, minHeight: 72, resize: 'vertical' }}
            placeholder="What is this project about?"
            value={form.description}
            onChange={e => set('description', e.target.value)}
          />
        </div>
        {error && <p style={{ color: 'var(--red)', fontSize: 13 }}>{error}</p>}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '8px 16px', borderRadius: 8, fontSize: 14,
              background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-2)', cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '8px 20px', borderRadius: 8, fontSize: 14, fontWeight: 600,
              background: 'var(--blue)', color: '#fff', border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? 'Creating...' : 'Create Project'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
