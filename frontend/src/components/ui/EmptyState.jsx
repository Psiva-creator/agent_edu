import { Inbox } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
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
  const navigate = useNavigate()

  const handleClick = () => {
    if (typeof action === 'function') {
      action()
    } else if (action && action.href) {
      navigate(action.href)
    } else if (action && action.onClick) {
      action.onClick()
    }
  }

  const label = (action && action.label) || actionLabel

  return (
    <div className={`empty-state ${className || ''}`}>
      <div className="empty-state__icon">
        <Icon size={40} />
      </div>
      <h3 className="empty-state__title">{title}</h3>
      <p className="empty-state__desc">{description}</p>
      {action && (
        <Button variant="primary" size="md" onClick={handleClick}>
          {label}
        </Button>
      )}
    </div>
  )
}

