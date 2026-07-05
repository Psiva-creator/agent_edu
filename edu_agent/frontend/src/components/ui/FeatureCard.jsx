import { motion } from 'framer-motion'

function FeatureCard({ icon: Icon, title, description, index = 0 }) {
  return (
    <motion.div
      className="glass-card p-6 group h-full"
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-30px' }}
      transition={{ delay: index * 0.08, duration: 0.5 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
    >
      <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform duration-300 border border-emerald-500/20">
        {Icon ? (
          <Icon className="w-6 h-6 text-emerald-400" aria-hidden="true" />
        ) : null}
      </div>
      <h3 className="text-base font-semibold text-white mb-2 font-display">{title}</h3>
      <p className="text-sm text-slate-400 leading-relaxed">{description}</p>
    </motion.div>
  )
}

export default FeatureCard
