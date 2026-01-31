import { useState, useCallback } from 'react';
import { useWizard } from '../hooks/useWizardState';
import { PencilIcon, LinkIcon, CheckIcon } from '@heroicons/react/24/outline';
import { OutputDisplay } from '../components/OutputDisplay';
import { buildShareUrl } from '../utils/shareUrl';

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

  const editStep = (step: number) => {
    dispatch({ type: 'SET_STEP', payload: step });
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-2">Review Configuration</h2>
      <p className="text-gray-400 mb-8">
        Review your configuration before generating output files.
      </p>

      <div className="mb-6 p-4 rounded-lg border border-dark-500 bg-dark-600 flex flex-wrap items-center gap-3">
        <span className="text-sm text-gray-400">Share this configuration:</span>
        <button
          type="button"
          onClick={copyShareUrl}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-primary-200 bg-dark-500 hover:bg-dark-500/80 border border-dark-400 transition-colors"
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

      <div className="space-y-3">
        {/* Core Settings */}
        <div className="border border-dark-500 rounded-lg p-4 bg-dark-600 hover:bg-dark-500 transition-colors">
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
              onClick={() => editStep(0)}
              className="ml-4 text-primary-500 hover:text-primary-400 transition-colors"
            >
              <PencilIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Storage */}
        <div className="border border-dark-500 rounded-lg p-4 bg-dark-600 hover:bg-dark-500 transition-colors">
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
              onClick={() => editStep(1)}
              className="ml-4 text-primary-500 hover:text-primary-400 transition-colors"
            >
              <PencilIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Cache */}
        <div className="border border-dark-500 rounded-lg p-4 bg-dark-600 hover:bg-dark-500 transition-colors">
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
              onClick={() => editStep(2)}
              className="ml-4 text-primary-500 hover:text-primary-400 transition-colors"
            >
              <PencilIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Swagger */}
        <div className="border border-dark-500 rounded-lg p-4 bg-dark-600 hover:bg-dark-500 transition-colors">
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
              onClick={() => editStep(3)}
              className="ml-4 text-primary-500 hover:text-primary-400 transition-colors"
            >
              <PencilIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* JWT Auth */}
        <div className="border border-dark-500 rounded-lg p-4 bg-dark-600 hover:bg-dark-500 transition-colors">
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
              onClick={() => editStep(4)}
              className="ml-4 text-primary-500 hover:text-primary-400 transition-colors"
            >
              <PencilIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* CORS */}
        <div className="border border-dark-500 rounded-lg p-4 bg-dark-600 hover:bg-dark-500 transition-colors">
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
              onClick={() => editStep(5)}
              className="ml-4 text-primary-500 hover:text-primary-400 transition-colors"
            >
              <PencilIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Helmet */}
        <div className="border border-dark-500 rounded-lg p-4 bg-dark-600 hover:bg-dark-500 transition-colors">
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
              onClick={() => editStep(6)}
              className="ml-4 text-primary-500 hover:text-primary-400 transition-colors"
            >
              <PencilIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Validation */}
        <div className="border border-dark-500 rounded-lg p-4 bg-dark-600 hover:bg-dark-500 transition-colors">
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
              onClick={() => editStep(7)}
              className="ml-4 text-primary-500 hover:text-primary-400 transition-colors"
            >
              <PencilIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Rate Limiter */}
        <div className="border border-dark-500 rounded-lg p-4 bg-dark-600 hover:bg-dark-500 transition-colors">
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
              onClick={() => editStep(8)}
              className="ml-4 text-primary-500 hover:text-primary-400 transition-colors"
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
