export default function AIEvaluation() {
  return (
    <div className="ai-eval-card">
      <div className="ai-eval-header">
        <span className="ai-sparkle">✦</span>
        AI Evaluation
      </div>
      <p className="ai-quote">
        "Your presentation does an excellent job covering the core methodology and results. However, consider adding more details about the experimental setup and future work section to make it more complete."
      </p>
      <button className="view-feedback-btn" id="view-feedback-btn">
        View Full Feedback
      </button>
    </div>
  )
}
