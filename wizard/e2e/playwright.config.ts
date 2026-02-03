import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'specs',
  timeout: 120000,
  expect: {
    timeout: 5000,
  },
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: [
    ['list'],
    [
      'html',
      {
        outputFolder: 'test-results/playwright',
        open: 'never',
      },
    ],
  ],
  use: {
    baseURL: 'http://localhost:3002',
    actionTimeout: 10000,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    browserName: 'chromium',
    ...devices['Desktop Chrome'],
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
      },
    },
  ],
  tsconfig: '../tsconfig.e2e.json',
  webServer: {
    command: 'NX_DAEMON=false npx nx preview wizard --configuration=production --port=3002',
    url: 'http://localhost:3002',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
    cwd: '../..',
  },
});
