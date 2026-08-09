import { useRef, useState } from 'react'

function formatBytes(bytes) {
  if (!bytes) return ''
  const units = ['B', 'KB', 'MB']
  let i = 0
  let value = bytes
  while (value >= 1024 && i < units.length - 1) {
    value /= 1024
    i += 1
  }
  return `${value.toFixed(1)} ${units[i]}`
}

function FileCard({ kind, file, onPick }) {
  const inputRef = useRef(null)
  const isPdf = kind === 'pdf'
  return (
    <div>
      <div className="file-section-label">{isPdf ? 'Research Paper' : 'Presentation'}</div>
      <div className="file-card" onClick={() => inputRef.current?.click()}>
        <div className={`file-icon ${isPdf ? 'pdf' : 'pptx'}`}>
          {isPdf ? (
            'PDF'
          ) : (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
              <rect x="2" y="3" width="20" height="14" rx="2" fill="none" stroke="white" strokeWidth="2"/>
              <line x1="8" y1="21" x2="16" y2="21" stroke="white" strokeWidth="2" strokeLinecap="round"/>
              <line x1="12" y1="17" x2="12" y2="21" stroke="white" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          )}
        </div>
        <div className="file-meta">
          <h3>{file ? file.name : (isPdf ? 'Choose a PDF…' : 'Choose a PPTX…')}</h3>
          <p>
            {file
              ? `${formatBytes(file.size)} · Ready`
              : `Click to select ${isPdf ? '.pdf' : '.pptx'} file`}
            <span />
            {file ? '' : 'Not selected'}
          </p>
        </div>
        {file && (
          <span className="file-check">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
          </span>
        )}
        <input
          ref={inputRef}
          type="file"
          accept={isPdf ? '.pdf,application/pdf' : '.pptx,application/vnd.openxmlformats-officedocument.presentationml.presentation'}
          style={{ display: 'none' }}
          onChange={(e) => onPick(e.target.files?.[0] || null)}
        />
      </div>
    </div>
  )
}

export default function FileComparison({ onCompare, loading }) {
  const [paper, setPaper] = useState(null)
  const [presentation, setPresentation] = useState(null)
  const ready = Boolean(paper && presentation && !loading)

  return (
    <div className="file-comparison-card">
      <div className="file-comparison-grid">
        <FileCard kind="pdf" file={paper} onPick={setPaper} />
        <div className="compare-center">
          <div className="compare-line" />
          <div className="compare-arrows">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="17 1 21 5 17 9"/>
              <path d="M3 11V9a4 4 0 0 1 4-4h14"/>
              <polyline points="7 23 3 19 7 15"/>
              <path d="M21 13v2a4 4 0 0 1-4 4H3"/>
            </svg>
          </div>
          <div className="compare-line" />
          {loading ? (
            <div className="ready-label spinner-text">Analyzing…</div>
          ) : (
            <button
              className="compare-cta"
              id="compare-btn"
              disabled={!ready}
              onClick={() => ready && onCompare(paper, presentation)}
            >
              {ready ? 'Compare' : 'Select both files'}
            </button>
          )}
        </div>
        <FileCard kind="pptx" file={presentation} onPick={setPresentation} />
      </div>
    </div>
  )
}