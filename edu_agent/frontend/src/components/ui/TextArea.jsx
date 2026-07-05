import { forwardRef } from 'react'
import { cn } from '../../utils/helpers'
import './Input.css'

const TextArea = forwardRef(({
  label,
  error,
  hint,
  className,
  id,
  rows = 4,
  ...props
}, ref) => {
  const inputId = id || `textarea-${label?.toLowerCase().replace(/\s+/g, '-')}`

  return (
    <div className={cn('input-group', error && 'input-group--error', className)}>
      {label && (
        <label htmlFor={inputId} className="input-group__label">
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        id={inputId}
        rows={rows}
        className="input-group__input input-group__textarea"
        {...props}
      />
      {error && <span className="input-group__error">{error}</span>}
      {hint && !error && <span className="input-group__hint">{hint}</span>}
    </div>
  )
})

TextArea.displayName = 'TextArea'
export default TextArea
