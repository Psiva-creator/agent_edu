import { cn } from '../../utils/helpers'
import './Skeleton.css'

export function Skeleton({ width, height, radius = 'md', className }) {
  return (
    <div
      className={cn('skeleton', className)}
      style={{
        width: width || '100%',
        height: height || '20px',
        borderRadius: `var(--radius-${radius})`,
      }}
    />
  )
}

export function SkeletonCard({ lines = 3, className }) {
  return (
    <div className={cn('skeleton-card', className)}>
      <Skeleton height="14px" width="40%" />
      <div style={{ marginTop: 'var(--space-3)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton key={i} height="12px" width={i === lines - 1 ? '60%' : '100%'} />
        ))}
      </div>
    </div>
  )
}

export function SkeletonDashboard() {
  return (
    <div className="skeleton-dashboard">
      <div className="skeleton-dashboard__header">
        <Skeleton height="28px" width="200px" />
        <Skeleton height="14px" width="120px" />
      </div>
      <div className="skeleton-dashboard__grid">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonCard key={i} lines={2} />
        ))}
      </div>
      <SkeletonCard lines={5} />
    </div>
  )
}
