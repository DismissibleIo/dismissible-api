import { CheckIcon } from '@heroicons/react/24/solid';

interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
  steps: string[];
}

function getStepStatus(index: number, currentStep: number): string {
  if (index < currentStep) return 'completed';
  if (index === currentStep) return 'current';
  return 'upcoming';
}

export function StepIndicator({ currentStep, totalSteps, steps }: StepIndicatorProps) {
  return (
    <nav className="mb-8" aria-label="Progress">
      {/* Mobile: Simple text indicator */}
      <div
        className="text-sm text-white/70 text-center font-medium md:hidden"
        aria-live="polite"
        aria-atomic="true"
      >
        Step {currentStep + 1} of {totalSteps}:{' '}
        <span className="text-primary-400 font-semibold">{steps[currentStep]}</span>
      </div>

      {/* Desktop: Full stepper */}
      <div className="hidden md:block">
        <div
          className="text-sm text-white/70 mb-6 text-center font-medium"
          aria-live="polite"
          aria-atomic="true"
        >
          Step {currentStep + 1} of {totalSteps}
        </div>
        <ol className="flex items-center" role="list">
          {steps.map((step, index) => {
            const status = getStepStatus(index, currentStep);
            return (
              <li key={step} className="flex items-center" style={{ flex: '1 1 0%' }}>
                <div className="flex flex-col items-center w-full">
                  <div
                    className={`w-11 h-11 rounded-full flex items-center justify-center border-2 transition-all duration-200 ${
                      status === 'completed'
                        ? 'bg-primary-600 border-primary-600 shadow-lg shadow-primary-600/30'
                        : status === 'current'
                          ? 'border-primary-500 text-primary-500 bg-white/5 shadow-lg shadow-primary-500/20'
                          : 'border-white/10 text-white/50 bg-white/5'
                    }`}
                    aria-current={status === 'current' ? 'step' : undefined}
                    aria-label={`Step ${index + 1}: ${step}, ${status}`}
                  >
                    {status === 'completed' ? (
                      <CheckIcon className="w-6 h-6 text-white" aria-hidden="true" />
                    ) : (
                      <span className="text-sm font-bold" aria-hidden="true">
                        {index + 1}
                      </span>
                    )}
                  </div>
                  <div
                    className={`mt-2 text-xs text-center transition-colors ${
                      status === 'current'
                        ? 'text-primary-400 font-semibold'
                        : status === 'completed'
                          ? 'text-white/90'
                          : 'text-white/50'
                    }`}
                    aria-hidden="true"
                  >
                    {step}
                  </div>
                </div>
                {index < totalSteps - 1 && (
                  <div
                    className={`h-0.5 transition-colors duration-200 flex-1 ${
                      index < currentStep ? 'bg-primary-600' : 'bg-white/10'
                    }`}
                    aria-hidden="true"
                    style={{ marginTop: '-2rem' }}
                  />
                )}
              </li>
            );
          })}
        </ol>
      </div>
    </nav>
  );
}
