import { useConfigSection } from '../hooks/useWizardState';
import { ToggleInput, NumberInput, SelectInput, MultiSelectInput } from '../components/forms';
import { HELP_TEXT } from '../config/constants';

export function RateLimiterStep() {
  const {
    section: rateLimiter,
    update: updateRateLimiter,
    getError,
  } = useConfigSection('rateLimiter');

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-2">Rate Limiter</h2>
      <p className="text-gray-400 mb-8">
        Protect your API from abuse by limiting the number of requests.
      </p>

      <ToggleInput
        label="Enable Rate Limiting"
        value={rateLimiter.enabled}
        onChange={(value) => updateRateLimiter({ enabled: value })}
        helpText={HELP_TEXT.rateLimiterEnabled}
        testId="rate-limiter-enabled-toggle"
      />

      {rateLimiter.enabled && (
        <>
          <NumberInput
            label="Points (Requests)"
            value={rateLimiter.points}
            onChange={(value) => updateRateLimiter({ points: value })}
            helpText={HELP_TEXT.rateLimiterPoints}
            min={1}
            required
            error={getError('points')}
            testId="rate-limiter-points-input"
          />

          <NumberInput
            label="Duration (seconds)"
            value={rateLimiter.duration}
            onChange={(value) => updateRateLimiter({ duration: value })}
            helpText={HELP_TEXT.rateLimiterDuration}
            min={1}
            required
            error={getError('duration')}
            testId="rate-limiter-duration-input"
          />

          <NumberInput
            label="Block Duration (seconds)"
            value={rateLimiter.blockDuration}
            onChange={(value) => updateRateLimiter({ blockDuration: value })}
            helpText={HELP_TEXT.rateLimiterBlockDuration}
            min={0}
            required
            error={getError('blockDuration')}
            testId="rate-limiter-block-duration-input"
          />

          <MultiSelectInput
            label="Key Types"
            value={rateLimiter.keyType}
            onChange={(value) => updateRateLimiter({ keyType: value })}
            helpText={HELP_TEXT.rateLimiterKeyType}
            placeholder="ip,origin,referrer"
            required
            error={getError('keyType')}
            testId="rate-limiter-key-type-input"
          />

          <SelectInput
            label="Key Mode"
            value={rateLimiter.keyMode}
            onChange={(value) => updateRateLimiter({ keyMode: value as 'and' | 'or' | 'any' })}
            options={[
              { value: 'any', label: 'Any (block if ANY key exceeds limit)' },
              { value: 'and', label: 'And (combine all keys into one)' },
              { value: 'or', label: 'Or (use first available key)' },
            ]}
            helpText={HELP_TEXT.rateLimiterKeyMode}
            required
            error={getError('keyMode')}
            testId="rate-limiter-key-mode-select"
          />

          <MultiSelectInput
            label="Ignored Keys"
            value={rateLimiter.ignoredKeys || ''}
            onChange={(value) => updateRateLimiter({ ignoredKeys: value })}
            helpText={HELP_TEXT.rateLimiterIgnoredKeys}
            placeholder="localhost,192.168.1.1"
            testId="rate-limiter-ignored-keys-input"
          />

          <NumberInput
            label="Hook Priority"
            value={rateLimiter.priority}
            onChange={(value) => updateRateLimiter({ priority: value })}
            helpText={HELP_TEXT.rateLimiterPriority}
            required
            error={getError('priority')}
            testId="rate-limiter-priority-input"
          />
        </>
      )}
    </div>
  );
}
