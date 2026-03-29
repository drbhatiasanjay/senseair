import { useState } from 'react'

const API_URL = import.meta.env.VITE_API_URL || `${window.location.protocol}//${window.location.hostname}:8000`

interface LoginProps {
  onLogin: (token: string, email: string) => void
}

export function Login({ onLogin }: LoginProps) {
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [step, setStep] = useState<'email' | 'otp'>('email')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [devCode, setDevCode] = useState('')

  const requestOtp = async () => {
    setError('')
    setLoading(true)
    try {
      const resp = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await resp.json()
      if (!resp.ok) {
        setError(data.detail || 'Not authorized')
        return
      }
      setStep('otp')
      if (data.dev_code) setDevCode(data.dev_code)
    } catch {
      setError('Failed to connect to server')
    } finally {
      setLoading(false)
    }
  }

  const verifyOtp = async () => {
    setError('')
    setLoading(true)
    try {
      const resp = await fetch(`${API_URL}/api/auth/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      })
      const data = await resp.json()
      if (!resp.ok) {
        setError(data.detail || 'Invalid code')
        return
      }
      localStorage.setItem('senseair_token', data.token)
      localStorage.setItem('senseair_email', data.email)
      onLogin(data.token, data.email)
    } catch {
      setError('Failed to verify')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ position: 'relative', zIndex: 1 }}>
      <div
        className="w-full max-w-sm rounded-2xl p-8"
        style={{
          background: 'var(--bg-card)',
          backdropFilter: 'blur(12px)',
          border: '1px solid var(--border)',
        }}
      >
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold" style={{ color: 'var(--accent)' }}>SenseAir</h1>
          <p className="text-sm mt-2" style={{ color: 'var(--text-secondary)' }}>
            WiFi CSI Sensing Dashboard
          </p>
        </div>

        {step === 'email' ? (
          <>
            <label className="block text-xs font-medium uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && requestOtp()}
              placeholder="your@email.com"
              className="w-full rounded-xl px-4 py-3 text-sm outline-none"
              style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border)',
                color: 'var(--text-primary)',
              }}
            />
            <button
              onClick={requestOtp}
              disabled={!email || loading}
              className="w-full mt-4 py-3 rounded-xl text-sm font-semibold transition-opacity"
              style={{
                background: 'var(--accent)',
                color: '#060a13',
                opacity: !email || loading ? 0.5 : 1,
              }}
            >
              {loading ? 'Sending...' : 'Continue'}
            </button>
          </>
        ) : (
          <>
            <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
              Enter the code sent to <span style={{ color: 'var(--accent)' }}>{email}</span>
            </p>
            {devCode && (
              <div className="mb-3 p-3 rounded-lg text-center" style={{ background: 'rgba(99,179,237,0.1)', border: '1px solid var(--border)' }}>
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Dev code: </span>
                <span className="text-lg font-bold tracking-widest" style={{ color: 'var(--accent)' }}>{devCode}</span>
              </div>
            )}
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && verifyOtp()}
              placeholder="000000"
              maxLength={6}
              className="w-full rounded-xl px-4 py-3 text-sm text-center tracking-widest outline-none"
              style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border)',
                color: 'var(--text-primary)',
                fontSize: 20,
              }}
            />
            <button
              onClick={verifyOtp}
              disabled={code.length !== 6 || loading}
              className="w-full mt-4 py-3 rounded-xl text-sm font-semibold transition-opacity"
              style={{
                background: 'var(--accent)',
                color: '#060a13',
                opacity: code.length !== 6 || loading ? 0.5 : 1,
              }}
            >
              {loading ? 'Verifying...' : 'Login'}
            </button>
            <button
              onClick={() => { setStep('email'); setCode(''); setDevCode('') }}
              className="w-full mt-2 py-2 text-sm"
              style={{ color: 'var(--text-muted)' }}
            >
              Use different email
            </button>
          </>
        )}

        {error && (
          <p className="mt-3 text-sm text-center" style={{ color: 'var(--red)' }}>{error}</p>
        )}
      </div>
    </div>
  )
}
