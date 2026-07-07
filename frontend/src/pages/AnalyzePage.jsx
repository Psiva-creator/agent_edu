import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, ArrowRight, Sparkles, User, Code, Compass, CheckCircle, Upload, FileText, AlertTriangle, Loader } from 'lucide-react'
import { analyzeProfile, uploadResume, analyzeResumeText, generateRoadmap, searchJobs, askMentor } from '../services/api'
import { useCareerMemory } from '../hooks/useCareerMemory'
import { transformReportToMemory } from '../utils/profileTransformer'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import TextArea from '../components/ui/TextArea'
import StepIndicator from '../components/ui/StepIndicator'
import Badge from '../components/ui/Badge'
import Card from '../components/ui/Card'
import './AnalyzePage.css'
import axios from 'axios'

const STEPS = ['Mode', 'Personal Info', 'Skills & Interests', 'Career Goals', 'Review']

const PIPELINE_STAGES = [
  { id: 'upload', label: 'Resume Uploaded & Extracted' },
  { id: 'analyze', label: 'Resume Analyzed (ATS & Skills)' },
  { id: 'report', label: 'Career Intelligence Generated' },
  { id: 'roadmap', label: 'Personalized Roadmap Created' },
  { id: 'jobs', label: 'Market Jobs Matched' },
  { id: 'mentor', label: 'AI Mentor Initialized' },
  { id: 'memory', label: 'Career Memory Saved' }
]

