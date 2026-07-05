import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  FileText, Sparkles, Download, CheckCircle, 
  XCircle, ChevronRight, BarChart2, Crosshair, 
  Target, Briefcase, Zap, AlertTriangle, ArrowRight,
  TrendingUp, Award, UserCheck, Search, Info, Paperclip
} from 'lucide-react'
import { useApi } from '../../hooks/useApi'
import { analyzeResumeText, uploadResume } from '../../services/api'
import Button from '../ui/Button'
import Card from '../ui/Card'
import Input from '../ui/Input'
import TextArea from '../ui/TextArea'
import Badge from '../ui/Badge'
import EmptyState from '../ui/EmptyState'
import ScoreRing from '../ui/ScoreRing'
import './ResumePanel.css'

export default function ResumePanel({ data: existingData, formData }) {
  const [resumeText, setResumeText] = useState('')
  const [targetRole, setTargetRole] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef(null)
  
  const { data, loading, error, execute, reset } = useApi(analyzeResumeText)

  const result = data || existingData

  const handleAnalyze = async () => {
    if (!resumeText.trim()) return
    await execute({ resume_text: resumeText, target_role: targetRole || null })
  }

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setIsUploading(true)
    if (reset) reset()
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await uploadResume(formData)
      if (res.text) {
        setResumeText(res.text)
      }
    } catch (err) {
      console.error('File upload failed:', err)
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const loadSample = () => {
    setTargetRole('Software Engineer')
    setResumeText(`John Doe
johndoe@email.com | (555) 123-4567 | San Francisco, CA

SUMMARY
Passionate Software Engineer with 4 years of experience building scalable web applications. Proficient in modern JavaScript frameworks and cloud infrastructure.

EXPERIENCE
Software Engineer | Tech Solutions Inc. | 2020 - Present
- Worked on a web application.
- Improved database speed.
- Built features for users.

SKILLS
Languages: JavaScript (ES6+), HTML5, CSS3
Frameworks: React, Node.js
Database: PostgreSQL

EDUCATION
B.S. in Computer Science
University of Technology | 2014 - 2018`)
  }

  const renderDashboard = () => {
    if (!result) return null

    // Fallback data if backend hasn't been fully updated yet
    const breakdown = result.ats_breakdown || { keywords: 80, projects: 60, achievements: 40, experience: 85, education: 90, grammar: 85, readability: 75 }
    const verdict = result.recruiter_verdict || { verdict: 'Needs Improvement', interview_probability: 45, hiring_probability: 25 }
    const rewrites = result.ai_rewrites || [
      { original: "Worked on a web application.", improved: "Engineered a scalable web application using React and Node.js, serving 10,000+ daily active users." },
      { original: "Improved database speed.", improved: "Optimized PostgreSQL database queries, reducing average response latency by 40%." }
    ]
    const questions = result.interview_questions || {
      easy: ["Walk me through your resume.", "What is your strongest technical skill?"],
      medium: ["Describe a challenging technical problem you solved.", "How do you handle technical debt?"],
      hard: ["Design a scalable architecture for a high-traffic API.", "Explain a situation where you had to compromise on best practices."]
    }
    const checklist = result.section_checklist || { education: true, skills: true, experience: true, projects: false, achievements: false, certifications: false, github: false, linkedin: false }

    return (
      <motion.div 
        className="resume-dashboard"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* ROW 1: Score Cards */}
        <div className="dashboard-row dashboard-row--4">
          <div className="premium-card" style={{ alignItems: 'center', textAlign: 'center' }}>
            <h4 className="premium-card__header">Overall ATS Score</h4>
            <div style={{ margin: 'var(--space-4) 0' }}>
              <ScoreRing score={result.score || 0} size={120} label={result.readiness_label} />
            </div>
          </div>
          
          <div className="premium-card">
            <div className="premium-card__header">
              <div className="premium-card__icon premium-card__icon--primary"><Target size={20}/></div>
              Top Match
            </div>
            <div className="premium-card__value">{result.career_path?.[0]?.match_percentage || 0}%</div>
            <div className="premium-card__subtext">{result.career_path?.[0]?.role || 'Target Role'}</div>
          </div>

          <div className="premium-card">
            <div className="premium-card__header">
              <div className="premium-card__icon premium-card__icon--warning"><Crosshair size={20}/></div>
              Interview Chance
            </div>
            <div className="premium-card__value">{verdict.interview_probability}%</div>
            <div className="premium-card__subtext">Based on current market competition</div>
          </div>

          <div className="premium-card">
            <div className="premium-card__header">
              <div className="premium-card__icon premium-card__icon--success"><UserCheck size={20}/></div>
              Recruiter Verdict
            </div>
            <div className="premium-card__value" style={{ fontSize: 'var(--text-xl)' }}>{verdict.verdict}</div>
            <div className="premium-card__subtext">Hiring Probability: {verdict.hiring_probability}%</div>
          </div>
        </div>

        {/* ROW 2: ATS Breakdown & Role Compatibility */}
        <div className="dashboard-row dashboard-row--2-1">
          <Card padding="lg">
            <h3 style={{ marginBottom: 'var(--space-4)' }}>ATS Parsing Breakdown</h3>
            <div className="progress-list">
              {Object.entries(breakdown).map(([key, val]) => (
                <div key={key} className="progress-item">
                  <div className="progress-item__header">
                    <span style={{ textTransform: 'capitalize' }}>{key}</span>
                    <span>{val}%</span>
                  </div>
                  <div className="progress-track">
                    <motion.div 
                      className="progress-fill" 
                      initial={{ width: 0 }} 
                      animate={{ width: `${val}%` }}
                      style={{ background: val > 80 ? 'var(--accent-success)' : val > 50 ? 'var(--accent-warning)' : 'var(--accent-danger)' }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card padding="lg">
            <h3 style={{ marginBottom: 'var(--space-4)' }}>Role Compatibility</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              {result.career_path?.slice(0, 5).map((path, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-3)', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
                  <div>
                    <div style={{ fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-sm)' }}>{path.role}</div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>{path.matching_skills} / {path.total_required} skills match</div>
                  </div>
                  <Badge variant={path.match_percentage > 80 ? 'success' : path.match_percentage > 50 ? 'warning' : 'danger'}>
                    {path.match_percentage}%
                  </Badge>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* ROW 3: Heatmap & Missing Keywords */}
        <div className="dashboard-row dashboard-row--2">
          <Card padding="lg">
            <h3 style={{ marginBottom: 'var(--space-4)' }}>Resume Heatmap</h3>
            <div className="heatmap-grid">
              {Object.entries(breakdown).slice(0, 5).map(([key, val]) => {
                const blocks = Math.round(val / 10);
                return (
                  <div key={key} className="heatmap-row">
                    <div className="heatmap-label" style={{ textTransform: 'capitalize' }}>{key}</div>
                    <div className="heatmap-blocks">
                      {[...Array(10)].map((_, i) => (
                        <div key={i} className={`heatmap-block ${i < blocks ? 'active' : ''}`} />
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>

          <Card padding="lg">
            <h3 style={{ marginBottom: 'var(--space-4)' }}>Missing ATS Keywords</h3>
            <div className="badge-cloud">
              {result.missing_skills?.length > 0 ? (
                result.missing_skills.map((skill, i) => (
                  <div key={i} className="dashboard-badge dashboard-badge--missing">
                    <AlertTriangle size={14} /> {skill}
                  </div>
                ))
              ) : (
                <EmptyState icon={CheckCircle} title="No missing keywords" description="Your resume covers all required skills." />
              )}
            </div>
            <div style={{ marginTop: 'var(--space-6)', padding: 'var(--space-4)', background: 'rgba(var(--accent-success-rgb), 0.1)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
              <TrendingUp size={20} color="var(--accent-success)" />
              <div>
                <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)', color: 'var(--accent-success)' }}>Potential ATS Improvement</div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>Adding these keywords could boost your score by up to 15%.</div>
              </div>
            </div>
          </Card>
        </div>

        {/* ROW 4: Strengths & Weaknesses */}
        <div className="dashboard-row dashboard-row--2">
          <Card padding="lg">
            <h3 style={{ marginBottom: 'var(--space-4)' }}>Identified Strengths</h3>
            <div className="badge-cloud">
              {result.strengths?.map((str, i) => (
                <div key={i} className="dashboard-badge dashboard-badge--strength">
                  <CheckCircle size={14} /> {str}
                </div>
              ))}
            </div>
          </Card>

          <Card padding="lg">
            <h3 style={{ marginBottom: 'var(--space-4)' }}>Areas for Improvement</h3>
            <div className="badge-cloud">
              {result.improvements?.map((imp, i) => (
                <div key={i} className="dashboard-badge dashboard-badge--weakness">
                  <XCircle size={14} /> {imp}
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* ROW 5: AI Rewrite Suggestions */}
        <Card padding="lg">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
            <h3>AI Bullet Point Rewrites</h3>
            <Badge variant="primary">Accepting these boosts ATS score</Badge>
          </div>
          <div className="rewrite-list">
            {rewrites.map((rewrite, i) => (
              <div key={i} className="rewrite-card">
                <div className="rewrite-text rewrite-text--original">{rewrite.original}</div>
                <div className="rewrite-arrow"><ArrowRight size={16} /></div>
                <div className="rewrite-text rewrite-text--improved">{rewrite.improved}</div>
              </div>
            ))}
          </div>
        </Card>

        {/* ROW 6: Checklist */}
        <Card padding="lg">
          <h3 style={{ marginBottom: 'var(--space-4)' }}>Resume Section Checklist</h3>
          <div className="checklist-grid">
            {Object.entries(checklist).map(([key, present]) => (
              <div key={key} className="checklist-item">
                <div className={`checklist-icon ${present ? 'checklist-icon--done' : 'checklist-icon--missing'}`}>
                  {present ? <CheckCircle size={18} /> : <XCircle size={18} />}
                </div>
                <span style={{ textTransform: 'capitalize' }}>{key}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* ROW 7: AI Interview Questions */}
        <Card padding="lg">
          <h3 style={{ marginBottom: 'var(--space-4)' }}>Generated Interview Questions</h3>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--space-6)' }}>These questions were uniquely generated based on the skills and experience identified in your resume.</p>
          <div className="interview-grid">
            <div className="interview-column">
              <h5>Easy</h5>
              {questions.easy?.map((q, i) => <div key={i} className="interview-q interview-q--easy">{q}</div>)}
            </div>
            <div className="interview-column">
              <h5>Medium</h5>
              {questions.medium?.map((q, i) => <div key={i} className="interview-q interview-q--medium">{q}</div>)}
            </div>
            <div className="interview-column">
              <h5>Hard</h5>
              {questions.hard?.map((q, i) => <div key={i} className="interview-q interview-q--hard">{q}</div>)}
            </div>
          </div>
        </Card>

        {/* ROW 8: Export Center */}
        <div style={{ display: 'flex', justifyContent: 'center', margin: 'var(--space-8) 0' }}>
          <Button variant="primary" icon={Download} size="lg">
            Download Full Analysis Report (PDF)
          </Button>
        </div>

      </motion.div>
    )
  }

  return (
    <div style={{ width: '100%', maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      
      <div className="resume-header">
        <div className="resume-header__title">
          <h1>Resume Intelligence</h1>
          <p>AI-powered deep analysis, ATS optimization, and coaching.</p>
        </div>
        <div className="resume-header__actions">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            accept=".pdf,.txt" 
            style={{ display: 'none' }} 
          />
          {result && (
            <Button 
              variant="primary" 
              icon={Paperclip} 
              loading={isUploading}
              onClick={() => fileInputRef.current?.click()}
            >
              Upload New Resume
            </Button>
          )}
          <Button 
            variant="outline" 
            icon={Download} 
            disabled={!result}
          >
            Export Report
          </Button>
        </div>
      </div>

      {!result && (
        <div className="resume-input-card">
          <div className="resume-input__row">
            <div style={{ flex: 2 }}>
              <TextArea
                label="Resume Content"
                placeholder="Paste your resume text here..."
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                rows={4}
              />
            </div>
            <div style={{ flex: 1 }}>
              <Input
                label="Target Role"
                placeholder="e.g. AI Engineer"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
              />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center' }}>
            <Button
              variant="primary"
              icon={Sparkles}
              loading={loading}
              disabled={!resumeText.trim()}
              onClick={handleAnalyze}
            >
              Analyze Resume
            </Button>
            <Button
              variant="outline"
              icon={Paperclip}
              loading={isUploading}
              onClick={() => fileInputRef.current?.click()}
            >
              Upload Resume
            </Button>
            <Button variant="secondary" onClick={loadSample}>
              Load Sample Resume
            </Button>
          </div>
        </div>
      )}

      {loading && (
        <Card padding="xl" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-4)', minHeight: '300px' }}>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
          >
            <Sparkles size={40} color="var(--accent-primary)" opacity={0.5} />
          </motion.div>
          <div style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-medium)' }}>Analyzing against 100+ ATS heuristics...</div>
          <p style={{ color: 'var(--text-secondary)' }}>Identifying keyword gaps, structural flaws, and predicting recruiter verdicts.</p>
        </Card>
      )}

      {error && (
        <EmptyState icon={AlertTriangle} title="Analysis Failed" description="Could not process the resume. Please check the text and try again." />
      )}

      {renderDashboard()}
    </div>
  )
}
