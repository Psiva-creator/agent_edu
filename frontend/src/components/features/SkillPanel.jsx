import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Target, Flame, TrendingUp, Clock, AlertCircle, Sparkles, Brain, CheckCircle2
} from 'lucide-react'
import { useCareerMemory } from '../../hooks/useCareerMemory'
import { analyzeSkills } from '../../services/api'
import RadarChart from '../charts/RadarChart'
import HeatMap from '../charts/HeatMap'
import SkillGraph from '../charts/SkillGraph'
import EmptyState from '../ui/EmptyState'
import Button from '../ui/Button'
import './SkillPanel.css'

export default function SkillPanel() {
  const { memory, updateSkillIntelligence } = useCareerMemory()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Derived state from Memory
  const targetRole = memory?.personal_info?.target_role || "Software Engineer"
  const experienceYears = memory?.personal_info?.experience_years || 0
  
  // Combine skills from resume and roadmap
  const resumeSkills = memory?.resume_intelligence?.skills || []
  const roadmapGaps = memory?.career_analysis?.roadmap?.skill_gaps_addressed || []
  const hasData = resumeSkills.length > 0 || roadmapGaps.length > 0

  const intel = memory?.skill_intelligence

  // Auto-fetch if we have roadmap/resume data but no skill intelligence
  useEffect(() => {
    if (hasData && !intel && !loading && !error) {
      handleAnalyze()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasData, intel, loading, error])

  const handleAnalyze = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await analyzeSkills({
        current_skills: resumeSkills,
        skill_gaps: roadmapGaps,
        target_role: targetRole,
        experience_years: experienceYears
      })
      updateSkillIntelligence(data)
    } catch (err) {
      console.error(err)
      setError("Failed to generate skill intelligence. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  // Formatting helpers
  const sortedSkills = useMemo(() => {
    if (!intel?.skills) return []
    return [...intel.skills].sort((a, b) => b.market_demand - a.market_demand)
  }, [intel])

  const radarData = useMemo(() => {
    return sortedSkills.slice(0, 6) // Top 6 for Radar
  }, [sortedSkills])


  if (!hasData) {
    return (
      <EmptyState
        icon={Target}
        title="No Skills Found"
        description="Please upload your resume or generate a roadmap first so we can analyze your skills."
      />
    )
  }

  return (
    <div className="skill-panel">
      <div className="skill-panel__header">
        <h2>Skill Intelligence Dashboard</h2>
        <p>Deep analytics for {targetRole} based on your Career Memory</p>
      </div>

      {loading && (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-tertiary)' }}>
          <Sparkles className="animate-spin" size={24} style={{ margin: '0 auto 12px' }} />
          Analyzing Market Demand and Salary Impact...
        </div>
      )}

      {error && (
        <div style={{ padding: '16px', background: 'rgba(239,68,68,0.1)', color: '#ef4444', borderRadius: '12px' }}>
          {error}
          <Button variant="secondary" onClick={handleAnalyze} style={{marginLeft: 12}}>Retry</Button>
        </div>
      )}

      {!loading && !error && intel && (
        <motion.div className="skill-bento" initial={{opacity:0, y:20}} animate={{opacity:1, y:0}}>
          
          {/* ── HERO STATS ── */}
          <div className="bento-card bento-card--hero">
            <div className="skill-hero-stat">
              <span className="skill-hero-stat__label">Market Readiness</span>
              <span className="skill-hero-stat__val skill-hero-stat__val--green">{intel.overall_market_readiness}%</span>
            </div>
            <div className="skill-hero-stat">
              <span className="skill-hero-stat__label">Top Priority</span>
              <span className="skill-hero-stat__val" style={{fontSize: 24}}>{intel.top_priority_skill}</span>
            </div>
            <div className="skill-hero-stat">
              <span className="skill-hero-stat__label">Est. Learning Time</span>
              <span className="skill-hero-stat__val">{intel.total_learning_hours}h</span>
            </div>
            <Button variant="primary" icon={Sparkles} onClick={handleAnalyze}>Refresh Data</Button>
          </div>

          {/* ── RADAR CHART ── */}
          <div className="bento-card bento-card--radar">
            <div className="bento-card__title"><Target size={16}/> Current vs Target Level</div>
            {radarData.length > 0 && <RadarChart data={radarData} size={280} />}
            <div style={{display:'flex', gap:16, marginTop: 16, fontSize: 10, color:'var(--text-tertiary)'}}>
              <span style={{display:'flex', alignItems:'center', gap:4}}><div style={{width:10,height:10,background:'rgba(99, 102, 241, 0.3)',border:'1px solid #6366f1'}}></div> Current</span>
              <span style={{display:'flex', alignItems:'center', gap:4}}><div style={{width:10,height:10,background:'rgba(16, 185, 129, 0.1)',border:'1px dashed #10b981'}}></div> Target</span>
            </div>
          </div>

          {/* ── HEATMAP ── */}
          <div className="bento-card bento-card--heatmap">
            <div className="bento-card__title"><Flame size={16}/> Priority Matrix (Time vs Demand)</div>
            {sortedSkills.length > 0 && <HeatMap data={sortedSkills} width={450} height={250} />}
            <p style={{fontSize: 10, color:'var(--text-tertiary)', marginTop: 8}}>
              Top left quadrant represents High Demand / Fast to Learn skills.
            </p>
          </div>

          {/* ── SKILL LIST (Progress Bars) ── */}
          <div className="bento-card bento-card--list">
            <div className="bento-card__title"><TrendingUp size={16}/> Detailed Skill Analytics</div>
            <div className="skill-list">
              {sortedSkills.map((s, i) => (
                <div key={i} className={`skill-list-item ${s.is_gap ? 'skill-list-item--gap' : 'skill-list-item--current'}`}>
                  
                  <div className="skill-list-item__name">
                    {s.name}
                    <span className={`skill-list-item__badge ${s.is_gap ? 'badge--gap' : 'badge--current'}`}>
                      {s.is_gap ? 'Gap' : 'Current'}
                    </span>
                  </div>

                  <div className="skill-list-item__progress-wrap">
                    <div className="skill-list-item__progress-bar">
                      <div className="skill-list-item__progress-fill" style={{width: `${s.current_level}%`}} />
                      <div className="skill-list-item__progress-target" style={{left: `${s.target_level}%`}} />
                    </div>
                    <div className="skill-list-item__progress-labels">
                      <span>Level {s.current_level}</span>
                      <span>Target {s.target_level}</span>
                    </div>
                  </div>

                  <div className="skill-list-item__stat">
                    <span>Demand</span>
                    <strong>{s.market_demand}/100</strong>
                  </div>

                  <div className="skill-list-item__stat">
                    <span>Salary Impact</span>
                    <strong>{s.salary_impact}/100</strong>
                  </div>

                </div>
              ))}
            </div>
          </div>

          {/* ── SKILL GRAPH ── */}
          <div className="bento-card bento-card--graph">
            <div className="bento-card__title"><Brain size={16}/> Knowledge Graph</div>
            <SkillGraph skills={sortedSkills} targetRole={targetRole} />
          </div>

        </motion.div>
      )}
    </div>
  )
}
