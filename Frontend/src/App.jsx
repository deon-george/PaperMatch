import { useState } from 'react'
import Sidebar from './components/Sidebar'
import Dashboard from './components/Dashboard'
import History from './components/History'
import Reports from './components/Reports'
import TopicAnalysis from './components/TopicAnalysis'
import { loadHistory, saveHistory } from './lib/history'

async function analyzeFiles(paper, presentation) {
  const form = new FormData()
  form.append('paper', paper)
  form.append('presentation', presentation)
  const res = await fetch('/api/analyze', { method: 'POST', body: form })
  const data = await res.json()
  if (!res.ok || !data.ok) throw new Error(data.error || 'Analysis failed')
  return data
}

export default function App() {
  const [page, setPage] = useState('dashboard')
  const [comparison, setComparison] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleCompare = async (paper, presentation) => {
    setLoading(true)
    setError(null)
    try {
      const report = await analyzeFiles(paper, presentation)
      setComparison({ report, files: report.files, date: new Date().toISOString() })
      saveHistory({
        report,
        files: report.files,
        date: new Date().toISOString(),
      })
      setPage('dashboard')
    } catch (err) {
      setError(err.message || 'Something went wrong while analyzing the files.')
    } finally {
      setLoading(false)
    }
  }

  const openHistoryEntry = (entry) => {
    setComparison(entry)
    setPage('dashboard')
  }

  return (
    <div className="app-layout">
      <Sidebar active={page} onNavigate={setPage} />
      <div className="main-content">
        {page === 'dashboard' && (
          <Dashboard
            comparison={comparison}
            loading={loading}
            error={error}
            onCompare={handleCompare}
            onNavigate={setPage}
          />
        )}
        {page === 'new-comparison' && (
          <Dashboard
            comparison={null}
            loading={loading}
            error={error}
            onCompare={handleCompare}
            onNavigate={setPage}
          />
        )}
        {page === 'history' && <History onOpen={openHistoryEntry} />}
        {page === 'reports' && <Reports onOpen={openHistoryEntry} />}
        {page === 'topic-analysis' && (
          <TopicAnalysis comparison={comparison} onNavigate={setPage} />
        )}
      </div>
    </div>
  )
}