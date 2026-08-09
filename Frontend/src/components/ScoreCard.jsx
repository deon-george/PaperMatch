const RADIUS = 72
const STROKE = 14
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

const COLORS = ['#4F46E5', '#06B6D4', '#F59E0B', '#10B981', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#6366F1']

export default function ScoreCard({ report }) {
  const breakdown = report?.breakdown || []
  const score = report?.overall_score ?? 0
  const label = report?.score_label || 'No Analysis'
  const description = report?.score_description || ''
  const offset = CIRCUMFERENCE - (score / 100) * CIRCUMFERENCE

  return (
    <div className="score-card">
      <div className="card-title">
        Overall Similarity Score
        <span className="card-title-info">i</span>
      </div>

      <div className="score-content">
        {/* Donut */}
        <div className="score-donut-wrap">
          <svg
            className="donut-svg"
            width="170"
            height="170"
            viewBox="0 0 170 170"
          >
            <defs>
              <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#06B6D4" />
                <stop offset="60%" stopColor="#4F46E5" />
                <stop offset="100%" stopColor="#6366F1" />
              </linearGradient>
            </defs>
            <circle
              cx="85"
              cy="85"
              r={RADIUS}
              fill="none"
              stroke="#E2E8F0"
              strokeWidth={STROKE}
            />
            <circle
              cx="85"
              cy="85"
              r={RADIUS}
              fill="none"
              stroke="url(#scoreGrad)"
              strokeWidth={STROKE}
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={offset}
              strokeLinecap="round"
            />
          </svg>
          <div className="donut-center">
            <div className="donut-percent">{score}%</div>
            <div className="donut-label">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
              </svg>
              {label}
            </div>
          </div>
        </div>

        {/* Breakdown */}
        <div className="score-details">
          <p className="score-desc">{description}</p>
          <div className="breakdown-title">Score Breakdown</div>
          <div className="breakdown-list">
            {breakdown.map((item, i) => (
              <div className="breakdown-item" key={item.label}>
                <span className="breakdown-label">{item.label}</span>
                <div className="breakdown-bar-wrap">
                  <div
                    className="breakdown-bar"
                    style={{ width: `${item.pct}%`, background: COLORS[i % COLORS.length] }}
                  />
                </div>
                <span className="breakdown-pct">{item.pct}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}