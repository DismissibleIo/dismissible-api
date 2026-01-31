import { useState, useCallback } from 'react';
import { Tab } from '@headlessui/react';
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { useWizard } from '../hooks/useWizardState';
import { generateEnvFile } from '../utils/envGenerator';
import { generateDockerCommand } from '../utils/dockerGenerator';
import { classNames } from '../utils/classNames';
import { CopyButton } from './CopyButton';

export function OutputDisplay() {
  const { state } = useWizard();
  const [includeDefaults, setIncludeDefaults] = useState(false);
  // Separate copied state for each button to avoid both showing "Copied!"
  const [copiedState, setCopiedState] = useState<{ env: boolean; docker: boolean }>({
    env: false,
    docker: false,
  });

  const envFile = generateEnvFile(state.config, { includeDefaults });
  const dockerCmd = generateDockerCommand(state.config);

  const copyToClipboard = useCallback(async (text: string, key: 'env' | 'docker') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedState((prev) => ({ ...prev, [key]: true }));
      setTimeout(() => setCopiedState((prev) => ({ ...prev, [key]: false })), 2000);
    } catch (err) {
      // Show user feedback on failure (could be enhanced with toast notification)
      console.error('Failed to copy to clipboard:', err);
    }
  }, []);

  const downloadEnvFile = () => {
    try {
      const blob = new Blob([envFile], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = '.env';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to download .env file:', err);
      // Could show user feedback here (toast notification, etc.)
    }
  };

  return (
    <div className="mt-8">
      <h3 className="text-xl font-bold text-white mb-6">Generated Configuration</h3>

      <div className="mb-6 flex gap-6">
        <label className="flex items-center cursor-pointer group">
          <input
            type="checkbox"
            checked={includeDefaults}
            onChange={(e) => setIncludeDefaults(e.target.checked)}
            className="rounded border-dark-400 bg-dark-600 text-primary-600 focus:ring-primary-500 focus:ring-offset-dark-700 transition-colors"
          />
          <span className="ml-3 text-sm text-gray-300 group-hover:text-gray-100 transition-colors">
            Include default values
          </span>
        </label>
      </div>

      <Tab.Group>
        <Tab.List className="flex space-x-2 rounded-xl bg-dark-600 p-1.5 border border-dark-500">
          <Tab
            className={({ selected }) =>
              classNames(
                'w-full rounded-lg py-2.5 text-sm font-medium leading-5 transition-all duration-200',
                'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-dark-700',
                selected
                  ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/30'
                  : 'text-gray-400 hover:bg-dark-500 hover:text-gray-200',
              )
            }
          >
            .env File
          </Tab>
          <Tab
            className={({ selected }) =>
              classNames(
                'w-full rounded-lg py-2.5 text-sm font-medium leading-5 transition-all duration-200',
                'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-dark-700',
                selected
                  ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/30'
                  : 'text-gray-400 hover:bg-dark-500 hover:text-gray-200',
              )
            }
          >
            Docker Run
          </Tab>
        </Tab.List>
        <Tab.Panels className="mt-4">
          <Tab.Panel className="rounded-xl bg-dark-600 border border-dark-500 p-4">
            <div className="flex justify-end gap-2 mb-3">
              <CopyButton
                onClick={() => copyToClipboard(envFile, 'env')}
                copied={copiedState.env}
                aria-label={copiedState.env ? 'Copied to clipboard' : 'Copy .env file to clipboard'}
              />
              <button
                onClick={downloadEnvFile}
                aria-label="Download .env file"
                className="inline-flex items-center px-4 py-2 border border-dark-400 text-xs font-medium rounded-lg text-gray-300 bg-dark-500 hover:bg-dark-400 hover:text-white transition-all"
              >
                <ArrowDownTrayIcon className="w-4 h-4 mr-2" aria-hidden="true" />
                Download
              </button>
            </div>
            <pre
              className="bg-dark-700 border border-dark-500 rounded-lg p-4 overflow-x-auto text-xs font-mono text-gray-300"
              aria-label="Generated .env file content"
              tabIndex={0}
            >
              {envFile}
            </pre>
          </Tab.Panel>
          <Tab.Panel className="rounded-xl bg-dark-600 border border-dark-500 p-4">
            <div className="flex justify-end gap-2 mb-3">
              <CopyButton
                onClick={() => copyToClipboard(dockerCmd, 'docker')}
                copied={copiedState.docker}
                aria-label={
                  copiedState.docker ? 'Copied to clipboard' : 'Copy Docker command to clipboard'
                }
              />
            </div>
            <pre
              className="bg-dark-700 border border-dark-500 rounded-lg p-4 overflow-x-auto text-xs font-mono text-gray-300"
              aria-label="Generated Docker command"
              tabIndex={0}
            >
              {dockerCmd}
            </pre>
          </Tab.Panel>
        </Tab.Panels>
      </Tab.Group>
    </div>
  );
}
