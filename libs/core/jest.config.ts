export default {
  displayName: 'dismissible',
  preset: '../../jest.preset.js',
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.json' }],
  },
  transformIgnorePatterns: ['node_modules/(?!(nest-typed-config|uuid)/)'],
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageDirectory: '../../coverage/libs/core',
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.spec.ts',
    '!src/**/*.interface.ts',
    '!src/**/*.dto.ts',
    '!src/**/*.enum.ts',
    '!src/**/index.ts',
    '!src/**/*.module.ts',
  ],
  coverageReporters: ['text', 'text-summary', 'html'],
  coverageThreshold: {
    global: {
      branches: 81,
      functions: 84,
      lines: 92,
      statements: 92,
    },
  },
};
