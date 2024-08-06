import { faker } from '@faker-js/faker'
import { expect, test } from '@playwright/test'
import { ApiEndpoint } from '../API/Api'
import { ChannelPage } from '../model/channel-page'
import { ChunterPage } from '../model/chunter-page'
import { SignUpData } from '../model/common-types'
import { LeftSideMenuPage } from '../model/left-side-menu-page'
import { LoginPage } from '../model/login-page'
import { SelectWorkspacePage } from '../model/select-workspace-page'
import { SignInJoinPage } from '../model/signin-page'
import { PlatformURI, generateTestData } from '../utils'

test.describe('channel tests', () => {
  let leftSideMenuPage: LeftSideMenuPage
  let chunterPage: ChunterPage
  let channelPage: ChannelPage
  let loginPage: LoginPage
  let api: ApiEndpoint
  let newUser2: SignUpData
  let data: { workspaceName: string, userName: string, firstName: string, lastName: string, channelName: string }

  test.beforeEach(async ({ page, request }) => {
    data = generateTestData()
    newUser2 = {
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      email: faker.internet.email(),
      password: '1234'
    }

    leftSideMenuPage = new LeftSideMenuPage(page)
    chunterPage = new ChunterPage(page)
    channelPage = new ChannelPage(page)
    loginPage = new LoginPage(page)
    api = new ApiEndpoint(request)
    await api.createAccount(data.userName, '1234', data.firstName, data.lastName)
    await api.createWorkspaceWithLogin(data.workspaceName, data.userName, '1234')
    await (await page.goto(`${PlatformURI}`))?.finished()
    await loginPage.login(data.userName, '1234')
    const swp = new SelectWorkspacePage(page)
    await swp.selectWorkspace(data.workspaceName)
    // await (await page.goto(`${PlatformURI}/workbench/${data.workspaceName}`))?.finished()
  })

  test('create new private channel and check if the messages stays on it', async ({ browser, page }) => {
    await leftSideMenuPage.clickChunter()
    await chunterPage.clickChannelBrowser()
    await chunterPage.clickNewChannelHeader()
    await chunterPage.createPrivateChannel(data.channelName, true)
    await channelPage.checkIfChannelDefaultExist(true, data.channelName)
    await channelPage.sendMessage('Test message')
    await channelPage.checkMessageExist('Test message', true, 'Test message')
    await channelPage.clickChannel('general')
    await channelPage.checkMessageExist('Test message', false, 'Test message')
    await channelPage.clickChannel(data.channelName)
    await channelPage.checkMessageExist('Test message', true, 'Test message')
    await page.reload()
    await channelPage.checkMessageExist('Test message', true, 'Test message')
  })

  test('create new public channel and check if the messages stays on it', async ({ browser, page }) => {
    await leftSideMenuPage.clickChunter()
    await chunterPage.clickChannelBrowser()
    await chunterPage.clickNewChannelHeader()
    await chunterPage.createPrivateChannel(data.channelName, false)
    await channelPage.checkIfChannelDefaultExist(true, data.channelName)
    await channelPage.sendMessage('Test message')
    await channelPage.checkMessageExist('Test message', true, 'Test message')
    await channelPage.clickChannel('general')
    await channelPage.checkMessageExist('Test message', false, 'Test message')
    await channelPage.clickChannel(data.channelName)
    await channelPage.checkMessageExist('Test message', true, 'Test message')
    await page.reload()
    await channelPage.checkMessageExist('Test message', true, 'Test message')
  })

  test('create new private channel tests and check if the new user have access to it', async ({ browser, page }) => {
    await leftSideMenuPage.clickChunter()
    await chunterPage.clickChannelBrowser()
    await chunterPage.clickNewChannelHeader()
    await chunterPage.createPrivateChannel(data.channelName, true)
    await channelPage.checkIfChannelDefaultExist(true, data.channelName)
    await channelPage.sendMessage('Test message')
    await channelPage.checkMessageExist('Test message', true, 'Test message')
    await leftSideMenuPage.openProfileMenu()
    await leftSideMenuPage.inviteToWorkspace()
    await leftSideMenuPage.getInviteLink()

    const linkText = await page.locator('.antiPopup .link').textContent()
    const page2 = await browser.newPage()
    const leftSideMenuPageSecond = new LeftSideMenuPage(page2)
    const channelPageSecond = new ChannelPage(page2)
    await api.createAccount(newUser2.email, newUser2.password, newUser2.firstName, newUser2.lastName)
    await page2.goto(linkText ?? '')
    const joinPage = new SignInJoinPage(page2)
    await joinPage.join(newUser2)
    await leftSideMenuPageSecond.clickChunter()
    await channelPageSecond.checkIfChannelDefaultExist(false, data.channelName)
    await channelPageSecond.clickChannelTab()
    await channelPageSecond.checkIfChannelTableExist(data.channelName, false)
    await page2.close()
  })

  test('create new public channel tests and check if the new user have access to it by default', async ({
    browser,
    page
  }) => {
    await leftSideMenuPage.clickChunter()
    await chunterPage.clickChannelBrowser()
    await chunterPage.clickNewChannelHeader()
    await chunterPage.createPrivateChannel(data.channelName, false)
    await channelPage.checkIfChannelDefaultExist(true, data.channelName)
    await channelPage.sendMessage('Test message')
    await channelPage.checkMessageExist('Test message', true, 'Test message')
    await leftSideMenuPage.openProfileMenu()
    await leftSideMenuPage.inviteToWorkspace()
    await leftSideMenuPage.getInviteLink()

    const linkText = await page.locator('.antiPopup .link').textContent()
    const page2 = await browser.newPage()
    const leftSideMenuPageSecond = new LeftSideMenuPage(page2)
    const channelPageSecond = new ChannelPage(page2)
    await api.createAccount(newUser2.email, newUser2.password, newUser2.firstName, newUser2.lastName)
    await page2.goto(linkText ?? '')
    const joinPage = new SignInJoinPage(page2)
    await joinPage.join(newUser2)
    await leftSideMenuPageSecond.clickChunter()
    await channelPageSecond.checkIfChannelDefaultExist(false, data.channelName)
    await channelPageSecond.clickChannelTab()
    await channelPageSecond.checkIfChannelTableExist(data.channelName, true)
    await page2.close()
  })

  test('create new private channel and test if the user can exchange the messages', async ({ browser, page }) => {
    await leftSideMenuPage.clickChunter()
    await chunterPage.clickChannelBrowser()
    await chunterPage.clickNewChannelHeader()
    await chunterPage.createPrivateChannel(data.channelName, false)
    await channelPage.checkIfChannelDefaultExist(true, data.channelName)
    await channelPage.sendMessage('Test message')
    await channelPage.checkMessageExist('Test message', true, 'Test message')
    await leftSideMenuPage.openProfileMenu()
    await leftSideMenuPage.inviteToWorkspace()
    await leftSideMenuPage.getInviteLink()

    const linkText = await page.locator('.antiPopup .link').textContent()
    const page2 = await browser.newPage()
    const leftSideMenuPageSecond = new LeftSideMenuPage(page2)
    const channelPageSecond = new ChannelPage(page2)
    await leftSideMenuPage.clickOnCloseInvite()
    await api.createAccount(newUser2.email, newUser2.password, newUser2.firstName, newUser2.lastName)
    await page2.goto(linkText ?? '')
    const joinPage = new SignInJoinPage(page2)
    await joinPage.join(newUser2)
    await leftSideMenuPageSecond.clickChunter()
    await channelPageSecond.checkIfChannelDefaultExist(false, data.channelName)
    await channelPageSecond.clickChannelTab()
    await channelPageSecond.checkIfChannelTableExist(data.channelName, true)
    await channelPageSecond.clickJoinChannelButton()
    await channelPageSecond.clickChooseChannel(data.channelName)
    const checkJoinButton = await page2.locator('button[data-id="btnJoin"]').isVisible({ timeout: 1500 })
    if (checkJoinButton) await page2.locator('button[data-id="btnJoin"]').click()
    await channelPageSecond.checkMessageExist('Test message', true, 'Test message')
    await channelPageSecond.sendMessage('My dream is to fly')
    await channelPageSecond.checkMessageExist('My dream is to fly', true, 'My dream is to fly')
    await channelPage.checkMessageExist('My dream is to fly', true, 'My dream is to fly')
    await page2.close()
  })

  test('create new private channel add user to it', async ({ browser, page }) => {
    await leftSideMenuPage.clickChunter()
    await chunterPage.clickChannelBrowser()
    await chunterPage.clickNewChannelHeader()
    await chunterPage.createPrivateChannel(data.channelName, true)
    await channelPage.checkIfChannelDefaultExist(true, data.channelName)
    await channelPage.sendMessage('Test message')
    await channelPage.checkMessageExist('Test message', true, 'Test message')
    await leftSideMenuPage.openProfileMenu()
    await leftSideMenuPage.inviteToWorkspace()
    await leftSideMenuPage.getInviteLink()

    const linkText = await page.locator('.antiPopup .link').textContent()
    const page2 = await browser.newPage()
    const leftSideMenuPageSecond = new LeftSideMenuPage(page2)
    const channelPageSecond = new ChannelPage(page2)
    await leftSideMenuPage.clickOnCloseInvite()
    await api.createAccount(newUser2.email, newUser2.password, newUser2.firstName, newUser2.lastName)
    await page2.goto(linkText ?? '')
    const joinPage = new SignInJoinPage(page2)
    await joinPage.join(newUser2)
    await leftSideMenuPageSecond.clickChunter()
    await channelPage.clickChannelTab()
    await channelPage.clickOnUser(data.lastName + ' ' + data.firstName)
    await channelPage.addMemberToChannel(newUser2.lastName + ' ' + newUser2.firstName)
    await channelPage.pressEscape()
    await leftSideMenuPageSecond.clickChunter()
    await channelPageSecond.checkIfChannelDefaultExist(true, data.channelName)
    await channelPageSecond.clickChannelTab()
    await channelPageSecond.checkIfChannelTableExist(data.channelName, true)
    await channelPageSecond.clickChooseChannel(data.channelName)
    await channelPageSecond.checkMessageExist('Test message', true, 'Test message')
    await channelPageSecond.sendMessage('One two')
    await channelPageSecond.checkMessageExist('One two', true, 'One two')
    await channelPage.clickChooseChannel(data.channelName)
    await channelPage.checkMessageExist('One two', true, 'One two')
    await page2.close()
  })

  test('go to general channel add user to it', async ({ browser, page }) => {
    await leftSideMenuPage.clickChunter()
    await channelPage.clickChannel('general')

    await channelPage.sendMessage('Test message')
    await channelPage.checkMessageExist('Test message', true, 'Test message')
    await leftSideMenuPage.openProfileMenu()
    await leftSideMenuPage.inviteToWorkspace()
    await leftSideMenuPage.getInviteLink()

    const linkText = await page.locator('.antiPopup .link').textContent()
    const page2 = await browser.newPage()
    const leftSideMenuPageSecond = new LeftSideMenuPage(page2)
    const channelPageSecond = new ChannelPage(page2)
    await leftSideMenuPage.clickOnCloseInvite()
    await api.createAccount(newUser2.email, newUser2.password, newUser2.firstName, newUser2.lastName)
    await page2.goto(linkText ?? '')
    const joinPage = new SignInJoinPage(page2)
    await joinPage.join(newUser2)
    await leftSideMenuPageSecond.clickChunter()
    await channelPageSecond.clickChannel('general')
    await channelPageSecond.checkMessageExist('Test message', true, 'Test message')
    await channelPageSecond.sendMessage('One two')
    await channelPageSecond.checkMessageExist('One two', true, 'One two')
    await channelPage.clickChannel('random')
    await channelPage.clickOnClosePopupButton()
    await channelPage.clickChannel('general')
    await channelPage.checkMessageExist('One two', true, 'One two')
    await page2.close()
  })

  test('go to random channel add user to it', async ({ browser, page }) => {
    await leftSideMenuPage.clickChunter()
    await channelPage.clickChannel('random')

    await channelPage.sendMessage('Test message')
    await channelPage.checkMessageExist('Test message', true, 'Test message')
    await leftSideMenuPage.openProfileMenu()
    await leftSideMenuPage.inviteToWorkspace()
    await leftSideMenuPage.getInviteLink()

    const linkText = await page.locator('.antiPopup .link').textContent()
    const page2 = await browser.newPage()
    const leftSideMenuPageSecond = new LeftSideMenuPage(page2)
    const channelPageSecond = new ChannelPage(page2)
    await leftSideMenuPage.clickOnCloseInvite()
    await api.createAccount(newUser2.email, newUser2.password, newUser2.firstName, newUser2.lastName)
    await page2.goto(linkText ?? '')
    const joinPage = new SignInJoinPage(page2)
    await joinPage.join(newUser2)
    await leftSideMenuPageSecond.clickChunter()
    await channelPageSecond.clickChannel('random')
    await channelPageSecond.checkMessageExist('Test message', true, 'Test message')
    await channelPageSecond.sendMessage('One two')
    await channelPageSecond.checkMessageExist('One two', true, 'One two')
    await channelPage.clickChannel('general')
    await channelPage.clickOnClosePopupButton()
    await channelPage.clickChannel('random')
    await channelPage.checkMessageExist('One two', true, 'One two')
    await page2.close()
  })

  test('check if user can add emoji', async () => {
    await leftSideMenuPage.clickChunter()
    await channelPage.clickChannel('random')
    await channelPage.sendMessage('Test message')
    await channelPage.checkMessageExist('Test message', true, 'Test message')
    await channelPage.addEmoji('Test message', '😤')
    await channelPage.checkIfEmojiIsAdded('😤')
  })

  test('check if user can save message', async () => {
    await leftSideMenuPage.clickChunter()
    await channelPage.clickChannel('random')
    await channelPage.sendMessage('Test message')
    await channelPage.saveMessage('Test message')
    await channelPage.sendMessage('Test message')
    await channelPage.clickSaveMessageTab()
    await channelPage.checkIfMessageExist(true, 'Test message')
  })

  test('check if user can pin message', async () => {
    await leftSideMenuPage.clickChunter()
    await channelPage.clickChannel('random')
    await channelPage.sendMessage('Test message')
    await channelPage.replyToMessage('Test message', 'Reply message')
    await channelPage.checkIfMessageExist(true, 'Reply message')
    await channelPage.closeAndOpenReplyMessage()
    await channelPage.checkIfMessageExist(true, 'Reply message')
  })

  test('check if user can edit message', async ({ page }) => {
    await leftSideMenuPage.clickChunter()
    await channelPage.clickChannel('random')
    await channelPage.sendMessage('Test message')
    await channelPage.clickOpenMoreButton('Test message')
    await channelPage.clickEditMessageButton(' edited message')
    await page.keyboard.press('Enter')
    await channelPage.checkIfMessageExist(true, 'Test message edited message')
    await channelPage.clickOpenMoreButton('Test message edited message')
    await channelPage.clickEditMessageButton(' 1')
    await channelPage.clickOnUpdateButton()
    await channelPage.checkIfMessageExist(true, 'Test message edited message 1')
  })

  test('check if user can copy message', async ({ page }) => {
    const baseURL = process.env.PLATFORM_URI ?? 'http://localhost:8083'
    const expectedUrl = `${baseURL}/workbench/${data.workspaceName}/chunter/chunter:space:Random|chunter:class:Channel?message=`
    await leftSideMenuPage.clickChunter()
    await channelPage.clickChannel('random')
    await channelPage.sendMessage('Test message')
    await channelPage.clickOpenMoreButton('Test message')
    await channelPage.clickCopyLinkButton()
    const clipboardContent = await page.evaluate(async () => {
      return await navigator.clipboard.readText()
    })
    expect(clipboardContent).toContain(expectedUrl)
  })

  test('check if user can delete messages', async ({ page }) => {
    await leftSideMenuPage.clickChunter()
    await channelPage.clickChannel('random')
    await channelPage.sendMessage('Test message')
    await channelPage.clickOpenMoreButton('Test message')
    await channelPage.clickDeleteMessageButton()
    await channelPage.checkIfMessageExist(false, 'Test message')
  })

  test('Check if user can change the name of chat', async ({ browser, page }) => {
    await leftSideMenuPage.clickChunter()
    await chunterPage.clickChannelBrowser()
    await chunterPage.clickNewChannelHeader()
    await chunterPage.createPrivateChannel(data.channelName, false)
    await channelPage.checkIfChannelDefaultExist(true, data.channelName)
    await channelPage.clickOnOpenChannelDetails()
    await channelPage.changeChannelName(data.channelName)
    await channelPage.checkIfNameIsChanged('New Channel Name')
  })

  test('Check if user can switch to private or public', async ({ browser, page }) => {
    await leftSideMenuPage.clickChunter()
    await chunterPage.clickChannelBrowser()
    await chunterPage.clickNewChannelHeader()
    await chunterPage.createPrivateChannel(data.channelName, false)
    await channelPage.checkIfChannelDefaultExist(true, data.channelName)
    await channelPage.clickOnOpenChannelDetails()
    await channelPage.changeChannelPrivacyOrAutoJoin('No', 'Yes', 'Yes')
    await channelPage.changeChannelPrivacyOrAutoJoin('Yes', 'No', 'No')
  })

  test('Check if user can switch auto join', async ({ browser, page }) => {
    await leftSideMenuPage.clickChunter()
    await chunterPage.clickChannelBrowser()
    await chunterPage.clickNewChannelHeader()
    await chunterPage.createPrivateChannel(data.channelName, false)
    await channelPage.checkIfChannelDefaultExist(true, data.channelName)
    await channelPage.clickOnOpenChannelDetails()
    await channelPage.changeChannelPrivacyOrAutoJoin('N/A', 'Yes', 'Yes', true)
  })

  test('Check if the user can be added through preview tab', async ({ browser, page }) => {
    await leftSideMenuPage.openProfileMenu()
    await leftSideMenuPage.inviteToWorkspace()
    await leftSideMenuPage.getInviteLink()

    const linkText = await page.locator('.antiPopup .link').textContent()
    const page2 = await browser.newPage()
    const leftSideMenuPageSecond = new LeftSideMenuPage(page2)
    const channelPageSecond = new ChannelPage(page2)

    await leftSideMenuPage.clickOnCloseInvite()
    await api.createAccount(newUser2.email, newUser2.password, newUser2.firstName, newUser2.lastName)
    await page2.goto(linkText ?? '')
    const joinPage = new SignInJoinPage(page2)
    await joinPage.join(newUser2)
    await leftSideMenuPageSecond.clickChunter()
    await channelPageSecond.clickChannel('general')
    await channelPageSecond.clickOnOpenChannelDetails()
    await channelPageSecond.checkIfUserIsAdded(data.lastName + ' ' + data.firstName, false)
    await page2.close()
  })

  test('Check if we can create new public channel tests and check if the new user have can be added through preview', async ({
    browser,
    page
  }) => {
    await leftSideMenuPage.clickChunter()
    await chunterPage.clickChannelBrowser()
    await chunterPage.clickNewChannelHeader()
    await chunterPage.createPrivateChannel(data.channelName, false)
    await channelPage.checkIfChannelDefaultExist(true, data.channelName)
    await leftSideMenuPage.openProfileMenu()
    await leftSideMenuPage.inviteToWorkspace()
    await leftSideMenuPage.getInviteLink()
    const linkText = await page.locator('.antiPopup .link').textContent()
    await leftSideMenuPage.clickOnCloseInvite()
    const page2 = await browser.newPage()
    await api.createAccount(newUser2.email, newUser2.password, newUser2.firstName, newUser2.lastName)
    await page2.goto(linkText ?? '')
    const joinPage = new SignInJoinPage(page2)
    await joinPage.join(newUser2)
    await leftSideMenuPage.clickChunter()
    await channelPage.clickChannel('general')
    await channelPage.clickChannel(data.channelName)
    await channelPage.clickOnOpenChannelDetails()
    await channelPage.addMemberToChannelPreview(newUser2.lastName + ' ' + newUser2.firstName)
    await page2.close()
  })

  test('Checking backlinks in the Chat', async ({ browser, page }) => {
    await api.createAccount(newUser2.email, newUser2.password, newUser2.firstName, newUser2.lastName)
    await leftSideMenuPage.openProfileMenu()
    await leftSideMenuPage.inviteToWorkspace()
    await leftSideMenuPage.getInviteLink()
    const linkText = await page.locator('.antiPopup .link').textContent()
    await leftSideMenuPage.clickOnCloseInvite()
    const page2 = await browser.newPage()
    const leftSideMenuPageSecond = new LeftSideMenuPage(page2)
    const channelPageSecond = new ChannelPage(page2)
    await page2.goto(linkText ?? '')
    const joinPage = new SignInJoinPage(page2)
    await joinPage.join(newUser2)
    await leftSideMenuPageSecond.clickChunter()

    await leftSideMenuPage.clickChunter()
    await channelPage.clickChannel('general')
    const mentionName = `${newUser2.lastName} ${newUser2.firstName}`
    await channelPage.sendMention(mentionName)
    await channelPage.checkMessageExist(`@${mentionName}`, true, `@${mentionName}`)

    await channelPageSecond.clickChannel('general')
    await channelPageSecond.checkMessageExist(`@${mentionName}`, true, `@${mentionName}`)
    await page2.close()
  })
})
