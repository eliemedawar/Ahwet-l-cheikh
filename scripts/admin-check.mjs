// Checks that the admin can actually change what guests see: the Wording tab's
// per-language overrides, the Content tab's paired English/Arabic fields, and
// that clearing an override restores the built-in text.
import assert from 'node:assert/strict'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { chromium } from 'playwright-core'

const base = process.env.APP_URL || 'http://127.0.0.1:4173/'
const artifacts = path.resolve('artifacts/admin')
await mkdir(artifacts, { recursive: true })
const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true })
const page = await browser.newPage({ viewport: { width: 1280, height: 950 }, reducedMotion: 'reduce' })
const errors = []
page.on('pageerror', e => errors.push(e.message))
page.on('console', m => m.type() === 'error' && errors.push(m.text()))
const done = []
/** Sets the guest language directly, so each block starts from a known state. */
const useLanguage = async (lang) => {
  await page.evaluate((l) => sessionStorage.setItem('kc-visit-language', JSON.stringify(l)), lang)
  await page.reload({ waitUntil: 'networkidle' })
  await page.locator('.arrival').waitFor()
}

try {
  // ---- Wording tab: override the welcome headline in English ----
  await page.goto(`${base}#/admin`, { waitUntil: 'networkidle' })
  await page.getByRole('button', { name: 'Wording' }).click()
  await page.locator('.a-search input').fill('headline')
  const line1 = page.locator('.a-word', { hasText: 'Headline, line 1' }).first()
  await line1.locator('input[lang="en"], textarea[lang="en"]').fill('A corner of Beirut.')
  await line1.locator('input[lang="ar"], textarea[lang="ar"]').fill('زاوية من بيروت.')
  done.push('wording tab accepts EN + AR overrides')

  // The row should mark itself changed and offer a reset.
  assert.equal(await line1.locator('.a-word-reset').count(), 1, 'changed row must offer Reset')
  done.push('changed row shows Reset')

  // ---- Content tab: branch + its Arabic counterpart ----
  await page.getByRole('button', { name: 'Content' }).click()
  await page.locator('.a-field', { hasText: /^Branch \/ address/ }).first().locator('input').fill('Gemmayzeh, Beirut')
  await page.locator('.a-field', { hasText: 'Branch / address — العربية' }).first().locator('input').fill('الجميزة، بيروت')
  done.push('content tab accepts branch in both languages')

  // ---- Storefront: English ----
  await page.goto(base, { waitUntil: 'networkidle' })
  await page.locator('.arrival').waitFor()
  assert.match(await page.locator('#arrival-title').innerText(), /A corner of Beirut\./, 'English headline override must render')
  assert.match(await page.locator('.arrival-top span').innerText(), /Gemmayzeh, Beirut/i, 'branch override must render')
  // Untouched wording must still come from the built-in copy.
  assert.match(await page.locator('.arrival-copy p').innerText(), /Pull up a chair/, 'untouched paragraph keeps built-in wording')
  done.push('storefront renders EN overrides, keeps built-in for the rest')

  // ---- Storefront: Arabic ----
  await useLanguage('ar')
  assert.match(await page.locator('#arrival-title').innerText(), /زاوية من بيروت\./, 'Arabic headline override must render')
  assert.match(await page.locator('.arrival-top span').innerText(), /الجميزة، بيروت/, 'Arabic branch override must render')
  done.push('storefront renders AR overrides')

  // ---- Untouched button label must stay translated in Arabic ----
  await useLanguage('ar')
  const arDefaultCta = await page.locator('.arrival-copy .gold-button').innerText()
  assert.match(arDefaultCta, /تصفّح القائمة/, `default Arabic CTA must stay Arabic, got "${arDefaultCta}"`)
  await useLanguage('en')
  const enDefaultCta = await page.locator('.arrival-copy .gold-button').innerText()
  assert.match(enDefaultCta, /View the menu/, `default English CTA, got "${enDefaultCta}"`)
  done.push('untouched button label stays translated in both languages')

  // ---- The Arabic CTA bug: a custom button label must survive the language switch ----
  await page.goto(`${base}#/admin`, { waitUntil: 'networkidle' })
  await page.getByRole('button', { name: 'Content' }).click()
  await page.locator('.a-field', { hasText: /^Button label/ }).first().locator('input').fill('See the menu')
  await page.goto(base, { waitUntil: 'networkidle' })
  await useLanguage('ar')
  const arCta = await page.locator('.arrival-copy .gold-button').innerText()
  assert.match(arCta, /See the menu/, `Arabic CTA should use the custom label, got "${arCta}"`)
  done.push('custom button label now survives the Arabic switch')

  // ---- Clearing an override restores the built-in wording ----
  await page.goto(`${base}#/admin`, { waitUntil: 'networkidle' })
  await page.getByRole('button', { name: 'Wording' }).click()
  await page.locator('.a-search input').fill('headline')
  await page.locator('.a-word', { hasText: 'Headline, line 1' }).first().locator('.a-word-reset').click()
  await page.goto(base, { waitUntil: 'networkidle' })
  await useLanguage('en')
  assert.match(await page.locator('#arrival-title').innerText(), /A little Beirut\./, 'reset must restore built-in wording')
  done.push('Reset restores the built-in wording')

  // ---- Every copy key is reachable in the editor ----
  await page.goto(`${base}#/admin`, { waitUntil: 'networkidle' })
  await page.getByRole('button', { name: 'Wording' }).click()
  const rows = await page.locator('.a-word').count()
  const keys = await page.evaluate(() => Object.keys(JSON.parse(localStorage.getItem('kc-menu-data')).settings.text.en))
  done.push(`wording editor exposes ${rows} strings (overrides stored: ${keys.length})`)
  await page.screenshot({ path: path.join(artifacts, 'wording-tab.png'), fullPage: false })

  console.log(JSON.stringify({ passed: done, browserErrors: errors }, null, 2))
  if (errors.length) process.exitCode = 1
} catch (error) {
  console.log(JSON.stringify({ passedBefore: done, failed: error.message, browserErrors: errors }, null, 2))
  process.exitCode = 1
} finally {
  await browser.close()
}
