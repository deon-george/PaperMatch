export default function FileComparison() {
  return (
    <div className="file-comparison-card">
      <div className="file-comparison-grid">
        {/* Research Paper */}
        <div>
          <div className="file-section-label">Research Paper</div>
          <div className="file-card">
            <div className="file-icon pdf">PDF</div>
            <div className="file-meta">
              <h3>Deep Learning for Phishing<br />Detection.pdf</h3>
              <p>12.4 MB <span /> 15 Pages</p>
            </div>
            <span className="file-check">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
            </span>
          </div>
        </div>

        {/* Center swap */}
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
          <div className="ready-label">Ready to Compare</div>
        </div>

        {/* Presentation */}
        <div>
          <div className="file-section-label">Presentation</div>
          <div className="file-card">
            <div className="file-icon pptx">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
                <rect x="2" y="3" width="20" height="14" rx="2" fill="none" stroke="white" strokeWidth="2"/>
                <line x1="8" y1="21" x2="16" y2="21" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                <line x1="12" y1="17" x2="12" y2="21" stroke="white" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <div className="file-meta">
              <h3>Seminar_Presentation.pptx</h3>
              <p>8.7 MB <span /> 12 Slides</p>
            </div>
            <span className="file-check">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
