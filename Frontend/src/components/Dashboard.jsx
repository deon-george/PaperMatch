import FileComparison from './FileComparison'
import ScoreCard from './ScoreCard'
import QuickSummary from './QuickSummary'
import AIEvaluation from './AIEvaluation'
import SectionAnalysis from './SectionAnalysis'
import TopicsCard from './TopicsCard'
import Recommendations from './Recommendations'

export default function Dashboard({ comparison, loading, error, onCompare }) {
  const report = comparison?.report

  return (
    <>
      {/* Header */}
      <header className="top-header">
        <div className="header-left">
          <h1>PaperMatch</h1>
          <p>Analyze how well your presentation represents your research paper.</p>
        </div>
      </header>

      <div className="dashboard-body">

      <FileComparison onCompare={onCompare} loading={loading} />

      {error && (
        <div className="error-banner" id="error-banner">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          {error}
        </div>
      )}

      {loading && (
        <div className="loading-card" id="loading-card">
          <div className="spinner" />
          <p>Extracting text, retrieving with RAG and comparing…</p>
        </div>
      )}

      {!loading && report && (
        <>
          <div className="analysis-grid">
            <ScoreCard report={report} />
            <QuickSummary report={report} />
            <AIEvaluation report={report} />
          </div>

          <div className="bottom-grid">
            <SectionAnalysis report={report} />
            <TopicsCard report={report} />
            <Recommendations report={report} />
          </div>
        </>
      )}

      {!loading && !report && !error && (
        <div className="empty-state" id="empty-state">
          <div className="empty-illustration">📄 ⇄ 🖥️</div>
          <h3>No comparison yet</h3>
          <p>Upload a research paper (PDF) and your seminar presentation (PPTX), then hit Compare.</p>
        </div>
      )}
      </div>
    </>
  )
}