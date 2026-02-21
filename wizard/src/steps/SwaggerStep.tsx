import { useConfigSection } from '../hooks/useWizardState';
import { ToggleInput, TextInput } from '../components/forms';
import { HELP_TEXT } from '../config/constants';

export function SwaggerStep() {
  const { section: swagger, update: updateSwagger, getError } = useConfigSection('swagger');

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-2">Swagger Documentation</h2>
      <p className="text-gray-400 mb-8">Enable Swagger/OpenAPI documentation for your API.</p>

      <ToggleInput
        label="Enable Swagger"
        value={swagger.enabled}
        onChange={(value) => updateSwagger({ enabled: value })}
        helpText={HELP_TEXT.swaggerEnabled}
        testId="swagger-enabled-toggle"
      />

      {swagger.enabled && (
        <TextInput
          label="Swagger Path"
          value={swagger.path}
          onChange={(value) => updateSwagger({ path: value })}
          helpText={HELP_TEXT.swaggerPath}
          placeholder="docs"
          required
          error={getError('path')}
          testId="swagger-path-input"
        />
      )}

      {swagger.enabled && (
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-sm text-blue-800">
            Swagger documentation will be available at:
            <br />
            <code className="font-mono">/{swagger.path}</code> (HTML)
            <br />
            <code className="font-mono">/{swagger.path}-json</code> (JSON)
            <br />
            <code className="font-mono">/{swagger.path}-yaml</code> (YAML)
          </p>
        </div>
      )}
    </div>
  );
}
