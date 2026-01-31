import { useConfigSection } from '../hooks/useWizardState';
import { ToggleInput, TextInput, MultiSelectInput, NumberInput } from '../components/forms';
import { HELP_TEXT } from '../config/constants';

export function CorsStep() {
  const { section: cors, update: updateCors, getError } = useConfigSection('cors');

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-2">CORS Settings</h2>
      <p className="text-gray-400 mb-8">
        Configure Cross-Origin Resource Sharing for browser-based clients.
      </p>

      <ToggleInput
        label="Enable CORS"
        value={cors.enabled}
        onChange={(value) => updateCors({ enabled: value })}
        helpText={HELP_TEXT.corsEnabled}
      />

      {cors.enabled && (
        <>
          <MultiSelectInput
            label="Allowed Origins"
            value={cors.origins || ''}
            onChange={(value) => updateCors({ origins: value })}
            helpText={HELP_TEXT.corsOrigins}
            placeholder="https://example.com,https://app.example.com"
          />

          <TextInput
            label="Allowed Methods"
            value={cors.methods}
            onChange={(value) => updateCors({ methods: value })}
            helpText={HELP_TEXT.corsMethods}
            required
            error={getError('methods')}
          />

          <TextInput
            label="Allowed Headers"
            value={cors.allowedHeaders}
            onChange={(value) => updateCors({ allowedHeaders: value })}
            helpText={HELP_TEXT.corsAllowedHeaders}
            required
            error={getError('allowedHeaders')}
          />

          <ToggleInput
            label="Allow Credentials"
            value={cors.credentials}
            onChange={(value) => updateCors({ credentials: value })}
            helpText={HELP_TEXT.corsCredentials}
          />

          <NumberInput
            label="Max Age (seconds)"
            value={cors.maxAge}
            onChange={(value) => updateCors({ maxAge: value })}
            helpText={HELP_TEXT.corsMaxAge}
            min={0}
            required
            error={getError('maxAge')}
          />

          {cors.origins?.includes('*') && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-sm text-yellow-800">
                <strong>Warning:</strong> Using wildcard (*) for origins may expose your API to
                unauthorized cross-origin requests, especially when credentials are enabled.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
