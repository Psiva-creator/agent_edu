import { forwardRef } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '../../utils/helpers'
import './Select.css'

const Select = forwardRef(({
  label,
  error,
  hint,
  options = [],
  placeholder = 'Select...',
  className,
  id,
  ...props
}, ref) => {
  const inputId = id || `select-${label?.toLowerCase().replace(/\s+/g, '-')}`

  return (
    <div className={cn('input-group', error && 'input-group--error', className)}>
      {label && (
        <label htmlFor={inputId} className="input-group__label">
          {label}
        </label>
      )}
      <div className="select-wrapper">
        <select
          ref={ref}
          id={inputId}
          className="select__input"
          {...props}
        >
          <option value="" disabled>{placeholder}</option>
          {options.map((opt) => (
            <option key={typeof opt === 'string' ? opt : opt.value} value={typeof opt === 'string' ? opt : opt.value}>
              {typeof opt === 'string' ? opt : opt.label}
            </option>
          ))}
        </select>
        <ChevronDown size={16} className="select__chevron" />
      </div>
      {error && <span className="input-group__error">{error}</span>}
      {hint && !error && <span className="input-group__hint">{hint}</span>}
    </div>
  )
})

Select.displayName = 'Select'
export default Select
