export default {
  displayName: 'core-e2e',
  preset: '../../jest.preset.js',
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.json' }],
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageDirectory: '../../coverage/libs/core-e2e',
  testMatch: ['**/*.e2e-spec.ts'],
  transformIgnorePatterns: ['node_modules/(?!(nest-typed-config|uuid)/)'],
  maxWorkers: 1,
};
