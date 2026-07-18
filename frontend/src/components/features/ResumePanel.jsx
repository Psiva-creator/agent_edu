import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  FileText, Sparkles, Download, CheckCircle, 
  XCircle, ChevronRight, BarChart2, Crosshair, 
  Target, Briefcase, Zap, AlertTriangle, ArrowRight,
  TrendingUp, Award, UserCheck, Search, Info, Paperclip,
  RefreshCw, Eye, EyeOff, ArrowUp, ArrowDown, Edit3, Clock, Trash2, Globe
} from 'lucide-react'
import { useApi } from '../../hooks/useApi'
import { 
  analyzeResumeText, uploadResume, exportResumePdf, enhanceProjectDescription,
  getResumeVersions, setActiveResumeVersion, renameResumeVersion, deleteResumeVersion
} from '../../services/api'
import { usePlatformSync } from '../../hooks/usePlatformSync'
import { useCareerMemory } from '../../hooks/useCareerMemory'
import Button from '../ui/Button'
import Card from '../ui/Card'
import Input from '../ui/Input'
import TextArea from '../ui/TextArea'
import Badge from '../ui/Badge'
import EmptyState from '../ui/EmptyState'
import ScoreRing from '../ui/ScoreRing'
import Tabs from '../ui/Tabs'
import FallbackBanner from '../ui/FallbackBanner'
import './ResumePanel.css'

