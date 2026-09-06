import assert from 'node:assert/strict'
import { chromium } from 'playwright-core'

const baseUrl = process.env.APP_URL || 'http://127.0.0.1:4173/'
const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true })
try {
  for (const reducedMotion of ['no-preference', 'reduce']) {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, reducedMotion })
    await page.goto(baseUrl, { waitUntil: 'networkidle' })
    await page.locator('.arrival').waitFor()
    await page.getByRole('button', { name: 'View the menu', exact: true }).click()
    if (reducedMotion === 'no-preference') assert.equal(await page.locator('.arrival--leaving').count(), 1)
    await page.locator('.arrival').waitFor({ state: 'detached' })
    assert.equal(await page.evaluate(() => document.activeElement.id), 'menu-title')
    assert.equal(await page.locator('.dish-card').count(), 6)
    await page.reload({ waitUntil: 'networkidle' })
    assert.equal(await page.locator('.arrival').count(), 1)
    await page.close()
  }
  console.log('Arrival transition and welcome reload behavior passed.')
} finally {
  await browser.close()
}
