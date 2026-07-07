import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, ArrowRight, Sparkles, User, Code, Compass, CheckCircle, Upload, FileText } from 'lucide-react'
import { useApi } from '../hooks/useApi'
import { analyzeProfile, uploadResume } from '../services/api'
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

export default function AnalyzePage() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [mode, setMode] = useState(null) // 'upload' or 'manual'
  const [file, setFile] = useState(null)
  
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
  
  const { loading, execute } = useApi(analyzeProfile)
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
    } else {
      alert('Please upload a PDF or TXT file.')
    }
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
      // Skip manual steps if uploading
      if (step === 0 && mode === 'upload' && file) {
        handleUploadSubmit()
      } else {
        setStep(s => Math.min(s + 1, 4))
      }
    } 
  }
  
  const prev = () => setStep(s => Math.max(s - 1, 0))

  const processReportAndNavigate = (report) => {
    const memoryData = transformReportToMemory(report)
    clearMemory()
    updateMemory(memoryData)
    navigate('/dashboard')
  }

  const handleUploadSubmit = async () => {
    try {
      // 1. Upload and extract text using our base64 safe uploadResume function
      const uploadRes = await uploadResume(file)
      const text = uploadRes.text

      // 2. We don't have explicit inputs for target_role in upload mode, so let's default or extract
      // Since backend /report requires name, current_role, target_role, we can pass placeholders 
      // or let the backend infer them. Actually, the backend API requires these fields.
      // Let's pass the text to /analyze first to extract details, OR just pass defaults and the text as summary.
      // Wait, the backend /resume/analyze is better for this.
      const analyzeRes = await axios.post('/api/v1/resume/analyze', {
        resume_text: text,
        target_role: "Software Engineer" // Fallback
      })
      
      const analysis = analyzeRes.data
      
      // 3. Now we call /report with the extracted data
      const payload = {
        name: "Resume Candidate", // Fallback if not extracted
        current_role: "Candidate",
        target_role: analysis.target_role || "Software Engineer",
        skills: analysis.extracted_skills || [],
        experience_years: analysis.experience_years || 0,
        education: "",
        location: ""
      }
      const result = await execute(payload)
      
      // Merge specific resume intelligence
      result.resume_score = analysis.score || 85
      result.ats_score = analysis.score || 80
      result.strengths = analysis.strengths || []
      result.weaknesses = analysis.improvements || []
      
      processReportAndNavigate(result)
    } catch (err) {
      console.error(err)
      alert('Failed to process resume. Please try manual entry.')
    }
  }

  const handleManualSubmit = async () => {
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
      const result = await execute(payload)
      processReportAndNavigate(result)
    } catch (err) {
      // Error handled by useApi
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
          <button className="analyze-page__back" onClick={() => navigate('/')}><ArrowLeft size={18} /> Back</button>
          <h1>Career <span className="text-gradient">Analysis</span></h1>
          <p>Provide your details or upload your resume to build your Career Memory.</p>
        </motion.div>

        <StepIndicator steps={STEPS} currentStep={step} />

        <Card padding="lg" className="analyze-page__card">
          <AnimatePresence mode="wait">
            <motion.div key={step} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}>
              
              {step === 0 && (
                <div className="analyze-page__mode-selection">
                  <div className="analyze-page__icon-title"><Sparkles size={20} style={{ color: 'var(--accent-primary)' }} /><h3>Select Analysis Mode</h3></div>
                  <div className="mode-cards">
                    <div className={`mode-card ${mode === 'upload' ? 'active' : ''}`} onClick={() => setMode('upload')}>
                      <Upload size={32} />
                      <h4>Upload Resume</h4>
                      <p>Automatically extract skills, experience, and goals to build your Career Memory instantly.</p>
                      {mode === 'upload' && (
                        <div className="file-upload-zone" onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}>
                          <FileText size={24} />
                          <span>{file ? file.name : "Click to select PDF or TXT"}</span>
                          <input type="file" ref={fileInputRef} hidden accept=".pdf,.txt" onChange={handleFileChange} />
                        </div>
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

          <div className="analyze-page__nav">
            {step > 0 && <Button variant="ghost" icon={ArrowLeft} onClick={prev} disabled={loading}>Back</Button>}
            <div style={{ flex: 1 }} />
            {step < 4 && !(step === 0 && mode === 'upload') ? (
              <Button variant="primary" iconRight={ArrowRight} onClick={next} disabled={step === 0 && !mode}>Continue</Button>
            ) : (
              <Button variant="primary" icon={Sparkles} loading={loading} onClick={mode === 'upload' ? handleUploadSubmit : handleManualSubmit} disabled={mode === 'upload' && !file}>
                {mode === 'upload' ? 'Upload & Analyze Resume' : 'Run AI Analysis'}
              </Button>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
