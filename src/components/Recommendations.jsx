const recs = [
  'Add experimental setup details',
  'Include hyperparameter configurations',
  'Add future work section',
  'Consider adding more visual elements for better engagement',
  'Great coverage of methodology and results!',
]

function CheckIcon() {
  return (
    <svg className="rec-check" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
      <polyline points="22 4 12 14.01 9 11.01"/>
    </svg>
  )
}

export default function Recommendations() {
  return (
    <div className="recommendations-card">
      <div className="rec-header">
        <span className="rec-bulb">💡</span>
        Recommendations
      </div>
      <ul className="rec-list">
        {recs.map((rec, i) => (
          <li className="rec-item" key={i} id={`rec-${i}`}>
            <CheckIcon />
            <span>{rec}</span>
          </li>
        ))}
      </ul>
      <button className="download-btn" id="download-report-btn">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="7 10 12 15 17 10"/>
          <line x1="12" y1="15" x2="12" y2="3"/>
        </svg>
        Download Full Report
      </button>
    </div>
  )
}
