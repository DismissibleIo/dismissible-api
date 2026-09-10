import { FlatCompat } from '@eslint/eslintrc';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import js from '@eslint/js';
import nx from '@nx/eslint-plugin';
import eslintPluginPrettier from 'eslint-plugin-prettier';

const compat = new FlatCompat({
  baseDirectory: dirname(fileURLToPath(import.meta.url)),
  recommendedConfig: js.configs.recommended,
});

export default [
  ...nx.configs['flat/base'],
  { plugins: { prettier: eslintPluginPrettier } },
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    rules: {
      '@nx/enforce-module-boundaries': [
        'error',
        {
          enforceBuildableLibDependency: true,
          allow: [],
          depConstraints: [
            {
              sourceTag: '*',
              onlyDependOnLibsWithTags: ['*'],
            },
          ],
        },
      ],
    },
  },
  ...nx.configs['flat/typescript'],
  ...compat
    .config({
      extends: ['plugin:prettier/recommended'],
    })
    .map((config) => ({
      ...config,
      files: ['**/*.ts', '**/*.tsx'],
      rules: {
        ...config.rules,
        'prettier/prettier': 'error',
        '@typescript-eslint/explicit-function-return-type': 'off',
        '@typescript-eslint/explicit-module-boundary-types': 'off',
        '@typescript-eslint/no-explicit-any': 'warn',
        '@typescript-eslint/no-unused-vars': [
          'error',
          {
            argsIgnorePattern: '^_',
            varsIgnorePattern: '^_',
          },
        ],
      },
    })),
  ...nx.configs['flat/javascript'],
  ...compat
    .config({
      extends: ['plugin:prettier/recommended'],
    })
    .map((config) => ({
      ...config,
      files: ['**/*.js', '**/*.jsx'],
      rules: {
        ...config.rules,
        'prettier/prettier': 'error',
      },
    })),
  {
    ignores: ['dist', 'tmp', 'coverage', '**/*.js.map'],
  },
];
