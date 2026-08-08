const summaryItems = [
  {
    id: 'total-paper-sections',
    icon: (
      <svg className="summary-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
        <polyline points="10 9 9 9 8 9"/>
      </svg>
    ),
    label: 'Total Paper Sections',
    value: '6',
    valueClass: '',
  },
  {
    id: 'total-slides',
    icon: (
      <svg className="summary-icon purple" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
        <line x1="8" y1="21" x2="16" y2="21"/>
        <line x1="12" y1="17" x2="12" y2="21"/>
      </svg>
    ),
    label: 'Total Slides',
    value: '12',
    valueClass: '',
  },
  {
    id: 'matching-sections',
    icon: (
      <svg className="summary-icon green" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
        <polyline points="22 4 12 14.01 9 11.01"/>
      </svg>
    ),
    label: 'Matching Sections',
    value: '5',
    valueClass: 'green',
  },
  {
    id: 'missing-sections',
    icon: (
      <svg className="summary-icon orange" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
        <line x1="12" y1="9" x2="12" y2="13"/>
        <line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>
    ),
    label: 'Missing Sections',
    value: '1',
    valueClass: 'orange',
  },
  {
    id: 'extra-topics',
    icon: (
      <svg className="summary-icon red" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <line x1="15" y1="9" x2="9" y2="15"/>
        <line x1="9" y1="9" x2="15" y2="15"/>
      </svg>
    ),
    label: 'Extra Topics',
    value: '1',
    valueClass: 'red',
  },
]

export default function QuickSummary() {
  return (
    <div className="quick-summary-card">
      <div className="card-title">Quick Summary</div>
      <div className="summary-list">
        {summaryItems.map((item) => (
          <div className="summary-item" key={item.id} id={`summary-${item.id}`}>
            <div className="summary-item-left">
              {item.icon}
              <span className="summary-label">{item.label}</span>
            </div>
            <span className={`summary-value ${item.valueClass}`}>{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
