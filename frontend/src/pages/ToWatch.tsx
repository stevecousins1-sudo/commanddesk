import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { tasksApi } from '../api/tasks'
import { projectsApi } from '../api/projects'
import { Task } from '../types'
import Modal from '../components/common/Modal'
import { isSafeHttpUrl, safeHref } from '../utils/url'
import { reportError } from '../store/useAppStore'
import { formatShortDate, isOverdue } from '../utils/date'

function AddWatchModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const { data: projects = [] } = useQuery({ queryKey: ['projects'], queryFn: projectsApi.getAll })
  const [form, setForm] = useState({
    title: '',
    description: '',
    video_link: '',
    due_date: '',
    project_id: '',
    project_name: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const setF = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const handleProjectChange = (pid: string) => {
    const p = projects.find(p => String(p.id) === pid)
    setForm(f => ({ ...f, project_id: pid, project_name: p?.name || '' }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim()) { setError('Video name is required'); return }
    if (!form.video_link.trim()) { setError('Video link is required'); return }
    if (!isSafeHttpUrl(form.video_link)) { setError('Video link must be a valid http:// or https:// URL'); return }
    setLoading(true)
    try {
      await tasksApi.create({
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        video_link: form.video_link.trim(),
        due_date: form.due_date || undefined,
        project_id: form.project_id ? Number(form.project_id) : undefined,
        project_name: form.project_name || undefined,
        category: form.project_id ? 'proj' : 'adhoc',
        assignee: 'Me',
        priority: 'Medium',
        status: 'todo',
      })
      onCreated()
    } catch {
      setError('Failed to add video')
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
    <Modal title="Add to Watch List" onClose={onClose}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <label style={labelStyle}>Video Name *</label>
          <input
            style={inputStyle}
            placeholder="What is this recording?"
            value={form.title}
            onChange={e => setF('title', e.target.value)}
            autoFocus
          />
        </div>
        <div>
          <label style={labelStyle}>Video Link *</label>
          <input
            style={inputStyle}
            placeholder="https://..."
            value={form.video_link}
            onChange={e => setF('video_link', e.target.value)}
          />
        </div>
        <div>
          <label style={labelStyle}>Description</label>
          <textarea
            style={{ ...inputStyle, minHeight: 64, resize: 'vertical' }}
            placeholder="Optional notes about this recording…"
            value={form.description}
            onChange={e => setF('description', e.target.value)}
          />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={labelStyle}>Watch By</label>
            <input
              type="date"
              style={inputStyle}
              value={form.due_date}
              onChange={e => setF('due_date', e.target.value)}
            />
          </div>
          <div>
            <label style={labelStyle}>Project</label>
            <select
              style={{ ...inputStyle, cursor: 'pointer' }}
              value={form.project_id}
              onChange={e => handleProjectChange(e.target.value)}
            >
              <option value="">Ad-hoc (no project)</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
        </div>
        {error && <p style={{ color: 'var(--red)', fontSize: 13 }}>{error}</p>}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button
            type="button"
            onClick={onClose}
            style={{ padding: '8px 16px', borderRadius: 8, fontSize: 14, background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-2)', cursor: 'pointer' }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            style={{ padding: '8px 20px', borderRadius: 8, fontSize: 14, fontWeight: 600, background: 'var(--blue)', color: '#fff', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}
          >
            {loading ? 'Adding…' : 'Add to Watch List'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

export default function ToWatch() {
  const qc = useQueryClient()
  const [showAdd, setShowAdd] = useState(false)

  const { data: tasks = [], isLoading } = useQuery({ queryKey: ['tasks'], queryFn: () => tasksApi.getAll() })

  const watchItems = tasks.filter(t => t.video_link && t.status !== 'done')

  const handleMarkWatched = async (task: Task) => {
    try {
      await tasksApi.complete(task.id)
      qc.invalidateQueries({ queryKey: ['tasks'] })
    } catch (err) {
      reportError(err, 'Failed to mark recording as watched')
    }
  }

  if (isLoading) return (
    <div className="flex items-center justify-center h-40">
      <span style={{ color: 'var(--text-3)' }}>Loading…</span>
    </div>
  )

  return (
    <div className="max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-syne font-bold text-2xl" style={{ color: 'var(--text-1)' }}>To Watch</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-2)' }}>
            {watchItems.length === 0 ? 'No recordings to watch' : `${watchItems.length} recording${watchItems.length !== 1 ? 's' : ''} to watch`}
          </p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
          style={{ background: 'var(--blue)', color: '#fff' }}
          onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
          onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
        >
          + Add Video
        </button>
      </div>

      {/* Empty state */}
      {watchItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20" style={{ color: 'var(--text-3)' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>▶</div>
          <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-2)' }}>No recordings queued</p>
          <p className="text-xs">Add a video link to start your watch list</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {watchItems.map(task => {
            const overdue = isOverdue(task.due_date)
            const href = safeHref(task.video_link)
            return (
              <div
                key={task.id}
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: 12,
                  padding: '14px 16px',
                  display: 'flex',
                  gap: 14,
                  alignItems: 'flex-start',
                }}
              >
                {/* Watch / complete button */}
                <button
                  onClick={() => handleMarkWatched(task)}
                  title="Mark as watched"
                  style={{
                    marginTop: 2,
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border)',
                    cursor: 'pointer',
                    fontSize: 14,
                    color: 'var(--text-3)',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'rgba(52,211,153,0.15)'
                    e.currentTarget.style.borderColor = 'var(--green)'
                    e.currentTarget.style.color = 'var(--green)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'var(--bg-elevated)'
                    e.currentTarget.style.borderColor = 'var(--border)'
                    e.currentTarget.style.color = 'var(--text-3)'
                  }}
                >
                  ✓
                </button>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 4 }}>
                    <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-1)', margin: 0, lineHeight: 1.4 }}>
                      {task.title}
                    </p>
                    {/* Badges */}
                    <div style={{ display: 'flex', gap: 6, flexShrink: 0, alignItems: 'center' }}>
                      {task.project_name && (
                        <span style={{
                          fontSize: 10, fontFamily: 'DM Mono, monospace',
                          padding: '2px 7px', borderRadius: 5,
                          background: 'rgba(96,165,250,0.1)', color: 'var(--blue-bright)',
                          border: '1px solid rgba(96,165,250,0.2)',
                        }}>
                          {task.project_name}
                        </span>
                      )}
                      {task.due_date && (
                        <span style={{
                          fontSize: 10, fontFamily: 'DM Mono, monospace',
                          padding: '2px 7px', borderRadius: 5,
                          color: overdue ? 'var(--red)' : 'var(--text-2)',
                          border: `1px solid ${overdue ? 'var(--red)' : 'var(--border)'}`,
                        }}>
                          {overdue ? '⚠ ' : ''}Watch by {formatShortDate(task.due_date)}
                        </span>
                      )}
                    </div>
                  </div>

                  {task.description && (
                    <p style={{ fontSize: 13, color: 'var(--text-2)', margin: '0 0 10px 0', lineHeight: 1.5 }}>
                      {task.description}
                    </p>
                  )}

                  {/* Link — only rendered clickable for safe http(s) URLs */}
                  {href ? (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '5px 12px',
                        borderRadius: 7,
                        fontSize: 13,
                        fontWeight: 500,
                        fontFamily: 'DM Sans, sans-serif',
                        background: 'var(--bg-elevated)',
                        border: '1px solid var(--border)',
                        color: 'var(--blue)',
                        textDecoration: 'none',
                        transition: 'border-color 0.15s',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--blue)')}
                      onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
                    >
                      <span style={{ fontSize: 12 }}>▶</span> Watch Recording
                    </a>
                  ) : (
                    <span
                      title="This link is not a valid http(s) URL and has been blocked"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '5px 12px',
                        borderRadius: 7,
                        fontSize: 13,
                        fontWeight: 500,
                        fontFamily: 'DM Sans, sans-serif',
                        background: 'var(--bg-elevated)',
                        border: '1px solid var(--border)',
                        color: 'var(--text-3)',
                      }}
                    >
                      <span style={{ fontSize: 12 }}>⚠</span> Unsafe link blocked
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showAdd && (
        <AddWatchModal
          onClose={() => setShowAdd(false)}
          onCreated={() => { qc.invalidateQueries({ queryKey: ['tasks'] }); setShowAdd(false) }}
        />
      )}
    </div>
  )
}
