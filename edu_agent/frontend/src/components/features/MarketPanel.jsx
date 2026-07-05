import { motion } from 'framer-motion'
import { TrendingUp, Zap, BarChart3, Building2, DollarSign } from 'lucide-react'
import Card from '../ui/Card'
import Badge from '../ui/Badge'
import EmptyState from '../ui/EmptyState'
import './MarketPanel.css'

export default function MarketPanel({ data, formData }) {
  if (!data) {
    return <EmptyState icon={TrendingUp} title="No market data" description="Run a career analysis to see market insights for your target domain." />
  }

  // Extract market-relevant info from CareerReportResponse
  const targetRole = data.target_role || formData?.target_role || 'Your Target Role'
  const skillGaps = data.skill_gaps || []
  const hiringCompanies = data.hiring_companies || []
  const salary = data.expected_salary || {}
  const certifications = data.certifications || []
  const targetRoles = data.target_roles || []

  const hasSalary = salary.min || salary.max || salary.median

  return (
    <div className="market-panel">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <Card variant="accent" padding="md">
          <div className="market-panel__header">
            <BarChart3 size={20} style={{ color: 'var(--accent-secondary)' }} />
            <div>
              <h3>Market Insights</h3>
              <p className="market-panel__sub">For {targetRole}</p>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Salary Estimates */}
      {hasSalary && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card padding="md">
            <div className="market-panel__section-title">
              <DollarSign size={16} style={{ color: 'var(--success)' }} />
              <h4>Expected Salary Range</h4>
            </div>
            <div className="market-panel__salary">
              <div className="market-panel__salary-item">
                <span className="market-panel__salary-label">Minimum</span>
                <span className="market-panel__salary-value">{salary.min ? `₹${(salary.min / 100000).toFixed(1)}L` : '—'}</span>
              </div>
              <div className="market-panel__salary-item">
                <span className="market-panel__salary-label">Median</span>
                <span className="market-panel__salary-value market-panel__salary-value--accent">{salary.median ? `₹${(salary.median / 100000).toFixed(1)}L` : '—'}</span>
              </div>
              <div className="market-panel__salary-item">
                <span className="market-panel__salary-label">Maximum</span>
                <span className="market-panel__salary-value">{salary.max ? `₹${(salary.max / 100000).toFixed(1)}L` : '—'}</span>
              </div>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Target Role Matches */}
      {targetRoles.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Card padding="md">
            <div className="market-panel__section-title">
              <TrendingUp size={16} style={{ color: 'var(--info)' }} />
              <h4>Matched Roles</h4>
            </div>
            <div className="market-panel__list">
              {targetRoles.map((role, i) => (
                <motion.div key={i} className="market-panel__trend" initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 + i * 0.05 }}>
                  <div className="market-panel__trend-dot" />
                  <span>{role.title || role} — <strong>{role.match || 0}% match</strong></span>
                </motion.div>
              ))}
            </div>
          </Card>
        </motion.div>
      )}

      {/* In-Demand Skills (skill gaps) */}
      {skillGaps.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card padding="md">
            <div className="market-panel__section-title">
              <Zap size={16} style={{ color: 'var(--warning)' }} />
              <h4>Skills in Demand</h4>
            </div>
            <div className="market-panel__badges">
              {skillGaps.map((skill, i) => (
                <Badge key={i} variant="warning" size="md">{skill}</Badge>
              ))}
            </div>
          </Card>
        </motion.div>
      )}

      {/* Hiring Companies */}
      {hiringCompanies.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <Card padding="md">
            <div className="market-panel__section-title">
              <Building2 size={16} style={{ color: 'var(--accent-secondary)' }} />
              <h4>Top Hiring Companies</h4>
            </div>
            <div className="market-panel__badges">
              {hiringCompanies.map((company, i) => (
                <Badge key={i} variant="primary" size="md">{company}</Badge>
              ))}
            </div>
          </Card>
        </motion.div>
      )}

      {/* Recommended Certifications */}
      {certifications.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card padding="md">
            <div className="market-panel__section-title">
              <TrendingUp size={16} style={{ color: 'var(--success)' }} />
              <h4>Recommended Certifications</h4>
            </div>
            <div className="market-panel__badges">
              {certifications.map((cert, i) => (
                <Badge key={i} variant="success" size="md">{cert}</Badge>
              ))}
            </div>
          </Card>
        </motion.div>
      )}
    </div>
  )
}
