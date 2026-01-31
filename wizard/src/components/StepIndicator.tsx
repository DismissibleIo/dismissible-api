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
      <div
        className="text-sm text-gray-400 mb-6 text-center font-medium"
        aria-live="polite"
        aria-atomic="true"
      >
        Step {currentStep + 1} of {totalSteps}
      </div>
      <ol className="flex justify-between items-center" role="list">
        {steps.map((step, index) => {
          const status = getStepStatus(index, currentStep);
          return (
            <li key={step} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1">
                <div
                  className={`w-11 h-11 rounded-full flex items-center justify-center border-2 transition-all duration-200 ${
                    status === 'completed'
                      ? 'bg-primary-600 border-primary-600 shadow-lg shadow-primary-600/30'
                      : status === 'current'
                        ? 'border-primary-500 text-primary-500 bg-dark-600 shadow-lg shadow-primary-500/20'
                        : 'border-dark-500 text-gray-500 bg-dark-600'
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
                  className={`mt-2 text-xs text-center hidden md:block transition-colors ${
                    status === 'current'
                      ? 'text-primary-400 font-semibold'
                      : status === 'completed'
                        ? 'text-gray-300'
                        : 'text-gray-500'
                  }`}
                  aria-hidden="true"
                >
                  {step}
                </div>
              </div>
              {index < totalSteps - 1 && (
                <div
                  className={`flex-1 h-0.5 transition-colors duration-200 ${
                    index < currentStep ? 'bg-primary-600' : 'bg-dark-500'
                  }`}
                  aria-hidden="true"
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
