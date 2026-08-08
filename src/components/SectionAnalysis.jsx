const sections = [
  { name: 'Abstract', slide: 'Slide 1', pct: 95, color: '#4F46E5', badge: 'Excellent', badgeClass: 'badge-excellent' },
  { name: 'Introduction', slide: 'Slide 2', pct: 90, color: '#4F46E5', badge: 'Excellent', badgeClass: 'badge-excellent' },
  { name: 'Related Work', slide: 'Slide 3', pct: 75, color: '#4F46E5', badge: 'Good', badgeClass: 'badge-good' },
  { name: 'Methodology', slide: 'Slides 4-6', pct: 92, color: '#4F46E5', badge: 'Excellent', badgeClass: 'badge-excellent' },
  { name: 'Results', slide: 'Slides 7-8', pct: 85, color: '#4F46E5', badge: 'Good', badgeClass: 'badge-good' },
  { name: 'Conclusion', slide: 'Slide 9', pct: 60, color: '#F59E0B', badge: 'Fair', badgeClass: 'badge-fair' },
  { name: 'Future Work', slide: null, pct: 0, color: '#94A3B8', badge: 'Missing', badgeClass: 'badge-missing' },
]

export default function SectionAnalysis() {
  return (
    <div className="section-analysis-card">
      <div className="card-title">Section-wise Analysis</div>
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
            <tr key={s.name} id={`section-${s.name.toLowerCase().replace(' ', '-')}`}>
              <td className="section-name">{s.name}</td>
              <td className="slide-match">
                {s.slide ? (
                  s.slide
                ) : (
                  <span className="not-found-text">Not Found</span>
                )}
              </td>
              <td className="sim-cell">
                <div className="sim-bar-wrap">
                  <div className="mini-bar-bg">
                    <div
                      className="mini-bar"
                      style={{ width: `${s.pct}%`, background: s.color }}
                    />
                  </div>
                  <span className="sim-pct">{s.pct}%</span>
                </div>
              </td>
              <td>
                <span className={`status-badge ${s.badgeClass}`}>{s.badge}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
