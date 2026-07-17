import { useMemo } from 'react'

// Shows Time Required (X) vs Market Demand (Y)
export default function HeatMap({ data, width = 300, height = 200 }) {
  const padding = 30
  const w = width - padding * 2
  const h = height - padding * 2

  const maxTime = Math.max(...data.map(d => d.time_required_hours), 40)
  const maxDemand = 100

  return (
    <svg width={width} height={height} style={{ overflow: 'visible', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-lg)' }}>
      {/* Grid */}
      <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="var(--border-default)" />
      <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="var(--border-default)" />

      {/* Labels */}
      <text x={padding - 10} y={padding} textAnchor="end" fill="var(--text-tertiary)" fontSize="10">High Demand</text>
      <text x={padding - 10} y={height - padding} textAnchor="end" fill="var(--text-tertiary)" fontSize="10">Low</text>
      <text x={padding} y={height - padding + 15} textAnchor="middle" fill="var(--text-tertiary)" fontSize="10">Fast</text>
      <text x={width - padding} y={height - padding + 15} textAnchor="middle" fill="var(--text-tertiary)" fontSize="10">{maxTime}h+</text>

      {/* Quadrant backgrounds */}
      <rect x={padding} y={padding} width={w/2} height={h/2} fill="rgba(var(--success-rgb), 0.05)" /> {/* High Demand, Fast */}
      <rect x={padding+w/2} y={padding} width={w/2} height={h/2} fill="rgba(var(--warning-rgb), 0.05)" /> {/* High Demand, Slow */}
      
      {/* Points */}
      {data.map((d, i) => {
        // x axis = time (inverted, so fast is left)
        const x = padding + (Math.min(d.time_required_hours, maxTime) / maxTime) * w
        // y axis = demand (inverted, high demand is top)
        const y = padding + (1 - d.market_demand / maxDemand) * h
        
        const isHot = d.market_demand >= 80 && d.time_required_hours <= 40
        const color = isHot ? 'var(--success)' : (d.market_demand >= 60 ? 'var(--accent-primary)' : 'var(--warning)')

        return (
          <g key={i} className="group cursor-pointer">
            <circle cx={x} cy={y} r={6} fill={color} opacity={0.8} />
            <text x={x} y={y - 12} textAnchor="middle" fill="var(--text-primary)" fontSize="10" fontWeight="bold">
              {d.name}
            </text>
          </g>
        )
      })}
    </svg>
  )
}
