import { expect, test } from '@playwright/test'
import { PlatformURI, PlatformUser } from './utils'

test.describe('login test', () => {
  test('check login', async ({ page }) => {
    page.on('pageerror', (exception) => {
      console.log('Uncaught exception:')
      console.log(exception.message)
    })

    // Create user and workspace
    await page.goto(`${PlatformURI}/login%3Acomponent%3ALoginApp/login`)

    const emaillocator = page.locator('[name=email]')
    await emaillocator.click()
    await emaillocator.fill(PlatformUser)

    const password = page.locator('[name=current-password]')
    await password.click()
    await password.fill('1234')

    const button = page.locator('button:has-text("Login")')
    expect(await button.isEnabled()).toBe(true)

    await button.click()

    await page.click('text=sanity-ws')
  })
})
