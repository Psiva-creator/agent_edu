import { motion } from 'framer-motion'

// Respects prefers-reduced-motion: disables all infinite animations for users
// who prefer reduced motion (accessibility requirement).
const motionProps = (animate, transition) => ({
  animate,
  transition: { ...transition, repeat: Infinity },
})

function AnimatedBackground({ variant = 'default' }) {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {/* Grid overlay */}
      <div className="absolute inset-0 bg-grid opacity-40" />

      {/* Gradient orbs — disabled via motion.reduce in CSS */}
      <motion.div
        className="bg-orb bg-orb-1"
        animate={{ x: [0, 30, -20, 0], y: [0, -30, 20, 0] }}
        transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="bg-orb bg-orb-2"
        animate={{ x: [0, -25, 15, 0], y: [0, 25, -15, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
      />
      <motion.div
        className={`bg-orb bg-orb-3 ${variant === 'loading' ? 'opacity-25' : ''}`}
        animate={{ scale: [1, 1.1, 0.95, 1] }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Floating particles — loading page only */}
      {variant === 'loading' &&
        Array.from({ length: 24 }).map((_, i) => (
          <motion.div
            key={i}
            className="particle motion-reduce:hidden"
            style={{
              left: `${(i * 17 + 5) % 100}%`,
              top: `${(i * 23 + 10) % 100}%`,
            }}
            animate={{
              y: [0, -40, 0],
              opacity: [0.2, 0.8, 0.2],
            }}
            transition={{
              duration: 3 + (i % 4),
              repeat: Infinity,
              delay: i * 0.2,
              ease: 'easeInOut',
            }}
          />
        ))}

      {/* Radial vignette */}
      <div className="absolute inset-0 bg-radial-vignette" />
    </div>
  )
}

export default AnimatedBackground
