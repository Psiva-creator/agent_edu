import { useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  Map, FileText, Briefcase, TrendingUp,
  MessageCircle, Target, Brain, Sparkles, LayoutDashboard
} from 'lucide-react'
import Button from '../ui/Button'
import { useCareerMemory } from '../../hooks/useCareerMemory'
import './OverviewPanel.css'

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] },
}

export default function OverviewPanel() {
  const { memory } = useCareerMemory()

  // Navigation dispatcher
  const handleNav = (tabId) => {
    window.dispatchEvent(new CustomEvent('dashboard-navigate', { detail: tabId }))
  }

  // --- Derived Statistics ---
  const userName = memory?.personal_info?.name || 'User'
  const targetRole = memory?.personal_info?.target_role || 'Not Set'
  
  const roadmapData = memory?.career_analysis?.roadmap
  const roadmapProgress = useMemo(() => {
    if (!roadmapData?.weeks) return 0
    // Simplified progress calculation for overview (assuming a placeholder since completedTasks is in RoadmapPanel local state usually)
    // We will display a placeholder % or if we can deduce from somewhere
    return 0 // Default to 0 for overview unless global memory tracks it
  }, [roadmapData])

  const resumeScore = memory?.resume_intelligence?.resume_score || 0
  const atsScore = memory?.resume_intelligence?.ats_score || 0
  
  const jobsData = memory?.career_analysis?.jobs
  const marketData = memory?.career_analysis?.market_insights

  return (
    <div className="rh-overview">
      {/* HEADER & STATS */}
      <motion.div className="rh-overview__header" {...fadeUp}>
        <h1>Welcome back, {userName}</h1>
        <p>Continue your career journey.</p>
      </motion.div>

      <motion.div className="rh-overview__stats-bar" {...fadeUp} transition={{ delay: 0.1 }}>
        <div className="rh-overview__stat-card">
          <span className="rh-overview__stat-label"><Target size={14}/> Selected Career</span>
          <span className="rh-overview__stat-val" style={{ fontSize: '18px' }}>{targetRole}</span>
        </div>
        <div className="rh-overview__stat-card">
          <span className="rh-overview__stat-label"><Map size={14}/> Roadmap Progress</span>
          <span className="rh-overview__stat-val">{roadmapProgress}%</span>
        </div>
        <div className="rh-overview__stat-card">
          <span className="rh-overview__stat-label"><FileText size={14}/> Resume Score</span>
          <span className="rh-overview__stat-val">{resumeScore}/100</span>
        </div>
        <div className="rh-overview__stat-card">
          <span className="rh-overview__stat-label"><Sparkles size={14}/> Certificates</span>
          <span className="rh-overview__stat-val">{memory?.resume_intelligence?.certifications?.length || 0}</span>
        </div>
      </motion.div>

      {/* QUICK ACTIONS */}
      <motion.div className="rh-quick-actions" {...fadeUp} transition={{ delay: 0.15 }}>
        <button className="rh-quick-action-btn" onClick={() => handleNav('resume')}><FileText size={16}/> Resume</button>
        <button className="rh-quick-action-btn" onClick={() => handleNav('roadmap')}><Map size={16}/> Roadmap</button>
        <button className="rh-quick-action-btn" onClick={() => handleNav('jobs')}><Briefcase size={16}/> Jobs</button>
        <button className="rh-quick-action-btn" onClick={() => handleNav('market')}><TrendingUp size={16}/> Market</button>
        <button className="rh-quick-action-btn" onClick={() => handleNav('mentor')}><MessageCircle size={16}/> Mentor</button>
        <button className="rh-quick-action-btn" onClick={() => handleNav('skills')}><Target size={16}/> Skills</button>
        <button className="rh-quick-action-btn" onClick={() => handleNav('interview')}><Brain size={16}/> Interview</button>
      </motion.div>

      {/* GRID LAYOUT */}
      <div className="rh-overview__grid">
        
        {/* ROADMAP WIDGET */}
        <motion.div className="rh-overview__widget widget-roadmap" {...fadeUp} transition={{ delay: 0.2 }}>
          <div className="rh-overview__widget-header">
            <h3 className="rh-overview__widget-title"><Map size={18}/> Roadmap Preview</h3>
          </div>
          <div className="rh-overview__widget-content">
            {roadmapData?.weeks ? (
              <>
                <div className="rh-widget-row">
                  <span className="rh-widget-label">Current Phase</span>
                  <span className="rh-widget-value">{roadmapData.weeks[0]?.phase || 'Foundations'}</span>
                </div>
                <div className="rh-widget-row">
                  <span className="rh-widget-label">Current Topic</span>
                  <span className="rh-widget-value">{roadmapData.weeks[0]?.theme || 'Week 1'}</span>
                </div>
                <div>
                  <span className="rh-widget-label" style={{ fontSize: 13 }}>Overall Completion</span>
                  <div className="rh-progress-container">
                    <div className="rh-progress-fill" style={{ width: `${roadmapProgress}%` }} />
                  </div>
                </div>
              </>
            ) : (
              <div className="rh-empty-ph">No roadmap generated yet</div>
            )}
          </div>
          <div className="rh-overview__widget-action">
            <Button variant="outline" onClick={() => handleNav('roadmap')} style={{ width: '100%' }}>
              Continue Learning
            </Button>
          </div>
        </motion.div>

        {/* RESUME WIDGET */}
        <motion.div className="rh-overview__widget widget-resume" {...fadeUp} transition={{ delay: 0.25 }}>
          <div className="rh-overview__widget-header">
            <h3 className="rh-overview__widget-title"><FileText size={18}/> Resume Preview</h3>
          </div>
          <div className="rh-overview__widget-content">
            {resumeScore > 0 ? (
              <>
                <div className="rh-widget-row">
                  <span className="rh-widget-label">Resume Score</span>
                  <span className="rh-widget-value">{resumeScore}</span>
                </div>
                <div className="rh-widget-row">
                  <span className="rh-widget-label">ATS Score</span>
                  <span className="rh-widget-value">{atsScore}</span>
                </div>
                <div className="rh-widget-row">
                  <span className="rh-widget-label">Missing Skills</span>
                  <span className="rh-widget-value" style={{ color: 'var(--accent-red)' }}>
                    {memory.resume_intelligence.missing_skills?.length || 0}
                  </span>
                </div>
              </>
            ) : (
              <div className="rh-empty-ph">No resume uploaded</div>
            )}
          </div>
          <div className="rh-overview__widget-action">
            <Button variant="outline" onClick={() => handleNav('resume')} style={{ width: '100%' }}>
              Improve Resume
            </Button>
          </div>
        </motion.div>

        {/* JOBS WIDGET */}
        <motion.div className="rh-overview__widget widget-jobs" {...fadeUp} transition={{ delay: 0.3 }}>
          <div className="rh-overview__widget-header">
            <h3 className="rh-overview__widget-title"><Briefcase size={18}/> Jobs Preview</h3>
          </div>
          <div className="rh-overview__widget-content">
            {jobsData?.jobs?.length > 0 ? (
              <>
                <div className="rh-widget-row">
                  <span className="rh-widget-label">Recommended Jobs</span>
                  <span className="rh-widget-value">{jobsData.jobs.length}</span>
                </div>
                <div className="rh-widget-row">
                  <span className="rh-widget-label">Top Match</span>
                  <span className="rh-widget-value">{jobsData.jobs[0].title}</span>
                </div>
              </>
            ) : (
              <div className="rh-empty-ph">No jobs fetched yet</div>
            )}
          </div>
          <div className="rh-overview__widget-action">
            <Button variant="outline" onClick={() => handleNav('jobs')} style={{ width: '100%' }}>
              Apply Now
            </Button>
          </div>
        </motion.div>

        {/* MARKET WIDGET */}
        <motion.div className="rh-overview__widget widget-market" {...fadeUp} transition={{ delay: 0.35 }}>
          <div className="rh-overview__widget-header">
            <h3 className="rh-overview__widget-title"><TrendingUp size={18}/> Market Insights</h3>
          </div>
          <div className="rh-overview__widget-content">
            {marketData ? (
              <>
                <div className="rh-widget-row">
                  <span className="rh-widget-label">Hiring Trend</span>
                  <span className="rh-widget-value" style={{ color: 'var(--brand-primary)' }}>High</span>
                </div>
                <div className="rh-widget-row">
                  <span className="rh-widget-label">Average Salary</span>
                  <span className="rh-widget-value">{marketData.executive_summary?.average_salary || 'N/A'}</span>
                </div>
              </>
            ) : (
              <div className="rh-empty-ph">No market data available</div>
            )}
          </div>
          <div className="rh-overview__widget-action">
            <Button variant="outline" onClick={() => handleNav('market')} style={{ width: '100%' }}>
              View Market
            </Button>
          </div>
        </motion.div>

        {/* SKILLS WIDGET */}
        <motion.div className="rh-overview__widget widget-skills" {...fadeUp} transition={{ delay: 0.4 }}>
          <div className="rh-overview__widget-header">
            <h3 className="rh-overview__widget-title"><Target size={18}/> Skills</h3>
          </div>
          <div className="rh-overview__widget-content">
            <div className="rh-widget-row">
              <span className="rh-widget-label">Skills Learned</span>
              <span className="rh-widget-value">{memory?.resume_intelligence?.skills?.length || 0}</span>
            </div>
            <div className="rh-widget-row">
              <span className="rh-widget-label">Skills Remaining</span>
              <span className="rh-widget-value">{memory?.resume_intelligence?.missing_skills?.length || 0}</span>
            </div>
          </div>
          <div className="rh-overview__widget-action">
            <Button variant="outline" onClick={() => handleNav('skills')} style={{ width: '100%' }}>
              View Skills
            </Button>
          </div>
        </motion.div>

        {/* INTERVIEW WIDGET */}
        <motion.div className="rh-overview__widget widget-interview" {...fadeUp} transition={{ delay: 0.45 }}>
          <div className="rh-overview__widget-header">
            <h3 className="rh-overview__widget-title"><Brain size={18}/> Interview</h3>
          </div>
          <div className="rh-overview__widget-content">
            {memory?.interview_history?.length > 0 ? (
              <>
                <div className="rh-widget-row">
                  <span className="rh-widget-label">Last Attempt</span>
                  <span className="rh-widget-value">
                    {new Date(memory.interview_history[0].date).toLocaleDateString()}
                  </span>
                </div>
                <div className="rh-widget-row">
                  <span className="rh-widget-label">Mock Score</span>
                  <span className="rh-widget-value">{memory.interview_history[0].score}/100</span>
                </div>
              </>
            ) : (
              <div className="rh-empty-ph">No mock interviews yet</div>
            )}
          </div>
          <div className="rh-overview__widget-action">
            <Button variant="outline" onClick={() => handleNav('interview')} style={{ width: '100%' }}>
              Practice
            </Button>
          </div>
        </motion.div>

        {/* MENTOR WIDGET */}
        <motion.div className="rh-overview__widget widget-mentor" {...fadeUp} transition={{ delay: 0.5 }}>
          <div className="rh-overview__widget-header">
            <h3 className="rh-overview__widget-title"><MessageCircle size={18}/> Mentor</h3>
          </div>
          <div className="rh-overview__widget-content">
            <div className="rh-empty-ph">Ask AI mentor for advice</div>
          </div>
          <div className="rh-overview__widget-action">
            <Button variant="outline" onClick={() => handleNav('mentor')} style={{ width: '100%' }}>
              Open Mentor
            </Button>
          </div>
        </motion.div>

      </div>
    </div>
  )
}
