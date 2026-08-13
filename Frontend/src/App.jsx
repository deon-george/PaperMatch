import { useEffect, useState } from 'react'
import Sidebar from './components/Sidebar'
import Dashboard from './components/Dashboard'
import History from './components/History'
import Reports from './components/Reports'
import ReportPage from './components/ReportPage'
import TopicAnalysis from './components/TopicAnalysis'
import AuthPage from './components/AuthPage'
import { apiUrl } from './lib/api'
import { saveHistory } from './lib/history'
import { authFetch, clearAuth, getToken, getUser, setAuth } from './lib/auth'

async function analyzeFiles(paper, presentation) {
  const form = new FormData()
  form.append('paper', paper)
  form.append('presentation', presentation)
  const res = await fetch(apiUrl('/api/analyze'), { method: 'POST', body: form })
  const data = await res.json()
  if (!res.ok || !data.ok) throw new Error(data.error || 'Analysis failed')
  return data
}

export default function App() {
  const [page, setPage] = useState('dashboard')
  const [comparison, setComparison] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [user, setUser] = useState(() => getUser())
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    if (!getToken() || user) return
    authFetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.ok) {
          setAuth(getToken(), data.user)
          setUser(data.user)
        } else {
          clearAuth()
        }
      })
      .catch(() => clearAuth())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleLogin = (token, userData) => {
    setAuth(token, userData)
    setUser(userData)
    setPage('dashboard')
  }

  const handleLogout = () => {
    clearAuth()
    setUser(null)
    setPage('dashboard')
  }

  const handleCompare = async (paper, presentation) => {
    setLoading(true)
    setError(null)
    try {
      const report = await analyzeFiles(paper, presentation)
      const entry = { report, files: report.files, date: new Date().toISOString() }
      setComparison(entry)
      saveHistory(entry)
      if (user) {
        authFetch('/api/history', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ files: entry.files, report: entry.report }),
        }).catch(() => {})
      }
      setPage('dashboard')
    } catch (err) {
      setError(err.message || 'Something went wrong while analyzing the files.')
    } finally {
      setLoading(false)
    }
  }

  const openHistoryEntry = (entry) => {
    setComparison(entry)
    setPage('dashboard')
  }

  const initials = (name) => {
    return (name || '?')
      .split(/[\s.@_]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0].toUpperCase())
      .join('') || '?'
  }

  return (
    <div className="app-layout">
      {/* Mobile Top Header */}
      <div className="mobile-header">
        <button
          className="hamburger-btn"
          onClick={() => setSidebarOpen(true)}
          aria-label="Open menu"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
        <div className="mobile-logo">
          <span className="mobile-logo-icon">📄</span>
          <span className="mobile-logo-text">Paper<span>Match</span></span>
        </div>
        <div
          className="mobile-avatar"
          onClick={() => setPage('account')}
          title="Account"
        >
          {user ? initials(user.username) : '?'}
        </div>
      </div>

      {/* Sidebar Backdrop Overlay on Mobile */}
      {sidebarOpen && (
        <div
          className="sidebar-backdrop"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Sidebar
        active={page}
        onNavigate={setPage}
        user={user}
        onSignOut={handleLogout}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <div className="main-content">
        {page === 'dashboard' && (
          <Dashboard
            comparison={comparison}
            loading={loading}
            error={error}
            onCompare={handleCompare}
            onNavigate={setPage}
          />
        )}
        {page === 'new-comparison' && (
          <Dashboard
            comparison={null}
            loading={loading}
            error={error}
            onCompare={handleCompare}
            onNavigate={setPage}
          />
        )}
        {page === 'history' && <History user={user} onOpen={openHistoryEntry} />}
        {page === 'reports' && <Reports user={user} onOpen={openHistoryEntry} />}
        {page === 'report' && <ReportPage comparison={comparison} onNavigate={setPage} />}
        {page === 'topic-analysis' && (
          <TopicAnalysis comparison={comparison} onNavigate={setPage} />
        )}
        {page === 'account' && (
          <AuthPage user={user} onLogin={handleLogin} onLogout={handleLogout} />
        )}
      </div>
    </div>
  )
}
