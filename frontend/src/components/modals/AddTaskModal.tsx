import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import Modal from '../common/Modal'
import { tasksApi } from '../../api/tasks'
import { employeesApi } from '../../api/employees'
import { Project } from '../../types'

const PRIORITIES = ['Critical', 'High', 'Medium', 'Low']
const STATUSES = ['todo', 'inprogress', 'review', 'done']

interface Props {
  onClose: () => void
  onCreated: () => void
  defaultCategory?: 'proj' | 'adhoc'
  defaultProjectId?: number
  defaultProjectName?: string
  projects?: Project[]
}

export default function AddTaskModal({ onClose, onCreated, defaultCategory = 'proj', defaultProjectId, defaultProjectName, projects = [] }: Props) {
  const [form, setForm] = useState({
    title: '',
    description: '',
    priority: 'Medium',
    status: 'todo',
    category: defaultCategory,
    project_id: defaultProjectId ? String(defaultProjectId) : '',
    project_name: defaultProjectName || '',
    assigned_from: '',
    report_to: '',
    due_date: '',
    assignee: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const { data: employees = [] } = useQuery({ queryKey: ['employees'], queryFn: employeesApi.getAll })

  const setF = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const handleProjectChange = (pid: string) => {
    const p = projects.find(p => String(p.id) === pid)
    setForm(f => ({ ...f, project_id: pid, project_name: p?.name || '' }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim()) { setError('Title is required'); return }
    setLoading(true)
    try {
      await tasksApi.create({
        ...form,
        priority: form.priority as any,
        status: form.status as any,
        category: form.category as any,
        project_id: form.project_id ? Number(form.project_id) : undefined,
        assignee: form.assignee,
      })
      onCreated()
    } catch {
      setError('Failed to create task')
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
    <Modal title="Add Task" onClose={onClose}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <label style={labelStyle}>Title *</label>
          <input style={inputStyle} placeholder="Task title" value={form.title} onChange={e => setF('title', e.target.value)} autoFocus />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={labelStyle}>Priority</label>
            <select style={{ ...inputStyle, cursor: 'pointer' }} value={form.priority} onChange={e => setF('priority', e.target.value)}>
              {PRIORITIES.map(p => <option key={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Status</label>
            <select style={{ ...inputStyle, cursor: 'pointer' }} value={form.status} onChange={e => setF('status', e.target.value)}>
              {STATUSES.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={labelStyle}>Category</label>
            <select style={{ ...inputStyle, cursor: 'pointer' }} value={form.category} onChange={e => setF('category', e.target.value)}>
              <option value="proj">Project</option>
              <option value="adhoc">Ad-hoc</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>Due Date</label>
            <input type="date" style={{ ...inputStyle, colorScheme: 'dark' }} value={form.due_date} onChange={e => setF('due_date', e.target.value)} />
          </div>
        </div>
        <div>
          <label style={labelStyle}>Assignee</label>
          <select style={{ ...inputStyle, cursor: 'pointer' }} value={form.assignee} onChange={e => setF('assignee', e.target.value)}>
            <option value="">Unassigned</option>
            <option value="Me">Me</option>
            {employees.map(e => <option key={e.id} value={e.name}>{e.name}</option>)}
          </select>
        </div>
        {form.category === 'proj' && projects.length > 0 && (
          <div>
            <label style={labelStyle}>Project</label>
            <select style={{ ...inputStyle, cursor: 'pointer' }} value={form.project_id} onChange={e => handleProjectChange(e.target.value)}>
              <option value="">No project</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={labelStyle}>Assigned From</label>
            <input style={inputStyle} placeholder="Who assigned this?" value={form.assigned_from} onChange={e => setF('assigned_from', e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>Report To</label>
            <input style={inputStyle} placeholder="Who to report to?" value={form.report_to} onChange={e => setF('report_to', e.target.value)} />
          </div>
        </div>
        <div>
          <label style={labelStyle}>Description</label>
          <textarea style={{ ...inputStyle, minHeight: 64, resize: 'vertical' }} placeholder="Optional details..." value={form.description} onChange={e => setF('description', e.target.value)} />
        </div>
        {error && <p style={{ color: 'var(--red)', fontSize: 13 }}>{error}</p>}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button type="button" onClick={onClose} style={{ padding: '8px 16px', borderRadius: 8, fontSize: 14, background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-2)', cursor: 'pointer' }}>Cancel</button>
          <button type="submit" disabled={loading} style={{ padding: '8px 20px', borderRadius: 8, fontSize: 14, fontWeight: 600, background: 'var(--blue)', color: '#fff', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}>
            {loading ? 'Adding...' : 'Add Task'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
