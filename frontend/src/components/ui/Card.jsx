import { cn } from '../../utils/helpers'
import './Card.css'

export default function Card({
  children,
  variant = 'default',
  hover = false,
  padding = 'md',
  className,
  ...props
}) {
  return (
    <div
      className={cn(
        'card',
        `card--${variant}`,
        `card--pad-${padding}`,
        hover && 'card--hover',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardHeader({ children, className, ...props }) {
  return (
    <div className={cn('card__header', className)} {...props}>
      {children}
    </div>
  )
}

export function CardTitle({ children, className, ...props }) {
  return (
    <h3 className={cn('card__title', className)} {...props}>
      {children}
    </h3>
  )
}

export function CardDescription({ children, className, ...props }) {
  return (
    <p className={cn('card__description', className)} {...props}>
      {children}
    </p>
  )
}

export function CardContent({ children, className, ...props }) {
  return (
    <div className={cn('card__content', className)} {...props}>
      {children}
    </div>
  )
}
