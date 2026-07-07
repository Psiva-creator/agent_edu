/**
 * ComparePanel — Resume vs Job Comparison
 * ════════════════════════════════════════
 * 
 * Premium full-page comparison between the user's resume/career memory
 * and any recommended job. Uses ONLY Career Memory signals from
 * sessionStorage — no mock data.
 *
 * Features:
 *   - Job selection from recommended roles (Career Memory)
 *   - Skill-by-skill comparison with green/yellow/red highlighting
 *   - ATS Keyword Match %
 *   - Experience & Project gap analysis
 *   - Overall Match % with animated score ring
 *   - AI action suggestions (Learn X, Improve Y, Add Z)
 *   - Compare another job without re-uploading resume
 */

import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  GitCompare, CheckCircle, AlertTriangle, XCircle,
  Sparkles, BarChart3, Target, Briefcase, MapPin,
  GraduationCap, FolderKanban, Award, RefreshCw,
  Lightbulb, ArrowRight, Info, Zap, Shield, FileText,
  Check, TrendingUp, ChevronRight
} from 'lucide-react'
import { useApi } from '../../hooks/useApi'
import { compareResumeToJob } from '../../services/api'
import Button from '../ui/Button'
import Card from '../ui/Card'
import Badge from '../ui/Badge'
import EmptyState from '../ui/EmptyState'
import ScoreRing from '../ui/ScoreRing'
import './ComparePanel.css'

// ─── Animation variants ──────────────────────────────────────

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
}

const stagger = { animate: { transition: { staggerChildren: 0.06 } } }

// ─── Career Memory Helpers ───────────────────────────────────

function getCareerMemory() {
  /**
   * Extracts all Career Memory signals from sessionStorage.
   * Sources:
   *   - 'analysisResult'  → POST /report response (profile data)
   *   - 'resumeAnalysis'  → POST /resume/analyze response
   *   - 'analysisFormData' → form input data from analyze page
   */
  let report = null
  let resume = null
  let formData = null

  try {
    const raw = sessionStorage.getItem('analysisResult')
    if (raw) report = JSON.parse(raw)
  } catch {}

  try {
    const raw = sessionStorage.getItem('resumeAnalysis')
    if (raw) resume = JSON.parse(raw)
  } catch {}

  try {
    const raw = sessionStorage.getItem('analysisFormData')
    if (raw) formData = JSON.parse(raw)
  } catch {}

  if (!report && !resume && !formData) return null

  // ── Extract skills ────────────────────────────────────────
  const profileSkills = formData?.skills || report?.skills || []
  const resumeSkills = resume?.strengths || []
  const allSkills = [...new Set([...profileSkills, ...resumeSkills])]

  // ── Extract experience ────────────────────────────────────
  const experienceYears = parseInt(
    formData?.experience_years || formData?.experience || report?.experience_years || 0
  )

  // ── Extract education ─────────────────────────────────────
  const education = formData?.education || 
    (formData?.degree ? `${formData.degree} ${formData.branch || ''}`.trim() : null) ||
    report?.education || null

  // ── Has projects / certifications from resume checklist ───
  const checklist = resume?.section_checklist || {}
  const hasProjects = checklist.projects ?? false
  const hasCertifications = checklist.certifications ?? false

  // ── Resume text from resume analysis ──────────────────────
  const resumeText = resume?.resume_text || null

  // ── Career path / recommended roles ───────────────────────
  const careerPath = resume?.career_path || report?.career_path || []

  // ── Target role ───────────────────────────────────────────
  const targetRole = formData?.target_role || formData?.career_goal || 
    report?.target_role || 'Software Engineer'

  return {
    profileSkills,
    resumeSkills,
    allSkills,
    experienceYears,
    education,
    hasProjects,
    hasCertifications,
    resumeText,
    careerPath,
    targetRole,
    formData,
    report,
    resume,
  }
}

