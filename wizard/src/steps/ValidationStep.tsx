import { useConfigSection } from '../hooks/useWizardState';
import { ToggleInput } from '../components/forms';
import { HELP_TEXT } from '../config/constants';

export function ValidationStep() {
  const { section: validation, update: updateValidation } = useConfigSection('validation');

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-2">Validation Settings</h2>
      <p className="text-gray-400 mb-8">
        Configure how the API validates and handles incoming requests.
      </p>

      <ToggleInput
        label="Disable Error Messages"
        value={validation.disableErrorMessages}
        onChange={(value) => updateValidation({ disableErrorMessages: value })}
        helpText={HELP_TEXT.validationDisableErrorMessages}
      />

      <ToggleInput
        label="Whitelist Properties"
        value={validation.whitelist}
        onChange={(value) => updateValidation({ whitelist: value })}
        helpText={HELP_TEXT.validationWhitelist}
      />

      <ToggleInput
        label="Forbid Non-Whitelisted Properties"
        value={validation.forbidNonWhitelisted}
        onChange={(value) => updateValidation({ forbidNonWhitelisted: value })}
        helpText={HELP_TEXT.validationForbidNonWhitelisted}
      />

      <ToggleInput
        label="Transform Payloads"
        value={validation.transform}
        onChange={(value) => updateValidation({ transform: value })}
        helpText={HELP_TEXT.validationTransform}
      />

      <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
        <p className="text-sm text-blue-800">
          In production, all these settings should typically be enabled to prevent internal error
          messages from leaking and ensure strict validation.
        </p>
      </div>
    </div>
  );
}
