const BADGE_CLASS = {
  Excellent: 'badge-excellent',
  Good: 'badge-good',
  Fair: 'badge-fair',
  Missing: 'badge-missing',
}

const BAR_COLOR = {
  Excellent: '#4F46E5',
  Good: '#3B82F6',
  Fair: '#F59E0B',
  Missing: '#94A3B8',
}

export default function SectionAnalysis({ report }) {
  const sections = report?.sections || []

  return (
    <div className="section-analysis-card">
      <div className="card-title">Section-wise Analysis</div>
      {sections.length === 0 ? (
        <p className="empty-inline">No sections analysed yet.</p>
      ) : (
        <table className="analysis-table">
          <thead>
            <tr>
              <th>Paper Section</th>
              <th>Best Matching Slide</th>
              <th>Similarity</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {sections.map((s) => (
              <tr key={s.name} id={`section-${s.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`}>
                <td className="section-name">{s.name}</td>
                <td className="slide-match">
                  {s.slides ? (
                    s.slides
                  ) : (
                    <span className="not-found-text">Not Found</span>
                  )}
                </td>
                <td className="sim-cell">
                  <div className="sim-bar-wrap">
                    <div className="mini-bar-bg">
                      <div
                        className="mini-bar"
                        style={{ width: `${s.pct}%`, background: BAR_COLOR[s.status] || '#4F46E5' }}
                      />
                    </div>
                    <span className="sim-pct">{s.pct}%</span>
                  </div>
                </td>
                <td>
                  <span className={`status-badge ${BADGE_CLASS[s.status] || 'badge-missing'}`}>{s.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}