function getRecommendedJobs(memory) {
  /**
   * Builds a list of recommended jobs from Career Memory.
   * These come from the career_path in the report/resume analysis.
   */
  if (!memory) return []

  const careerPath = memory.careerPath || []
  const jobs = careerPath.map((role) => ({
    title: role.role || role.title || 'Unknown Role',
    company: '', // Career path doesn't include companies
    match_percentage: role.match_percentage || 0,
    required_skills: role.required_skills || role.missing_skills || [],
    matching_skills: role.matching_skills || 0,
    total_required: role.total_required || 0,
    salary: role.salary_range || '',
    location: '',
    job_description: '',
    min_experience: role.min_experience || 0,
  }))

  // If no career path exists, create jobs from target role
  if (jobs.length === 0 && memory.targetRole) {
    jobs.push({
      title: memory.targetRole,
      company: '',
      match_percentage: 0,
      required_skills: [],
      matching_skills: 0,
      total_required: 0,
      salary: '',
      location: '',
      job_description: '',
      min_experience: 0,
    })
  }

  return jobs
}

// ─── Score Color Helper ──────────────────────────────────────

function getMatchColor(pct) {
  if (pct >= 75) return '#22c55e'
  if (pct >= 50) return '#f59e0b'
  return '#ef4444'
}

function getMatchLabel(pct) {
  if (pct >= 85) return 'Excellent Match'
  if (pct >= 70) return 'Strong Match'
  if (pct >= 50) return 'Moderate Match'
  if (pct >= 30) return 'Weak Match'
  return 'Poor Match'
}

// ─── Status Icon ─────────────────────────────────────────────

function StatusIcon({ status, size = 14 }) {
  if (status === 'matched' || status === 'met' || status === 'exceeds')
    return <CheckCircle size={size} />
  if (status === 'partial')
    return <AlertTriangle size={size} />
  return <XCircle size={size} />
}

// ═══════════════════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════════════════

