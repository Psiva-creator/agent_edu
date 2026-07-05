import { Check } from 'lucide-react'
import { cn } from '../../utils/helpers'
import './StepIndicator.css'

export default function StepIndicator({ steps, currentStep, className }) {
  return (
    <div className={cn('step-indicator', className)}>
      {steps.map((step, index) => {
        const isCompleted = index < currentStep
        const isActive = index === currentStep

        return (
          <div key={index} className="step-indicator__item">
            <div
              className={cn(
                'step-indicator__circle',
                isCompleted && 'step-indicator__circle--completed',
                isActive && 'step-indicator__circle--active'
              )}
            >
              {isCompleted ? <Check size={14} /> : <span>{index + 1}</span>}
            </div>
            <span
              className={cn(
                'step-indicator__label',
                (isCompleted || isActive) && 'step-indicator__label--active'
              )}
            >
              {step}
            </span>
            {index < steps.length - 1 && (
              <div
                className={cn(
                  'step-indicator__line',
                  isCompleted && 'step-indicator__line--completed'
                )}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
