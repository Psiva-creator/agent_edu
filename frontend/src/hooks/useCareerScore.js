/**
 * useCareerScore
 * ══════════════
 * Computes the Career Match Score (0–100) from existing backend data.
 * No new API calls — aggregates already-fetched data from:
 *   - sessionStorage('analysisResult')   → POST /report response
 *   - sessionStorage('resumeAnalysis')   → POST /resume/analyze response
 *
 * Listens for 'career-score-update' custom events dispatched by ResumePanel.
 * Auto-recomputes whenever resume is re-analyzed.
 */

import { useState, useEffect, useCallback } from 'react'

// ─── Score color thresholds ───────────────────────────────────
export const getScoreColor = (score) => {
  if (score >= 86) return '#22c55e'   // Green
  if (score >= 71) return '#6366f1'   // Blue (accent)
  if (score >= 41) return '#f59e0b'   // Orange
  return '#ef4444'                     // Red
}

export const getScoreLabel = (score) => {
  if (score >= 86) return 'Excellent Match'
  if (score >= 71) return 'Strong Match'
  if (score >= 41) return 'Developing Match'
  return 'Poor Match'
}

export const getScoreZone = (score) => {
  if (score >= 86) return 'green'
  if (score >= 71) return 'blue'
  if (score >= 41) return 'orange'
  return 'red'
}

// ─── Growth potential (higher score = lower remaining gap) ────
const computeGrowthPotential = (score, missingSkillsCount, experienceYears) => {
  const gap = 100 - score
  const expBonus = Math.min(experienceYears * 3, 15)
  const learningCurve = missingSkillsCount <= 2 ? 'Fast' : missingSkillsCount <= 5 ? 'Moderate' : 'Gradual'
  const potential = Math.min(Math.round(gap * 0.75 + expBonus), 95)
  return { potential, learningCurve, gap }
}

