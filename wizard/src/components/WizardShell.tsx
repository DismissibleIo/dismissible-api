import { ReactNode } from 'react';
import { useWizard } from '../hooks/useWizardState';
import { StepIndicator } from './StepIndicator';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/solid';

interface WizardShellProps {
  children: ReactNode;
  onNext?: () => boolean;
  onPrev?: () => void;
  canGoNext?: boolean;
  canGoPrev?: boolean;
  nextLabel?: string;
  prevLabel?: string;
}

const STEP_NAMES = [
  'Core',
  'Storage',
  'Cache',
  'Swagger',
  'Auth',
  'CORS',
  'Helmet',
  'Validation',
  'Rate',
  'Review',
];

export function WizardShell({
  children,
  onNext,
  onPrev,
  canGoNext = true,
  canGoPrev = true,
  nextLabel = 'Next',
  prevLabel = 'Back',
}: WizardShellProps) {
  const { state, dispatch } = useWizard();

  const handleNext = () => {
    if (onNext) {
      const valid = onNext();
      if (!valid) return;
    }
    dispatch({ type: 'NEXT_STEP' });
  };

  const handlePrev = () => {
    if (onPrev) {
      onPrev();
    }
    dispatch({ type: 'PREV_STEP' });
  };

  const isFirstStep = state.currentStep === 0;
  const isLastStep = state.currentStep === STEP_NAMES.length - 1;

  return (
    <div className="min-h-screen bg-[#05070f] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white">Dismissible API Configuration Wizard</h1>
          <p className="mt-3 text-lg text-white/70">Configure your Dismissible API with ease</p>
        </div>

        <div className="card p-6 md:p-8">
          <StepIndicator
            currentStep={state.currentStep}
            totalSteps={STEP_NAMES.length}
            steps={STEP_NAMES}
          />

          <div className="mt-8 mb-8">{children}</div>

          <div
            className="flex justify-between border-t border-white/10 pt-6"
            role="navigation"
            aria-label="Wizard navigation"
          >
            {!isLastStep && (
              <button
                type="button"
                onClick={handlePrev}
                disabled={!canGoPrev || isFirstStep}
                aria-label={`Go to previous step: ${STEP_NAMES[state.currentStep - 1] || 'None'}`}
                className="btn-secondary"
              >
                <ChevronLeftIcon className="w-5 h-5 mr-2" aria-hidden="true" />
                {prevLabel}
              </button>
            )}

            {isLastStep && (
              <button
                type="button"
                onClick={() => dispatch({ type: 'RESET' })}
                aria-label="Reset wizard and start over"
                className="btn-secondary"
              >
                Start Over
              </button>
            )}

            {!isLastStep && (
              <button
                type="button"
                onClick={handleNext}
                disabled={!canGoNext}
                aria-label={`Go to next step: ${STEP_NAMES[state.currentStep + 1] || 'Review'}`}
                className="btn-primary"
              >
                {nextLabel}
                <ChevronRightIcon className="w-5 h-5 ml-2" aria-hidden="true" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
