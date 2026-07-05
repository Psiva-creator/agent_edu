import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Brain, Sparkles } from 'lucide-react'
import AgentTimeline from './ui/AgentTimeline'
import ProgressBar from './ui/ProgressBar'

const AGENT_STEPS = [
  { id: 'resume', label: 'Resume Analysis', description: 'Parsing profile data', detail: 'Extracting skills and experience...' },
  { id: 'skills', label: 'Skill Gap Analysis', description: 'Comparing current vs target', detail: 'Identifying skill deficiencies...' },
  { id: 'jobs', label: 'Job Matching', description: 'Scanning opportunities', detail: 'Finding aligned roles...' },
  { id: 'market', label: 'Market Intelligence', description: 'Analyzing industry trends', detail: 'Gathering salary & demand data...' },
  { id: 'roadmap', label: 'Roadmap Generation', description: 'Building learning path', detail: 'Creating personalized milestones...' },
  { id: 'mentor', label: 'AI Mentor', description: 'Generating advice', detail: 'Crafting career recommendations...' },
]

const MOTIVATIONAL = [
  'Great careers are built one skill at a time...',
  'Your future self will thank you for this...',
  'Analyzing thousands of job market signals...',
  'Mapping the shortest path to your dream role...',
  'Every expert was once a beginner...',
  'Building your personalized success blueprint...',
]

function Loading({ message: externalMessage }) {
  const [activeStep, setActiveStep] = useState(0)
  const [messageIndex, setMessageIndex] = useState(0)
  const [progress, setProgress] = useState(0)
  const [eta, setEta] = useState(28)

  useEffect(() => {
    const stepInterval = setInterval(() => {
      setActiveStep((prev) => (prev < AGENT_STEPS.length - 1 ? prev + 1 : prev))
    }, 3500)
    return () => clearInterval(stepInterval)
  }, [])

  useEffect(() => {
    const msgInterval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % MOTIVATIONAL.length)
    }, 3000)
    return () => clearInterval(msgInterval)
  }, [])

  useEffect(() => {
    const progressInterval = setInterval(() => {
      setProgress((prev) => Math.min(prev + 1.5, 95))
      setEta((prev) => Math.max(prev - 0.5, 3))
    }, 400)
    return () => clearInterval(progressInterval)
  }, [])

  const displayMessage = externalMessage || MOTIVATIONAL[messageIndex]

  return (
    <div className="flex flex-col md:flex-row items-center justify-center gap-10 lg:gap-16 min-h-[70vh] px-4 max-w-[1000px] xl:max-w-[1200px] mx-auto w-full">
      {/* Left: AI thinking animation */}
      <div className="flex flex-col items-center gap-6 md:w-72 shrink-0">
        <div className="relative w-28 h-28" aria-hidden="true">
          <motion.div
            className="absolute inset-0 rounded-full border border-accent-500/30"
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
          />
          <motion.div
            className="absolute inset-3 rounded-full border border-cyan-500/20 border-dashed"
            animate={{ rotate: -360 }}
            transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
              className="w-14 h-14 rounded-2xl gradient-bg flex items-center justify-center shadow-xl shadow-accent-500/30"
              animate={{ scale: [1, 1.08, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Brain className="w-7 h-7 text-white" />
            </motion.div>
          </div>
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 rounded-full bg-accent-400"
              style={{ top: '50%', left: '50%' }}
              animate={{
                x: [0, Math.cos(i * 2.1) * 50, 0],
                y: [0, Math.sin(i * 2.1) * 50, 0],
                opacity: [0.3, 1, 0.3],
              }}
              transition={{ duration: 2.5, repeat: Infinity, delay: i * 0.4 }}
            />
          ))}
        </div>

        <div className="text-center space-y-2 w-full">
          <div className="flex items-center justify-center gap-2">
            <Sparkles className="w-4 h-4 text-accent-400 animate-pulse" aria-hidden="true" />
            <span className="text-sm font-semibold text-white">AI Processing</span>
          </div>
          <AnimatePresence mode="wait">
            <motion.p
              key={displayMessage}
              className="text-sm text-slate-400 min-h-[40px]"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
              aria-live="polite"
              aria-atomic="true"
            >
              {displayMessage}
            </motion.p>
          </AnimatePresence>
        </div>

        <div className="w-full space-y-2">
          <ProgressBar value={progress} label="Overall Progress" size="md" />
          <p className="text-xs text-slate-500 text-center">
            Est. completion: ~{Math.round(eta)}s
          </p>
        </div>
      </div>

      {/* Right: Agent timeline */}
      <motion.div
        className="glass-card p-6 sm:p-8 w-full max-w-md"
        initial={{ opacity: 0, x: 24 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
        aria-live="polite"
        aria-label="Agent processing status"
      >
        <h2 className="text-sm font-semibold text-white mb-6 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" aria-hidden="true" />
          Agent Execution Pipeline
        </h2>
        <AgentTimeline steps={AGENT_STEPS} activeIndex={activeStep} />
      </motion.div>
    </div>
  )
}

export default Loading