// ─── Core score computation ───────────────────────────────────
const computeCareerScore = (report, resumeData) => {
  if (!report && !resumeData) return null

  // ── Signal extraction from backend data ──────────────────
  const readinessScore     = resumeData?.readiness_score ?? resumeData?.score ?? report?.readiness_score ?? 0
  const atsScore           = resumeData?.readiness_score ?? report?.readiness_score ?? 0 // proxy
  const careerPath         = resumeData?.career_path ?? []
  const skillMatchPct      = careerPath.length > 0 ? (careerPath[0]?.match_percentage ?? 0) : 0
  const missingSkills      = resumeData?.missing_skills ?? report?.skill_gaps ?? []
  const experienceYears    = report?.experience_years ?? resumeData?.experience_years ?? 0
  const checklist          = resumeData?.section_checklist ?? {}
  const hasProjects        = checklist.projects ?? false
  const hasCertifications  = checklist.certifications ?? false
  const hasEducation       = checklist.education ?? true
  const targetRoles        = report?.target_roles ?? []
  const marketDemandScore  = targetRoles.length > 0 ? (targetRoles[0]?.match ?? 0) : (report?.readiness_score ?? 0)

  // ── Weighted score components ────────────────────────────
  const w_readiness    = 0.25
  const w_ats          = 0.15
  const w_skillMatch   = 0.20
  const w_experience   = 0.10
  const w_projects     = 0.05
  const w_certs        = 0.05
  const w_education    = 0.05
  const w_market       = 0.15

  const missingPenaltyPct = Math.min(missingSkills.length * 5, 25)  // max 25% penalty

  const scoreComponents = {
    resume:      { value: readinessScore,                           weight: w_readiness, label: 'Resume Quality',   max: 100 },
    ats:         { value: Math.min(atsScore + 5, 100),              weight: w_ats,       label: 'ATS Score',        max: 100 },
    skillMatch:  { value: skillMatchPct,                            weight: w_skillMatch, label: 'Skill Match',     max: 100 },
    experience:  { value: Math.min(experienceYears * 12.5, 100),   weight: w_experience, label: 'Experience',      max: 100 },
    projects:    { value: hasProjects ? 100 : 0,                    weight: w_projects,  label: 'Projects',         max: 100 },
    certifications: { value: hasCertifications ? 100 : 0,          weight: w_certs,     label: 'Certifications',   max: 100 },
    education:   { value: hasEducation ? 100 : 40,                  weight: w_education, label: 'Education',        max: 100 },
    market:      { value: marketDemandScore,                        weight: w_market,    label: 'Market Demand',    max: 100 },
  }

  let rawScore = Object.values(scoreComponents).reduce((acc, c) => acc + (c.value * c.weight), 0)
  const finalScore = Math.max(0, Math.min(Math.round(rawScore - (missingPenaltyPct * 0.10)), 100))

  // ── Confidence: how many signals are actually available ──
  const signalCount = [
    resumeData !== null,
    report !== null,
    careerPath.length > 0,
    missingSkills.length >= 0,
    experienceYears > 0,
    targetRoles.length > 0,
    Object.keys(checklist).length > 0,
  ].filter(Boolean).length

  const confidence = Math.round((signalCount / 7) * 100)

  // ── Strengths from backend ───────────────────────────────
  const strengths = [
    ...(resumeData?.strengths ?? []),
    ...(report?.strengths ?? []),
  ].filter((v, i, a) => a.indexOf(v) === i).slice(0, 6)

  // ── "What increases this score?" suggestions ─────────────
  const suggestions = []

  if ((scoreComponents.skillMatch.value) < 70) {
    suggestions.push({ icon: '🎯', title: 'Improve Skill Match', desc: `Learn the required skills for ${report?.target_role ?? 'your target role'} — this adds up to 20 points.` })
  }
  if (!hasProjects) {
    suggestions.push({ icon: '🚀', title: 'Add Projects', desc: 'Including relevant projects in your resume adds 5 points to your score.' })
  }
  if (!hasCertifications) {
    suggestions.push({ icon: '📜', title: 'Get Certified', desc: 'Industry certifications can boost your score by up to 5 points and market credibility significantly.' })
  }
  if (missingSkills.length > 0) {
    suggestions.push({ icon: '📚', title: 'Fill Skill Gaps', desc: `You have ${missingSkills.length} missing skills. Closing gaps removes up to 25 penalty points.` })
  }
  if (experienceYears < 2) {
    suggestions.push({ icon: '💼', title: 'Gain Experience', desc: 'More years of experience can add up to 10 points. Consider internships or freelance projects.' })
  }
  if ((scoreComponents.resume.value) < 75) {
    suggestions.push({ icon: '✍️', title: 'Strengthen Your Resume', desc: 'Use action verbs, quantify achievements, and add professional links to boost the resume score (25% weight).' })
  }
  if ((scoreComponents.market.value) < 60) {
    suggestions.push({ icon: '📈', title: 'Target High-Demand Roles', desc: 'Align your profile with roles in high market demand to gain up to 15 points.' })
  }

  // ── Improvement suggestions from backend ─────────────────
  const improveSuggestions = [
    ...(resumeData?.improvements ?? resumeData?.ats_suggestions ?? []),
    ...(report?.next_steps ?? []),
  ].filter((v, i, a) => a.indexOf(v) === i).slice(0, 8)

  const { potential, learningCurve, gap } = computeGrowthPotential(finalScore, missingSkills.length, experienceYears)

  return {
    score: finalScore,
    confidence,
    scoreColor: getScoreColor(finalScore),
    scoreLabel: getScoreLabel(finalScore),
    scoreZone: getScoreZone(finalScore),
    components: scoreComponents,
    missingSkills,
    missingPenalty: missingPenaltyPct,
    strengths,
    suggestions,
    improveSuggestions,
    growthPotential: potential,
    learningCurve,
    gap,
    experienceYears,
    hasResume: resumeData !== null,
    targetRole: report?.target_role ?? resumeData?.target_role ?? 'Your Target Role',
  }
}

// ─── Hook ────────────────────────────────────────────────────
export default function useCareerScore() {
  const [scoreData, setScoreData] = useState(null)
  const [bonusScore, setBonusScore] = useState(0)

  const recompute = useCallback(() => {
    let report = null
    let resumeData = null

    try {
      const raw = sessionStorage.getItem('careerMemory')
      if (raw) {
        const mem = JSON.parse(raw)
        if (mem.isActive) {
          report = mem.raw_report || null
          resumeData = mem.resume_intelligence?.raw_analysis || null
        }
      }
    } catch (e) {
      console.error("Failed to parse career memory in useCareerScore", e)
    }

    const result = computeCareerScore(report, resumeData)
    if (result) {
      result.score = Math.min(100, result.score + bonusScore)
      result.scoreColor = getScoreColor(result.score)
      result.scoreLabel = getScoreLabel(result.score)
      result.scoreZone = getScoreZone(result.score)
    }
    setScoreData(result)
  }, [bonusScore])

  useEffect(() => {
    // Initial computation
    recompute()

    // Listen for resume analysis updates
    const handleUpdate = () => recompute()
    window.addEventListener('career-score-update', handleUpdate)

    // Listen for incremental updates from Rewrite Studio
    const handleIncrement = (e) => {
      const amount = e.detail?.amount || 2
      setBonusScore(prev => prev + amount)
    }
    window.addEventListener('resume-score-increment', handleIncrement)

    // Also poll sessionStorage for cross-tab updates (lightweight)
    const interval = setInterval(recompute, 5000)

    return () => {
      window.removeEventListener('career-score-update', handleUpdate)
      window.removeEventListener('resume-score-increment', handleIncrement)
      clearInterval(interval)
    }
  }, [recompute])

  return scoreData
}

