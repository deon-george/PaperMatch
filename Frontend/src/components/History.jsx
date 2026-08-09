import { useEffect, useState } from 'react'
import { loadHistory, formatDate } from '../lib/history'
import { authFetch } from '../lib/auth'

function scoreClass(score) {
  if (score >= 70) return 'score-chip good'
  if (score >= 45) return 'score-chip mid'
  return 'score-chip low'
}

export default function History({ user, onOpen }) {
  const [entries, setEntries] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    if (user) {
      authFetch('/api/history')
        .then((res) => res.json())
        .then((data) => {
          if (cancelled) return
          if (data.ok) {
            setEntries(data.entries)
          } else {
            setError(data.error || 'Could not load your history.')
            setEntries([])
          }
        })
        .catch(() => {
          if (!cancelled) {
            setError('Could not load your history. Please try again.')
            setEntries([])
          }
        })
    } else {
      setEntries(loadHistory())
    }
    return () => {
      cancelled = true
    }
  }, [user])

  const removeEntry = async (entry) => {
    if (!entry.id) return
    try {
      const res = await authFetch(`/api/history/${entry.id}`, { method: 'DELETE' })
      const data = await res.json()
      if (res.ok && data.ok) {
        setEntries((prev) => prev.filter((e) => e.id !== entry.id))
      }
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="page-shell">
      <header className="top-header">
        <div className="header-left">
          <h1>Comparisons History</h1>
          <p>
            {user
              ? 'Your paper-vs-presentation comparisons, saved to your account.'
              : 'Your past paper-vs-presentation comparisons.'}
          </p>
        </div>
      </header>

      <div className="dashboard-body">
        {error ? (
          <div className="empty-state">
            <div className="empty-illustration">⚠️</div>
            <h3>Could not load history</h3>
            <p>{error}</p>
          </div>
        ) : entries === null ? (
          <div className="empty-state">
            <div className="empty-illustration">🕘</div>
            <h3>Loading…</h3>
          </div>
        ) : entries.length === 0 ? (
          <div className="empty-state">
            <div className="empty-illustration">🕘</div>
            <h3>No comparisons yet</h3>
            <p>Run a comparison and it will appear here.</p>
          </div>
        ) : (
          <div className="history-list">
            {entries.map((entry, i) => (
              <div className="history-item" key={entry.id || entry.date + i} id={`history-${i}`}>
                <div className={scoreClass(entry.report?.overall_score)}>
                  {entry.report?.overall_score ?? '–'}%
                </div>
                <div className="history-meta">
                  <h3>{entry.files?.paper_name || 'Paper'}</h3>
                  <p>
                    vs {entry.files?.presentation_name || 'Presentation'}
                    <span className="dot" />
                    {formatDate(entry.date)}
                  </p>
                </div>
                <div className="report-actions">
                  <button className="view-btn" onClick={() => onOpen?.(entry)}>
                    View
                  </button>
                  {entry.id && (
                    <button
                      className="view-btn ghost delete"
                      title="Delete this comparison"
                      onClick={() => removeEntry(entry)}
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
