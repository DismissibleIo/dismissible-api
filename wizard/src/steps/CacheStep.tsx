import { useWizard, useConfigSection } from '../hooks/useWizardState';
import { SelectInput, TextInput, NumberInput, ToggleInput } from '../components/forms';
import { HELP_TEXT } from '../config/constants';
import { CacheConfig } from '../config/schema';

/** Default configurations for each cache type */
const CACHE_TYPE_DEFAULTS: Record<string, CacheConfig> = {
  redis: {
    type: 'redis',
    url: '',
    keyPrefix: 'dismissible:cache:',
    ttlMs: 21600000,
    enableReadyCheck: true,
    maxRetries: 3,
    connectionTimeoutMs: 5000,
  },
  memory: {
    type: 'memory',
    maxItems: 5000,
    ttlMs: 21600000,
  },
  none: { type: 'none' },
};

export function CacheStep() {
  const { dispatch } = useWizard();
  const { section: cache, update: updateCache, getError } = useConfigSection('cache');

  const handleCacheTypeChange = (value: string) => {
    const newCache = CACHE_TYPE_DEFAULTS[value] || CACHE_TYPE_DEFAULTS.none;
    dispatch({
      type: 'UPDATE_CONFIG',
      payload: { cache: newCache },
    });
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-2">Cache Configuration</h2>
      <p className="text-gray-400 mb-8">Configure caching to improve API performance.</p>

      <SelectInput
        label="Cache Type"
        value={cache.type}
        onChange={handleCacheTypeChange}
        options={[
          { value: 'none', label: 'No Cache' },
          { value: 'memory', label: 'Memory Cache' },
          { value: 'redis', label: 'Redis Cache' },
        ]}
        helpText={HELP_TEXT.cacheType}
        required
        error={getError('type')}
        testId="cache-type-select"
      />

      {cache.type === 'redis' && (
        <>
          <TextInput
            label="Redis URL"
            value={cache.url}
            onChange={(value) => updateCache({ url: value })}
            helpText={HELP_TEXT.redisCacheUrl}
            placeholder="redis://localhost:6379"
            required
            error={getError('url')}
            testId="redis-url-input"
          />

          <TextInput
            label="Key Prefix"
            value={cache.keyPrefix}
            onChange={(value) => updateCache({ keyPrefix: value })}
            helpText={HELP_TEXT.redisCacheKeyPrefix}
            required
            error={getError('keyPrefix')}
            testId="redis-prefix-input"
          />

          <NumberInput
            label="TTL (milliseconds)"
            value={cache.ttlMs}
            onChange={(value) => updateCache({ ttlMs: value })}
            helpText={HELP_TEXT.redisCacheTtlMs}
            min={1}
            required
            error={getError('ttlMs')}
            testId="redis-ttl-input"
          />

          <ToggleInput
            label="Enable Ready Check"
            value={cache.enableReadyCheck}
            onChange={(value) => updateCache({ enableReadyCheck: value })}
            helpText={HELP_TEXT.redisCacheEnableReadyCheck}
            testId="redis-enable-ready-toggle"
          />

          <NumberInput
            label="Max Retries"
            value={cache.maxRetries}
            onChange={(value) => updateCache({ maxRetries: value })}
            helpText={HELP_TEXT.redisCacheMaxRetries}
            min={0}
            required
            error={getError('maxRetries')}
            testId="redis-max-retries-input"
          />

          <NumberInput
            label="Connection Timeout (milliseconds)"
            value={cache.connectionTimeoutMs}
            onChange={(value) => updateCache({ connectionTimeoutMs: value })}
            helpText={HELP_TEXT.redisCacheConnectionTimeoutMs}
            min={1}
            required
            error={getError('connectionTimeoutMs')}
            testId="redis-connection-timeout-input"
          />
        </>
      )}

      {cache.type === 'memory' && (
        <>
          <NumberInput
            label="Max Items"
            value={cache.maxItems}
            onChange={(value) => updateCache({ maxItems: value })}
            helpText={HELP_TEXT.memoryCacheMaxItems}
            min={1}
            required
            error={getError('maxItems')}
            testId="memory-cache-max-items-input"
          />

          <NumberInput
            label="TTL (milliseconds)"
            value={cache.ttlMs}
            onChange={(value) => updateCache({ ttlMs: value })}
            helpText={HELP_TEXT.memoryCacheTtlMs}
            min={1}
            required
            error={getError('ttlMs')}
            testId="memory-cache-ttl-input"
          />

          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-sm text-yellow-800">
              <strong>Warning:</strong> Memory cache is not shared across multiple instances. For
              production deployments, use Redis.
            </p>
          </div>
        </>
      )}

      {cache.type === 'none' && (
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-sm text-blue-800">
            No caching will be used. This is suitable for development but may impact performance in
            production.
          </p>
        </div>
      )}
    </div>
  );
}
