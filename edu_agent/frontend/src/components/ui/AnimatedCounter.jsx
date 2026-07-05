import { useEffect, useState } from 'react'
import { motion, useSpring, useTransform } from 'framer-motion'

function AnimatedCounter({ value, suffix = '', prefix = '', duration = 1.5, className = '' }) {
  const [display, setDisplay] = useState(0)
  const spring = useSpring(0, { duration: duration * 1000, bounce: 0 })
  const rounded = useTransform(spring, (v) => Math.round(v))

  useEffect(() => {
    spring.set(typeof value === 'number' ? value : parseFloat(value) || 0)
    const unsub = rounded.on('change', (v) => setDisplay(v))
    return () => unsub()
  }, [value, spring, rounded])

  return (
    <motion.span className={className} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      {prefix}
      {display}
      {suffix}
    </motion.span>
  )
}

export default AnimatedCounter
