import { Inbox } from 'lucide-react'
import Button from './Button'
import './EmptyState.css'

export default function EmptyState({
  icon: Icon = Inbox,
  title = 'No data yet',
  description = 'Get started by performing an action.',
  action,
  actionLabel = 'Get Started',
  className,
}) {
  return (
    <div className={`empty-state ${className || ''}`}>
      <div className="empty-state__icon">
        <Icon size={40} />
      </div>
      <h3 className="empty-state__title">{title}</h3>
      <p className="empty-state__desc">{description}</p>
      {action && (
        <Button variant="primary" size="md" onClick={action}>
          {actionLabel}
        </Button>
      )}
    </div>
  )
}
