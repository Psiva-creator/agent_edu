import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  User,
  Briefcase,
  Target,
  GraduationCap,
  MapPin,
  Clock,
  Plus,
  X,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Check,
} from 'lucide-react'
import Button from './Button'
import InputField from './ui/InputField'
import ProgressBar from './ui/ProgressBar'

const STEPS = [
  { id: 'personal', label: 'Personal Info', icon: User, number: 1 },
  { id: 'career', label: 'Career Goals', icon: Target, number: 2 },
  { id: 'skills', label: 'Skills & Experience', icon: Briefcase, number: 3 },
]

const stepVariants = {
  enter: (dir) => ({ opacity: 0, x: dir > 0 ? 40 : -40 }),
  center: { opacity: 1, x: 0 },
  exit: (dir) => ({ opacity: 0, x: dir > 0 ? -40 : 40 }),
}

function StudentForm({ onSubmit, loading = false }) {
  const [formData, setFormData] = useState({
    name: '',
    current_role: '',
    target_role: '',
    skills: [],
    experience_years: 0,
    education: '',
    location: '',
  })
  const [skillInput, setSkillInput] = useState('')
  const [errors, setErrors] = useState({})
  const [step, setStep] = useState(0)
  const [direction, setDirection] = useState(1)

  const completionFields = [
    formData.name,
    formData.current_role,
    formData.target_role,
    formData.skills.length > 0,
    formData.education,
    formData.location,
  ]
  const completionPct = Math.round(
    (completionFields.filter(Boolean).length / completionFields.length) * 100
  )

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'experience_years' ? parseInt(value) || 0 : value,
    }))
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }))
    }
  }

  const addSkill = () => {
    const trimmed = skillInput.trim()
    if (trimmed && !formData.skills.includes(trimmed)) {
      setFormData((prev) => ({ ...prev, skills: [...prev.skills, trimmed] }))
      setSkillInput('')
    }
  }

  const removeSkill = (skillToRemove) => {
    setFormData((prev) => ({
      ...prev,
      skills: prev.skills.filter((s) => s !== skillToRemove),
    }))
  }

  const handleSkillKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addSkill()
    }
  }

  const validateStep = (s) => {
    const newErrors = {}
    if (s === 0 && !formData.name.trim()) newErrors.name = 'Name is required'
    if (s === 1) {
      if (!formData.current_role.trim()) newErrors.current_role = 'Current role is required'
      if (!formData.target_role.trim()) newErrors.target_role = 'Target role is required'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (!validateStep(step)) return
    setDirection(1)
    setStep((s) => Math.min(s + 1, STEPS.length - 1))
  }

  const handleBack = () => {
    setDirection(-1)
    setStep((s) => Math.max(s - 1, 0))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!validateStep(step)) return
    onSubmit(formData)
  }

  const isLastStep = step === STEPS.length - 1
  const isFirstStep = step === 0

  return (
    <form onSubmit={handleSubmit} className="space-y-8" noValidate>
      {/* Step Indicator */}
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            Step {step + 1} of {STEPS.length}
          </span>
          <span className="text-xs font-semibold text-accent-400">{completionPct}% complete</span>
        </div>
        <ProgressBar value={completionPct} showLabel={false} size="sm" />

        {/* Step Pills */}
        <div className="flex items-center gap-2" role="list" aria-label="Form steps">
          {STEPS.map((s, i) => {
            const Icon = s.icon
            const isCompleted = i < step
            const isCurrent = i === step
            return (
              <div key={s.id} className="flex items-center gap-2 flex-1 last:flex-none" role="listitem">
                <div
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                    isCurrent
                      ? 'bg-accent-500/15 text-accent-400 border border-accent-500/30'
                      : isCompleted
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                        : 'text-slate-600 border border-transparent'
                  }`}
                  aria-current={isCurrent ? 'step' : undefined}
                >
                  {isCompleted ? (
                    <Check className="w-3.5 h-3.5" aria-hidden="true" />
                  ) : (
                    <Icon className="w-3.5 h-3.5" aria-hidden="true" />
                  )}
                  <span className="hidden sm:inline">{s.label}</span>
                  <span className="sm:hidden">{i + 1}</span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`flex-1 h-px ${isCompleted ? 'bg-emerald-500/30' : 'bg-dark-700'}`} aria-hidden="true" />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Step Content */}
      <div className="relative overflow-hidden min-h-[200px]">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            variants={stepVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
            className="space-y-5"
          >
            {/* Step 1: Personal Info */}
            {step === 0 && (
              <>
                <div className="flex items-center gap-2 pb-2 border-b border-white/5">
                  <User className="w-4 h-4 text-accent-400" aria-hidden="true" />
                  <h3 className="text-sm font-semibold text-white">Personal Information</h3>
                </div>
                <InputField
                  id="name"
                  name="name"
                  label="Full Name"
                  icon={User}
                  placeholder="e.g., Rishi Sharma"
                  value={formData.name}
                  onChange={handleChange}
                  error={errors.name}
                  required
                />
              </>
            )}

            {/* Step 2: Career Goals */}
            {step === 1 && (
              <>
                <div className="flex items-center gap-2 pb-2 border-b border-white/5">
                  <Target className="w-4 h-4 text-accent-400" aria-hidden="true" />
                  <h3 className="text-sm font-semibold text-white">Career Goals</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <InputField
                    id="current_role"
                    name="current_role"
                    label="Current Role / Status"
                    icon={Briefcase}
                    placeholder="e.g., CS Student, Junior Developer"
                    value={formData.current_role}
                    onChange={handleChange}
                    error={errors.current_role}
                    required
                  />
                  <InputField
                    id="target_role"
                    name="target_role"
                    label="Target Role"
                    icon={Target}
                    placeholder="e.g., Senior Software Engineer"
                    value={formData.target_role}
                    onChange={handleChange}
                    error={errors.target_role}
                    required
                  />
                </div>
              </>
            )}

            {/* Step 3: Skills & Experience */}
            {step === 2 && (
              <>
                <div className="flex items-center gap-2 pb-2 border-b border-white/5">
                  <Sparkles className="w-4 h-4 text-accent-400" aria-hidden="true" />
                  <h3 className="text-sm font-semibold text-white">Skills & Experience</h3>
                </div>

                <div>
                  <label htmlFor="skill_input" className="form-label flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-accent-400/70" aria-hidden="true" />
                    Your Skills
                  </label>
                  <div className="flex gap-2">
                    <input
                      id="skill_input"
                      type="text"
                      className="form-input flex-1"
                      placeholder="Type a skill and press Enter"
                      value={skillInput}
                      onChange={(e) => setSkillInput(e.target.value)}
                      onKeyDown={handleSkillKeyDown}
                      aria-describedby="skill-hint"
                    />
                    <Button type="button" variant="secondary" size="md" onClick={addSkill} aria-label="Add skill">
                      <Plus className="w-4 h-4" aria-hidden="true" />
                      Add
                    </Button>
                  </div>
                  <p id="skill-hint" className="text-xs text-slate-500 mt-1.5">Press Enter or click Add to include a skill</p>

                  <AnimatePresence mode="popLayout">
                    {formData.skills.length > 0 && (
                      <motion.div
                        className="flex flex-wrap gap-2 mt-3"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                      >
                        {formData.skills.map((skill) => (
                          <motion.span
                            key={skill}
                            layout
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-accent-500/15 text-accent-400 border border-accent-500/20"
                          >
                            {skill}
                            <button
                              type="button"
                              onClick={() => removeSkill(skill)}
                              className="text-accent-400/60 hover:text-accent-400 transition-colors"
                              aria-label={`Remove ${skill}`}
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </motion.span>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                  <div>
                    <label htmlFor="experience_years" className="form-label flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-accent-400/70" aria-hidden="true" />
                      Experience (Years)
                    </label>
                    <input
                      id="experience_years"
                      name="experience_years"
                      type="number"
                      min="0"
                      max="50"
                      className="form-input"
                      placeholder="0"
                      value={formData.experience_years}
                      onChange={handleChange}
                    />
                  </div>
                  <div>
                    <label htmlFor="education" className="form-label flex items-center gap-1.5">
                      <GraduationCap className="w-3.5 h-3.5 text-accent-400/70" aria-hidden="true" />
                      Education
                    </label>
                    <select
                      id="education"
                      name="education"
                      className="form-select"
                      value={formData.education}
                      onChange={handleChange}
                    >
                      <option value="">Select...</option>
                      <option value="High School">High School</option>
                      <option value="Bachelor's">Bachelor&apos;s Degree</option>
                      <option value="Master's">Master&apos;s Degree</option>
                      <option value="PhD">PhD</option>
                      <option value="Self-taught">Self-taught</option>
                      <option value="Bootcamp">Bootcamp Graduate</option>
                    </select>
                  </div>
                  <InputField
                    id="location"
                    name="location"
                    label="Location"
                    icon={MapPin}
                    placeholder="e.g., Bangalore, India"
                    value={formData.location}
                    onChange={handleChange}
                  />
                </div>
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation Buttons */}
      <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          {!isFirstStep && (
            <Button type="button" variant="secondary" size="md" onClick={handleBack}>
              <ChevronLeft className="w-4 h-4" aria-hidden="true" />
              Back
            </Button>
          )}
        </div>

        <div className="flex items-center gap-4 w-full sm:w-auto justify-end">
          <p className="text-xs text-slate-500 hidden sm:block">
            {isLastStep ? 'Fields marked * are required' : `Step ${step + 1} of ${STEPS.length}`}
          </p>
          {isLastStep ? (
            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={loading}
              disabled={!formData.name || !formData.current_role || !formData.target_role}
            >
              {loading ? 'Analyzing...' : 'Analyze My Career Path'}
              {!loading && <ChevronRight className="w-5 h-5" aria-hidden="true" />}
            </Button>
          ) : (
            <Button type="button" variant="primary" size="md" onClick={handleNext}>
              Continue
              <ChevronRight className="w-4 h-4" aria-hidden="true" />
            </Button>
          )}
        </div>
      </div>
    </form>
  )
}

export default StudentForm
