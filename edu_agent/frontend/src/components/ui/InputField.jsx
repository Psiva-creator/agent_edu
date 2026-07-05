
function InputField({
  id,
  label,
  icon: Icon,
  error,
  hint,
  required,
  className = '',
  ...props
}) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label htmlFor={id} className="form-label flex items-center gap-1.5">
          {Icon && <Icon className="w-3.5 h-3.5 text-accent-400/70" aria-hidden="true" />}
          {label}
          {required && <span className="text-rose-400" aria-hidden="true">*</span>}
        </label>
      )}
      <div className="relative">
        {Icon && !label && (
          <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" aria-hidden="true" />
        )}
        <input
          id={id}
          className={`form-input ${Icon && !label ? 'pl-10' : ''} ${error ? 'border-rose-500/50 focus:border-rose-400 focus:ring-rose-500/20' : ''}`}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
          required={required}
          {...props}
        />
      </div>
      {error && (
        <p id={`${id}-error`} className="text-xs text-rose-400 flex items-center gap-1" role="alert">
          {error}
        </p>
      )}
      {hint && !error && (
        <p id={`${id}-hint`} className="text-xs text-slate-500">{hint}</p>
      )}
    </div>
  )
}

export default InputField
