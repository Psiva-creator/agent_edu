import { motion } from 'framer-motion'

function SectionHeader({ badge, title, highlight, description, align = 'center', className = '' }) {
  const alignClass = align === 'center' ? 'text-center mx-auto' : 'text-left'

  return (
    <motion.div
      className={`max-w-3xl mb-14 ${alignClass} ${className}`}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.5 }}
    >
      {badge && (
        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-accent-500/10 text-accent-400 border border-accent-500/20 mb-4">
          {badge}
        </span>
      )}
      <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold font-display text-white mb-4 tracking-tight">
        {title}{' '}
        {highlight && <span className="gradient-text">{highlight}</span>}
      </h2>
      {description && (
        <p className="text-slate-400 text-base sm:text-lg leading-relaxed max-w-2xl mx-auto">
          {description}
        </p>
      )}
    </motion.div>
  )
}

export default SectionHeader
