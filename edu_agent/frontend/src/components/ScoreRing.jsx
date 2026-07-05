import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

function ScoreRing({ score = 0, size = 140, strokeWidth = 8, label = 'Career Match' }) {
  const [animatedScore, setAnimatedScore] = useState(0)
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (animatedScore / 100) * circumference

  useEffect(() => {
    let start = 0
    const step = score / 50
    const timer = setInterval(() => {
      start += step
      if (start >= score) {
        setAnimatedScore(score)
        clearInterval(timer)
      } else {
        setAnimatedScore(Math.round(start))
      }
    }, 20)
    return () => clearInterval(timer)
  }, [score])

  const getColor = () => {
    if (animatedScore >= 80) return { stroke: '#34d399', text: 'text-emerald-400', glow: 'rgba(52, 211, 153, 0.3)' }
    if (animatedScore >= 60) return { stroke: '#818cf8', text: 'text-accent-400', glow: 'rgba(129, 140, 248, 0.3)' }
    if (animatedScore >= 40) return { stroke: '#fbbf24', text: 'text-amber-400', glow: 'rgba(251, 191, 36, 0.3)' }
    return { stroke: '#fb7185', text: 'text-rose-400', glow: 'rgba(251, 113, 133, 0.3)' }
  }

  const color = getColor()

  return (
    <div className="flex flex-col items-center gap-4" role="img" aria-label={`${label}: ${animatedScore} out of 100`}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          className="-rotate-90"
          style={{ filter: `drop-shadow(0 0 12px ${color.glow})` }}
          aria-hidden="true"
        >
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="rgba(99, 102, 241, 0.08)"
            strokeWidth={strokeWidth}
          />
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color.stroke}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.2, ease: [0.4, 0, 0.2, 1] }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            className={`text-4xl font-bold ${color.text} font-display`}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3, type: 'spring' }}
          >
            {animatedScore}
          </motion.span>
          <span className="text-xs text-slate-500 -mt-0.5">/ 100</span>
        </div>
      </div>
      <span className="text-sm font-medium text-slate-400">{label}</span>
    </div>
  )
}

export default ScoreRing
