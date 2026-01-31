import { useMemo } from 'react';
import { WizardProvider, useWizard } from './hooks/useWizardState';
import { WizardShell } from './components/WizardShell';
import { hasStepErrors } from './utils/validateWizard';
import { parseShareUrl } from './utils/shareUrl';
import {
  CoreStep,
  StorageStep,
  CacheStep,
  SwaggerStep,
  JwtAuthStep,
  CorsStep,
  HelmetStep,
  ValidationStep,
  RateLimiterStep,
  ReviewStep,
} from './steps';

function WizardContent() {
  const { state } = useWizard();
  const stepHasErrors = hasStepErrors(state.currentStep, state.validation);

  const steps = [
    <CoreStep key="core" />,
    <StorageStep key="storage" />,
    <CacheStep key="cache" />,
    <SwaggerStep key="swagger" />,
    <JwtAuthStep key="jwt" />,
    <CorsStep key="cors" />,
    <HelmetStep key="helmet" />,
    <ValidationStep key="validation" />,
    <RateLimiterStep key="ratelimiter" />,
    <ReviewStep key="review" />,
  ];

  return <WizardShell canGoNext={!stepHasErrors}>{steps[state.currentStep]}</WizardShell>;
}

function App() {
  const initialConfig = useMemo(() => parseShareUrl(), []);
  return (
    <WizardProvider initialConfig={initialConfig}>
      <WizardContent />
    </WizardProvider>
  );
}

export default App;
