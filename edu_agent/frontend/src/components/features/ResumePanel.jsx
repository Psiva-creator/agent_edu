import { useState } from 'react'
import { motion } from 'framer-motion'
import { Upload, FileText, Sparkles } from 'lucide-react'
import { useApi } from '../../hooks/useApi'
import { analyzeResumeText } from '../../services/api'
import Button from '../ui/Button'
import TextArea from '../ui/TextArea'
import Input from '../ui/Input'
import Card, { CardContent } from '../ui/Card'
import Badge from '../ui/Badge'
import ScoreRing from '../ui/ScoreRing'
import EmptyState from '../ui/EmptyState'
import ErrorState from '../ui/ErrorState'
import { SkeletonCard } from '../ui/Skeleton'
import './ResumePanel.css'

export default function ResumePanel({ data: existingData, formData }) {
  const [resumeText, setResumeText] = useState('')
  const [targetRole, setTargetRole] = useState('')
  const { data, loading, error, execute, reset } = useApi(analyzeResumeText)

  const result = data || existingData

  const handleAnalyze = async () => {
    if (!resumeText.trim()) return
    await execute({ resume_text: resumeText, target_role: targetRole || null })
  }

  return (
    <div className="resume-panel">
      {/* Input Section */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card padding="md">
          <div className="resume-panel__header">
            <FileText size={20} style={{ color: 'var(--accent-primary)' }} />
            <h3>Paste Your Resume</h3>
          </div>
          <div className="resume-panel__form">
            <TextArea
              label="Resume Content"
              placeholder="Paste your resume text here..."
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
              rows={6}
            />
            <Input
              label="Target Role (optional)"
              placeholder="e.g. Machine Learning Engineer"
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
            />
            <Button
              variant="primary"
              icon={Sparkles}
              loading={loading}
              disabled={!resumeText.trim()}
              onClick={handleAnalyze}
            >
              Analyze Resume
            </Button>
          </div>
        </Card>
      </motion.div>

      {/* Loading */}
      {loading && (
        <div className="resume-panel__loading">
          <SkeletonCard lines={4} />
          <SkeletonCard lines={3} />
        </div>
      )}

      {/* Error */}
      {error && <ErrorState message={error} onRetry={handleAnalyze} />}

      {/* Results */}
      {result && !loading && (
        <motion.div
          className="resume-panel__results"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          {/* Score */}
          <Card padding="md" className="resume-panel__score-card">
            <div className="resume-panel__score-row">
              <ScoreRing score={result.score || 0} size={100} label="Resume Score" />
              <div>
                <h4>Resume Score</h4>
                <p className="resume-panel__exp">
                  {result.experience_years || 0} years of experience detected
                </p>
              </div>
            </div>
          </Card>

          {/* Skills */}
          {result.extracted_skills?.length > 0 && (
            <Card padding="md">
              <h4 style={{ marginBottom: 'var(--space-3)' }}>Extracted Skills</h4>
              <div className="resume-panel__badges">
                {result.extracted_skills.map((skill) => (
                  <Badge key={skill} variant="primary" size="md">{skill}</Badge>
                ))}
              </div>
            </Card>
          )}

          {/* Strengths & Improvements */}
          <div className="resume-panel__grid">
            {result.strengths?.length > 0 && (
              <Card padding="md">
                <h4 style={{ color: 'var(--success)', marginBottom: 'var(--space-3)' }}>
                  ✓ Strengths
                </h4>
                <CardContent>
                  {result.strengths.map((s, i) => (
                    <p key={i} className="resume-panel__item">{s}</p>
                  ))}
                </CardContent>
              </Card>
            )}
            {result.improvements?.length > 0 && (
              <Card padding="md">
                <h4 style={{ color: 'var(--warning)', marginBottom: 'var(--space-3)' }}>
                  ↑ Improvements
                </h4>
                <CardContent>
                  {result.improvements.map((s, i) => (
                    <p key={i} className="resume-panel__item">{s}</p>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        </motion.div>
      )}

      {/* Empty State */}
      {!result && !loading && !error && (
        <EmptyState
          icon={Upload}
          title="No resume analyzed yet"
          description="Paste your resume text above and click Analyze to get AI-powered feedback."
        />
      )}
    </div>
  )
}
