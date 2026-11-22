import { defineConfig, devices } from '@playwright/test'
import { apiOrigin, frontendBaseUrl, gatewayPassword, gatewayUsername } from './e2e/environment'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  forbidOnly: Boolean(process.env.CI),
  timeout: 45_000,
  expect: { timeout: 15_000 },
  reporter: 'list',
  use: {
    baseURL: frontendBaseUrl,
    ignoreHTTPSErrors: false,
    trace: 'off',
    screenshot: 'off',
    video: 'off',
    httpCredentials: gatewayUsername && gatewayPassword
      ? { username: gatewayUsername, password: gatewayPassword, origin: apiOrigin }
      : undefined,
  },
  projects: [{
    name: 'chromium',
    use: {
      ...devices['Desktop Chrome'],
      channel: process.env.E2E_BROWSER_CHANNEL || undefined,
    },
  }],
})
