import FileComparison from './FileComparison'
import ScoreCard from './ScoreCard'
import QuickSummary from './QuickSummary'
import AIEvaluation from './AIEvaluation'
import SectionAnalysis from './SectionAnalysis'
import TopicsCard from './TopicsCard'
import Recommendations from './Recommendations'

export default function Dashboard() {
  return (
    <div className="main-content">
      {/* Header */}
      <header className="top-header">
        <div className="header-left">
          <h1>Welcome back, Arjun! 👋</h1>
          <p>Analyze how well your presentation represents your research paper.</p>
        </div>
        <button className="new-comparison-btn" id="new-comparison-header-btn">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          New Comparison
        </button>
      </header>

      {/* Body */}
      <div className="dashboard-body">
        <FileComparison />

        <div className="analysis-grid">
          <ScoreCard />
          <QuickSummary />
          <AIEvaluation />
        </div>

        <div className="bottom-grid">
          <SectionAnalysis />
          <TopicsCard />
          <Recommendations />
        </div>
      </div>
    </div>
  )
}
