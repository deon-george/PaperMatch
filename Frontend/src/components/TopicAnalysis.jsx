import TopicsCard from './TopicsCard'
import SectionAnalysis from './SectionAnalysis'

export default function TopicAnalysis({ comparison, onNavigate }) {
  const report = comparison?.report

  return (
    <div className="page-shell">
      <header className="top-header">
        <div className="header-left">
          <h1>Topic Analysis</h1>
          <p>Deep dive into how well the deck covers the paper's topics.</p>
        </div>
        {!report && (
          <button className="new-comparison-btn" id="go-compare-btn" onClick={() => onNavigate?.('dashboard')}>
            New Comparison
          </button>
        )}
      </header>

      <div className="dashboard-body">
        {!report ? (
          <div className="empty-state">
            <div className="empty-illustration">🧭</div>
            <h3>No topic analysis yet</h3>
            <p>Run a comparison first — the missing and extra topics will be shown here.</p>
          </div>
        ) : (
          <div className="topic-analysis-grid">
            <TopicsCard report={report} />
            <SectionAnalysis report={report} />
          </div>
        )}
      </div>
    </div>
  )
}