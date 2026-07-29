export interface StepperItem {
  id: string
  label: string
}

interface StepperProps {
  steps: StepperItem[]
  currentStep: number
}

export function Stepper({ steps, currentStep }: StepperProps) {
  return (
    <nav aria-label="Form progress" className="mb-6">
      <ol className="flex items-center">
        {steps.map((step, index) => {
          const isActive = index === currentStep
          const isComplete = index < currentStep
          const isLast = index === steps.length - 1

          return (
            <li
              key={step.id}
              className={`flex items-center ${isLast ? '' : 'flex-1'}`}
              aria-current={isActive ? 'step' : undefined}
              aria-label={step.label}
            >
              <span
                title={step.label}
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition ${
                  isActive
                    ? 'bg-primary text-white shadow-sm shadow-primary/25'
                    : isComplete
                      ? 'bg-primary/15 text-primary'
                      : 'border border-line bg-white text-ink/40'
                }`}
              >
                {isComplete ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="h-4 w-4"
                    aria-hidden
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 0 1 0 1.414l-8 8a1 1 0 0 1-1.414 0l-4-4a1 1 0 1 1 1.414-1.414L8 12.586l7.293-7.293a1 1 0 0 1 1.414 0Z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  index + 1
                )}
              </span>
              {!isLast ? (
                <span
                  className={`mx-1.5 h-0.5 flex-1 rounded-full ${
                    isComplete ? 'bg-primary/35' : 'bg-line'
                  }`}
                />
              ) : null}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
