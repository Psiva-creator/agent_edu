import { motion } from 'framer-motion'
import { Star } from 'lucide-react'

function TestimonialCard({ quote, author, role, avatar, index = 0 }) {
  return (
    <motion.div
      className="glass-card p-6 h-full flex flex-col"
      initial={{ opacity: 0, scale: 0.95 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
    >
      <div className="flex gap-1 mb-4" aria-label="5 star rating">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" aria-hidden="true" />
        ))}
      </div>
      <blockquote className="text-sm text-slate-300 leading-relaxed flex-1 mb-6">
        &ldquo;{quote}&rdquo;
      </blockquote>
      <div className="flex items-center gap-3 pt-4 border-t border-white/5">
        <div className="w-10 h-10 rounded-full gradient-bg flex items-center justify-center text-sm font-bold text-white shrink-0">
          {avatar}
        </div>
        <div>
          <p className="text-sm font-semibold text-white">{author}</p>
          <p className="text-xs text-slate-500">{role}</p>
        </div>
      </div>
    </motion.div>
  )
}

export default TestimonialCard
