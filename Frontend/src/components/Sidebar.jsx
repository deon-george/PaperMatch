import { useState } from 'react'

const navItems = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: (
      <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M9 22V12H15V22" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    id: 'new-comparison',
    label: 'New Comparison',
    icon: (
      <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="10" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M12 8V16M8 12H16" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    id: 'history',
    label: 'Comparisons History',
    icon: (
      <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="10" strokeLinecap="round" strokeLinejoin="round"/>
        <polyline points="12 6 12 12 16 14" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    id: 'reports',
    label: 'Reports',
    icon: (
      <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" strokeLinecap="round" strokeLinejoin="round"/>
        <polyline points="14 2 14 8 20 8" strokeLinecap="round" strokeLinejoin="round"/>
        <line x1="16" y1="13" x2="8" y2="13" strokeLinecap="round" strokeLinejoin="round"/>
        <line x1="16" y1="17" x2="8" y2="17" strokeLinecap="round" strokeLinejoin="round"/>
        <polyline points="10 9 9 9 8 9" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    id: 'report',
    label: 'Full Report',
    icon: (
      <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" strokeLinecap="round" strokeLinejoin="round"/>
        <polyline points="14 2 14 8 20 8" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M8 13h8M8 17h5M8 9h1" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    id: 'topic-analysis',
    label: 'Topic Analysis',
    icon: (
      <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" xmlns="http://www.w3.org/2000/svg">
        <line x1="18" y1="20" x2="18" y2="10" strokeLinecap="round" strokeLinejoin="round"/>
        <line x1="12" y1="20" x2="12" y2="4" strokeLinecap="round" strokeLinejoin="round"/>
        <line x1="6" y1="20" x2="6" y2="14" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    id: 'account',
    label: 'Account',
    icon: (
      <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="12" cy="7" r="4" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
]

function initials(name) {
  return (name || '?')
    .split(/[\s.@_]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('') || '?'
}

const API_PROVIDERS = [
  { id: 'openai', label: 'OpenAI', placeholder: 'sk-...', color: '#10a37f' },
  { id: 'gemini', label: 'Google Gemini', placeholder: 'AIza...', color: '#4285F4' },
  { id: 'anthropic', label: 'Anthropic (Claude)', placeholder: 'sk-ant-...', color: '#D97706' },
]

function ApiKeysModal({ onClose }) {
  const [keys, setKeys] = useState(() => {
    try { return JSON.parse(localStorage.getItem('pm_api_keys') || '{}') } catch { return {} }
  })
  const [saved, setSaved] = useState(false)
  const [showKey, setShowKey] = useState({})

  const handleSave = () => {
    localStorage.setItem('pm_api_keys', JSON.stringify(keys))
    setSaved(true)
    setTimeout(() => setSaved(false), 2200)
  }

  return (
    <div className="modal-backdrop" id="api-keys-modal" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-card">
        <div className="modal-header">
          <div className="modal-title">
            <span className="modal-sparkle">🔑</span>
            Add API Keys
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <p className="modal-subtitle">
          Connect your AI provider keys to unlock advanced analysis, AI-powered insights, and unlimited comparisons.
        </p>

        <div className="modal-fields">
          {API_PROVIDERS.map((provider) => (
            <div className="api-field" key={provider.id}>
              <label className="api-label" htmlFor={`api-key-${provider.id}`}>
                <span className="api-dot" style={{ background: provider.color }} />
                {provider.label}
              </label>
              <div className="api-input-wrap">
                <input
                  id={`api-key-${provider.id}`}
                  className="api-input"
                  type={showKey[provider.id] ? 'text' : 'password'}
                  placeholder={provider.placeholder}
                  value={keys[provider.id] || ''}
                  onChange={(e) => setKeys((prev) => ({ ...prev, [provider.id]: e.target.value }))}
                  autoComplete="off"
                  spellCheck={false}
                />
                <button
                  className="api-eye-btn"
                  type="button"
                  onClick={() => setShowKey((prev) => ({ ...prev, [provider.id]: !prev[provider.id] }))}
                  title={showKey[provider.id] ? 'Hide key' : 'Show key'}
                >
                  {showKey[provider.id] ? (
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/>
                      <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  ) : (
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="modal-footer">
          <button className="modal-cancel-btn" onClick={onClose}>Cancel</button>
          <button className="modal-save-btn" id="save-api-keys-btn" onClick={handleSave}>
            {saved ? '✓ Saved!' : 'Save Keys'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Sidebar({ active = 'dashboard', onNavigate, user = null, onSignOut, isOpen = false, onClose }) {
  const [showApiModal, setShowApiModal] = useState(false)

  return (
    <>
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        {/* Logo */}
        <div className="sidebar-logo">
          <div className="logo-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
          </div>
          <div className="logo-text">
            <div className="logo-name">
              Paper<span>Match</span>
            </div>
            <div className="logo-tagline">Research. Present. Perfect.</div>
          </div>
          {onClose && (
            <button className="sidebar-close-btn" onClick={onClose} aria-label="Close sidebar">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <button
              key={item.id}
              id={`nav-${item.id}`}
              className={`nav-item ${active === item.id ? 'active' : ''}`}
              onClick={() => {
                onNavigate?.(item.id);
                onClose?.();
              }}
            >
              <span className="nav-icon">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        {/* Upgrade to Pro */}
        <div className="sidebar-upgrade">
          <div className="upgrade-header">
            <span className="upgrade-sparkle">✦</span>
            Upgrade to Pro
          </div>
          <p className="upgrade-desc">
            Unlock advanced analysis, AI insights, and export detailed reports.
          </p>
          <button className="upgrade-btn" id="upgrade-btn" onClick={() => setShowApiModal(true)}>
            Upgrade Now
          </button>
        </div>

        {/* User */}
        <div className="sidebar-user" id="user-menu">
          <div className="user-avatar">{user ? initials(user.username) : '?'}</div>
          <div className="user-info">
            {user ? (
              <>
                <div className="user-name">{user.username}</div>
                <div className="user-email">{user.email}</div>
              </>
            ) : (
              <>
                <div className="user-name">Guest</div>
                <div className="user-email">Sign in to sync history</div>
              </>
            )}
          </div>
          <div className="user-actions">
            {user ? (
              <button className="user-action" title="Sign out" onClick={() => {
                onSignOut?.();
                onClose?.();
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H9"/>
                  <polyline points="16 17 21 12 16 7"/>
                  <line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
              </button>
            ) : (
              <button
                className="user-action"
                title="Account"
                onClick={() => {
                  onNavigate?.('account');
                  onClose?.();
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </button>
            )}
          </div>
        </div>
      </aside>

      {showApiModal && <ApiKeysModal onClose={() => setShowApiModal(false)} />}
    </>
  )
}
