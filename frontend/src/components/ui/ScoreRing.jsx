import { getScoreColor } from '../../utils/helpers'
import './ScoreRing.css'

export default function ScoreRing({
  score = 0,
  size = 120,
  strokeWidth = 8,
  label = 'Score',
  showLabel = true,
  className,
}) {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (score / 100) * circumference
  const color = getScoreColor(score)

  return (
    <div className={`score-ring ${className || ''}`} style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--border-default)"
          strokeWidth={strokeWidth}
        />
        {/* Score arc */}
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
          style={{ transition: 'stroke-dashoffset 1s cubic-bezier(0.16, 1, 0.3, 1)' }}
        />
      </svg>
      <div className="score-ring__content">
        <span className="score-ring__value" style={{ color }}>{Math.round(score)}</span>
        {showLabel && <span className="score-ring__label">{label}</span>}
      </div>
    </div>
  )
}
