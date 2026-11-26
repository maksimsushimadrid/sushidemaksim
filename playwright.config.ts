import { defineConfig, devices } from '@playwright/test';

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
    testDir: './tests',
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 1 : 0,
    workers: process.env.CI ? 2 : undefined,
    reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'html',
    timeout: 30_000,
    use: {
        baseURL: 'http://localhost:5173',
        trace: 'retain-on-failure',
        screenshot: 'only-on-failure',
    },

    /* Configure projects for major browsers */
    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
        {
            name: 'webkit',
            use: { ...devices['Desktop Safari'] },
        },
    ],

    /* Run your local dev server before starting the tests */
    webServer: [
        {
            command: process.env.CI
                ? 'NODE_ENV=production npm run preview -- --port 5173 --host 0.0.0.0'
                : 'npm run dev:client',
            url: 'http://localhost:5173',
            reuseExistingServer: !process.env.CI,
            timeout: 180_000,
            stdout: 'pipe',
            stderr: 'pipe',
        },
        {
            command: process.env.CI
                ? 'cd server && NODE_ENV=production npm run start'
                : 'npm run dev:server',
            url: 'http://localhost:3001/api/health',
            reuseExistingServer: !process.env.CI,
            timeout: 180_000,
            stdout: 'pipe',
            stderr: 'pipe',
        },
    ],
});
