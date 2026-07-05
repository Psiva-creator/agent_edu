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
      timeline_months: parseInt(timeline) || 12,
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
                label="Timeline (months)"
                type="number"
                min="1"
                max="60"
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
          {result.estimated_timeline && (
            <div className="roadmap-panel__timeline-badge">
              <Clock size={14} />
              <span>Estimated: {result.estimated_timeline}</span>
            </div>
          )}

          {/* Milestones */}
          {result.milestones?.length > 0 && (
            <div className="roadmap-timeline">
              {result.milestones.map((milestone, i) => (
                <motion.div
                  key={i}
                  className="roadmap-timeline__item"
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.1 }}
                >
                  <div className="roadmap-timeline__marker">
                    <div className="roadmap-timeline__dot" />
                    {i < result.milestones.length - 1 && <div className="roadmap-timeline__line" />}
                  </div>
                  <Card padding="sm" hover className="roadmap-timeline__card">
                    <h4>{milestone.title || milestone.name || `Milestone ${i + 1}`}</h4>
                    <p>{milestone.description || milestone.details || JSON.stringify(milestone)}</p>
                    {milestone.duration && (
                      <span className="roadmap-timeline__duration">
                        <Clock size={12} /> {milestone.duration}
                      </span>
                    )}
                  </Card>
                </motion.div>
              ))}
            </div>
          )}

          {/* Resources */}
          {result.resources?.length > 0 && (
            <Card padding="md">
              <div className="roadmap-panel__header">
                <BookOpen size={18} style={{ color: 'var(--success)' }} />
                <h3>Recommended Resources</h3>
              </div>
              <div className="roadmap-panel__resources">
                {result.resources.map((r, i) => (
                  <div key={i} className="roadmap-panel__resource">
                    <span>{r.title || r.name || JSON.stringify(r)}</span>
                    {r.url && (
                      <a href={r.url} target="_blank" rel="noopener noreferrer">Visit →</a>
                    )}
                  </div>
                ))}
              </div>
            </Card>
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
