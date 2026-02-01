import { useConfigSection } from '../hooks/useWizardState';
import { NumberInput, ToggleInput } from '../components/forms';
import { HELP_TEXT } from '../config/constants';

export function CoreStep() {
  const { section: core, update: updateCore, getError } = useConfigSection('core');

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-2">Core Settings</h2>
      <p className="text-gray-400 mb-8">Configure the basic settings for your Dismissible API.</p>

      <NumberInput
        label="Port"
        value={core.port}
        onChange={(value) => updateCore({ port: value })}
        helpText={HELP_TEXT.port}
        min={1}
        max={65535}
        required
        error={getError('port')}
      />

      <ToggleInput
        label="Run Migration on Startup"
        value={core.storageRunSetup}
        onChange={(value) => updateCore({ storageRunSetup: value })}
        helpText={HELP_TEXT.storageRunSetup}
      />
    </div>
  );
}
