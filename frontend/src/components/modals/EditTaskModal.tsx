import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Task } from '../../types'
import { tasksApi } from '../../api/tasks'
import { employeesApi } from '../../api/employees'
import Modal from '../common/Modal'

const PRIORITIES = ['Critical', 'High', 'Medium', 'Low'] as const
const STATUSES = ['todo', 'inprogress', 'review', 'done'] as const

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 12px',
  borderRadius: 8,
  background: 'var(--bg-card)',
  border: '1px solid var(--border)',
  color: 'var(--text-1)',
  fontSize: 14,
  fontFamily: 'DM Sans, sans-serif',
  outline: 'none',
  boxSizing: 'border-box',
}

const labelStyle: React.CSSProperties = {
  fontSize: 12,
  color: 'var(--text-3)',
  marginBottom: 4,
  display: 'block',
  fontFamily: 'DM Mono, monospace',
}

interface Props {
  task: Task
  onClose: () => void
  onSaved: () => void
}

export default function EditTaskModal({ task, onClose, onSaved }: Props) {
  const [formData, setFormData] = useState({
    title: task.title ?? '',
    description: task.description ?? '',
    priority: task.priority ?? 'Medium',
    status: task.status ?? 'todo',
    assignee: task.assignee ?? '',
    due_date: task.due_date ? task.due_date.slice(0, 10) : '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { data: employees = [] } = useQuery({
    queryKey: ['employees'],
    queryFn: employeesApi.getAll,
  })

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      await tasksApi.update(task.id, {
        ...formData,
        priority: formData.priority as any,
        status: formData.status as any,
        category: task.category as any,
        project_id: task.project_id,
        project_name: task.project_name,
        assigned_from: task.assigned_from,
        report_to: task.report_to,
      })
      onSaved()
    } catch (err: any) {
      setError(err?.message ?? 'Failed to save changes.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal title="Edit Task" onClose={onClose}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Title */}
        <div>
          <label style={labelStyle} htmlFor="edit-title">Title</label>
          <input
            id="edit-title"
            name="title"
            style={inputStyle}
            value={formData.title}
            onChange={handleChange}
            required
            autoFocus
          />
        </div>

        {/* Description */}
        <div>
          <label style={labelStyle} htmlFor="edit-description">Description</label>
          <textarea
            id="edit-description"
            name="description"
            style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }}
            value={formData.description}
            onChange={handleChange}
          />
        </div>

        {/* Priority + Status */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={labelStyle} htmlFor="edit-priority">Priority</label>
            <select
              id="edit-priority"
              name="priority"
              style={inputStyle}
              value={formData.priority}
              onChange={handleChange}
            >
              {PRIORITIES.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={labelStyle} htmlFor="edit-status">Status</label>
            <select
              id="edit-status"
              name="status"
              style={inputStyle}
              value={formData.status}
              onChange={handleChange}
            >
              {STATUSES.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Assignee + Due Date */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={labelStyle} htmlFor="edit-assignee">Assignee</label>
            <select
              id="edit-assignee"
              name="assignee"
              style={inputStyle}
              value={formData.assignee}
              onChange={handleChange}
            >
              <option value="">Unassigned</option>
              <option value="Me">Me</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.name}>{emp.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={labelStyle} htmlFor="edit-due-date">Due Date</label>
            <input
              id="edit-due-date"
              name="due_date"
              type="date"
              style={inputStyle}
              value={formData.due_date}
              onChange={handleChange}
            />
          </div>
        </div>

        {/* Error */}
        {error && (
          <div style={{ fontSize: 13, color: 'var(--red)', fontFamily: 'DM Sans, sans-serif' }}>
            {error}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 4 }}>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            style={{
              padding: '8px 18px',
              borderRadius: 8,
              border: '1px solid var(--border)',
              background: 'var(--bg-elevated)',
              color: 'var(--text-2)',
              fontSize: 14,
              fontFamily: 'DM Sans, sans-serif',
              cursor: saving ? 'not-allowed' : 'pointer',
              opacity: saving ? 0.6 : 1,
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            style={{
              padding: '8px 18px',
              borderRadius: 8,
              border: 'none',
              background: 'var(--blue)',
              color: '#fff',
              fontSize: 14,
              fontFamily: 'DM Sans, sans-serif',
              cursor: saving ? 'not-allowed' : 'pointer',
              opacity: saving ? 0.7 : 1,
              fontWeight: 500,
            }}
          >
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
