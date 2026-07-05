import { forwardRef } from 'react'
import { cn } from '../../utils/helpers'
import './Input.css'

const Input = forwardRef(({
  label,
  error,
  hint,
  icon: Icon,
  className,
  id,
  ...props
}, ref) => {
  const inputId = id || `input-${label?.toLowerCase().replace(/\s+/g, '-')}`

  return (
    <div className={cn('input-group', error && 'input-group--error', className)}>
      {label && (
        <label htmlFor={inputId} className="input-group__label">
          {label}
        </label>
      )}
      <div className="input-group__wrapper">
        {Icon && <Icon size={16} className="input-group__icon" />}
        <input
          ref={ref}
          id={inputId}
          className={cn('input-group__input', Icon && 'input-group__input--icon')}
          {...props}
        />
      </div>
      {error && <span className="input-group__error">{error}</span>}
      {hint && !error && <span className="input-group__hint">{hint}</span>}
    </div>
  )
})

Input.displayName = 'Input'
export default Input
