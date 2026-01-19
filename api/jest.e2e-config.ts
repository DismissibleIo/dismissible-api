export default {
  displayName: 'api-e2e',
  preset: '../jest.preset.js',
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.e2e.json' }],
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageDirectory: '../coverage/api-e2e',
  testMatch: ['**/*.e2e-spec.ts'],
  transformIgnorePatterns: [
    'node_modules/(?!(nest-typed-config|uuid|mock-jwks|msw|@mswjs|until-async|@bundled-es-modules)/)',
  ],
  maxWorkers: 1,
};
