import { motion } from 'framer-motion'

function ProgressBar({ value = 0, max = 100, label, showLabel = true, size = 'md', animated = true, className = '' }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100))
  const heights = { sm: 'h-1', md: 'h-1.5', lg: 'h-2' }

  return (
    <div className={`w-full ${className}`} role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={max} aria-label={label}>
      {(showLabel && label) && (
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs font-medium text-slate-400">{label}</span>
          <span className="text-xs font-semibold text-accent-400">{Math.round(pct)}%</span>
        </div>
      )}
      <div className={`w-full rounded-full bg-dark-700/80 overflow-hidden ${heights[size]}`}>
        <motion.div
          className="h-full rounded-full gradient-bg relative overflow-hidden"
          initial={animated ? { width: 0 } : false}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
        >
          <div className="absolute inset-0 animate-shimmer opacity-50" />
        </motion.div>
      </div>
    </div>
  )
}

export default ProgressBar
