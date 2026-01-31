import { useWizard, useConfigSection } from '../hooks/useWizardState';
import { NumberInput, SelectInput, ToggleInput } from '../components/forms';
import { HELP_TEXT } from '../config/constants';
import { StorageConfig } from '../config/schema';

/** Default storage configurations for each storage type */
const STORAGE_TYPE_DEFAULTS: Record<string, StorageConfig> = {
  postgres: { type: 'postgres', connectionString: '' },
  dynamodb: {
    type: 'dynamodb',
    tableName: 'dismissible-items',
    awsRegion: 'us-east-1',
  },
  memory: {
    type: 'memory',
    maxItems: 5000,
    ttlMs: 21600000,
  },
};

export function CoreStep() {
  const { dispatch } = useWizard();
  const { section: core, update: updateCore, getError } = useConfigSection('core');

  const handleStorageTypeChange = (value: string) => {
    const storageType = value as 'postgres' | 'dynamodb' | 'memory';
    const newStorage = STORAGE_TYPE_DEFAULTS[storageType] || STORAGE_TYPE_DEFAULTS.memory;
    
    dispatch({
      type: 'UPDATE_CONFIG',
      payload: {
        core: {
          ...core,
          storageType,
        },
        storage: newStorage,
      },
    });
  };

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

      <SelectInput
        label="Storage Type"
        value={core.storageType}
        onChange={handleStorageTypeChange}
        options={[
          { value: 'memory', label: 'Memory (Development)' },
          { value: 'postgres', label: 'PostgreSQL' },
          { value: 'dynamodb', label: 'DynamoDB' },
        ]}
        helpText={HELP_TEXT.storageType}
        required
        error={getError('storageType')}
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
