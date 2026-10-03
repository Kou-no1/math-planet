import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import Fraction from 'fraction.js'

const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE ?? 'playwright')
const baseUrl = process.env.QA_BASE_URL ?? 'http://127.0.0.1:5176/math-planet/'
const output = process.env.QA_OUTPUT_DIR ?? join(tmpdir(), 'kukucchi-phase17')
await mkdir(output, { recursive: true })
const browser = await chromium.launch({
  channel: 'msedge',
  headless: true,
  args: ['--mute-audio'],
})
const errors = []
const reports = []
let currentPage

async function layout(page, name, viewport) {
  assert.ok(
    await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 2),
    `${name}: horizontal overflow`,
  )
  await page.screenshot({
    path: join(output, `${viewport.width}-${name}.png`),
    fullPage: true,
  })
}
async function choices(page, viewport) {
  const buttons = page.locator('.choice-grid button')
  await buttons.first().waitFor()
  assert.equal(await buttons.count(), 4)
  for (const button of await buttons.all()) {
    const rect = await button.boundingBox()
    assert.ok(
      rect &&
        rect.x >= 0 &&
        rect.y >= 0 &&
        rect.x + rect.width <= viewport.width + 1 &&
        rect.y + rect.height <= viewport.height + 1,
      `choice clipped ${JSON.stringify(rect)}`,
    )
    assert.ok(
      await button.evaluate((element) => {
        const rect = element.getBoundingClientRect()
        return element.contains(
          document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2),
        )
      }),
      'choice covered',
    )
    assert.ok(
      await button.evaluate((element) => {
        const rect = element.getBoundingClientRect()
        return Array.from(element.querySelectorAll('.fraction-value > span')).every((span) => {
          const text = span.getBoundingClientRect()
          return (
            text.top >= rect.top &&
            text.bottom <= rect.bottom &&
            text.left >= rect.left &&
            text.right <= rect.right
          )
        })
      }),
      'fraction text clipped',
    )
  }
}
async function correctLabel(page) {
  const heading = page.locator('.question-prompt')
  const prompt = await heading.evaluate(
    (element) =>
      element.querySelector('.fraction-expression')?.getAttribute('aria-label') ??
      element.textContent,
  )
  const parts = prompt.trim().split(/\s+/)
  assert.equal(parts.length, 3, prompt)
  const left = new Fraction(parts[0]),
    right = new Fraction(parts[2])
  const value =
    parts[1] === '+'
      ? left.add(right)
      : parts[1] === '-'
        ? left.sub(right)
        : parts[1] === '×'
          ? left.mul(right)
          : left.div(right)
  return prompt.includes('/') ? value.toFraction() : value.toString(6)
}
async function answer(page) {
  const label = await correctLabel(page)
  await page.getByRole('button', { name: label, exact: true }).click()
  await page.locator('.feedback-correct').waitFor()
}
async function route(page, path) {
  const url = `${baseUrl}#${path}`
  if (page.url() === url) await page.reload()
  else await page.goto(url)
}

