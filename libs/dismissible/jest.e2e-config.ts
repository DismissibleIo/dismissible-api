export default {
  displayName: 'dismissible-e2e',
  preset: '../../jest.preset.js',
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.json' }],
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageDirectory: '../../coverage/libs/dismissible-e2e',
  testMatch: ['**/*.e2e-spec.ts'],
  transformIgnorePatterns: ['node_modules/(?!(nest-typed-config|uuid)/)'],
  maxWorkers: 1,
};
