import { useConfigSection } from '../hooks/useWizardState';
import { ToggleInput, NumberInput } from '../components/forms';
import { HELP_TEXT } from '../config/constants';

export function HelmetStep() {
  const { section: helmet, update: updateHelmet } = useConfigSection('helmet');

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-2">Security Headers (Helmet)</h2>
      <p className="text-gray-400 mb-8">
        Configure security-related HTTP headers to protect against common vulnerabilities.
      </p>

      <ToggleInput
        label="Enable Helmet"
        value={helmet.enabled}
        onChange={(value) => updateHelmet({ enabled: value })}
        helpText={HELP_TEXT.helmetEnabled}
        testId="helmet-enabled-toggle"
      />

      {helmet.enabled && (
        <>
          <ToggleInput
            label="Content Security Policy"
            value={helmet.csp}
            onChange={(value) => updateHelmet({ csp: value })}
            helpText={HELP_TEXT.helmetCsp}
            testId="helmet-csp-toggle"
          />

          <ToggleInput
            label="Cross-Origin Embedder Policy"
            value={helmet.coep}
            onChange={(value) => updateHelmet({ coep: value })}
            helpText={HELP_TEXT.helmetCoep}
            testId="helmet-coep-toggle"
          />

          <NumberInput
            label="HSTS Max Age (seconds)"
            value={helmet.hstsMaxAge}
            onChange={(value) => updateHelmet({ hstsMaxAge: value })}
            helpText={HELP_TEXT.helmetHstsMaxAge}
            min={0}
            required
            testId="helmet-hsts-max-age-input"
          />

          <ToggleInput
            label="HSTS Include Subdomains"
            value={helmet.hstsIncludeSubdomains}
            onChange={(value) => updateHelmet({ hstsIncludeSubdomains: value })}
            helpText={HELP_TEXT.helmetHstsIncludeSubdomains}
            testId="helmet-hsts-include-subdomains-toggle"
          />

          <ToggleInput
            label="HSTS Preload"
            value={helmet.hstsPreload}
            onChange={(value) => updateHelmet({ hstsPreload: value })}
            helpText={HELP_TEXT.helmetHstsPreload}
            testId="helmet-hsts-preload-toggle"
          />
        </>
      )}

      <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
        <p className="text-sm text-blue-800">
          For most production deployments, keeping Helmet enabled is recommended to protect against
          XSS, clickjacking, and other attacks.
        </p>
      </div>
    </div>
  );
}