export default function ResumePanel({ data: existingData, formData }) {
  const [resumeText, setResumeText] = useState('')
  const [targetRole, setTargetRole] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [activeTab, setActiveTab] = useState('analysis')
  const [uploadError, setUploadError] = useState(null)
  const fileInputRef = useRef(null)
  
  // Versions and Syncing States
  const [versions, setVersions] = useState([])
  const [showSuggestionModal, setShowSuggestionModal] = useState(false)
  const [suggestedProfile, setSuggestedProfile] = useState(null)
  const [confirmedProfileFields, setConfirmedProfileFields] = useState({
    name: true, education: true, experience_years: true, skills: true
  })
  
  const [renamingId, setRenamingId] = useState(null)
  const [renamingName, setRenamingName] = useState('')
  const [viewingResumeText, setViewingResumeText] = useState(null)
  const [isSyncingState, setIsSyncingState] = useState(false)

  const [localResumeData, setLocalResumeData] = useState(() => {
    try {
      const raw = sessionStorage.getItem('resumeAnalysis')
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  })

  const { data, loading, error, execute, reset } = useApi(analyzeResumeText)
  const { memory, syncActiveResumeState, updatePersonalInfo } = useCareerMemory()
  
  const memoryAnalysis = memory?.resume_intelligence?.raw_analysis
  const result = memoryAnalysis || data || localResumeData || existingData

  // Builder States
  const { syncing, lastSynced, fetchPlatformData } = usePlatformSync()
  const [projects, setProjects] = useState([])
  const [achievements, setAchievements] = useState([])
  const [isExporting, setIsExporting] = useState(false)
  const [enhancingIndex, setEnhancingIndex] = useState(null)

  // Fetch initial profile data & load versions list on mount
  useEffect(() => {
    if (formData?.target_role) {
      setTargetRole(formData.target_role)
    }
    const loadVersions = async () => {
      try {
        const list = await getResumeVersions()
        setVersions(list)
      } catch (err) {
        console.error("Failed to load versions:", err)
      }
    }
    loadVersions()
  }, [formData])

  const handleAnalyze = async () => {
    if (!resumeText.trim()) return
    setIsSyncingState(true)
    try {
      const analysisResult = await execute({ resume_text: resumeText, target_role: targetRole || null })
      if (analysisResult) {
        // Sync active state across all panels!
        await syncActiveResumeState(resumeText, targetRole || null)
        
        // Refresh versions list
        const latestVersions = await getResumeVersions()
        setVersions(latestVersions)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setIsSyncingState(false)
    }
  }

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setIsUploading(true)
    setUploadError(null)
    if (reset) reset()
    try {
      const res = await uploadResume(file)
      if (res.text && res.text.trim()) {
        setResumeText(res.text)
        
        // Sync active state across all panels!
        await syncActiveResumeState(res.text, targetRole, res.profile_suggestion)
        
        // Setup Smart Profile suggestions
        if (res.profile_suggestion) {
          setSuggestedProfile(res.profile_suggestion)
          setShowSuggestionModal(true)
        }
        
        // Refresh versions list
        const latestVersions = await getResumeVersions()
        setVersions(latestVersions)
      } else {
        setUploadError("Could not extract any text from the PDF. Please make sure the file is not scanned or upload a text file.")
      }
    } catch (err) {
      console.error('File upload failed:', err)
      const errMsg = err.response?.data?.error || err.message || "Failed to upload and parse file."
      setUploadError(errMsg)
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleSetActive = async (version) => {
    setIsSyncingState(true)
    try {
      await setActiveResumeVersion(version.id)
      
      // Update global context state!
      await syncActiveResumeState(version.text, version.career_domain)
      
      // Refresh list
      const list = await getResumeVersions()
      setVersions(list)
    } catch (err) {
      console.error("Failed to set active resume:", err)
      alert("Failed to switch active resume version.")
    } finally {
      setIsSyncingState(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this resume version?")) return
    try {
      await deleteResumeVersion(id)
      const list = await getResumeVersions()
      setVersions(list)
      
      const active = list.find(v => v.active)
      if (active) {
        await syncActiveResumeState(active.text, active.career_domain)
      }
    } catch (err) {
      console.error("Failed to delete version:", err)
    }
  }

  const triggerRename = (version) => {
    setRenamingId(version.id)
    setRenamingName(version.name)
  }

  const submitRename = async (id) => {
    if (!renamingName.trim()) return
    try {
      await renameResumeVersion(id, renamingName.trim())
      setRenamingId(null)
      setRenamingName('')
      const list = await getResumeVersions()
      setVersions(list)
    } catch (err) {
      console.error("Failed to rename version:", err)
    }
  }

  const handleAcceptProfileSuggestions = () => {
    if (!suggestedProfile) return
    const updates = {}
    if (confirmedProfileFields.name && suggestedProfile.name) {
      updates.name = suggestedProfile.name
    }
    if (confirmedProfileFields.education && suggestedProfile.education) {
      updates.education = suggestedProfile.education
    }
    if (confirmedProfileFields.experience_years && suggestedProfile.experience_years !== undefined) {
      updates.experience_years = suggestedProfile.experience_years
    }
    if (confirmedProfileFields.skills && suggestedProfile.skills?.length > 0) {
      updates.skills = suggestedProfile.skills
    }
    
    updatePersonalInfo(updates)
    setShowSuggestionModal(false)
    setSuggestedProfile(null)
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

  const handleSyncPlatform = async () => {
    const syncedData = await fetchPlatformData()
    // Helper to calculate relevance based on target role
    const tr = (targetRole || formData?.target_role || '').toLowerCase()
    
    const enrichedProjects = syncedData.projects.map(p => {
      let relevanceScore = 0;
      if (tr) {
        const techStr = (p.tech || []).join(' ').toLowerCase();
        if (tr.includes('frontend') || tr.includes('react') || tr.includes('web')) {
          if (techStr.includes('react') || techStr.includes('html')) relevanceScore += 1;
        }
        if (tr.includes('backend') || tr.includes('node') || tr.includes('api')) {
          if (techStr.includes('node') || techStr.includes('api')) relevanceScore += 1;
        }
        if (tr.includes('ai') || tr.includes('data')) {
          if (techStr.includes('python') || techStr.includes('openai')) relevanceScore += 1;
        }
      }
      return { ...p, relevanceScore }
    }).sort((a, b) => b.relevanceScore - a.relevanceScore)

    setProjects(enrichedProjects)
    setAchievements(syncedData.achievements)
  }

  const toggleVisibility = (index, type) => {
    if (type === 'project') {
      const newArr = [...projects]
      newArr[index].hidden = !newArr[index].hidden
      setProjects(newArr)
    } else {
      const newArr = [...achievements]
      newArr[index].hidden = !newArr[index].hidden
      setAchievements(newArr)
    }
  }

  const moveItem = (index, direction, type) => {
    const arr = type === 'project' ? [...projects] : [...achievements]
    if (direction === 'up' && index > 0) {
      [arr[index - 1], arr[index]] = [arr[index], arr[index - 1]]
    } else if (direction === 'down' && index < arr.length - 1) {
      [arr[index + 1], arr[index]] = [arr[index], arr[index + 1]]
    }
    if (type === 'project') setProjects(arr)
    else setAchievements(arr)
  }

  const handleEnhanceDescription = async (index) => {
    setEnhancingIndex(index)
    try {
      const proj = projects[index]
      const res = await enhanceProjectDescription(proj.description)
      const newProjects = [...projects]
      newProjects[index].description = res.enhanced_description
      setProjects(newProjects)
    } catch (err) {
      console.error(err)
    } finally {
      setEnhancingIndex(null)
    }
  }

  const handleExportBuilderResume = async () => {
    setIsExporting(true)
    try {
      const payload = {
        name: formData?.name || 'Candidate Name',
        email: 'user@example.com',
        phone: '+1 234 567 890',
        summary: `Professional targeting ${targetRole || formData?.target_role || 'roles'} with strong technical background.`,
        skills: formData?.skills || [],
        experience: [{ title: formData?.current_role || 'Professional', company: 'Company', duration: '2023-Present', points: [] }],
        education: [{ degree: formData?.education || 'Degree', institution: 'University' }],
        projects: projects,
        achievements: achievements,
        certifications: []
      }
      const blob = await exportResumePdf(payload)
      const url = window.URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', 'Built_Resume.pdf')
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (err) {
      console.error('Export failed:', err)
      alert('Failed to generate PDF')
    } finally {
      setIsExporting(false)
    }
  }

  const renderVersions = () => {
    if (activeTab !== 'versions') return null;

    return (
      <motion.div 
        className="resume-versions-list"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}
      >
        <Card padding="lg">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
            <div>
              <h3 style={{ margin: 0 }}>Recent Resumes & Versions</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', margin: '4px 0 0 0' }}>
                Manage previous uploads, toggle active resume configurations, and review scoring histories.
              </p>
            </div>
            <Button variant="outline" icon={Paperclip} loading={isUploading} onClick={() => fileInputRef.current?.click()}>
              Upload New Version
            </Button>
          </div>

          {versions.length === 0 ? (
            <EmptyState icon={Clock} title="No Versions Recorded" description="Upload a resume file to automatically track and manage version histories." />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              {versions.map((ver, idx) => (
                <div 
                  key={ver.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: 'var(--space-4)',
                    background: ver.active ? 'rgba(99, 102, 241, 0.05)' : 'var(--bg-secondary)',
                    border: ver.active ? '1px solid var(--accent-primary)' : '1px solid var(--border-light)',
                    borderRadius: 'var(--radius-lg)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', flex: 1 }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: 'var(--radius-md)',
                      background: ver.active ? 'var(--accent-primary)' : 'rgba(255,255,255,0.05)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: ver.active ? '#fff' : 'var(--text-secondary)'
                    }}>
                      <FileText size={20} />
                    </div>

                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                        {renamingId === ver.id ? (
                          <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
                            <input 
                              type="text" 
                              value={renamingName} 
                              onChange={(e) => setRenamingName(e.target.value)}
                              style={{
                                background: 'var(--bg-surface)',
                                border: '1px solid var(--accent-primary)',
                                borderRadius: 'var(--radius-sm)',
                                padding: '2px 6px',
                                color: 'var(--text-primary)',
                                fontSize: 'var(--text-sm)'
                              }}
                            />
                            <Button size="sm" variant="primary" onClick={() => submitRename(ver.id)}>Save</Button>
                            <Button size="sm" variant="ghost" onClick={() => setRenamingId(null)}>Cancel</Button>
                          </div>
                        ) : (
                          <span style={{ fontWeight: 'var(--weight-semibold)', color: 'var(--text-primary)' }}>
                            {ver.name}
                          </span>
                        )}
                        <Badge variant="outline" size="sm">v{ver.version}</Badge>
                        {ver.active && <Badge variant="success" size="sm">Active Source</Badge>}
                      </div>

                      <div style={{ display: 'flex', gap: 'var(--space-4)', marginTop: '4px', fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
                        <span>Uploaded: {ver.upload_date}</span>
                        <span>Size: {ver.file_size}</span>
                        <span>Domain: {ver.career_domain}</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                    <div style={{ marginRight: 'var(--space-4)', textAlign: 'right' }}>
                      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', display: 'block' }}>ATS Score</span>
                      <span style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-bold)', color: ver.ats_score > 80 ? 'var(--accent-success)' : 'var(--accent-warning)' }}>
                        {ver.ats_score}%
                      </span>
                    </div>

                    <Button 
                      size="sm" 
                      variant={ver.active ? "secondary" : "primary"}
                      disabled={ver.active || isSyncingState} 
                      onClick={() => handleSetActive(ver)}
                    >
                      {ver.active ? "Active" : "Set Active"}
                    </Button>
                    
                    <Button size="sm" variant="outline" onClick={() => triggerRename(ver)}>Rename</Button>
                    <Button size="sm" variant="ghost" onClick={() => setViewingResumeText(ver.text)}>View Text</Button>
                    <Button size="sm" variant="ghost" onClick={() => window.open(`/api/v1/resume/download/${ver.id}`, '_blank')}>Download</Button>
                    <Button size="sm" variant="ghost" style={{ color: 'var(--accent-danger)' }} onClick={() => handleDelete(ver.id)}><Trash2 size={14} /></Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </motion.div>
    )
  }

  const renderAnalysisDashboard = () => {
    if (activeTab !== 'analysis') return null;
    if (!result) return (
      <EmptyState icon={Info} title="No Analysis Available" description="Upload or paste your resume to get deep ATS insights." />
    )

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
        <FallbackBanner source={result.source} />
        {/* Score Cards */}
        <div className="dashboard-row dashboard-row--4">
          <div className="premium-card" style={{ alignItems: 'center', textAlign: 'center' }}>
            <h4 className="premium-card__header">Overall ATS Score</h4>
            <div style={{ margin: 'var(--space-4) 0' }}>
              <ScoreRing score={result.score || 0} size={120} label={result.readiness_label} />
            </div>
          </div>
          <div className="premium-card">
            <div className="premium-card__header"><div className="premium-card__icon premium-card__icon--primary"><Target size={20}/></div>Top Match</div>
            <div className="premium-card__value">{result.career_path?.[0]?.match_percentage || 0}%</div>
            <div className="premium-card__subtext">{result.career_path?.[0]?.role || 'Target Role'}</div>
          </div>
          <div className="premium-card">
            <div className="premium-card__header"><div className="premium-card__icon premium-card__icon--warning"><Crosshair size={20}/></div>Interview Chance</div>
            <div className="premium-card__value">{verdict.interview_probability}%</div>
            <div className="premium-card__subtext">Based on current market competition</div>
          </div>
          <div className="premium-card">
            <div className="premium-card__header"><div className="premium-card__icon premium-card__icon--success"><UserCheck size={20}/></div>Recruiter Verdict</div>
            <div className="premium-card__value" style={{ fontSize: 'var(--text-xl)' }}>{verdict.verdict}</div>
            <div className="premium-card__subtext">Hiring Probability: {verdict.hiring_probability}%</div>
          </div>
        </div>

        {/* ATS Breakdown & Role Compatibility */}
        <div className="dashboard-row dashboard-row--2-1">
          <Card padding="lg">
            <h3 style={{ marginBottom: 'var(--space-4)' }}>ATS Parsing Breakdown</h3>
            <div className="progress-list">
              {Object.entries(breakdown).map(([key, val]) => (
                <div key={key} className="progress-item">
                  <div className="progress-item__header"><span style={{ textTransform: 'capitalize' }}>{key}</span><span>{val}%</span></div>
                  <div className="progress-track">
                    <motion.div className="progress-fill" initial={{ width: 0 }} animate={{ width: `${val}%` }} style={{ background: val > 80 ? 'var(--accent-success)' : val > 50 ? 'var(--accent-warning)' : 'var(--accent-danger)' }} />
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
                  <Badge variant={path.match_percentage > 80 ? 'success' : path.match_percentage > 50 ? 'warning' : 'danger'}>{path.match_percentage}%</Badge>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Export Center */}
        <div style={{ display: 'flex', justifyContent: 'center', margin: 'var(--space-8) 0' }}>
          <Button variant="primary" icon={Download} size="lg" onClick={() => window.open(`${import.meta.env.VITE_API_URL || '/api/v1'}/report/pdf`, '_blank')}>
            Download Full Analysis Report (PDF)
          </Button>
        </div>
      </motion.div>
    )
  }

  const renderBuilder = () => {
    if (activeTab !== 'builder') return null;
    return (
      <motion.div className="resume-builder" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div className="builder-header">
          <div>
            <h3>Auto Portfolio Sync</h3>
            <p className="builder-desc">Automatically fetch your platform projects, achievements, and certifications.</p>
          </div>
          <Button variant="primary" icon={RefreshCw} loading={syncing} onClick={handleSyncPlatform}>
            {lastSynced ? 'Sync Again' : 'Sync Profile'}
          </Button>
        </div>

        {projects.length === 0 && !lastSynced ? (
          <EmptyState icon={Briefcase} title="No Data Synced" description="Sync your profile to pull in platform projects and achievements automatically." />
        ) : (
          <div className="builder-content">
            <Card padding="lg" className="builder-section">
              <div className="builder-section-title">
                <h4><Briefcase size={18} /> Projects</h4>
                <Badge variant="info">{projects.length} Found</Badge>
              </div>
              <div className="builder-list">
                {projects.map((proj, i) => (
                  <div key={i} className={`builder-item ${proj.hidden ? 'builder-item--hidden' : ''}`}>
                    <div className="builder-item-actions">
                      <button onClick={() => moveItem(i, 'up', 'project')} disabled={i===0}><ArrowUp size={14}/></button>
                      <button onClick={() => moveItem(i, 'down', 'project')} disabled={i===projects.length-1}><ArrowDown size={14}/></button>
                      <button onClick={() => toggleVisibility(i, 'project')}>{proj.hidden ? <EyeOff size={14}/> : <Eye size={14}/>}</button>
                    </div>
                    <div className="builder-item-content">
                      <div className="builder-item-head">
                        <h5>{proj.name}</h5>
                        {proj.relevanceScore > 0 && <Badge variant="success" size="sm">High Relevance</Badge>}
                      </div>
                      <p className="builder-item-role">{proj.role} {proj.completion_date && `• ${proj.completion_date}`}</p>
                      <div className="builder-item-desc">
                        {proj.description}
                        <Button 
                          variant="ghost" size="sm" icon={Edit3} 
                          loading={enhancingIndex === i}
                          onClick={() => handleEnhanceDescription(i)}
                          style={{ marginLeft: '10px' }}
                        >
                          Enhance AI
                        </Button>
                      </div>
                      <div className="builder-item-tech">
                        {proj.tech?.map((t, idx) => <span key={idx} className="tech-pill">{t}</span>)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card padding="lg" className="builder-section">
              <div className="builder-section-title">
                <h4><Award size={18} /> Achievements & Certifications</h4>
                <Badge variant="info">{achievements.length} Found</Badge>
              </div>
              <div className="builder-list">
                {achievements.map((ach, i) => (
                  <div key={i} className={`builder-item ${ach.hidden ? 'builder-item--hidden' : ''}`}>
                    <div className="builder-item-actions">
                      <button onClick={() => moveItem(i, 'up', 'achievement')} disabled={i===0}><ArrowUp size={14}/></button>
                      <button onClick={() => moveItem(i, 'down', 'achievement')} disabled={i===achievements.length-1}><ArrowDown size={14}/></button>
                      <button onClick={() => toggleVisibility(i, 'achievement')}>{ach.hidden ? <EyeOff size={14}/> : <Eye size={14}/>}</button>
                    </div>
                    <div className="builder-item-content">
                      <div className="builder-item-head">
                        <h5>{ach.title}</h5>
                        <Badge variant="outline" size="sm">{ach.type}</Badge>
                      </div>
                      <p className="builder-item-desc" style={{ marginTop: '4px' }}>{ach.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <div style={{ display: 'flex', justifyContent: 'center', marginTop: 'var(--space-8)' }}>
              <Button variant="primary" icon={Download} size="lg" loading={isExporting} onClick={handleExportBuilderResume}>
                Export ATS-Friendly Resume (PDF)
              </Button>
            </div>
          </div>
        )}
      </motion.div>
    )
  }

  return (
    <div style={{ width: '100%', maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      
      {uploadError && (
        <div className="upload-error-banner" style={{
          padding: 'var(--space-4)',
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid #ef4444',
          borderRadius: 'var(--radius-md)',
          color: '#ef4444',
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-3)',
          fontSize: 'var(--text-sm)'
        }}>
          <AlertTriangle size={18} style={{ flexShrink: 0 }} />
          <div style={{ flex: 1 }}>{uploadError}</div>
          <button 
            onClick={() => setUploadError(null)} 
            style={{ 
              background: 'none', 
              border: 'none', 
              color: 'inherit', 
              cursor: 'pointer', 
              fontWeight: 'bold'
            }}
          >
            ✕
          </button>
        </div>
      )}

      <div className="resume-header">
        <div className="resume-header__title">
          <h1>Resume Studio</h1>
          <p>AI-powered deep analysis and intelligent resume builder.</p>
        </div>
        <div className="resume-header__actions">
          <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".pdf,.txt" style={{ display: 'none' }} />
          {result && (
            <Button variant="primary" icon={Paperclip} loading={isUploading} onClick={() => fileInputRef.current?.click()}>
              Upload New Resume
            </Button>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 'var(--space-4)' }}>
        <Tabs 
          tabs={[
            { id: 'analysis', label: 'Resume Analysis', icon: BarChart2 },
            { id: 'builder', label: 'Auto Portfolio Builder', icon: FileText },
            { id: 'versions', label: 'Recent Resumes', icon: Clock }
          ]} 
          activeTab={activeTab} 
          onChange={setActiveTab} 
        />
      </div>

      {activeTab === 'analysis' && !result && (
        <div className="resume-input-card">
          <div className="resume-input__row">
            <div style={{ flex: 2 }}>
              <TextArea label="Resume Content" placeholder="Paste your resume text here..." value={resumeText} onChange={(e) => setResumeText(e.target.value)} rows={4} />
            </div>
            <div style={{ flex: 1 }}>
              <Input label="Target Role" placeholder="e.g. AI Engineer" value={targetRole} onChange={(e) => setTargetRole(e.target.value)} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center' }}>
            <Button variant="primary" icon={Sparkles} loading={loading} disabled={!resumeText.trim()} onClick={handleAnalyze}>Analyze Resume</Button>
            <Button variant="outline" icon={Paperclip} loading={isUploading} onClick={() => fileInputRef.current?.click()}>Upload Resume</Button>
            <Button variant="secondary" onClick={loadSample}>Load Sample Resume</Button>
          </div>
        </div>
      )}

      {loading && (
        <Card padding="xl" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-4)', minHeight: '300px' }}>
          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: "linear" }}>
            <Sparkles size={40} color="var(--accent-primary)" opacity={0.5} />
          </motion.div>
          <div style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-medium)' }}>Analyzing against 100+ ATS heuristics...</div>
        </Card>
      )}

      {error && (
        <EmptyState icon={AlertTriangle} title="Analysis Failed" description="Could not process the resume. Please check the text and try again." />
      )}

      {renderVersions()}

      {/* Smart Profile Updates Modal */}
      {showSuggestionModal && suggestedProfile && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: 'var(--space-4)'
        }}>
          <Card padding="xl" style={{ maxWidth: '600px', width: '100%', border: '1px solid var(--accent-primary)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
              <Sparkles size={24} style={{ color: 'var(--accent-primary)' }} />
              <h3 style={{ margin: 0 }}>Smart Profile Updates Suggested</h3>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-6)' }}>
              We extracted new information from your uploaded resume. Choose which sections you'd like to sync to your profile:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', marginBottom: 'var(--space-8)' }}>
              {suggestedProfile.name && (
                <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-3)', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', cursor: 'pointer' }}>
                  <input type="checkbox" checked={confirmedProfileFields.name} onChange={e => setConfirmedProfileFields(prev => ({ ...prev, name: e.target.checked }))} />
                  <div>
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', display: 'block' }}>Name</span>
                    <span style={{ fontSize: 'var(--text-sm)', fontWeight: '500' }}>{suggestedProfile.name}</span>
                  </div>
                </label>
              )}

              {suggestedProfile.education && (
                <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-3)', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', cursor: 'pointer' }}>
                  <input type="checkbox" checked={confirmedProfileFields.education} onChange={e => setConfirmedProfileFields(prev => ({ ...prev, education: e.target.checked }))} />
                  <div>
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', display: 'block' }}>Education</span>
                    <span style={{ fontSize: 'var(--text-sm)', fontWeight: '500' }}>{suggestedProfile.education}</span>
                  </div>
                </label>
              )}

              {suggestedProfile.experience_years !== undefined && (
                <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-3)', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', cursor: 'pointer' }}>
                  <input type="checkbox" checked={confirmedProfileFields.experience_years} onChange={e => setConfirmedProfileFields(prev => ({ ...prev, experience_years: e.target.checked }))} />
                  <div>
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', display: 'block' }}>Experience Years</span>
                    <span style={{ fontSize: 'var(--text-sm)', fontWeight: '500' }}>{suggestedProfile.experience_years} years</span>
                  </div>
                </label>
              )}

              {suggestedProfile.skills && suggestedProfile.skills.length > 0 && (
                <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-3)', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', cursor: 'pointer' }}>
                  <input type="checkbox" checked={confirmedProfileFields.skills} onChange={e => setConfirmedProfileFields(prev => ({ ...prev, skills: e.target.checked }))} />
                  <div>
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', display: 'block' }}>Skills Extracted</span>
                    <span style={{ fontSize: 'var(--text-sm)', fontWeight: '500' }}>{suggestedProfile.skills.join(', ')}</span>
                  </div>
                </label>
              )}
            </div>

            <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end' }}>
              <Button variant="ghost" onClick={() => setShowSuggestionModal(false)}>Keep Existing</Button>
              <Button variant="primary" onClick={handleAcceptProfileSuggestions}>Sync Selected to Profile</Button>
            </div>
          </Card>
        </div>
      )}

      {/* Raw Text Preview Modal */}
      {viewingResumeText && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: 'var(--space-4)'
        }}>
          <Card padding="lg" style={{ maxWidth: '800px', width: '100%', display: 'flex', flexDirection: 'column', maxHeight: '80vh' }}>
            <h3>Resume Raw Text Preview</h3>
            <div style={{
              flex: 1,
              overflowY: 'auto',
              margin: 'var(--space-4) 0',
              padding: 'var(--space-3)',
              background: 'var(--bg-secondary)',
              borderRadius: 'var(--radius-md)',
              fontFamily: 'monospace',
              fontSize: 'var(--text-sm)',
              whiteSpace: 'pre-wrap'
            }}>
              {viewingResumeText}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button variant="primary" onClick={() => setViewingResumeText(null)}>Close Preview</Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
