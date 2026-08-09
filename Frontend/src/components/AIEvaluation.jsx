export default function AIEvaluation({ report, onNavigate }) {
  const quote = report?.ai_quote || ''
  const quality = report?.ai_quality ?? null
  return (
    <div className="ai-eval-card">
      <div className="ai-eval-header">
        <span className="ai-sparkle">✦</span>
        AI Evaluation
        {quality !== null && <span className="ai-quality-pill">{quality}%</span>}
      </div>
      <p className="ai-quote">
        {quote ? `"${quote}"` : 'AI evaluation will appear here after a comparison.'}
      </p>
      <button
        className="view-feedback-btn"
        id="view-feedback-btn"
        onClick={() => onNavigate?.('report')}
        disabled={!report}
      >
        View Full Feedback
      </button>
    </div>
  )
}