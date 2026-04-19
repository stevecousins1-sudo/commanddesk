import { useState } from 'react'
import { Task } from '../../types'
import { tasksApi } from '../../api/tasks'
import Modal from '../common/Modal'
import PriorityBadge from '../common/PriorityBadge'

interface Props {
  task: Task
  onClose: () => void
  onUpdated: () => void
}

const STATUS_LABEL = { todo: 'To Do', inprogress: 'In Progress', review: 'Review', done: 'Done' }
const STATUS_COLOR = { todo: 'var(--text-3)', inprogress: 'var(--blue)', review: 'var(--amber)', done: 'var(--green)' }

const inputStyle = {
  width: '100%',
  padding: '8px 12px',
  borderRadius: 8,
  fontSize: 14,
  background: 'var(--bg-card)',
  border: '1px solid var(--border)',
  color: 'var(--text-1)',
  fontFamily: 'DM Sans, sans-serif',
  outline: 'none',
  resize: 'vertical' as const,
}

function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp)
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).replace(',', ',').replace(' at ', ' at ')
}

function isOverdue(due_date: string): boolean {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const due = new Date(due_date)
  due.setHours(0, 0, 0, 0)
  return due < today
}

export default function TaskDetailModal({ task, onClose, onUpdated }: Props) {
  const [updateText, setUpdateText] = useState('')
  const [posting, setPosting] = useState(false)

  async function handlePostUpdate() {
    if (!updateText.trim() || posting) return
    setPosting(true)
    try {
      await tasksApi.addStatusUpdate(task.id, updateText.trim())
      setUpdateText('')
      onUpdated()
      onClose()
    } finally {
      setPosting(false)
    }
  }

  const canPost = updateText.trim().length > 0 && !posting

  return (
    <Modal title={task.title} onClose={onClose}>
      {/* Metadata row */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', marginBottom: 12 }}>
        <PriorityBadge priority={task.priority} />

        <span style={{
          fontSize: 12,
          fontWeight: 600,
          color: STATUS_COLOR[task.status],
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border-light)',
          borderRadius: 6,
          padding: '2px 8px',
          fontFamily: 'DM Mono, monospace',
        }}>
          {STATUS_LABEL[task.status]}
        </span>

        {task.assignee && (
          <span style={{
            fontSize: 12,
            color: 'var(--text-2)',
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-light)',
            borderRadius: 6,
            padding: '2px 8px',
          }}>
            {task.assignee}
          </span>
        )}

        {task.due_date && (
          <span style={{
            fontSize: 12,
            color: isOverdue(task.due_date) ? 'var(--red)' : 'var(--text-2)',
            background: 'var(--bg-elevated)',
            border: `1px solid ${isOverdue(task.due_date) ? 'var(--red)' : 'var(--border-light)'}`,
            borderRadius: 6,
            padding: '2px 8px',
          }}>
            Due {new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
        )}

        {task.project_name && (
          <span style={{
            fontSize: 12,
            color: 'var(--text-2)',
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-light)',
            borderRadius: 6,
            padding: '2px 8px',
          }}>
            {task.project_name}
          </span>
        )}
      </div>

      {/* Description */}
      {task.description && (
        <p style={{ color: 'var(--text-2)', fontSize: 14, lineHeight: 1.6, margin: '0 0 4px 0' }}>
          {task.description}
        </p>
      )}

      {/* Divider */}
      <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '16px 0' }} />

      {/* Status Updates heading */}
      <div style={{
        fontSize: 11,
        fontWeight: 600,
        fontFamily: 'DM Mono, monospace',
        color: 'var(--text-3)',
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        marginBottom: 12,
      }}>
        Status Updates
      </div>

      {/* Add update area */}
      <div style={{ marginBottom: 16 }}>
        <textarea
          rows={3}
          placeholder="What's the latest?"
          value={updateText}
          onChange={e => setUpdateText(e.target.value)}
          style={{ ...inputStyle, display: 'block', marginBottom: 8, boxSizing: 'border-box' }}
        />
        <button
          onClick={handlePostUpdate}
          disabled={!canPost}
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
            cursor: canPost ? 'pointer' : 'not-allowed',
            opacity: canPost ? 1 : 0.5,
            transition: 'opacity 0.15s',
          }}
        >
          {posting ? 'Posting…' : 'Post Update'}
        </button>
      </div>

      {/* Updates list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {task.status_updates.length === 0 ? (
          <p style={{ color: 'var(--text-3)', fontSize: 13, margin: 0 }}>No status updates yet</p>
        ) : (
          task.status_updates.map((update, i) => (
            <div
              key={i}
              style={{
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border)',
                borderRadius: 8,
                padding: '12px',
              }}
            >
              <div style={{
                fontSize: 11,
                fontFamily: 'DM Mono, monospace',
                color: 'var(--text-3)',
                marginBottom: 6,
              }}>
                {formatTimestamp(update.timestamp)}
              </div>
              <div style={{ fontSize: 14, color: 'var(--text-1)', lineHeight: 1.55, whiteSpace: 'pre-wrap' }}>
                {update.text}
              </div>
            </div>
          ))
        )}
      </div>
    </Modal>
  )
}
