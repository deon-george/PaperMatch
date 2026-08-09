import { useState } from 'react'

function initials(name) {
  return (name || '?')
    .split(/[\s.@_]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('') || '?'
}

export default function AuthPage({ user, onLogin, onLogout }) {
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({ username: '', email: '', password: '' })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  if (user) {
    return (
      <div className="page-shell">
        <header className="top-header">
          <div className="header-left">
            <h1>Account</h1>
            <p>You are signed in as {user.username}.</p>
          </div>
        </header>
        <div className="dashboard-body">
          <div className="auth-card">
            <div className="auth-profile">
              <div className="auth-avatar">{initials(user.username)}</div>
              <div className="auth-profile-info">
                <h3>{user.username}</h3>
                <p>{user.email}</p>
              </div>
            </div>
            <p className="auth-note">
              Your comparisons are saved to your PaperMatch account and available on any device.
            </p>
            <button className="view-btn danger" onClick={onLogout}>
              Sign out
            </button>
          </div>
        </div>
      </div>
    )
  }

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    const body =
      mode === 'login'
        ? { username: form.username.trim(), password: form.password }
        : {
            username: form.username.trim(),
            email: form.email.trim(),
            password: form.password,
          }
    try {
      const res = await fetch(`/api/auth/${mode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok || !data.ok) throw new Error(data.error || 'Something went wrong')
      onLogin(data.token, data.user)
    } catch (err) {
      setError(err.message || 'Something went wrong')
    } finally {
      setBusy(false)
    }
  }

  const switchMode = (next) => {
    setMode(next)
    setError(null)
  }

  return (
    <div className="page-shell">
      <header className="top-header">
        <div className="header-left">
          <h1>Account</h1>
          <p>Sign in to sync your comparison history across devices.</p>
        </div>
      </header>
      <div className="dashboard-body">
        <div className="auth-card">
          <div className="auth-tabs">
            <button
              className={`auth-tab ${mode === 'login' ? 'active' : ''}`}
              onClick={() => switchMode('login')}
            >
              Sign in
            </button>
            <button
              className={`auth-tab ${mode === 'register' ? 'active' : ''}`}
              onClick={() => switchMode('register')}
            >
              Create account
            </button>
          </div>

          <form className="auth-form" onSubmit={submit}>
            <label className="auth-field">
              <span>Username</span>
              <input
                type="text"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                placeholder="you@example.com or username"
                autoComplete="username"
                required
              />
            </label>

            {mode === 'register' && (
              <label className="auth-field">
                <span>Email</span>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="you@example.com"
                  autoComplete="email"
                  required
                />
              </label>
            )}

            <label className="auth-field">
              <span>Password</span>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder={mode === 'register' ? 'At least 6 characters' : 'Your password'}
                autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                minLength={mode === 'register' ? 6 : undefined}
                required
              />
            </label>

            {error && <div className="auth-error">{error}</div>}

            <button className="auth-submit" type="submit" disabled={busy}>
              {busy ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
            </button>
          </form>

          <p className="auth-hint">
            {mode === 'login' ? (
              <>New to PaperMatch? <button className="link-btn" onClick={() => switchMode('register')}>Create an account</button></>
            ) : (
              <>Already have an account? <button className="link-btn" onClick={() => switchMode('login')}>Sign in</button></>
            )}
          </p>
        </div>
      </div>
    </div>
  )
}
