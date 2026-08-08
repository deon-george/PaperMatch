import { useState } from 'react'

const missingTopics = [
  {
    id: 'experimental-setup',
    title: 'Experimental Setup Details',
    desc: 'The paper contains detailed experimental setup information which is not covered in your presentation.',
  },
  {
    id: 'hyperparameters',
    title: 'Hyperparameters',
    desc: 'Specific hyperparameters and configuration details are missing from the presentation.',
  },
  {
    id: 'future-work',
    title: 'Future Work',
    desc: 'The future work and research directions section is not included in your presentation.',
  },
]

const extraTopics = [
  {
    id: 'demo-slides',
    title: 'Live Demo Slides',
    desc: 'You included a live demo section that is not present in the research paper.',
  },
  {
    id: 'team-intro',
    title: 'Team Introduction',
    desc: 'Team introduction slides are extra content not found in the original paper.',
  },
]

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

export default function TopicsCard() {
  const [activeTab, setActiveTab] = useState('missing')
  const topics = activeTab === 'missing' ? missingTopics : extraTopics

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

      {topics.map((topic) => (
        <div className="topic-item" key={topic.id} id={`topic-${topic.id}`}>
          <AlertIcon />
          <div className="topic-text">
            <h4>{topic.title}</h4>
            <p>{topic.desc}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
