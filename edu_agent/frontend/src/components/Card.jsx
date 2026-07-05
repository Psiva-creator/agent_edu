import { motion } from 'framer-motion'

function Card({ children, className = '', hover = true, glow = false, static: isStatic = false }) {
  const Component = hover && !isStatic ? motion.div : 'div'
  const motionProps = hover && !isStatic
    ? {
        whileHover: { y: -3, transition: { duration: 0.2 } },
        initial: { opacity: 0, y: 8 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.4 },
      }
    : {}

  return (
    <Component
      className={`
        ${isStatic ? 'glass-card-static' : 'glass-card'} p-6
        ${glow ? 'animate-pulseGlow' : ''}
        ${className}
      `}
      {...motionProps}
    >
      {children}
    </Component>
  )
}

export default Card
