import { useWizard, useConfigSection } from '../hooks/useWizardState';
import { TextInput, NumberInput, PasswordInput, SelectInput, ToggleInput } from '../components/forms';
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

export function StorageStep() {
  const { dispatch } = useWizard();
  const { section: core, update: updateCore } = useConfigSection('core');
  const { section: storage, update: updateStorage, getError } = useConfigSection('storage');

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
      <h2 className="text-2xl font-bold text-white mb-2">Storage Configuration</h2>
      <p className="text-gray-400 mb-8">Configure your storage backend</p>

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

      {storage.type === 'postgres' && (
        <TextInput
          label="PostgreSQL Connection String"
          value={storage.connectionString}
          onChange={(value) => updateStorage({ connectionString: value })}
          helpText={HELP_TEXT.postgresConnectionString}
          placeholder="postgresql://user:password@host:5432/database"
          required
          error={getError('connectionString')}
        />
      )}

      {storage.type === 'dynamodb' && (
        <>
          <TextInput
            label="Table Name"
            value={storage.tableName}
            onChange={(value) => updateStorage({ tableName: value })}
            helpText={HELP_TEXT.dynamodbTableName}
            required
            error={getError('tableName')}
          />

          <TextInput
            label="AWS Region"
            value={storage.awsRegion}
            onChange={(value) => updateStorage({ awsRegion: value })}
            helpText={HELP_TEXT.dynamodbAwsRegion}
            placeholder="us-east-1"
            required
            error={getError('awsRegion')}
          />

          <TextInput
            label="AWS Access Key ID"
            value={storage.awsAccessKeyId || ''}
            onChange={(value) => updateStorage({ awsAccessKeyId: value })}
            helpText={HELP_TEXT.dynamodbAwsAccessKeyId}
            placeholder="Optional if using IAM roles"
          />

          <PasswordInput
            label="AWS Secret Access Key"
            value={storage.awsSecretAccessKey || ''}
            onChange={(value) => updateStorage({ awsSecretAccessKey: value })}
            helpText={HELP_TEXT.dynamodbAwsSecretAccessKey}
            placeholder="Optional if using IAM roles"
          />

          <TextInput
            label="AWS Session Token"
            value={storage.awsSessionToken || ''}
            onChange={(value) => updateStorage({ awsSessionToken: value })}
            helpText={HELP_TEXT.dynamodbAwsSessionToken}
            placeholder="Optional for temporary credentials"
          />

          <TextInput
            label="Endpoint"
            value={storage.endpoint || ''}
            onChange={(value) => updateStorage({ endpoint: value })}
            helpText={HELP_TEXT.dynamodbEndpoint}
            placeholder="For LocalStack or DynamoDB Local"
          />
        </>
      )}

      {storage.type === 'memory' && (
        <>
          <NumberInput
            label="Max Items"
            value={storage.maxItems}
            onChange={(value) => updateStorage({ maxItems: value })}
            helpText={HELP_TEXT.memoryStorageMaxItems}
            min={1}
            required
            error={getError('maxItems')}
          />

          <NumberInput
            label="TTL (milliseconds)"
            value={storage.ttlMs}
            onChange={(value) => updateStorage({ ttlMs: value })}
            helpText={HELP_TEXT.memoryStorageTtlMs}
            min={1}
            required
            error={getError('ttlMs')}
          />

          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-sm text-yellow-800">
              <strong>Warning:</strong> Memory storage is for development only. Data will be lost
              when the application restarts.
            </p>
          </div>
        </>
      )}

      <div className="mt-6 pt-6 border-t border-white/10">
        <ToggleInput
          label="Run Migration on Startup"
          value={core.storageRunSetup}
          onChange={(value) => updateCore({ storageRunSetup: value })}
          helpText={HELP_TEXT.storageRunSetup}
        />
      </div>
    </div>
  );
}