export default function ComparePanel({ data: existingData, formData: existingFormData }) {
  const [memory, setMemory] = useState(null)
  const [recommendedJobs, setRecommendedJobs] = useState([])
  const [selectedJob, setSelectedJob] = useState(null)
  const [compareResult, setCompareResult] = useState(null)
  const { loading, error, execute, reset } = useApi(compareResumeToJob)

  // ── Load Career Memory ──────────────────────────────────────
  useEffect(() => {
    const mem = getCareerMemory()
    setMemory(mem)
    const jobs = getRecommendedJobs(mem)
    setRecommendedJobs(jobs)
  }, [])

  // Also listen for career-score-update events
  useEffect(() => {
    const handler = () => {
      const mem = getCareerMemory()
      setMemory(mem)
      const jobs = getRecommendedJobs(mem)
      setRecommendedJobs(jobs)
    }
    window.addEventListener('career-score-update', handler)
    return () => window.removeEventListener('career-score-update', handler)
  }, [])

  // ── Run Comparison ──────────────────────────────────────────
  const handleCompare = async (job) => {
    if (!memory) return
    setSelectedJob(job)

    try {
      const result = await execute({
        resume_skills: memory.resumeSkills,
        profile_skills: memory.profileSkills,
        resume_experience_years: memory.experienceYears,
        has_projects: memory.hasProjects,
        has_certifications: memory.hasCertifications,
        education: memory.education,
        resume_text: memory.resumeText,
        job_title: job.title,
        job_company: job.company || '',
        job_required_skills: job.required_skills || [],
        job_description: job.job_description || '',
        job_min_experience: job.min_experience || 0,
        job_salary: job.salary || '',
        job_location: job.location || '',
      })
      if (result) {
        setCompareResult(result)
      }
    } catch (err) {
      console.error('Comparison failed:', err)
    }
  }

  // ── Compare Another Job ─────────────────────────────────────
  const handleCompareAnother = () => {
    setSelectedJob(null)
    setCompareResult(null)
    if (reset) reset()
  }

  // ── No Career Memory ───────────────────────────────────────
  if (!memory) {
    return (
      <div className="compare-panel">
        <div className="compare-panel__header">
          <div className="compare-panel__header-text">
            <h1>Resume vs Job Comparison</h1>
            <p>Compare your resume against any job to find gaps and matches.</p>
          </div>
        </div>
        <div className="compare-info-box">
          <Info size={20} color="var(--info)" style={{ flexShrink: 0, marginTop: 2 }} />
          <div className="compare-info-box__text">
            <p>
              <strong>No Career Memory found.</strong> Please complete a career analysis first
              or analyze your resume in the Resume tab. This feature uses your existing
              Career Memory — no mock data.
            </p>
          </div>
        </div>
        <EmptyState
          icon={GitCompare}
          title="Start your analysis first"
          description="Go to the Analyze page to build your Career Memory, then return here to compare against jobs."
          action={{ label: 'Start Analysis', href: '/analyze' }}
        />
      </div>
    )
  }

  // ── Render Results ──────────────────────────────────────────
  if (compareResult && selectedJob) {
    return (
      <div className="compare-panel">
        <div className="compare-panel__header">
          <div className="compare-panel__header-text">
            <h1>Resume vs Job Comparison</h1>
            <p>
              Comparing your profile against <strong>{compareResult.job_title}</strong>
              {compareResult.job_company && ` at ${compareResult.job_company}`}
            </p>
          </div>
          <Button variant="outline" icon={RefreshCw} onClick={handleCompareAnother}>
            Compare Another Job
          </Button>
        </div>

        {/* ── Legend ───────────────────────────────────────── */}
        <motion.div {...fadeUp}>
          <div className="compare-legend">
            <div className="compare-legend__item">
              <div className="compare-legend__dot compare-legend__dot--green" />
              <span>Green = Match</span>
            </div>
            <div className="compare-legend__item">
              <div className="compare-legend__dot compare-legend__dot--yellow" />
              <span>Yellow = Partial</span>
            </div>
            <div className="compare-legend__item">
              <div className="compare-legend__dot compare-legend__dot--red" />
              <span>Red = Missing</span>
            </div>
          </div>
        </motion.div>

        {/* ── Overall Match Hero ───────────────────────────── */}
        <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.1 }}>
          <div className="compare-hero">
            <h2 className="compare-hero__title">Overall Match</h2>
            <p className="compare-hero__subtitle">
              {compareResult.job_title}{compareResult.job_company ? ` — ${compareResult.job_company}` : ''}
            </p>
            <div className="compare-hero__ring-wrap">
              <div
                className="compare-hero__ring-glow"
                style={{ background: `radial-gradient(circle, ${getMatchColor(compareResult.overall_match_pct)}22 0%, transparent 70%)` }}
              />
              <ScoreRing
                score={compareResult.overall_match_pct}
                size={180}
                strokeWidth={14}
                label="MATCH"
                subLabel={getMatchLabel(compareResult.overall_match_pct)}
                showLabel={true}
                animated={true}
              />
            </div>
            <div className="compare-hero__badges">
              <Badge variant={compareResult.overall_match_pct >= 70 ? 'success' : compareResult.overall_match_pct >= 40 ? 'warning' : 'danger'}>
                {getMatchLabel(compareResult.overall_match_pct)}
              </Badge>
            </div>
          </div>
        </motion.div>

        {/* ── Stats Row ────────────────────────────────────── */}
        <motion.div className="compare-stats-row" variants={stagger} initial="initial" animate="animate">
          <motion.div variants={fadeUp}>
            <div className="compare-stat-card">
              <div className="compare-stat-card__icon" style={{ background: 'rgba(99, 102, 241, 0.1)', color: 'var(--accent-primary)' }}>
                <Target size={20} />
              </div>
              <div className="compare-stat-card__label">Skill Match</div>
              <div className="compare-stat-card__value" style={{ color: getMatchColor(compareResult.skill_match_pct) }}>
                {compareResult.skill_match_pct}%
              </div>
              <div className="compare-stat-card__sub">
                {compareResult.total_matched}/{compareResult.total_required} skills matched
              </div>
            </div>
          </motion.div>

          <motion.div variants={fadeUp}>
            <div className="compare-stat-card">
              <div className="compare-stat-card__icon" style={{ background: 'rgba(6, 182, 212, 0.1)', color: 'var(--accent-secondary)' }}>
                <Shield size={20} />
              </div>
              <div className="compare-stat-card__label">ATS Keyword Match</div>
              <div className="compare-stat-card__value" style={{ color: getMatchColor(compareResult.ats_keyword_match_pct) }}>
                {compareResult.ats_keyword_match_pct}%
              </div>
              <div className="compare-ats-bar">
                <div className="compare-ats-bar__track">
                  <motion.div
                    className="compare-ats-bar__fill"
                    style={{ background: getMatchColor(compareResult.ats_keyword_match_pct) }}
                    initial={{ width: 0 }}
                    animate={{ width: `${compareResult.ats_keyword_match_pct}%` }}
                    transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
                  />
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div variants={fadeUp}>
            <div className="compare-stat-card">
              <div className="compare-stat-card__icon" style={{
                background: compareResult.experience_status === 'gap' ? 'var(--error-bg)' : 'var(--success-bg)',
                color: compareResult.experience_status === 'gap' ? 'var(--error)' : 'var(--success)',
              }}>
                <Briefcase size={20} />
              </div>
              <div className="compare-stat-card__label">Experience Gap</div>
              <div className="compare-stat-card__value" style={{
                color: compareResult.experience_status === 'gap' ? 'var(--error)' : 'var(--success)',
              }}>
                {compareResult.experience_status === 'gap'
                  ? `${compareResult.experience_gap_years} yr gap`
                  : compareResult.experience_status === 'exceeds'
                    ? 'Exceeds'
                    : 'Met ✓'}
              </div>
              <div className="compare-stat-card__sub">
                {memory.experienceYears} yrs experience
              </div>
            </div>
          </motion.div>

          <motion.div variants={fadeUp}>
            <div className="compare-stat-card">
              <div className="compare-stat-card__icon" style={{
                background: compareResult.total_missing > 0 ? 'var(--warning-bg)' : 'var(--success-bg)',
                color: compareResult.total_missing > 0 ? 'var(--warning)' : 'var(--success)',
              }}>
                <BarChart3 size={20} />
              </div>
              <div className="compare-stat-card__label">Skills Summary</div>
              <div className="compare-stat-card__value">
                {compareResult.total_required}
              </div>
              <div className="compare-stat-card__sub">
                {compareResult.total_matched} matched · {compareResult.total_partial} partial · {compareResult.total_missing} missing
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* ── Skill Comparison: Matched / Partial / Missing ── */}
        <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.2 }}>
          {/* Matched Skills */}
          {compareResult.matched_skills.length > 0 && (
            <div className="compare-skills-section" style={{ marginBottom: 'var(--space-4)' }}>
              <div className="compare-skills-section__header">
                <CheckCircle size={18} color="var(--success)" />
                <h3>Matched Skills</h3>
                <span className="compare-skills-section__count" style={{ background: 'var(--success-bg)', color: 'var(--success)' }}>
                  {compareResult.matched_skills.length}
                </span>
              </div>
              <div className="compare-skill-badges">
                {compareResult.matched_skills.map((item, i) => (
                  <motion.span
                    key={i}
                    className="compare-skill-badge compare-skill-badge--matched"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.04 }}
                  >
                    <CheckCircle size={12} /> {item.skill}
                  </motion.span>
                ))}
              </div>
            </div>
          )}

          {/* Partial Skills */}
          {compareResult.partial_skills.length > 0 && (
            <div className="compare-skills-section" style={{ marginBottom: 'var(--space-4)' }}>
              <div className="compare-skills-section__header">
                <AlertTriangle size={18} color="var(--warning)" />
                <h3>Partial Match</h3>
                <span className="compare-skills-section__count" style={{ background: 'var(--warning-bg)', color: 'var(--warning)' }}>
                  {compareResult.partial_skills.length}
                </span>
              </div>
              <div className="compare-skill-list">
                {compareResult.partial_skills.map((item, i) => (
                  <motion.div
                    key={i}
                    className="compare-skill-item compare-skill-item--partial"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <div className="compare-skill-item__icon">
                      <AlertTriangle size={14} />
                    </div>
                    <span className="compare-skill-item__name">{item.skill}</span>
                    {item.match_detail && (
                      <span className="compare-skill-item__detail">{item.match_detail}</span>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Missing Skills */}
          {compareResult.missing_skills.length > 0 && (
            <div className="compare-skills-section">
              <div className="compare-skills-section__header">
                <XCircle size={18} color="var(--error)" />
                <h3>Missing Skills</h3>
                <span className="compare-skills-section__count" style={{ background: 'var(--error-bg)', color: 'var(--error)' }}>
                  {compareResult.missing_skills.length}
                </span>
              </div>
              <div className="compare-skill-badges">
                {compareResult.missing_skills.map((item, i) => (
                  <motion.span
                    key={i}
                    className="compare-skill-badge compare-skill-badge--missing"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.04 }}
                  >
                    <XCircle size={12} /> {item.skill}
                  </motion.span>
                ))}
              </div>
            </div>
          )}
        </motion.div>

        {/* ── Side-by-Side: Resume Skills vs Job Skills ────── */}
        <motion.div className="compare-side-by-side" {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.25 }}>
          <div className="compare-side">
            <div className="compare-side__header">
              <FileText size={16} color="var(--accent-primary)" />
              <h4>Your Resume Skills</h4>
              <span className="compare-side__count">{memory.allSkills.length} skills</span>
            </div>
            <div className="compare-skill-badges">
              {memory.allSkills.map((skill, i) => {
                const isMatched = compareResult.matched_skills.some(s => s.skill.toLowerCase() === skill.toLowerCase())
                const isPartial = compareResult.partial_skills.some(s => s.skill.toLowerCase() === skill.toLowerCase())
                const variant = isMatched ? 'matched' : isPartial ? 'partial' : 'matched'
                return (
                  <span key={i} className={`compare-skill-badge compare-skill-badge--${variant}`}>
                    {skill}
                  </span>
                )
              })}
              {memory.allSkills.length === 0 && (
                <span style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-xs)' }}>
                  No skills in Career Memory
                </span>
              )}
            </div>
          </div>
          <div className="compare-side">
            <div className="compare-side__header">
              <Briefcase size={16} color="var(--accent-secondary)" />
              <h4>Job Required Skills</h4>
              <span className="compare-side__count">{compareResult.total_required} skills</span>
            </div>
            <div className="compare-skill-badges">
              {[...compareResult.matched_skills, ...compareResult.partial_skills, ...compareResult.missing_skills].map((item, i) => (
                <span key={i} className={`compare-skill-badge compare-skill-badge--${item.status}`}>
                  <StatusIcon status={item.status} size={11} /> {item.skill}
                </span>
              ))}
            </div>
          </div>
        </motion.div>

        {/* ── Section Gaps ─────────────────────────────────── */}
        {compareResult.section_gaps.length > 0 && (
          <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.3 }}>
            <div className="compare-skills-section">
              <div className="compare-skills-section__header">
                <BarChart3 size={18} color="var(--accent-primary)" />
                <h3>Section Gap Analysis</h3>
              </div>
              <div className="compare-gaps-grid">
                {compareResult.section_gaps.map((gap, i) => (
                  <motion.div
                    key={i}
                    className="compare-gap-card"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06 }}
                  >
                    <div className="compare-gap-card__header">
                      <div className="compare-gap-card__title">
                        {gap.section === 'Experience' && <Briefcase size={14} />}
                        {gap.section === 'Projects' && <FolderKanban size={14} />}
                        {gap.section === 'Certifications' && <Award size={14} />}
                        {gap.section === 'Education' && <GraduationCap size={14} />}
                        {gap.section}
                      </div>
                      <span className={`compare-gap-card__status compare-gap-card__status--${gap.status}`}>
                        {gap.status === 'met' ? '✓ Met' : gap.status === 'partial' ? '~ Partial' : '✗ Gap'}
                      </span>
                    </div>
                    <div className="compare-gap-card__row">
                      <span className="compare-gap-card__label">You have</span>
                      <span className="compare-gap-card__value">{gap.user_value}</span>
                    </div>
                    <div className="compare-gap-card__row">
                      <span className="compare-gap-card__label">Job requires</span>
                      <span className="compare-gap-card__value">{gap.job_requirement}</span>
                    </div>
                    {gap.gap_detail && (
                      <div className="compare-gap-card__detail">{gap.gap_detail}</div>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* ── AI Suggestions ───────────────────────────────── */}
        {compareResult.ai_suggestions.length > 0 && (
          <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.35 }}>
            <div className="compare-suggestions">
              <div className="compare-suggestions__header">
                <Lightbulb size={18} color="var(--warning)" />
                <h3>AI Suggestions to Improve Your Match</h3>
              </div>
              <div className="compare-suggestion-list">
                {compareResult.ai_suggestions.map((suggestion, i) => (
                  <motion.div
                    key={i}
                    className={`compare-suggestion-item compare-suggestion-item--${suggestion.priority}`}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.07 }}
                  >
                    <div className="compare-suggestion-item__icon">{suggestion.icon}</div>
                    <div className="compare-suggestion-item__body">
                      <div className="compare-suggestion-item__action">{suggestion.action}</div>
                      <div className="compare-suggestion-item__detail">{suggestion.detail}</div>
                    </div>
                    <span className={`compare-suggestion-item__priority compare-suggestion-item__priority--${suggestion.priority}`}>
                      {suggestion.priority}
                    </span>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* ── Compare Another Job ──────────────────────────── */}
        <motion.div className="compare-actions" {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.4 }}>
          <Button variant="primary" icon={RefreshCw} onClick={handleCompareAnother}>
            Compare Another Job
          </Button>
        </motion.div>
      </div>
    )
  }

  // ── Job Selection View ──────────────────────────────────────
  return (
    <div className="compare-panel">
      <div className="compare-panel__header">
        <div className="compare-panel__header-text">
          <h1>Resume vs Job Comparison</h1>
          <p>Select a recommended job to compare against your career profile. Uses your Career Memory — no re-upload needed.</p>
        </div>
      </div>

      {/* Career Memory Summary */}
      <motion.div {...fadeUp}>
        <Card padding="md">
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
            <Zap size={18} color="var(--accent-primary)" />
            <h3 style={{ margin: 0, fontSize: 'var(--text-md)', fontWeight: 'var(--weight-semibold)' }}>
              Career Memory Active
            </h3>
            <Badge variant="success" size="sm">Loaded</Badge>
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-6)', flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginBottom: 2 }}>Skills</div>
              <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)' }}>
                {memory.allSkills.length} skills loaded
              </div>
            </div>
            <div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginBottom: 2 }}>Experience</div>
              <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)' }}>
                {memory.experienceYears} years
              </div>
            </div>
            <div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginBottom: 2 }}>Education</div>
              <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)' }}>
                {memory.education || 'Not specified'}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginBottom: 2 }}>Target Role</div>
              <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)' }}>
                {memory.targetRole}
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Job Selection */}
      <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
          <Briefcase size={18} color="var(--accent-secondary)" />
          <h3 style={{ margin: 0, fontSize: 'var(--text-md)', fontWeight: 'var(--weight-semibold)' }}>
            Recommended Jobs
          </h3>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
            — Click any job to compare
          </span>
        </div>

        {recommendedJobs.length > 0 ? (
          <div className="compare-jobs-grid">
            {recommendedJobs.map((job, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
              >
                <div
                  className={`compare-job-card ${selectedJob === job ? 'compare-job-card--selected' : ''}`}
                  onClick={() => handleCompare(job)}
                >
                  <div className="compare-job-card__check">
                    <Check size={14} />
                  </div>
                  <div className="compare-job-card__title">{job.title}</div>
                  {job.company && (
                    <div className="compare-job-card__company">
                      <Briefcase size={12} /> {job.company}
                    </div>
                  )}
                  <div className="compare-job-card__meta">
                    {job.match_percentage > 0 && (
                      <span className="compare-job-card__tag">
                        <Target size={11} /> {job.match_percentage}% match
                      </span>
                    )}
                    {job.total_required > 0 && (
                      <span className="compare-job-card__tag">
                        {job.matching_skills}/{job.total_required} skills
                      </span>
                    )}
                    {job.location && (
                      <span className="compare-job-card__tag">
                        <MapPin size={11} /> {job.location}
                      </span>
                    )}
                  </div>
                  {job.required_skills.length > 0 && (
                    <div className="compare-job-card__skills">
                      {job.required_skills.slice(0, 5).map((skill, j) => (
                        <span key={j} className="compare-job-card__skill">{skill}</span>
                      ))}
                      {job.required_skills.length > 5 && (
                        <span className="compare-job-card__skill">+{job.required_skills.length - 5} more</span>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Briefcase}
            title="No recommended jobs yet"
            description="Complete your career analysis to get recommended jobs based on your profile."
            action={{ label: 'Start Analysis', href: '/analyze' }}
          />
        )}
      </motion.div>

      {/* Loading State */}
      {loading && (
        <motion.div
          className="compare-loading"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
          >
            <Sparkles size={40} color="var(--accent-primary)" opacity={0.5} />
          </motion.div>
          <div className="compare-loading__text">Comparing your profile against the job...</div>
          <div className="compare-loading__sub">
            Analyzing skills, experience, ATS keywords, and generating suggestions.
          </div>
        </motion.div>
      )}

      {/* Error State */}
      {error && (
        <Card padding="lg" style={{ borderColor: 'var(--error-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', color: 'var(--error)' }}>
            <AlertTriangle size={20} />
            <div>
              <div style={{ fontWeight: 'var(--weight-semibold)' }}>Comparison Failed</div>
              <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>{error}</div>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
