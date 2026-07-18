import { useState, useRef, useEffect } from 'react'
import { motion, useMotionValue, useSpring } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import './PremiumGetStartedButton.css'

export default function PremiumGetStartedButton({ onClick, className = '', children = 'Get Started' }) {
  const buttonRef = useRef(null)
  const [ripples, setRipples] = useState([])
  const [isClickGlow, setIsClickGlow] = useState(false)

  // Magnetic values
  const x = useMotionValue(0)
  const y = useMotionValue(0)

  const springConfig = { damping: 15, elasticity: 0.1, stiffness: 150 }
  const refX = useSpring(x, springConfig)
  const refY = useSpring(y, springConfig)

  const handleMouseMove = (e) => {
    if (!buttonRef.current) return
    const rect = buttonRef.current.getBoundingClientRect()
    const width = rect.width
    const height = rect.height
    // Get mouse position relative to center of the button
    const mouseX = e.clientX - rect.left - width / 2
    const mouseY = e.clientY - rect.top - height / 2

    // Pull intensity factor (slightly follows cursor)
    const pullFactor = 0.22 
    x.set(mouseX * pullFactor)
    y.set(mouseY * pullFactor)
  }

  const handleMouseLeave = () => {
    x.set(0)
    y.set(0)
  }

  const handleClick = (e) => {
    if (!buttonRef.current) return
    const rect = buttonRef.current.getBoundingClientRect()
    const xPos = e.clientX - rect.left
    const yPos = e.clientY - rect.top

    // Create unique ripple
    const newRipple = {
      id: Date.now() + Math.random(),
      x: xPos,
      y: yPos
    }

    setRipples((prev) => [...prev, newRipple])
    
    // Glow pulses once on click
    setIsClickGlow(true)
    setTimeout(() => setIsClickGlow(false), 600)

    if (onClick) {
      onClick(e)
    }
  }

  // Clean up ripples
  useEffect(() => {
    if (ripples.length === 0) return
    const timer = setTimeout(() => {
      setRipples((prev) => prev.slice(1))
    }, 850)
    return () => clearTimeout(timer)
  }, [ripples])

  return (
    <motion.button
      ref={buttonRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      style={{ x: refX, y: refY }}
      className={`premium-cta-btn ${isClickGlow ? 'pulse-glow' : ''} ${className}`}
      whileHover={{ scale: 1.03, y: -4 }}
      whileTap={{ scale: 0.97 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
    >
      {/* Background animated gradient */}
      <span className="premium-cta-btn__bg" />
      
      {/* Moving shine effect */}
      <span className="premium-cta-btn__shine" />
      
      {/* Inner glassmorphism border & reflection */}
      <span className="premium-cta-btn__border" />
      
      {/* Label and Arrow */}
      <span className="premium-cta-btn__content">
        <span className="premium-cta-btn__label">{children}</span>
        <ArrowRight size={18} className="premium-cta-btn__icon" />
      </span>

      {/* Glow shadow backplane */}
      <span className="premium-cta-btn__glow" />

      {/* Ripple elements */}
      {ripples.map((ripple) => (
        <span
          key={ripple.id}
          className="premium-cta-btn__ripple"
          style={{
            left: ripple.x,
            top: ripple.y
          }}
        />
      ))}
    </motion.button>
  )
}
