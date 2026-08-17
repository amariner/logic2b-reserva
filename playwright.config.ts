import { defineConfig, devices } from '@playwright/test';
import { existsSync } from 'node:fs';

const localChrome = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: 'http://127.0.0.1:8791',
    launchOptions: existsSync(localChrome) ? { executablePath: localChrome } : undefined,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'pnpm --filter @logic-reserva/worker exec wrangler dev --config wrangler.jsonc --ip 127.0.0.1 --port 8791 --inspector-port 9233',
    url: 'http://127.0.0.1:8791',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
