import { useMemo } from 'react'

export default function RadarChart({ data, size = 300 }) {
  const center = size / 2
  const radius = center - 40
  const maxScore = 100

  // We need at least 3 points to make a polygon
  const safeData = data.length >= 3 ? data : [...data, ...Array.from({length: Math.max(0, 3 - data.length)}).map((_,i) => ({name: `Skill ${i}`, current_level: 0, target_level: 0}))]

  const points = useMemo(() => {
    return safeData.map((d, i) => {
      const angle = (Math.PI * 2 * i) / safeData.length - Math.PI / 2
      const currentRadius = (d.current_level / maxScore) * radius
      const targetRadius = (d.target_level / maxScore) * radius
      
      return {
        label: d.name,
        currentX: center + Math.cos(angle) * currentRadius,
        currentY: center + Math.sin(angle) * currentRadius,
        targetX: center + Math.cos(angle) * targetRadius,
        targetY: center + Math.sin(angle) * targetRadius,
        labelX: center + Math.cos(angle) * (radius + 20),
        labelY: center + Math.sin(angle) * (radius + 20),
        align: Math.cos(angle) > 0.1 ? 'start' : Math.cos(angle) < -0.1 ? 'end' : 'middle'
      }
    })
  }, [safeData, size])

  const currentPath = points.map(p => `${p.currentX},${p.currentY}`).join(' ')
  const targetPath = points.map(p => `${p.targetX},${p.targetY}`).join(' ')

  const gridLevels = [0.2, 0.4, 0.6, 0.8, 1.0]

  return (
    <svg width={size} height={size} style={{ overflow: 'visible' }}>
      {/* Background Grid */}
      {gridLevels.map((level, i) => {
        const r = radius * level
        const path = points.map((_, idx) => {
          const angle = (Math.PI * 2 * idx) / points.length - Math.PI / 2
          return `${center + Math.cos(angle) * r},${center + Math.sin(angle) * r}`
        }).join(' ')
        return <polygon key={i} points={path} fill="none" stroke="var(--border-default)" strokeWidth={1} strokeDasharray={i === gridLevels.length - 1 ? "0" : "4,4"} />
      })}

      {/* Axis Lines */}
      {points.map((p, i) => {
        const angle = (Math.PI * 2 * i) / points.length - Math.PI / 2
        return (
          <line key={`axis-${i}`} x1={center} y1={center} x2={center + Math.cos(angle) * radius} y2={center + Math.sin(angle) * radius} stroke="var(--border-default)" strokeWidth={1} />
        )
      })}

      {/* Target Area (Ideal) */}
      <polygon points={targetPath} fill="rgba(var(--success-rgb), 0.1)" stroke="var(--success)" strokeWidth={2} strokeDasharray="4,4" />

      {/* Current Area (Actual) */}
      <polygon points={currentPath} fill="rgba(var(--accent-primary-rgb), 0.25)" stroke="var(--accent-primary)" strokeWidth={2} />

      {/* Data Points */}
      {points.map((p, i) => (
        <g key={`pts-${i}`}>
          <circle cx={p.targetX} cy={p.targetY} r={3} fill="var(--success)" />
          <circle cx={p.currentX} cy={p.currentY} r={4} fill="var(--accent-primary)" />
        </g>
      ))}

      {/* Labels */}
      {points.map((p, i) => (
        <text 
          key={`lbl-${i}`} 
          x={p.labelX} 
          y={p.labelY} 
          textAnchor={p.align} 
          alignmentBaseline="middle" 
          fill="var(--text-secondary)" 
          fontSize="10px"
          fontWeight="bold"
        >
          {p.label}
        </text>
      ))}
    </svg>
  )
}
