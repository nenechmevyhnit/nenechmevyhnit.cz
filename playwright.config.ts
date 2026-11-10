import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  use: { baseURL: 'http://localhost:4321', trace: 'retain-on-failure' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    { command: 'npx serve dist-e2e -l 4321 --no-clipboard', port: 4321, reuseExistingServer: !process.env.CI },
    { command: 'npx serve dist-prazdny -l 4322 --no-clipboard', port: 4322, reuseExistingServer: !process.env.CI },
  ],
});
