import { useState, useCallback } from 'react';
import { useWizard } from '../hooks/useWizardState';
import { PencilIcon, LinkIcon, CheckIcon } from '@heroicons/react/24/outline';
import { OutputDisplay } from '../components/OutputDisplay';
import { buildShareUrl } from '../utils/shareUrl';

/** Step indices for navigation */
const STEP_INDICES = {
  CORE: 0,
  STORAGE: 1,
  CACHE: 2,
  SWAGGER: 3,
  JWT_AUTH: 4,
  CORS: 5,
  HELMET: 6,
  VALIDATION: 7,
  RATE_LIMITER: 8,
} as const;

export function ReviewStep() {
  const { state, dispatch } = useWizard();
  const { config } = state;
  const [copied, setCopied] = useState(false);

  const copyShareUrl = useCallback(async () => {
    const url = buildShareUrl(config);
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }, [config]);

  const editStep = useCallback(
    (step: number) => {
      dispatch({ type: 'GO_TO_STEP', payload: step });
    },
    [dispatch],
  );

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-2">Review Configuration</h2>
      <p className="text-gray-400 mb-8">
        Review your configuration before generating output files.
      </p>

      <div className="mb-6 p-6 rounded-2xl border border-white/10 bg-white/5 flex flex-wrap items-center gap-3">
        <span className="text-sm text-white/70">Share this configuration:</span>
        <button
          type="button"
          onClick={copyShareUrl}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold border border-white/10 bg-white/5 text-white/80 hover:border-white/20 hover:bg-white/10 hover:text-white transition-all duration-200"
        >
          {copied ? (
            <>
              <CheckIcon className="w-4 h-4" />
              Copied!
            </>
          ) : (
            <>
              <LinkIcon className="w-4 h-4" />
              Copy share URL
            </>
          )}
        </button>
      </div>

      <div className="space-y-6">
        {/* Core Settings */}
        <div className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_20px_60px_rgba(8,15,40,0.45)] transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_30px_80px_rgba(8,15,40,0.55)]">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h3 className="font-semibold text-white mb-3">Core Settings</h3>
              <dl className="text-sm space-y-2">
                <div className="flex">
                  <dt className="w-32 text-gray-400">Port:</dt>
                  <dd className="text-gray-200">{config.core.port}</dd>
                </div>
                <div className="flex">
                  <dt className="w-32 text-gray-400">Storage Type:</dt>
                  <dd className="text-gray-200">{config.core.storageType}</dd>
                </div>
                <div className="flex">
                  <dt className="w-32 text-gray-400">Run Setup:</dt>
                  <dd className="text-gray-200">{config.core.storageRunSetup ? 'Yes' : 'No'}</dd>
                </div>
              </dl>
            </div>
            <button
              onClick={() => editStep(STEP_INDICES.CORE)}
              className="ml-4 text-primary-500 hover:text-primary-400 transition-colors"
              aria-label="Edit Core Settings"
            >
              <PencilIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Storage */}
        <div className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_20px_60px_rgba(8,15,40,0.45)] transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_30px_80px_rgba(8,15,40,0.55)]">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h3 className="font-semibold text-white mb-3">Storage</h3>
              <dl className="text-sm space-y-2">
                <div className="flex">
                  <dt className="w-32 text-gray-400">Type:</dt>
                  <dd className="text-gray-200">{config.storage.type}</dd>
                </div>
                {config.storage.type === 'postgres' && (
                  <div className="flex">
                    <dt className="w-32 text-gray-400">Connection:</dt>
                    <dd className="text-gray-200 truncate">
                      {config.storage.connectionString ? '***' : 'Not set'}
                    </dd>
                  </div>
                )}
                {config.storage.type === 'dynamodb' && (
                  <>
                    <div className="flex">
                      <dt className="w-32 text-gray-400">Table Name:</dt>
                      <dd className="text-gray-200">{config.storage.tableName}</dd>
                    </div>
                    <div className="flex">
                      <dt className="w-32 text-gray-400">Region:</dt>
                      <dd className="text-gray-200">{config.storage.awsRegion}</dd>
                    </div>
                  </>
                )}
                {config.storage.type === 'memory' && (
                  <>
                    <div className="flex">
                      <dt className="w-32 text-gray-400">Max Items:</dt>
                      <dd className="text-gray-200">{config.storage.maxItems}</dd>
                    </div>
                    <div className="flex">
                      <dt className="w-32 text-gray-400">TTL:</dt>
                      <dd className="text-gray-200">{config.storage.ttlMs} ms</dd>
                    </div>
                  </>
                )}
              </dl>
            </div>
            <button
              onClick={() => editStep(STEP_INDICES.STORAGE)}
              className="ml-4 text-primary-500 hover:text-primary-400 transition-colors"
              aria-label="Edit Storage Settings"
            >
              <PencilIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Cache */}
        <div className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_20px_60px_rgba(8,15,40,0.45)] transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_30px_80px_rgba(8,15,40,0.55)]">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h3 className="font-semibold text-white mb-3">Cache</h3>
              <dl className="text-sm space-y-2">
                <div className="flex">
                  <dt className="w-32 text-gray-400">Type:</dt>
                  <dd className="text-gray-200">
                    {config.cache.type === 'none' ? 'No Cache' : config.cache.type}
                  </dd>
                </div>
              </dl>
            </div>
            <button
              onClick={() => editStep(STEP_INDICES.CACHE)}
              className="ml-4 text-primary-500 hover:text-primary-400 transition-colors"
              aria-label="Edit Cache Settings"
            >
              <PencilIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Swagger */}
        <div className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_20px_60px_rgba(8,15,40,0.45)] transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_30px_80px_rgba(8,15,40,0.55)]">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h3 className="font-semibold text-white mb-3">Swagger</h3>
              <dl className="text-sm space-y-2">
                <div className="flex">
                  <dt className="w-32 text-gray-400">Enabled:</dt>
                  <dd className="text-gray-200">{config.swagger.enabled ? 'Yes' : 'No'}</dd>
                </div>
                {config.swagger.enabled && (
                  <div className="flex">
                    <dt className="w-32 text-gray-400">Path:</dt>
                    <dd className="text-gray-200">/{config.swagger.path}</dd>
                  </div>
                )}
              </dl>
            </div>
            <button
              onClick={() => editStep(STEP_INDICES.SWAGGER)}
              className="ml-4 text-primary-500 hover:text-primary-400 transition-colors"
              aria-label="Edit Swagger Settings"
            >
              <PencilIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* JWT Auth */}
        <div className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_20px_60px_rgba(8,15,40,0.45)] transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_30px_80px_rgba(8,15,40,0.55)]">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h3 className="font-semibold text-white mb-3">JWT Authentication</h3>
              <dl className="text-sm space-y-2">
                <div className="flex">
                  <dt className="w-32 text-gray-400">Enabled:</dt>
                  <dd className="text-gray-200">{config.jwtAuth.enabled ? 'Yes' : 'No'}</dd>
                </div>
              </dl>
            </div>
            <button
              onClick={() => editStep(STEP_INDICES.JWT_AUTH)}
              className="ml-4 text-primary-500 hover:text-primary-400 transition-colors"
              aria-label="Edit JWT Auth Settings"
            >
              <PencilIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* CORS */}
        <div className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_20px_60px_rgba(8,15,40,0.45)] transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_30px_80px_rgba(8,15,40,0.55)]">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h3 className="font-semibold text-white mb-3">CORS</h3>
              <dl className="text-sm space-y-2">
                <div className="flex">
                  <dt className="w-32 text-gray-400">Enabled:</dt>
                  <dd className="text-gray-200">{config.cors.enabled ? 'Yes' : 'No'}</dd>
                </div>
              </dl>
            </div>
            <button
              onClick={() => editStep(STEP_INDICES.CORS)}
              className="ml-4 text-primary-500 hover:text-primary-400 transition-colors"
              aria-label="Edit CORS Settings"
            >
              <PencilIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Helmet */}
        <div className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_20px_60px_rgba(8,15,40,0.45)] transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_30px_80px_rgba(8,15,40,0.55)]">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h3 className="font-semibold text-white mb-3">Security Headers</h3>
              <dl className="text-sm space-y-2">
                <div className="flex">
                  <dt className="w-32 text-gray-400">Enabled:</dt>
                  <dd className="text-gray-200">{config.helmet.enabled ? 'Yes' : 'No'}</dd>
                </div>
              </dl>
            </div>
            <button
              onClick={() => editStep(STEP_INDICES.HELMET)}
              className="ml-4 text-primary-500 hover:text-primary-400 transition-colors"
              aria-label="Edit Security Headers Settings"
            >
              <PencilIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Validation */}
        <div className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_20px_60px_rgba(8,15,40,0.45)] transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_30px_80px_rgba(8,15,40,0.55)]">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h3 className="font-semibold text-white mb-3">Validation</h3>
              <dl className="text-sm space-y-2">
                <div className="flex">
                  <dt className="w-32 text-gray-400">Hide Errors:</dt>
                  <dd className="text-gray-200">
                    {config.validation.disableErrorMessages ? 'Yes' : 'No'}
                  </dd>
                </div>
              </dl>
            </div>
            <button
              onClick={() => editStep(STEP_INDICES.VALIDATION)}
              className="ml-4 text-primary-500 hover:text-primary-400 transition-colors"
              aria-label="Edit Validation Settings"
            >
              <PencilIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Rate Limiter */}
        <div className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_20px_60px_rgba(8,15,40,0.45)] transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_30px_80px_rgba(8,15,40,0.55)]">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h3 className="font-semibold text-white mb-3">Rate Limiter</h3>
              <dl className="text-sm space-y-2">
                <div className="flex">
                  <dt className="w-32 text-gray-400">Enabled:</dt>
                  <dd className="text-gray-200">{config.rateLimiter.enabled ? 'Yes' : 'No'}</dd>
                </div>
              </dl>
            </div>
            <button
              onClick={() => editStep(STEP_INDICES.RATE_LIMITER)}
              className="ml-4 text-primary-500 hover:text-primary-400 transition-colors"
              aria-label="Edit Rate Limiter Settings"
            >
              <PencilIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <OutputDisplay />
    </div>
  );
}
