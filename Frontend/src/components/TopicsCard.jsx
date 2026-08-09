import { useState } from 'react'

function AlertIcon() {
  return (
    <div className="topic-alert-icon orange">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
        <line x1="12" y1="9" x2="12" y2="13"/>
        <line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>
    </div>
  )
}

export default function TopicsCard({ report }) {
  const [activeTab, setActiveTab] = useState('missing')
  const topics = activeTab === 'missing' ? report?.missing_topics || [] : report?.extra_topics || []

  return (
    <div className="topics-card">
      <div className="topics-tabs">
        <button
          className={`topic-tab ${activeTab === 'missing' ? 'active' : ''}`}
          id="tab-missing-topics"
          onClick={() => setActiveTab('missing')}
        >
          Missing Topics
        </button>
        <button
          className={`topic-tab ${activeTab === 'extra' ? 'active' : ''}`}
          id="tab-extra-topics"
          onClick={() => setActiveTab('extra')}
        >
          Extra Topics
        </button>
      </div>

      {topics.length === 0 ? (
        <p className="empty-inline">
          {activeTab === 'missing' ? 'No missing topics — great coverage!' : 'No extra content detected.'}
        </p>
      ) : (
        topics.map((topic) => (
          <div className="topic-item" key={topic.id || topic.title} id={`topic-${topic.id}`}>
            <AlertIcon />
            <div className="topic-text">
              <h4>{topic.title}</h4>
              <p>{topic.desc || topic.description}</p>
            </div>
          </div>
        ))
      )}
    </div>
  )
}