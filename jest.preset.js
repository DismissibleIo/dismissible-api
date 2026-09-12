const nxPreset = require('@nx/jest/preset').default;

module.exports = {
  ...nxPreset,
  // Keep CommonJS tests compatible with ESM-only Nest integrations and JWKS dependencies.
  transformIgnorePatterns: ['node_modules/(?!(@nestjs/axios|@nestjs/event-emitter|jose)/)'],
  collectCoverage: true,
  coverageReporters: ['text', 'text-summary', 'html'],
};
