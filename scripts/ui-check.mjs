import assert from 'node:assert/strict'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { chromium } from 'playwright-core'

const baseUrl = process.env.APP_URL || 'http://127.0.0.1:4173/'
const artifacts = path.resolve('artifacts/redesign')
await mkdir(artifacts, { recursive: true })
const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true })
const errors = []
const results = []
const screenshot = (page, name) => page.screenshot({ path: path.join(artifacts, `${name}.png`) })
const noOverflow = async page => assert(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), 'Page must fit the viewport')
const noBrokenLoadedImages = async page => {
  const broken = await page.locator('img').evaluateAll(images => images.filter(image => image.loading !== 'lazy' && (!image.complete || image.naturalWidth === 0)).map(image => image.src))
  assert.deepEqual(broken, [], `Broken images: ${broken.join(', ')}`)
}
const enter = async page => {
  await page.locator('.arrival').waitFor()
  await page.getByRole('button', { name: 'View the menu', exact: true }).click()
  await page.locator('.arrival').waitFor({ state: 'detached' })
  assert.equal(await page.evaluate(() => document.activeElement.id), 'menu-title')
}

try {
  for (const [name, width, height] of [['narrow', 293, 642], ['small', 320, 568], ['mobile', 390, 844], ['large-mobile', 430, 932], ['landscape', 844, 390], ['desktop', 1440, 1000]]) {
    const mobile = width < 900
    const page = await browser.newPage({ viewport: { width, height }, isMobile: mobile, hasTouch: mobile, reducedMotion: 'reduce' })
    page.on('pageerror', error => errors.push(`${name}: ${error.message}`))
    page.on('console', message => message.type() === 'error' && errors.push(`${name}: ${message.text()}`))
    await page.goto(baseUrl, { waitUntil: 'networkidle' })
    await noOverflow(page)
    await noBrokenLoadedImages(page)
    const entry = await page.getByRole('button', { name: 'View the menu', exact: true }).boundingBox()
    assert(entry.y >= 0 && entry.y + entry.height <= height, `${name}: arrival button must be visible`)
    await screenshot(page, `${name}-arrival`)
    await enter(page)
    assert.equal(await page.locator('.dish-card').count(), 6)
    assert.equal(await page.locator('.menu-chapter').count(), 4)
    assert.equal(await page.getByText('Your selection', { exact: true }).count(), 0)
    await noOverflow(page)
    await screenshot(page, `${name}-menu`)

    await page.getByRole('button', { name: 'View Turkish Coffee', exact: true }).click()
    const detail = page.getByRole('dialog', { name: 'Turkish Coffee', exact: true })
    await detail.waitFor()
    assert.equal(await detail.getByRole('button', { name: /add|save|order|checkout/i }).count(), 0)
    await screenshot(page, `${name}-detail`)
    await page.goBack()
    await detail.waitFor({ state: 'detached' })

    await page.locator('.category-browser').click()
    const directory = page.getByRole('dialog', { name: 'Menu', exact: true })
    await directory.waitFor()
    await directory.getByRole('searchbox').fill('Turkish')
    await directory.getByRole('button', { name: 'Find something delicious', exact: true }).click()
    await directory.waitFor({ state: 'detached' })
    assert.equal(await page.locator('.dish-card').count(), 1)
    assert.match(await page.locator('.dish-name').innerText(), /Turkish Coffee/)
    await page.getByRole('button', { name: 'Clear search', exact: true }).click()
    assert.equal(await page.locator('.dish-card').count(), 6)

    await page.locator('.category-rail').getByRole('button', { name: 'Coffee', exact: true }).click()
    await page.waitForTimeout(100)
    const chapter = await page.locator('#chapter-coffee').boundingBox()
    assert(chapter.y >= 100 && chapter.y < 180, `${name}: Coffee chapter should sit below sticky navigation, got ${chapter.y}`)

    await page.locator('.language-button').click()
    assert.equal(await page.locator('html').getAttribute('dir'), 'rtl')
    assert.match(await page.locator('#menu-title').innerText(), /مطبخنا/)
    await noOverflow(page)
    await page.locator('.language-button').click()

    await page.locator('#story').scrollIntoViewIfNeeded()
    await page.locator('.story-photograph img').waitFor()
    assert(await page.locator('.story-photograph img').evaluate(image => image.complete && image.naturalWidth > 0))
    await noOverflow(page)
    await page.reload({ waitUntil: 'networkidle' })
    assert.equal(await page.locator('.arrival').count(), 1, 'The welcome screen should return on a fresh page load')
    results.push(`${name}: arrival, images, menu, details, back, search, categories, Arabic, story, welcome reload passed`)
    await page.close()
  }

  const admin = await browser.newPage()
  await admin.goto(`${baseUrl}#/admin`, { waitUntil: 'networkidle' })
  await admin.getByRole('button', { name: /menu items/i }).waitFor()
  await admin.close()
  assert.deepEqual(errors, [])
  console.log(JSON.stringify({ results, browserErrors: errors }, null, 2))
} finally {
  await browser.close()
}
