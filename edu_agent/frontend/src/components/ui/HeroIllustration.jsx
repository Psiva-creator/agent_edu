import { motion } from 'framer-motion'

function HeroIllustration() {
  const agents = [
    { label: 'Resume', color: '#818cf8', angle: 0 },
    { label: 'Skills', color: '#22d3ee', angle: 60 },
    { label: 'Jobs', color: '#34d399', angle: 120 },
    { label: 'Market', color: '#fbbf24', angle: 180 },
    { label: 'Roadmap', color: '#fb7185', angle: 240 },
    { label: 'Mentor', color: '#a78bfa', angle: 300 },
  ]

  // Use CSS custom property for responsive radius via container size
  // On the max-w-lg (512px) container at lg+, 38% of 512 = ~194px is ideal.
  // We use 38% of the container via a relative approach.
  const RADIUS_PCT = 38 // percent of container half-width

  return (
    <div
      className="relative w-full max-w-lg mx-auto aspect-square select-none"
      aria-hidden="true"
    >
      {/* Outer glow ring */}
      <motion.div
        className="absolute inset-4 rounded-full border border-accent-500/20"
        animate={{ rotate: 360 }}
        transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
      />
      <motion.div
        className="absolute inset-12 rounded-full border border-cyan-500/15 border-dashed"
        animate={{ rotate: -360 }}
        transition={{ duration: 45, repeat: Infinity, ease: 'linear' }}
      />

      {/* Center core */}
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.div
          className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl gradient-bg flex items-center justify-center shadow-2xl shadow-accent-500/30"
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        >
          <svg className="w-10 h-10 sm:w-12 sm:h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        </motion.div>
      </div>

      {/* Orbiting agent nodes — positioned using % so they scale with the container */}
      {agents.map((agent, i) => {
        const rad = (agent.angle * Math.PI) / 180
        // % offsets from center (50%): radius is 38% of container half-dimension
        const xPct = 50 + Math.cos(rad) * RADIUS_PCT
        const yPct = 50 + Math.sin(rad) * RADIUS_PCT

        return (
          <motion.div
            key={agent.label}
            className="absolute"
            style={{
              left: `${xPct}%`,
              top: `${yPct}%`,
              transform: 'translate(-50%, -50%)',
            }}
            animate={{ y: [0, -6, 0] }}
            transition={{
              duration: 2 + i * 0.3,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: i * 0.2,
            }}
          >
            <div
              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold glass-light whitespace-nowrap"
              style={{ boxShadow: `0 0 20px ${agent.color}30` }}
            >
              <span
                className="inline-block w-1.5 h-1.5 rounded-full mr-1.5"
                style={{ background: agent.color }}
              />
              {agent.label}
            </div>
          </motion.div>
        )
      })}

      {/* Pulse rings */}
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="absolute inset-0 m-auto w-24 h-24 sm:w-32 sm:h-32 rounded-full border border-accent-500/20"
          animate={{ scale: [1, 2.5], opacity: [0.4, 0] }}
          transition={{ duration: 3, repeat: Infinity, delay: i * 1, ease: 'easeOut' }}
        />
      ))}
    </div>
  )
}

export default HeroIllustration
