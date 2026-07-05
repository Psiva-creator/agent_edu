import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import Card from './Card'

function InsightCard({ icon: Icon, emoji, title, value, subtitle, trend, index = 0 }) {
  const trendConfig = {
    up: { color: 'text-emerald-400', bg: 'bg-emerald-500/10', Icon: TrendingUp },
    down: { color: 'text-rose-400', bg: 'bg-rose-500/10', Icon: TrendingDown },
    neutral: { color: 'text-slate-400', bg: 'bg-slate-500/10', Icon: Minus },
  }
  const t = trendConfig[trend] || trendConfig.neutral

  return (
    <Card className="flex flex-col gap-4" hover>
      <div className="flex items-start justify-between">
        <motion.div
          className="w-11 h-11 rounded-xl bg-gradient-to-br from-accent-500/20 to-cyan-500/10 flex items-center justify-center"
          whileHover={{ scale: 1.1, rotate: 5 }}
          transition={{ type: 'spring', stiffness: 400 }}
        >
          {Icon ? (
            <Icon className="w-5 h-5 text-accent-400" aria-hidden="true" />
          ) : (
            <span className="text-lg" aria-hidden="true">{emoji}</span>
          )}
        </motion.div>
        {trend && subtitle && (
          <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-md ${t.bg} ${t.color}`}>
            <t.Icon className="w-3 h-3" aria-hidden="true" />
            {subtitle}
          </span>
        )}
      </div>
      <div>
        <p className="text-sm text-slate-500 mb-1">{title}</p>
        <motion.p
          className="text-2xl sm:text-3xl font-bold text-white font-display"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: index * 0.1 }}
        >
          {value}
        </motion.p>
      </div>
    </Card>
  )
}

export default InsightCard
