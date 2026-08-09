import { loadHistory, formatDate } from '../lib/history'

function downloadReport(report, name) {
  const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `papermatch-${(name || 'report').replace(/\.[^.]+$/, '')}.json`
  a.click()
  URL.revokeObjectURL(url)
}

export default function Reports({ onOpen }) {
  const history = loadHistory()

  return (
    <div className="page-shell">
      <header className="top-header">
        <div className="header-left">
          <h1>Reports</h1>
          <p>Download or revisit the full comparison reports.</p>
        </div>
      </header>

      <div className="dashboard-body">
        {history.length === 0 ? (
          <div className="empty-state">
            <div className="empty-illustration">📊</div>
            <h3>No reports yet</h3>
            <p>Completed comparisons are stored as downloadable reports.</p>
          </div>
        ) : (
          <div className="history-list">
            {history.map((entry, i) => (
              <div className="history-item" key={entry.date + i} id={`report-${i}`}>
                <div className="score-chip mid">{entry.report?.overall_score ?? '–'}%</div>
                <div className="history-meta">
                  <h3>{entry.files?.presentation_name || 'Presentation'} report</h3>
                  <p>
                    Paper: {entry.files?.paper_name || 'Paper'}
                    <span className="dot" />
                    {formatDate(entry.date)}
                  </p>
                </div>
                <div className="report-actions">
                  <button className="view-btn" onClick={() => onOpen?.(entry)}>
                    View
                  </button>
                  <button
                    className="view-btn ghost"
                    onClick={() => downloadReport(entry.report, entry.files?.presentation_name)}
                  >
                    Download
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}