try {
  for (const viewport of [
    { width: 320, height: 568 },
    { width: 390, height: 844 },
    { width: 768, height: 1024 },
    { width: 1366, height: 768 },
  ]) {
    console.log(`Checking ${viewport.width}x${viewport.height}`)
    const context = await browser.newContext({ viewport })
    const page = await context.newPage()
    currentPage = page
    page.on('pageerror', (error) => errors.push(error.message))
    await page.goto(baseUrl)
    await page.getByLabel('よびな').fill('みらい')
    await page.getByRole('button', { name: 'はじめる', exact: true }).click()
    await page.getByRole('button', { name: 'スキップ', exact: true }).click()
    await layout(page, 'home-six-planets', viewport)
    for (const [planet, label, area] of [
      ['decimal', '小数', 'decimal-add-hundredths'],
      ['fraction', '分数', 'fraction-add-unlike'],
    ]) {
      await route(page, '/home')
      await page.getByRole('link', { name: new RegExp(`${label}のほし`) }).click()
      await page.getByRole('heading', { name: `${label}のほし`, exact: true }).waitFor()
      await layout(page, `${planet}-menu`, viewport)
      await route(page, `/learn?planet=${planet}&area=${area}`)
      await page.getByRole('button', { name: '4たく', exact: true }).waitFor()
      assert.ok(await page.getByRole('button', { name: '入力', exact: true }).isDisabled())
      await layout(page, `${planet}-ready`, viewport)
      await page.getByRole('button', { name: 'スタート！', exact: true }).click()
      await choices(page, viewport)
      await layout(page, `${planet}-practice`, viewport)
      await page.getByRole('button', { name: /ひんと/ }).click()
      await page.getByRole('dialog', { name: 'ひんと', exact: true }).waitFor()
      await layout(page, `${planet}-hint`, viewport)
      await page.getByRole('button', { name: 'ひんとをとじる', exact: true }).click()
      for (let index = 0; index < 9; index++) {
        await page.locator('.choice-grid button').first().waitFor({ state: 'visible' })
        await page.locator('.feedback-idle').waitFor()
        await answer(page)
      }
      await page.getByRole('button', { name: /けっか/ }).click()
      await page.getByRole('heading', { name: /リザルト|けっか/ }).waitFor()
      const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('kukucchi-save-v1')))
      assert.ok(Object.keys(saved.progress.facts).some((id) => id.startsWith(`${planet}:`)))
      assert.ok(saved.player.coins > 0 && saved.player.exp > 0)
      await layout(page, `${planet}-result`, viewport)
      await page.getByRole('link', { name: 'もう一回', exact: true }).click()
      assert.ok(page.url().includes(`planet=${planet}`))
      await route(page, `/review?planet=${planet}`)
      await page.getByRole('button', { name: 'ふくしゅうすたーと', exact: true }).click()
      await choices(page, viewport)
      await answer(page)
      await layout(page, `${planet}-review`, viewport)
      await route(page, `/speed?planet=${planet}`)
      await page.getByRole('button', { name: 'すたーと！', exact: true }).click()
      await choices(page, viewport)
      await answer(page)
      await layout(page, `${planet}-speed`, viewport)
      for (const difficulty of ['やさしい', 'ふつう', 'むずかしい']) {
        await route(page, `/rocket?planet=${planet}`)
        await page.getByRole('button', { name: new RegExp(`^${difficulty}`) }).click()
        await page.getByRole('button', { name: 'すたーと！', exact: true }).click()
        await choices(page, viewport)
        await answer(page)
        await layout(page, `${planet}-rocket-${difficulty}`, viewport)
      }
    }
    await page.evaluate(async (base) => {
      const { fullOpenDebugSaveData } = await import(`${base}src/game-engine/debug/debugTools.ts`)
      localStorage.setItem(
        'kukucchi-save-v1',
        JSON.stringify(fullOpenDebugSaveData(JSON.parse(localStorage.getItem('kukucchi-save-v1')))),
      )
    }, baseUrl)
    await page.reload()
    for (const [planet, label, bossId] of [
      ['decimal', '小数', 'boss-decimal-add-hundredths'],
      ['fraction', '分数', 'boss-fraction-add-unlike'],
    ]) {
      await route(page, `/boss/${bossId}`)
      await page.getByRole('button', { name: /ノーマル/ }).click()
      await page.getByRole('button', { name: /スタート|すたーと/ }).click()
      await choices(page, viewport)
      await answer(page)
      await layout(page, `${planet}-boss`, viewport)
      await page.getByRole('link', { name: 'もどる', exact: true }).first().click()
      assert.ok(page.url().includes(`/planet/${planet}`))
      await route(page, '/custom')
      await page.getByRole('button', { name: label, exact: true }).click()
      await page.getByRole('tab', { name: /^なかま/ }).click()
      assert.equal(
        await page.locator('.custom-item-grid .custom-item-card').count(),
        planet === 'decimal' ? 18 : 12,
      )
      await page.locator('.custom-item-grid .custom-item-card').first().click()
      await layout(page, `${planet}-custom-buddies`, viewport)
      await page.getByRole('tab', { name: /^UFO/ }).click()
      assert.equal(await page.locator('.custom-item-grid .custom-item-card').count(), 3)
      await page.locator('.custom-item-grid .custom-item-card').last().click()
      await page.getByRole('tab', { name: /^エフェクト/ }).click()
      await page.locator('.custom-item-grid .custom-item-card').first().click()
      const shipGeometry = await page.locator('.custom-character-window').evaluate((preview) => {
        const ship = preview.querySelector('.ufo-ship').getBoundingClientRect()
        const cockpit = preview.querySelector('.ufo-cockpit').getBoundingClientRect()
        return {
          centers: Math.abs(ship.x + ship.width / 2 - cockpit.x - cockpit.width / 2),
          overlap: cockpit.bottom - ship.top,
        }
      })
      assert.ok(
        shipGeometry.centers < 4 && shipGeometry.overlap > 0,
        `UFO detached: ${JSON.stringify(shipGeometry)}`,
      )
      await layout(page, `${planet}-custom-ufo-effect`, viewport)
      await route(page, `/planet/${planet}`)
      assert.equal(await page.locator('.home-buddy-sprite.numeric-monster-sprite').count(), 1)
      await layout(page, `${planet}-equipped-menu`, viewport)
    }
    await route(page, '/book')
    await page.getByRole('button', { name: 'モンスター', exact: true }).click()
    assert.equal(
      await page.locator('[aria-label="小数のなかま"] .numeric-monster-sprite').count(),
      18,
    )
    assert.equal(
      await page.locator('[aria-label="分数のなかま"] .numeric-monster-sprite').count(),
      12,
    )
    await layout(page, 'numeric-monster-book', viewport)
    reports.push({ viewport, result: 'passed' })
    await context.close()
  }
  assert.deepEqual(errors, [])
  await writeFile(join(output, 'report.json'), JSON.stringify({ reports, errors }, null, 2))
  console.log(`Passed. Screenshots: ${output}`)
} catch (error) {
  if (currentPage && !currentPage.isClosed()) {
    await currentPage.screenshot({ path: join(output, 'failure.png'), fullPage: true })
    await writeFile(
      join(output, 'failure.txt'),
      `${currentPage.url()}\n${await currentPage.locator('body').innerText()}\n${JSON.stringify(errors)}`,
    )
  }
  throw error
} finally {
  await browser.close()
}
