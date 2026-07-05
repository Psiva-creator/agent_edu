import { motion } from 'framer-motion'
import { AlertTriangle, Check, BookOpen } from 'lucide-react'

const TYPE_CONFIG = {
  default: { classes: 'bg-accent-500/15 text-accent-400 border-accent-500/20', Icon: null },
  gap: { classes: 'bg-rose-500/15 text-rose-400 border-rose-500/20', Icon: AlertTriangle },
  mastered: { classes: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20', Icon: Check },
  learning: { classes: 'bg-amber-500/15 text-amber-400 border-amber-500/20', Icon: BookOpen },
}

function SkillBadge({ skill, type = 'default', index = 0 }) {
  const config = TYPE_CONFIG[type] || TYPE_CONFIG.default
  const Icon = config.Icon

  return (
    <motion.span
      className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium border ${config.classes}`}
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.04, type: 'spring', stiffness: 400 }}
      whileHover={{ scale: 1.05, y: -1 }}
    >
      {Icon && <Icon className="w-3 h-3 mr-1.5" aria-hidden="true" />}
      {skill}
    </motion.span>
  )
}

export default SkillBadge
