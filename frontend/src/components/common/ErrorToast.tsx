import { useEffect } from 'react'
import { useAppStore } from '../../store/useAppStore'

const AUTO_DISMISS_MS = 6000

export default function ErrorToast() {
  const { error, clearError } = useAppStore()

  useEffect(() => {
    if (!error) return
    const timer = setTimeout(clearError, AUTO_DISMISS_MS)
    return () => clearTimeout(timer)
  }, [error, clearError])

  if (!error) return null

  return (
    <div
      role="alert"
      style={{
        position: 'fixed',
        bottom: 24,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 60,
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12,
        maxWidth: 480,
        padding: '12px 14px',
        borderRadius: 10,
        background: 'var(--bg-elevated)',
        border: '1px solid var(--red)',
        boxShadow: '0 12px 32px rgba(0,0,0,0.4)',
      }}
    >
      <span style={{ color: 'var(--red)', fontSize: 14, lineHeight: 1.4, flexShrink: 0 }}>⚠</span>
      <p
        style={{
          margin: 0,
          fontSize: 13,
          lineHeight: 1.5,
          color: 'var(--text-1)',
          fontFamily: 'DM Sans, sans-serif',
        }}
      >
        {error}
      </p>
      <button
        onClick={clearError}
        aria-label="Dismiss"
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: 'var(--text-3)',
          fontSize: 13,
          lineHeight: 1.4,
          padding: 0,
          flexShrink: 0,
        }}
        onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-1)')}
        onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-3)')}
      >
        ✕
      </button>
    </div>
  )
}
