import { motion } from 'framer-motion'
import { Check, Loader2, Circle } from 'lucide-react'

const STATUS_ICON = {
  completed: Check,
  active: Loader2,
  pending: Circle,
}

function AgentTimeline({ steps, activeIndex = 0, className = '' }) {
  return (
    <div className={`space-y-0 ${className}`} role="list" aria-label="AI agent processing steps">
      {steps.map((step, index) => {
        const status =
          index < activeIndex ? 'completed' : index === activeIndex ? 'active' : 'pending'
        const Icon = STATUS_ICON[status]
        const isLast = index === steps.length - 1

        return (
          <motion.div
            key={step.id || step.label}
            className="relative flex gap-4"
            role="listitem"
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1, duration: 0.4 }}
          >
            {/* Connector line */}
            {!isLast && (
              <div
                className={`absolute left-[15px] top-8 bottom-0 w-px ${
                  status === 'completed' ? 'bg-emerald-500/40' : 'bg-dark-600'
                }`}
                aria-hidden="true"
              />
            )}

            {/* Status dot */}
            <div
              className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center shrink-0 border transition-all duration-500 ${
                status === 'completed'
                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                  : status === 'active'
                    ? 'bg-accent-500/20 border-accent-500/50 text-accent-400 shadow-lg shadow-accent-500/20'
                    : 'bg-dark-800 border-dark-600 text-slate-600'
              }`}
              aria-current={status === 'active' ? 'step' : undefined}
            >
              <Icon
                className={`w-4 h-4 ${status === 'active' ? 'animate-spin' : ''}`}
                aria-hidden="true"
              />
            </div>

            {/* Content */}
            <div className={`pb-8 flex-1 min-w-0 ${isLast ? 'pb-0' : ''}`}>
              <p
                className={`text-sm font-semibold transition-colors ${
                  status === 'active'
                    ? 'text-white'
                    : status === 'completed'
                      ? 'text-emerald-400'
                      : 'text-slate-500'
                }`}
              >
                {step.label}
              </p>
              {step.description && (
                <p className="text-xs text-slate-500 mt-0.5">{step.description}</p>
              )}
              {status === 'active' && step.detail && (
                <motion.p
                  className="text-xs text-accent-400/80 mt-1"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  key={step.detail}
                >
                  {step.detail}
                </motion.p>
              )}
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}

export default AgentTimeline
