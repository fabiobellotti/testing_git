import { expect, test } from '@playwright/test'
import { generateId, PlatformSetting, PlatformURI } from '../utils'
import { LeftSideMenuPage } from '../model/left-side-menu-page'
import { IssuesDetailsPage } from '../model/tracker/issues-details-page'
import { NewIssue } from '../model/tracker/types'
import { prepareNewIssueWithOpenStep } from './common-steps'
import { PublicLinkPopup } from '../model/tracker/public-link-popup'


test.describe('Tracker public link issues tests', () => {
  test('Public link generate', async ({ browser }) => {
    const publicLinkIssue: NewIssue = {
      title: `Public link generate issue-${ generateId() }`,
      description: 'Public link generate issue'
    }

    let link: string
    await test.step('Get public link from popup', async () => {
      const newContext = await browser.newContext({ storageState: PlatformSetting })
      const page = await newContext.newPage()
      await (await page.goto(`${ PlatformURI }/workbench/sanity-ws`))?.finished()

      const leftSideMenuPage = new LeftSideMenuPage(page)
      await leftSideMenuPage.buttonTracker.click()
      await prepareNewIssueWithOpenStep(page, publicLinkIssue)

      const issuesDetailsPage = new IssuesDetailsPage(page)
      await issuesDetailsPage.moreActionOnIssue('Public link')

      const publicLinkPopup = new PublicLinkPopup(page)
      link = await publicLinkPopup.getPublicLink()
    })

    await test.step('Check guest access to the issue', async () => {
      const clearSession = await browser.newContext()
      await clearSession.clearCookies()
      await clearSession.clearPermissions()

      const clearPage = await clearSession.newPage()
      await clearPage.goto(link)

      const clearIssuesDetailsPage = new IssuesDetailsPage(clearPage)
      await clearIssuesDetailsPage.waitDetailsOpened(publicLinkIssue.title)
      await clearIssuesDetailsPage.checkIssue({
        ...publicLinkIssue,
        status: 'Backlog'
      })
      expect(clearPage.url()).toContain('guest')
    })
  })
})
