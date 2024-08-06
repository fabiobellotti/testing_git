import { devices, PlaywrightTestConfig } from '@playwright/test'
import { config as dotenvConfig } from 'dotenv'
dotenvConfig()

let maxFailures: number | undefined
if (process.env.TESTS_MAX_FAILURES !== undefined) {
  maxFailures = parseInt(process.env.TESTS_MAX_FAILURES)
}

const config: PlaywrightTestConfig = {
  projects: [
    {
      name: 'QMS',
      use: {
        permissions: ['clipboard-read', 'clipboard-write'],
        ...devices['Desktop Chrome'],
        screenshot: 'only-on-failure',
        viewport: {
          width: 1440,
          height: 900
        },
        trace: {
          mode: 'retain-on-failure',
          snapshots: true,
          screenshots: true,
          sources: true
        }
      }
    }
  ],
  fullyParallel: false,
  retries: 1,
  timeout: 60000,
  maxFailures,
  reporter: [
    ['list'],
    ['html'],
    [
      'allure-playwright',
      {
        detail: false,
        suiteTitle: false
      }
    ]
  ]
}
export default config
