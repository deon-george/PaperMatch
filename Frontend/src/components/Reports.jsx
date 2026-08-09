import { loadHistory, formatDate } from '../lib/history'

function downloadReportPDF(report, name) {
  const title = `PaperMatch Report — ${(name || 'report').replace(/\.[^.]+$/, '')}`
  const overall = report?.overall_score ?? '–'
  const files = report?.files || {}

  // Build a readable section from the report object
  function renderSection(obj, depth = 0) {
    if (!obj || typeof obj !== 'object') return `<span>${obj ?? ''}</span>`
    return Object.entries(obj)
      .map(([k, v]) => {
        const label = k.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
        if (typeof v === 'object' && v !== null && !Array.isArray(v)) {
          return `<div style="margin:${depth ? 6 : 12}px 0 0 ${depth * 16}px">
            <strong style="color:#4F46E5;font-size:13px">${label}</strong>
            ${renderSection(v, depth + 1)}
          </div>`
        }
        if (Array.isArray(v)) {
          return `<div style="margin:6px 0 0 ${depth * 16}px">
            <strong style="font-size:12px;color:#374151">${label}:</strong>
            <ul style="margin:4px 0 0 16px;padding:0">${v.map((item) => `<li style="font-size:12px;color:#374151;margin:2px 0">${typeof item === 'object' ? JSON.stringify(item) : item}</li>`).join('')}</ul>
          </div>`
        }
        return `<div style="margin:4px 0 0 ${depth * 16}px;font-size:12px;color:#374151">
          <strong>${label}:</strong> ${v}
        </div>`
      })
      .join('')
  }

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <title>${title}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Inter', sans-serif; color: #111827; background: #fff; padding: 32px 40px; }
    .header { display: flex; align-items: center; gap: 16px; margin-bottom: 28px; border-bottom: 2px solid #4F46E5; padding-bottom: 16px; }
    .logo { background: linear-gradient(135deg,#6366F1,#8B5CF6); color: #fff; font-weight: 800; font-size: 18px; padding: 8px 16px; border-radius: 8px; }
    .header-text h1 { font-size: 20px; font-weight: 800; color: #111827; }
    .header-text p { font-size: 12px; color: #6B7280; margin-top: 2px; }
    .score-banner { background: linear-gradient(135deg,#EEF2FF,#F5F3FF); border: 1px solid #C7D2FE; border-radius: 12px; padding: 20px 24px; margin-bottom: 24px; display: flex; align-items: center; gap: 20px; }
    .score-num { font-size: 48px; font-weight: 800; color: #4F46E5; line-height: 1; }
    .score-label { font-size: 13px; color: #6B7280; }
    .score-label strong { display: block; font-size: 15px; color: #111827; margin-bottom: 4px; }
    .section { margin-bottom: 20px; }
    .section-title { font-size: 14px; font-weight: 700; color: #4F46E5; margin-bottom: 8px; padding-bottom: 4px; border-bottom: 1px solid #E0E7FF; }
    .meta-row { display: flex; gap: 32px; margin-bottom: 20px; }
    .meta-item { flex: 1; }
    .meta-item label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #9CA3AF; display: block; margin-bottom: 4px; }
    .meta-item span { font-size: 13px; font-weight: 600; color: #111827; }
    @media print {
      body { padding: 20px; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">PM</div>
    <div class="header-text">
      <h1>PaperMatch Analysis Report</h1>
      <p>Generated on ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
    </div>
  </div>

  <div class="score-banner">
    <div class="score-num">${overall}%</div>
    <div class="score-label">
      <strong>Overall Match Score</strong>
      How well the presentation covers the research paper content.
    </div>
  </div>

  <div class="meta-row">
    <div class="meta-item">
      <label>Research Paper</label>
      <span>${files.paper_name || report?.files?.paper || 'N/A'}</span>
    </div>
    <div class="meta-item">
      <label>Presentation</label>
      <span>${files.presentation_name || report?.files?.presentation || 'N/A'}</span>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Full Report Details</div>
    ${renderSection(report)}
  </div>
</body>
</html>`

  const win = window.open('', '_blank', 'width=900,height=700')
  win.document.write(html)
  win.document.close()
  win.focus()
  setTimeout(() => {
    win.print()
  }, 600)
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
                    onClick={() => downloadReportPDF(entry.report, entry.files?.presentation_name)}
                  >
                    Download PDF
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