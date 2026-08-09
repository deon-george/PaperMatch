import { loadHistory, formatDate } from '../lib/history'

function scoreClass(score) {
  if (score >= 70) return 'score-chip good'
  if (score >= 45) return 'score-chip mid'
  return 'score-chip low'
}

export default function History({ onOpen }) {
  const history = loadHistory()

  return (
    <div className="page-shell">
      <header className="top-header">
        <div className="header-left">
          <h1>Comparisons History</h1>
          <p>Your past paper-vs-presentation comparisons.</p>
        </div>
      </header>

      <div className="dashboard-body">
        {history.length === 0 ? (
          <div className="empty-state">
            <div className="empty-illustration">🕘</div>
            <h3>No comparisons yet</h3>
            <p>Run a comparison and it will appear here.</p>
          </div>
        ) : (
          <div className="history-list">
            {history.map((entry, i) => (
              <div className="history-item" key={entry.date + i} id={`history-${i}`}>
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
                <button className="view-btn" onClick={() => onOpen?.(entry)}>
                  View
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}