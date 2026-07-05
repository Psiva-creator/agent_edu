import { cn } from '../../utils/helpers'
import './Badge.css'

export default function Badge({
  children,
  variant = 'default',
  size = 'sm',
  icon: Icon,
  removable = false,
  onRemove,
  className,
  ...props
}) {
  return (
    <span
      className={cn('badge', `badge--${variant}`, `badge--${size}`, className)}
      {...props}
    >
      {Icon && <Icon size={12} />}
      {children}
      {removable && (
        <button
          className="badge__remove"
          onClick={(e) => { e.stopPropagation(); onRemove?.() }}
          aria-label={`Remove ${children}`}
        >
          ×
        </button>
      )}
    </span>
  )
}
