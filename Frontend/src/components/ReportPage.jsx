import ScoreCard from './ScoreCard'
import QuickSummary from './QuickSummary'
import AIEvaluation from './AIEvaluation'
import SectionAnalysis from './SectionAnalysis'
import TopicsCard from './TopicsCard'
import Recommendations from './Recommendations'
import { formatDate } from '../lib/history'

async function downloadReportPDF(report) {
  const res = await fetch('/api/report/pdf', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(report),
  })
  if (!res.ok) throw new Error('Could not generate the PDF report.')
  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `papermatch-report-${Date.now()}.pdf`
  a.click()
  URL.revokeObjectURL(url)
}

function scoreClass(score) {
  if (score >= 70) return 'good'
  if (score >= 45) return 'mid'
  return 'low'
}

export default function ReportPage({ comparison, onNavigate }) {
  const report = comparison?.report
  const files = comparison?.files || report?.files || {}

  if (!report) {
    return (
      <div className="page-shell">
        <header className="top-header">
          <div className="header-left">
            <h1>Full Report</h1>
            <p>View the complete similarity report for a comparison.</p>
          </div>
        </header>
        <div className="dashboard-body">
          <div className="empty-state">
            <div className="empty-illustration">📊</div>
            <h3>No report yet</h3>
            <p>Run a comparison first — the full report with every detail will appear here.</p>
            <button className="new-comparison-btn" onClick={() => onNavigate?.('dashboard')}>
              New Comparison
            </button>
          </div>
        </div>
      </div>
    )
  }

  const quick = report.quick_summary || {}
  const score = report.overall_score ?? '–'

  return (
    <div className="page-shell">
      <header className="top-header">
        <div className="header-left">
          <h1>Similarity Report</h1>
          <p>
            {files.paper_name || 'Paper'} vs {files.presentation_name || 'Presentation'}
            {comparison?.date ? <span className="report-date"> · {formatDate(comparison.date)}</span> : null}
          </p>
        </div>
        <div className="report-actions">
          <button className="new-comparison-btn" onClick={() => onNavigate?.('new-comparison')}>
            New Comparison
          </button>
          <button className="download-btn report-download-btn" onClick={() => downloadReportPDF(report)}>
            Download PDF
          </button>
        </div>
      </header>

      <div className="dashboard-body">
        {/* Meta strip */}
        <div className="report-meta">
          <div className="report-meta-item">
            <span className="report-meta-label">Research Paper</span>
            <span className="report-meta-value">{files.paper_name || 'Paper'}</span>
          </div>
          <div className="report-meta-item">
            <span className="report-meta-label">Presentation</span>
            <span className="report-meta-value">{files.presentation_name || 'Presentation'}</span>
          </div>
          <div className="report-meta-item">
            <span className="report-meta-label">Slides</span>
            <span className="report-meta-value">{quick.total_slides ?? '–'}</span>
          </div>
          <div className="report-meta-item">
            <span className="report-meta-label">Paper Sections</span>
            <span className="report-meta-value">{quick.total_sections ?? '–'}</span>
          </div>
          <div className="report-meta-item report-meta-score">
            <span className="report-meta-label">Overall Score</span>
            <span className={`score-chip ${scoreClass(score)} report-score-chip`}>{score}%</span>
          </div>
        </div>

        {/* Top cards */}
        <div className="analysis-grid">
          <ScoreCard report={report} />
          <QuickSummary report={report} />
          <AIEvaluation report={report} onNavigate={onNavigate} />
        </div>

        {/* Detailed sections */}
        <div className="bottom-grid report-details-grid">
          <SectionAnalysis report={report} />
          <TopicsCard report={report} />
          <Recommendations report={report} />
        </div>
      </div>
    </div>
  )
}
