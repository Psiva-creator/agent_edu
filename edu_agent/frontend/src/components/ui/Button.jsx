import { forwardRef } from 'react'
import { cn } from '../../utils/helpers'
import './Button.css'

const Button = forwardRef(({
  children,
  variant = 'primary',
  size = 'md',
  icon: Icon,
  iconRight: IconRight,
  loading = false,
  disabled = false,
  fullWidth = false,
  className,
  ...props
}, ref) => {
  return (
    <button
      ref={ref}
      className={cn(
        'btn',
        `btn--${variant}`,
        `btn--${size}`,
        fullWidth && 'btn--full',
        loading && 'btn--loading',
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <span className="btn__spinner" />}
      {!loading && Icon && <Icon size={size === 'sm' ? 14 : 16} />}
      {children && <span className="btn__label">{children}</span>}
      {!loading && IconRight && <IconRight size={size === 'sm' ? 14 : 16} />}
    </button>
  )
})

Button.displayName = 'Button'
export default Button
