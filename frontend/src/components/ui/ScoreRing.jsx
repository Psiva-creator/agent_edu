import { useEffect, useRef, useState } from 'react'
import { getScoreColor } from '../../hooks/useCareerScore'
import './ScoreRing.css'

/**
 * Enhanced ScoreRing
 * ══════════════════
 * Premium animated circular score ring with:
 *  - Animated stroke-dashoffset (SVG arc)
 *  - Animated count-up number
 *  - Glow effect matching score color
 *  - Multi-color support: Red/Orange/Blue/Green by zone
 *  - Dual ring layers for depth
 *  - Pulse on mount
 */
export default function ScoreRing({
  score = 0,
  size = 180,
  strokeWidth = 14,
  label = 'Score',
  subLabel = '',
  showLabel = true,
  animated = true,
  className = '',
}) {
  const [displayScore, setDisplayScore] = useState(0)
  const [mounted, setMounted] = useState(false)
  const rafRef = useRef(null)

  const radius = (size - strokeWidth * 2) / 2
  const circumference = radius * 2 * Math.PI
  const color = getScoreColor(score)

  // ── Animate count-up ─────────────────────────────────────
  useEffect(() => {
    if (!animated) { setDisplayScore(score); return }

    const start = performance.now()
    const duration = 1400
    const startVal = 0
    const endVal = score

    const tick = (now) => {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplayScore(Math.round(startVal + (endVal - startVal) * eased))
      if (progress < 1) rafRef.current = requestAnimationFrame(tick)
    }

    // Small delay so ring animation starts first
    const delay = setTimeout(() => {
      rafRef.current = requestAnimationFrame(tick)
    }, 100)

    return () => {
      clearTimeout(delay)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [score, animated])

  // ── Trigger mount animation ───────────────────────────────
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50)
    return () => clearTimeout(t)
  }, [])

  const progress = mounted ? score : 0
  const offset = circumference - (progress / 100) * circumference

  // Glow color by zone
  const glowStyle = {
    filter: `drop-shadow(0 0 12px ${color}66) drop-shadow(0 0 24px ${color}33)`,
  }

  return (
    <div
      className={`score-ring score-ring--enhanced ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={glowStyle}
      >
        {/* Outer decorative ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius + strokeWidth * 0.7}
          fill="none"
          stroke={`${color}11`}
          strokeWidth={1.5}
        />

        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.05)"
          strokeWidth={strokeWidth}
        />

        {/* Inner shadow track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={`${color}15`}
          strokeWidth={strokeWidth + 4}
        />

        {/* Active progress arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{
            transition: mounted
              ? 'stroke-dashoffset 1.4s cubic-bezier(0.16, 1, 0.3, 1), stroke 0.5s ease'
              : 'none',
          }}
        />

        {/* Tip dot at end of arc */}
        {progress > 5 && (
          <circle
            cx={
              size / 2 +
              radius *
                Math.cos(
                  ((progress / 100) * 2 * Math.PI - Math.PI / 2)
                )
            }
            cy={
              size / 2 +
              radius *
                Math.sin(
                  ((progress / 100) * 2 * Math.PI - Math.PI / 2)
                )
            }
            r={strokeWidth / 2 + 1}
            fill={color}
            style={{ filter: `drop-shadow(0 0 6px ${color})` }}
          />
        )}
      </svg>

      {/* Center content */}
      <div className="score-ring__content">
        <span
          className="score-ring__value score-ring__value--enhanced"
          style={{ color }}
        >
          {displayScore}
        </span>
        {showLabel && (
          <span className="score-ring__label score-ring__label--enhanced">
            {label}
          </span>
        )}
        {subLabel && (
          <span className="score-ring__sublabel" style={{ color }}>
            {subLabel}
          </span>
        )}
      </div>
    </div>
  )
}
