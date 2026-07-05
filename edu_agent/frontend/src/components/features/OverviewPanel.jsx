import { motion } from 'framer-motion'
import {
  TrendingUp, Target, Briefcase, FileText, Map, MessageCircle,
  Building2, Award, Rocket,
} from 'lucide-react'
import Card, { CardContent } from '../ui/Card'
import ScoreRing from '../ui/ScoreRing'
import Badge from '../ui/Badge'
import EmptyState from '../ui/EmptyState'
import { getScoreLabel } from '../../utils/helpers'
import './OverviewPanel.css'

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] },
}

export default function OverviewPanel({ data, formData }) {
  if (!data) {
    return (
      <EmptyState
        icon={TrendingUp}
        title="No analysis yet"
        description="Run a career analysis to see your overview dashboard."
        action={{ label: 'Start Analysis', href: '/analyze' }}
      />
    )
  }

  // CareerReportResponse fields
  const readinessScore = data.readiness_score || 0
  const skillGaps = data.skill_gaps || []
  const strengths = data.strengths || []
  const weaknesses = data.weaknesses || []
  const nextSteps = data.next_steps || []
  const hiringCompanies = data.hiring_companies || []
  const salary = data.expected_salary || {}
  const salaryMin = salary.min ? `₹${(salary.min / 100000).toFixed(0)}L` : ''
  const salaryMax = salary.max ? `₹${(salary.max / 100000).toFixed(0)}L` : ''
  const salaryRange = salaryMin && salaryMax ? `${salaryMin} - ${salaryMax}` : '—'
  const targetRoles = data.target_roles || []

  const summaryCards = [
    {
      label: 'Readiness Score',
      value: `${Math.round(readinessScore)}%`,
      sub: data.readiness_label || getScoreLabel(readinessScore),
      icon: TrendingUp,
      color: 'var(--accent-primary)',
    },
    {
      label: 'Skill Gaps',
      value: skillGaps.length,
      sub: skillGaps.length ? 'skills to learn' : 'You\'re on track!',
      icon: Target,
      color: skillGaps.length > 3 ? 'var(--warning)' : 'var(--success)',
    },
    {
      label: 'Salary Range',
      value: salaryRange,
      sub: 'expected range',
      icon: Briefcase,
      color: 'var(--accent-secondary)',
    },
    {
      label: 'Target Roles',
      value: targetRoles.length,
      sub: 'matched roles',
      icon: Map,
      color: 'var(--success)',
    },
  ]

  return (
    <div className="overview">
      {/* Candidate Summary */}
      {data.candidate_summary && (
        <motion.div {...fadeUp}>
          <Card variant="accent" padding="md">
            <p className="overview__mentor-text">{data.candidate_summary}</p>
          </Card>
        </motion.div>
      )}

      {/* Score + Summary Row */}
      <motion.div className="overview__hero" {...fadeUp}>
        <div className="overview__score-section">
          <ScoreRing score={readinessScore} size={140} label="Readiness" />
        </div>
        <div className="overview__metrics">
          {summaryCards.map((card, i) => (
            <motion.div
              key={card.label}
              {...fadeUp}
              transition={{ ...fadeUp.transition, delay: i * 0.08 }}
            >
              <Card hover className="overview__metric-card">
                <CardContent>
                  <div className="overview__metric-header">
                    <card.icon size={18} style={{ color: card.color }} />
                    <span className="overview__metric-label">{card.label}</span>
                  </div>
                  <div className="overview__metric-value" style={{ color: card.color }}>
                    {card.value}
                  </div>
                  <span className="overview__metric-sub">{card.sub}</span>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Skill Gaps */}
      {skillGaps.length > 0 && (
        <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.3 }}>
          <Card padding="md">
            <div className="overview__section-header">
              <Target size={18} style={{ color: 'var(--warning)' }} />
              <h3>Skills to Develop</h3>
            </div>
            <div className="overview__badges">
              {skillGaps.map((skill) => (
                <Badge key={skill} variant="warning" size="md">{skill}</Badge>
              ))}
            </div>
          </Card>
        </motion.div>
      )}

      {/* Strengths */}
      {strengths.length > 0 && (
        <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.35 }}>
          <Card padding="md">
            <div className="overview__section-header">
              <Award size={18} style={{ color: 'var(--success)' }} />
              <h3>Your Strengths</h3>
            </div>
            <div className="overview__badges">
              {strengths.map((s) => (
                <Badge key={s} variant="success" size="md">{s}</Badge>
              ))}
            </div>
          </Card>
        </motion.div>
      )}

      {/* Next Steps / Recommendations */}
      {nextSteps.length > 0 && (
        <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.4 }}>
          <Card padding="md">
            <div className="overview__section-header">
              <Rocket size={18} style={{ color: 'var(--accent-primary)' }} />
              <h3>Next Steps</h3>
            </div>
            <ol className="overview__next-steps">
              {nextSteps.map((step, i) => (
                <li key={i}>{step}</li>
              ))}
            </ol>
          </Card>
        </motion.div>
      )}

      {/* Hiring Companies */}
      {hiringCompanies.length > 0 && (
        <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.45 }}>
          <Card padding="md">
            <div className="overview__section-header">
              <Building2 size={18} style={{ color: 'var(--accent-secondary)' }} />
              <h3>Top Hiring Companies</h3>
            </div>
            <div className="overview__badges">
              {hiringCompanies.map((company) => (
                <Badge key={company} variant="default" size="md">{company}</Badge>
              ))}
            </div>
          </Card>
        </motion.div>
      )}

      {/* Mentor Advice */}
      {data.mentor_advice && (
        <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.5 }}>
          <Card variant="accent" padding="md">
            <div className="overview__section-header">
              <MessageCircle size={18} style={{ color: 'var(--accent-primary)' }} />
              <h3>AI Mentor Insight</h3>
            </div>
            <p className="overview__mentor-text">{data.mentor_advice}</p>
          </Card>
        </motion.div>
      )}

      {/* Overall Recommendation */}
      {data.overall_recommendation && (
        <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.55 }}>
          <Card padding="md">
            <div className="overview__section-header">
              <TrendingUp size={18} style={{ color: 'var(--accent-primary)' }} />
              <h3>Overall Recommendation</h3>
            </div>
            <p className="overview__mentor-text">{data.overall_recommendation}</p>
          </Card>
        </motion.div>
      )}
    </div>
  )
}
