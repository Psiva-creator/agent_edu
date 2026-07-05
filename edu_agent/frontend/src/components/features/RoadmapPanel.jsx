import { useState } from 'react'
import { motion } from 'framer-motion'
import { Map, Clock, BookOpen, Sparkles } from 'lucide-react'
import { useApi } from '../../hooks/useApi'
import { generateRoadmap } from '../../services/api'
import Button from '../ui/Button'
import Input from '../ui/Input'
import Card from '../ui/Card'
import EmptyState from '../ui/EmptyState'
import ErrorState from '../ui/ErrorState'
import { SkeletonCard } from '../ui/Skeleton'
import './RoadmapPanel.css'

export default function RoadmapPanel({ data: existingData, formData }) {
  const [currentRole, setCurrentRole] = useState('')
  const [targetRole, setTargetRole] = useState('')
  const [timeline, setTimeline] = useState('12')
  const { data, loading, error, execute } = useApi(generateRoadmap)

  const result = data || existingData

  const handleGenerate = async () => {
    if (!currentRole.trim() || !targetRole.trim()) return
    await execute({
      current_role: currentRole,
      target_role: targetRole,
      deadline_weeks: parseInt(timeline) || 12,
    })
  }

  return (
    <div className="roadmap-panel">
      {/* Input */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <Card padding="md">
          <div className="roadmap-panel__header">
            <Map size={20} style={{ color: 'var(--accent-secondary)' }} />
            <h3>Generate Career Roadmap</h3>
          </div>
          <div className="roadmap-panel__form">
            <div className="roadmap-panel__row">
              <Input
                label="Current Role"
                placeholder="e.g. Junior Developer"
                value={currentRole}
                onChange={(e) => setCurrentRole(e.target.value)}
              />
              <Input
                label="Target Role"
                placeholder="e.g. ML Engineer"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
              />
              <Input
                label="Timeline (weeks)"
                type="number"
                min="1"
                max="52"
                value={timeline}
                onChange={(e) => setTimeline(e.target.value)}
              />
            </div>
            <Button
              variant="primary"
              icon={Sparkles}
              loading={loading}
              disabled={!currentRole.trim() || !targetRole.trim()}
              onClick={handleGenerate}
            >
              Generate Roadmap
            </Button>
          </div>
        </Card>
      </motion.div>

      {loading && <SkeletonCard lines={6} />}
      {error && <ErrorState message={error} onRetry={handleGenerate} />}

      {/* Results */}
      {result && !loading && (
        <motion.div
          className="roadmap-panel__results"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          {result.total_weeks && (
            <div className="roadmap-panel__timeline-badge">
              <Clock size={14} />
              <span>Estimated Timeline: {result.total_weeks} weeks ({result.hours_per_week} hrs/week)</span>
            </div>
          )}
          
          {result.summary && (
            <div style={{ marginBottom: '1.5rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
              {result.summary}
            </div>
          )}

          {/* Milestones / Weeks */}
          {result.weeks?.length > 0 && (
            <div className="roadmap-timeline">
              {result.weeks.map((week, i) => (
                <motion.div
                  key={i}
                  className="roadmap-timeline__item"
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.1 }}
                >
                  <div className="roadmap-timeline__marker">
                    <div className="roadmap-timeline__dot" />
                    {i < result.weeks.length - 1 && <div className="roadmap-timeline__line" />}
                  </div>
                  <Card padding="sm" hover className="roadmap-timeline__card">
                    <h4>Week {week.week_number}: {week.theme}</h4>
                    <p style={{ marginTop: '4px', marginBottom: '12px' }}>
                      {week.milestone?.description || week.phase}
                    </p>
                    
                    {week.tasks?.length > 0 && (
                      <ul style={{ paddingLeft: '20px', marginBottom: '12px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                        {week.tasks.slice(0, 3).map((task, j) => (
                          <li key={j} style={{ marginBottom: '4px' }}>{task.title}</li>
                        ))}
                      </ul>
                    )}
                    
                    {week.estimated_hours && (
                      <span className="roadmap-timeline__duration">
                        <Clock size={12} /> {week.estimated_hours} hrs
                      </span>
                    )}
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {!result && !loading && !error && (
        <EmptyState
          icon={Map}
          title="No roadmap generated yet"
          description="Enter your current and target roles above to generate a personalized career roadmap."
        />
      )}
    </div>
  )
}
