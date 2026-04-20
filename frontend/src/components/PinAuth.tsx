import { useRef, useState, KeyboardEvent, ClipboardEvent } from 'react'

const CORRECT_PIN = '7535'
const PIN_LENGTH = 4

interface Props {
  onSuccess: () => void
}

export default function PinAuth({ onSuccess }: Props) {
  const [digits, setDigits] = useState<string[]>(Array(PIN_LENGTH).fill(''))
  const [error, setError] = useState(false)
  const [shake, setShake] = useState(false)
  const inputs = useRef<(HTMLInputElement | null)[]>([])

  const triggerError = () => {
    setError(true)
    setShake(true)
    setDigits(Array(PIN_LENGTH).fill(''))
    setTimeout(() => {
      setShake(false)
      inputs.current[0]?.focus()
    }, 600)
    setTimeout(() => setError(false), 2500)
  }

  const submit = (pin: string) => {
    if (pin === CORRECT_PIN) {
      sessionStorage.setItem('commanddesk_auth', 'true')
      onSuccess()
    } else {
      triggerError()
    }
  }

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return
    const char = value.slice(-1)
    const next = [...digits]
    next[index] = char
    setDigits(next)
    setError(false)

    if (char && index < PIN_LENGTH - 1) {
      inputs.current[index + 1]?.focus()
    }

    if (char && index === PIN_LENGTH - 1) {
      const pin = [...next.slice(0, PIN_LENGTH - 1), char].join('')
      if (pin.length === PIN_LENGTH) submit(pin)
    }

    if (!char && index > 0) {
      inputs.current[index - 1]?.focus()
    }
  }

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      const next = [...digits]
      next[index - 1] = ''
      setDigits(next)
      inputs.current[index - 1]?.focus()
    }
    if (e.key === 'Enter') {
      const pin = digits.join('')
      if (pin.length === PIN_LENGTH) submit(pin)
    }
  }

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, PIN_LENGTH)
    if (!pasted) return
    const next = Array(PIN_LENGTH).fill('')
    pasted.split('').forEach((ch, i) => { next[i] = ch })
    setDigits(next)
    const focusIdx = Math.min(pasted.length, PIN_LENGTH - 1)
    inputs.current[focusIdx]?.focus()
    if (pasted.length === PIN_LENGTH) submit(pasted)
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        background: 'var(--bg-base)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        gap: 0,
      }}
    >
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 40 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: 'var(--blue)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 18,
        }}>
          ⌘
        </div>
        <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 22, color: 'var(--text-1)' }}>
          CommandDesk
        </span>
      </div>

      {/* Card */}
      <div style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderRadius: 16,
        padding: '36px 40px',
        width: 320,
        textAlign: 'center',
      }}>
        <p style={{ fontFamily: 'DM Mono, monospace', fontSize: 11, color: 'var(--text-3)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>
          Enter PIN to continue
        </p>
        <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 20, color: 'var(--text-1)', marginBottom: 28 }}>
          Workspace locked
        </h2>

        {/* PIN boxes */}
        <div
          style={{
            display: 'flex', gap: 12, justifyContent: 'center', marginBottom: 24,
            animation: shake ? 'pin-shake 0.5s ease' : 'none',
          }}
        >
          {digits.map((d, i) => (
            <input
              key={i}
              ref={el => { inputs.current[i] = el }}
              type="password"
              inputMode="numeric"
              maxLength={1}
              value={d}
              autoFocus={i === 0}
              onChange={e => handleChange(i, e.target.value)}
              onKeyDown={e => handleKeyDown(i, e)}
              onPaste={handlePaste}
              style={{
                width: 52, height: 60,
                textAlign: 'center',
                fontSize: 24,
                fontFamily: 'DM Mono, monospace',
                fontWeight: 700,
                borderRadius: 10,
                border: `2px solid ${error ? 'var(--red)' : d ? 'var(--blue)' : 'var(--border)'}`,
                background: 'var(--bg-elevated)',
                color: error ? 'var(--red)' : 'var(--text-1)',
                outline: 'none',
                transition: 'border-color 0.15s, color 0.15s',
                caretColor: 'transparent',
              }}
            />
          ))}
        </div>

        {/* Error message */}
        <p style={{
          fontSize: 13,
          fontFamily: 'DM Sans, sans-serif',
          color: 'var(--red)',
          minHeight: 20,
          transition: 'opacity 0.2s',
          opacity: error ? 1 : 0,
        }}>
          Incorrect PIN. Please try again.
        </p>
      </div>

      <style>{`
        @keyframes pin-shake {
          0%, 100% { transform: translateX(0); }
          20%       { transform: translateX(-8px); }
          40%       { transform: translateX(8px); }
          60%       { transform: translateX(-6px); }
          80%       { transform: translateX(6px); }
        }
      `}</style>
    </div>
  )
}
