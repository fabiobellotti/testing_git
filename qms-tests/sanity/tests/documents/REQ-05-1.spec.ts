import { test } from '@playwright/test'
import { attachScreenshot, generateId, HomepageURI, PlatformSetting, PlatformURI } from '../utils'
import { allure } from 'allure-playwright'
import { DocumentContentPage } from '../model/documents/document-content-page'
import { LeftSideMenuPage } from '../model/left-side-menu-page'

import { faker } from '@faker-js/faker'
import { createTemplateStep, prepareDocumentStep } from './common-documents-steps'
import { DocumentStatus, NewDocument, NewTemplate } from '../model/types'

test.use({
  storageState: PlatformSetting
})

test.describe('ISO 13485, 4.2.4 Control of documents', () => {
  test.beforeEach(async ({ page }) => {
    await (await page.goto(`${PlatformURI}/${HomepageURI}`))?.finished()
  })

  test.afterEach(async ({ browser }) => {
    const contexts = browser.contexts()
    for (const context of contexts) {
      await context.close()
    }
  })

  test('TESTS-382. Create new a new Effective Template with category External', async ({ page }) => {
    await allure.description('Requirement\nUsers need to create a new template')
    await allure.tms('TESTS-382', 'https://tracex.hc.engineering/workbench/platform/tracker/TESTS-382')

    const leftSideMenuPage = new LeftSideMenuPage(page)
    const category = faker.word.words(2)
    const description = faker.lorem.sentence(1)
    const code = faker.word.words(2)
    const title = faker.word.words(2)

    const newTemplate: NewTemplate = {
      location: {
        space: 'Quality documents',
        parent: 'Quality documents'
      },
      title,
      description,
      code,
      category,
      reason: 'Test reason',
      reviewers: ['Appleseed John'],
      approvers: ['Appleseed John']
    }

    await leftSideMenuPage.clickButtonOnTheLeft('Documents')
    await test.step('2. Create a new category', async () => {
      const documentContentPage = new DocumentContentPage(page)
      await documentContentPage.selectControlDocumentSubcategory('Categories')
      await documentContentPage.clickOnAddCategoryButton()
      await documentContentPage.fillCategoryForm(category, description, code)
      await documentContentPage.expectCategoryCreated(category, code)
    })
    await test.step('3. Create a new template', async () => {
      const documentContentPage = new DocumentContentPage(page)
      await documentContentPage.clickNewDocumentArrow()
      await documentContentPage.clickNewTemplate()
      await createTemplateStep(page, title, description, category)
    })
    await test.step('4. Check document information', async () => {
      const documentContentPage = new DocumentContentPage(page)
      await documentContentPage.checkDocumentTitle(newTemplate.title)
      await documentContentPage.checkDocument({
        type: 'N/A',
        category: newTemplate.category ?? '',
        version: 'v0.1',
        status: DocumentStatus.DRAFT,
        owner: 'Appleseed John',
        author: 'Appleseed John'
      })
    })
    await test.step('5. Check if templates exists in template category', async () => {
      const documentContentPage = new DocumentContentPage(page)
      await documentContentPage.selectControlDocumentSubcategory('Templates')
      await documentContentPage.chooseFilter(code)
      await documentContentPage.checkIfFilterIsApplied(title)
    })
    await attachScreenshot('TESTS-382_Template_created.png', page)
  })

  test('TESTS-338. Negative: as a space Member only,  I cannot be assigned as an approver to any document of this space', async ({
    page
  }) => {
    await allure.description(
      'Requirement\nUser is a space member and cannot be assigned as an approver to any document of this space'
    )
    await allure.tms('TESTS-338', 'https://tracex.hc.engineering/workbench/platform/tracker/TESTS-338')
    const completeDocument: NewDocument = {
      template: 'HR (HR)',
      title: `Complete document-${generateId()}`,
      description: `Complete document description-${generateId()}`
    }
    const leftSideMenuPage = new LeftSideMenuPage(page)

    await leftSideMenuPage.clickButtonOnTheLeft('Documents')
    await test.step('2. Add a member to space', async () => {
      const documentContentPage = new DocumentContentPage(page)
      await documentContentPage.addMemberToQualityDocument()
    })
    await test.step('3. Check if the member exists in approve list', async () => {
      await prepareDocumentStep(page, completeDocument)

      const documentContentPage = new DocumentContentPage(page)
      await documentContentPage.clickSendForApproval()
      await documentContentPage.clickAddMember()
      await documentContentPage.checkIfMemberDropdownHasMember('Cain Velasquez', false)
    })
    await attachScreenshot('TESTS-338_Member_not_in_the_list.png', page)
  })
})
