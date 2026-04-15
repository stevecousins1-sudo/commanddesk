import { Priority } from '../../types'

interface Props {
  priority: Priority
  size?: 'sm' | 'md'
}

const config = {
  Critical: { bg: 'rgba(248,113,113,0.15)', border: 'rgba(248,113,113,0.4)', color: '#f87171' },
  High:     { bg: 'rgba(245,158,11,0.15)',  border: 'rgba(245,158,11,0.4)',  color: '#f59e0b' },
  Medium:   { bg: 'rgba(74,144,217,0.15)',  border: 'rgba(74,144,217,0.4)',  color: '#4a90d9' },
  Low:      { bg: 'rgba(52,211,153,0.15)',  border: 'rgba(52,211,153,0.4)',  color: '#34d399' },
}

export default function PriorityBadge({ priority, size = 'sm' }: Props) {
  const c = config[priority] || config.Medium
  const pad = size === 'sm' ? '2px 8px' : '4px 12px'
  const fontSize = size === 'sm' ? '11px' : '12px'
  return (
    <span
      className="font-mono font-medium rounded"
      style={{
        background: c.bg,
        border: `1px solid ${c.border}`,
        color: c.color,
        padding: pad,
        fontSize,
        letterSpacing: '0.04em',
      }}
    >
      {priority}
    </span>
  )
}