export default function AnalyzePage() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [mode, setMode] = useState(null) // 'upload' or 'manual'
  const [file, setFile] = useState(null)
  
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState({})
  const [globalError, setGlobalError] = useState(null)
  
  const [form, setForm] = useState({
    name: '', age: '', degree: '', branch: '', cgpa: '',
    current_role: '', target_role: '',
    skills: [], interests: [], preferred_domain: '',
    career_goal: '', experience_years: '0',
    education: '', location: '',
  })
  
  const [skillInput, setSkillInput] = useState('')
  const [interestInput, setInterestInput] = useState('')
  const [errors, setErrors] = useState({})
  
  const { updateMemory, clearMemory } = useCareerMemory()
  const fileInputRef = useRef(null)

  const update = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }))
    setErrors(prev => ({ ...prev, [field]: undefined }))
  }

  const addTag = (field, value, setInput) => {
    const v = value.trim()
    if (v && !form[field].includes(v)) update(field, [...form[field], v])
    setInput('')
  }

  const removeTag = (field, val) => {
    update(field, form[field].filter(s => s !== val))
  }

  const handleTagKey = (e, field, value, setInput) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addTag(field, value, setInput)
    }
  }

  const handleFileChange = (e) => {
    const selected = e.target.files[0]
    if (selected && (selected.type === 'application/pdf' || selected.type === 'text/plain')) {
      setFile(selected)
      setGlobalError(null)
    } else {
      setGlobalError('Please upload a PDF or TXT file.')
    }
  }
  
  const handleLoadSample = () => {
    const sampleText = `John Doe
johndoe@email.com | San Francisco, CA

SUMMARY
Software Engineer with 4 years of experience building scalable web applications. Proficient in React, Node.js, and Python.

EXPERIENCE
Frontend Developer, Tech Corp
2020 - Present
- Built modern React applications improving user engagement by 30%
- Optimized Webpack build times by 50%
- Collaborated with UX team to redesign main dashboard

Junior Developer, Web Solutions Inc.
2018 - 2020
- Developed RESTful APIs using Node.js and Express
- Migrated legacy frontend to Vue.js

EDUCATION
B.S. Computer Science, University of California
2014 - 2018

SKILLS
React, JavaScript, Python, Node.js, HTML, CSS, SQL`

    const sampleFile = new File([sampleText], 'sample_resume.txt', { type: 'text/plain' })
    setFile(sampleFile)
    setGlobalError(null)
  }

  const validateStep = () => {
    const e = {}
    if (step === 0 && !mode) return false
    if (step === 1) {
      if (!form.name.trim()) e.name = 'Name is required'
      if (!form.current_role.trim()) e.current_role = 'Current role is required'
    }
    if (step === 3) {
      if (!form.target_role.trim()) e.target_role = 'Target role is required'
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const next = () => { 
    if (validateStep()) {
      if (step === 0 && mode === 'upload' && file) {
        handlePipelineSubmit()
      } else {
        setStep(s => Math.min(s + 1, 4))
      }
    } 
  }
  
  const prev = () => setStep(s => Math.max(s - 1, 0))

  const updateProgress = (stageId, status) => {
    setProgress(prev => ({ ...prev, [stageId]: status }))
  }

  const handlePipelineSubmit = async () => {
    if (mode === 'upload' && !file) return
    if (mode === 'manual' && !validateStep()) return

    setIsProcessing(true)
    setGlobalError(null)
    setProgress({})

    try {
      let reportResult
      let analysis
      let targetRole = "Software Engineer"
      let skills = []
      let skillGaps = []
      let text = ""

      if (mode === 'upload') {
        // 1. Upload & Extract
        updateProgress('upload', 'loading')
        const uploadRes = await uploadResume(file)
        text = uploadRes.text
        if (!text || !text.trim()) {
          throw new Error("Could not extract text from file.")
        }
        updateProgress('upload', 'success')

        // 2. Analyze Resume
        updateProgress('analyze', 'loading')
        try {
          const analyzeRes = await analyzeResumeText({
            resume_text: text,
            target_role: "Software Engineer" // Fallback target role to extract base info
          })
          analysis = analyzeRes
          updateProgress('analyze', 'success')
        } catch (e) {
          console.error("Analysis failed:", e)
          throw new Error("Failed to analyze resume.") // Critical failure
        }

        // 3. Generate Report / Profile Analysis
        updateProgress('report', 'loading')
        try {
          const payload = {
            name: "Resume Candidate",
            current_role: "Candidate",
            target_role: analysis.target_role || "Software Engineer",
            skills: analysis.extracted_skills || [],
            experience_years: analysis.experience_years || 0,
            education: "",
            location: ""
          }
          reportResult = await analyzeProfile(payload)
          
          // Merge specific resume intelligence directly into the report result
          reportResult.resume_analysis = analysis
          reportResult.resume_text = text
          reportResult.resume_score = analysis.score || 85
          reportResult.ats_score = analysis.score || 80
          reportResult.strengths = analysis.strengths || []
          reportResult.weaknesses = analysis.improvements || []
          
          updateProgress('report', 'success')
        } catch (e) {
          console.error("Report failed:", e)
          throw new Error("Failed to generate career report.") // Critical failure
        }
      } else {
        // MANUAL MODE
        updateProgress('upload', 'success') // Skip
        updateProgress('analyze', 'success') // Skip
        
        updateProgress('report', 'loading')
        try {
          const payload = {
            name: form.name.trim(),
            current_role: form.current_role.trim(),
            target_role: form.target_role.trim(),
            skills: form.skills,
            experience_years: parseInt(form.experience_years) || 0,
            education: form.education || (form.degree ? `${form.degree} ${form.branch || ''}`.trim() : null),
            location: form.location || null,
          }
          reportResult = await analyzeProfile(payload)
          reportResult.resume_text = "" // No text available in manual mode
          updateProgress('report', 'success')
        } catch (e) {
          console.error("Report failed:", e)
          throw new Error("Failed to generate career report.")
        }
      }

      // Extract details for remaining agents
      targetRole = reportResult.target_role || "Software Engineer"
      skills = reportResult.skills || []
      skillGaps = reportResult.skill_gaps || reportResult.missing_skills || []

      // 4. Generate Roadmap (Non-blocking)
      updateProgress('roadmap', 'loading')
      try {
        const roadmapRes = await generateRoadmap({
          current_role: reportResult.current_role || "Candidate",
          target_role: targetRole,
          skill_gaps: skillGaps,
          hours_per_week: 10,
          deadline_weeks: 12,
          skills: skills
        })
        reportResult.roadmap = roadmapRes
        updateProgress('roadmap', 'success')
      } catch (e) {
        console.warn("Roadmap generation failed, continuing...", e)
        updateProgress('roadmap', 'error')
      }

      // 5. Search Jobs (Non-blocking)
      updateProgress('jobs', 'loading')
      try {
        const jobsRes = await searchJobs(targetRole, reportResult.location || '')
        reportResult.jobs = jobsRes
        updateProgress('jobs', 'success')
      } catch (e) {
        console.warn("Jobs fetch failed, continuing...", e)
        updateProgress('jobs', 'error')
      }

      // 6. Initialize Mentor (Non-blocking)
      updateProgress('mentor', 'loading')
      try {
        const mentorPrompt = `I have just uploaded my profile for the role of ${targetRole}. My top skills are ${skills.slice(0,3).join(', ')}. Please introduce yourself as my AI Career Mentor.`
        const mentorRes = await askMentor({
          question: mentorPrompt,
          career_context: JSON.stringify({
            target_role: targetRole,
            skills: skills,
            skill_gaps: skillGaps
          })
        })
        reportResult.mentor_context = mentorRes
        updateProgress('mentor', 'success')
      } catch (e) {
        console.warn("Mentor initialization failed, continuing...", e)
        updateProgress('mentor', 'error')
      }

      // 7. Save to Career Memory
      updateProgress('memory', 'loading')
      const memoryData = transformReportToMemory(reportResult)
      clearMemory()
      updateMemory(memoryData)
      updateProgress('memory', 'success')

      // Redirect to Dashboard automatically
      setTimeout(() => {
        navigate('/dashboard')
      }, 1500)

    } catch (err) {
      console.error(err)
      setIsProcessing(false)
      setGlobalError(err.message || 'Pipeline failed. Please try again.')
    }
  }

  const renderStageIcon = (status) => {
    switch(status) {
      case 'success': return <CheckCircle size={18} className="text-green-500" />
      case 'loading': return <Loader size={18} className="text-blue-500 animate-spin" />
      case 'error': return <AlertTriangle size={18} className="text-yellow-500" />
      default: return <div className="w-[18px] h-[18px] rounded-full border-2 border-gray-600" />
    }
  }

  const slideVariants = {
    enter: { x: 30, opacity: 0 },
    center: { x: 0, opacity: 1 },
    exit: { x: -30, opacity: 0 },
  }

  return (
    <div className="analyze-page">
      <div className="analyze-page__container">
        <motion.div className="analyze-page__header" initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}>
          <button className="analyze-page__back" onClick={() => navigate('/')} disabled={isProcessing}><ArrowLeft size={18} /> Back</button>
          <h1>Career <span className="text-gradient">Analysis</span></h1>
          <p>Provide your details or upload your resume to build your Career Memory.</p>
        </motion.div>

        {!isProcessing && <StepIndicator steps={STEPS} currentStep={step} />}

        <Card padding="lg" className="analyze-page__card">
          {!isProcessing ? (
            <AnimatePresence mode="wait">
              <motion.div key={step} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}>
                
                {step === 0 && (
                  <div className="analyze-page__mode-selection">
                    <div className="analyze-page__icon-title"><Sparkles size={20} style={{ color: 'var(--accent-primary)' }} /><h3>Select Analysis Mode</h3></div>
                    
                    {globalError && (
                      <div style={{ padding: '1rem', background: 'var(--error-bg)', color: 'var(--error)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                        <AlertTriangle size={18} />
                        {globalError}
                      </div>
                    )}
                    
                    <div className="mode-cards">
                      <div className={`mode-card ${mode === 'upload' ? 'active' : ''}`} onClick={() => setMode('upload')}>
                        <Upload size={32} />
                        <h4>Upload Resume</h4>
                        <p>Automatically extract skills, experience, and goals to build your Career Memory instantly.</p>
                        {mode === 'upload' && (
                          <>
                            <div className="file-upload-zone" onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}>
                              <FileText size={24} />
                              <span>{file ? file.name : "Click to select PDF or TXT"}</span>
                              <input type="file" ref={fileInputRef} hidden accept=".pdf,.txt" onChange={handleFileChange} />
                            </div>
                            <div style={{ marginTop: '0.5rem', display: 'flex', justifyContent: 'center' }}>
                              <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleLoadSample(); }}>
                                Load Sample Resume
                              </Button>
                            </div>
                          </>
                        )}
                      </div>
                      <div className={`mode-card ${mode === 'manual' ? 'active' : ''}`} onClick={() => setMode('manual')}>
                        <User size={32} />
                        <h4>Manual Entry</h4>
                        <p>Answer a few questions about your background to generate your profile.</p>
                      </div>
                    </div>
                  </div>
                )}

                {step === 1 && (
                  <div className="analyze-page__fields">
                    <div className="analyze-page__icon-title"><User size={20} style={{ color: 'var(--accent-primary)' }} /><h3>Personal Information</h3></div>
                    <div className="analyze-page__grid">
                      <Input label="Full Name" placeholder="e.g. Siva Kumar" value={form.name} onChange={e => update('name', e.target.value)} error={errors.name} />
                      <Input label="Age (optional)" type="number" placeholder="e.g. 21" min="16" max="65" value={form.age} onChange={e => update('age', e.target.value)} />
                    </div>
                    <div className="analyze-page__grid">
                      <Input label="Current Role" placeholder="e.g. Student, Junior Developer" value={form.current_role} onChange={e => update('current_role', e.target.value)} error={errors.current_role} />
                      <Input label="Education" placeholder="e.g. B.Tech Computer Science" value={form.education} onChange={e => update('education', e.target.value)} />
                    </div>
                    <Input label="Location (optional)" placeholder="e.g. Hyderabad, India" value={form.location} onChange={e => update('location', e.target.value)} />
                  </div>
                )}

                {step === 2 && (
                  <div className="analyze-page__fields">
                    <div className="analyze-page__icon-title"><Code size={20} style={{ color: 'var(--accent-secondary)' }} /><h3>Skills & Interests</h3></div>
                    <div>
                      <Input label="Skills (press Enter to add)" placeholder="e.g. Python" value={skillInput} onChange={e => setSkillInput(e.target.value)} onKeyDown={e => handleTagKey(e, 'skills', skillInput, setSkillInput)} hint="Press Enter or comma to add each skill" />
                      <div className="analyze-page__tags">{form.skills.map(s => <Badge key={s} variant="primary" size="md" removable onRemove={() => removeTag('skills', s)}>{s}</Badge>)}</div>
                    </div>
                    <div>
                      <Input label="Interests (press Enter to add)" placeholder="e.g. Artificial Intelligence" value={interestInput} onChange={e => setInterestInput(e.target.value)} onKeyDown={e => handleTagKey(e, 'interests', interestInput, setInterestInput)} hint="Press Enter or comma to add each interest" />
                      <div className="analyze-page__tags">{form.interests.map(s => <Badge key={s} variant="info" size="md" removable onRemove={() => removeTag('interests', s)}>{s}</Badge>)}</div>
                    </div>
                    <Input label="Preferred Domain (optional)" placeholder="e.g. AI/ML, Web Development" value={form.preferred_domain} onChange={e => update('preferred_domain', e.target.value)} />
                  </div>
                )}

                {step === 3 && (
                  <div className="analyze-page__fields">
                    <div className="analyze-page__icon-title"><Compass size={20} style={{ color: 'var(--success)' }} /><h3>Career Goals</h3></div>
                    <Input label="Target Role" placeholder="e.g. Senior Software Engineer, Data Scientist" value={form.target_role} onChange={e => update('target_role', e.target.value)} error={errors.target_role} />
                    <TextArea label="Career Goal (optional)" placeholder="Describe your career objective..." value={form.career_goal} onChange={e => update('career_goal', e.target.value)} rows={3} />
                    <Input label="Years of Experience" type="number" min="0" max="50" placeholder="e.g. 1" value={form.experience_years} onChange={e => update('experience_years', e.target.value)} />
                  </div>
                )}

                {step === 4 && (
                  <div className="analyze-page__fields">
                    <div className="analyze-page__icon-title"><CheckCircle size={20} style={{ color: 'var(--success)' }} /><h3>Review Your Profile</h3></div>
                    <div className="analyze-page__review">
                      <div className="analyze-page__review-row"><span>Name</span><span>{form.name || '—'}</span></div>
                      <div className="analyze-page__review-row"><span>Current Role</span><span>{form.current_role || '—'}</span></div>
                      <div className="analyze-page__review-row"><span>Target Role</span><span>{form.target_role || '—'}</span></div>
                      <div className="analyze-page__review-row"><span>Education</span><span>{form.education || '—'}</span></div>
                      <div className="analyze-page__review-row"><span>Experience</span><span>{form.experience_years} years</span></div>
                      <div className="analyze-page__review-row"><span>Location</span><span>{form.location || '—'}</span></div>
                      <div className="analyze-page__review-row"><span>Skills</span><div className="analyze-page__tags">{form.skills.map(s => <Badge key={s} variant="primary" size="sm">{s}</Badge>)}</div></div>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          ) : (
            <div className="pipeline-progress">
              <div className="analyze-page__icon-title" style={{ marginBottom: '2rem' }}>
                <Sparkles size={24} style={{ color: 'var(--accent-primary)' }} />
                <h3>Building Your Career Memory...</h3>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {PIPELINE_STAGES.map((stage) => {
                  const status = progress[stage.id] || 'pending'
                  return (
                    <motion.div 
                      key={stage.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem',
                        padding: '1rem',
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-light)',
                        borderRadius: 'var(--radius-md)',
                        opacity: status === 'pending' ? 0.5 : 1
                      }}
                    >
                      {renderStageIcon(status)}
                      <span style={{ 
                        color: status === 'pending' ? 'var(--text-secondary)' : 'var(--text-primary)',
                        fontWeight: status === 'loading' ? 500 : 400
                      }}>
                        {stage.label}
                      </span>
                    </motion.div>
                  )
                })}
              </div>
            </div>
          )}

          {!isProcessing && (
            <div className="analyze-page__nav">
              {step > 0 && <Button variant="ghost" icon={ArrowLeft} onClick={prev}>Back</Button>}
              <div style={{ flex: 1 }} />
              {step < 4 && !(step === 0 && mode === 'upload') ? (
                <Button variant="primary" iconRight={ArrowRight} onClick={next} disabled={step === 0 && !mode}>Continue</Button>
              ) : (
                <Button 
                  variant="primary" 
                  icon={Sparkles} 
                  onClick={handlePipelineSubmit} 
                  disabled={mode === 'upload' && !file}
                >
                  {mode === 'upload' ? 'Upload & Analyze Resume' : 'Run AI Analysis'}
                </Button>
              )}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
