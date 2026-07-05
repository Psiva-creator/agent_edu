import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, ArrowRight, Sparkles, User, Code, Compass, CheckCircle } from 'lucide-react'
import { useApi } from '../hooks/useApi'
import { analyzeProfile } from '../services/api'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import TextArea from '../components/ui/TextArea'
import Select from '../components/ui/Select'
import StepIndicator from '../components/ui/StepIndicator'
import Badge from '../components/ui/Badge'
import Card from '../components/ui/Card'
import './AnalyzePage.css'

const STEPS = ['Personal Info', 'Skills & Interests', 'Career Goals', 'Review']

export default function AnalyzePage() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
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

  const update = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }))
    setErrors(prev => ({ ...prev, [field]: undefined }))
  }

  const addTag = (field, value, setInput) => {
    const v = value.trim()
    if (v && !form[field].includes(v)) {
      update(field, [...form[field], v])
    }
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

  const validateStep = () => {
    const e = {}
    if (step === 0) {
      if (!form.name.trim()) e.name = 'Name is required'
      if (!form.current_role.trim()) e.current_role = 'Current role is required'
    }
    if (step === 2) {
      if (!form.target_role.trim()) e.target_role = 'Target role is required'
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const next = () => { if (validateStep()) setStep(s => Math.min(s + 1, 3)) }
  const prev = () => setStep(s => Math.max(s - 1, 0))

  const handleSubmit = async () => {
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
      // Store result and form data for dashboard
      sessionStorage.setItem('analysisResult', JSON.stringify(result))
      sessionStorage.setItem('analysisFormData', JSON.stringify({
        ...form,
        ...payload,
      }))
      navigate('/dashboard')
    } catch (err) {
      // Error is handled by useApi
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
        {/* Header */}
        <motion.div className="analyze-page__header" initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}>
          <button className="analyze-page__back" onClick={() => navigate('/')}><ArrowLeft size={18} /> Back</button>
          <h1>Career <span className="text-gradient">Analysis</span></h1>
          <p>Complete the form below to get your personalized AI career report.</p>
        </motion.div>

        {/* Steps */}
        <StepIndicator steps={STEPS} currentStep={step} />

        {/* Form */}
        <Card padding="lg" className="analyze-page__card">
          <AnimatePresence mode="wait">
            <motion.div key={step} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}>

              {step === 0 && (
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

              {step === 1 && (
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

              {step === 2 && (
                <div className="analyze-page__fields">
                  <div className="analyze-page__icon-title"><Compass size={20} style={{ color: 'var(--success)' }} /><h3>Career Goals</h3></div>
                  <Input label="Target Role" placeholder="e.g. Senior Software Engineer, Data Scientist" value={form.target_role} onChange={e => update('target_role', e.target.value)} error={errors.target_role} />
                  <TextArea label="Career Goal (optional)" placeholder="Describe your career objective..." value={form.career_goal} onChange={e => update('career_goal', e.target.value)} rows={3} />
                  <Input label="Years of Experience" type="number" min="0" max="50" placeholder="e.g. 1" value={form.experience_years} onChange={e => update('experience_years', e.target.value)} />
                </div>
              )}

              {step === 3 && (
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
                    <div className="analyze-page__review-row"><span>Interests</span><div className="analyze-page__tags">{form.interests.map(s => <Badge key={s} variant="info" size="sm">{s}</Badge>)}</div></div>
                    {form.preferred_domain && <div className="analyze-page__review-row"><span>Domain</span><span>{form.preferred_domain}</span></div>}
                    {form.career_goal && <div className="analyze-page__review-row"><span>Goal</span><span>{form.career_goal}</span></div>}
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="analyze-page__nav">
            {step > 0 && <Button variant="ghost" icon={ArrowLeft} onClick={prev}>Back</Button>}
            <div style={{ flex: 1 }} />
            {step < 3 ? (
              <Button variant="primary" iconRight={ArrowRight} onClick={next}>Continue</Button>
            ) : (
              <Button variant="primary" icon={Sparkles} loading={loading} onClick={handleSubmit}>Run AI Analysis</Button>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
