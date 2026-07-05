import { AlertTriangle, RefreshCw } from 'lucide-react'
import Button from './Button'
import './EmptyState.css'

export default function ErrorState({
  title = 'Something went wrong',
  message = 'An error occurred while loading data.',
  onRetry,
  className,
}) {
  return (
    <div className={`empty-state ${className || ''}`}>
      <div className="empty-state__icon" style={{ background: 'var(--error-bg)' }}>
        <AlertTriangle size={40} style={{ color: 'var(--error)' }} />
      </div>
      <h3 className="empty-state__title">{title}</h3>
      <p className="empty-state__desc">{message}</p>
      {onRetry && (
        <Button variant="secondary" size="md" icon={RefreshCw} onClick={onRetry}>
          Try Again
        </Button>
      )}
    </div>
  )
}
