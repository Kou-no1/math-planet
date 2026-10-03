import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE ?? 'playwright')
const baseUrl = process.env.QA_BASE_URL ?? 'http://127.0.0.1:5176/math-planet/'
const output = process.env.QA_OUTPUT_DIR ?? join(tmpdir(), 'kukucchi-phase16')
await mkdir(output, { recursive: true })
const browser = await chromium.launch({
  channel: process.env.QA_BROWSER_CHANNEL ?? 'msedge',
  headless: true,
  args: ['--mute-audio'],
})
const errors = []
const reports = []

async function checkLayout(page, name, viewport) {
  const geometry = await page.evaluate(() => ({
    width: innerWidth,
    document: document.documentElement.scrollWidth,
    body: document.body.scrollWidth,
  }))
  assert.ok(
    geometry.document <= geometry.width + 2 && geometry.body <= geometry.width + 2,
    `${name}: horizontal overflow ${JSON.stringify(geometry)}`,
  )
  await page.screenshot({
    path: join(output, `${viewport.width}-${name}.png`),
    fullPage: true,
  })
}

async function checkChoices(page, viewport) {
  const buttons = page.locator('.choice-grid button')
  assert.equal(await buttons.count(), 4)
  for (const button of await buttons.all()) {
    const rect = await button.boundingBox()
    assert.ok(
      rect &&
        rect.x >= -1 &&
        rect.y >= -1 &&
        rect.x + rect.width <= viewport.width + 1 &&
        rect.y + rect.height <= viewport.height + 1,
      `choice clipped: ${await button.innerText()} ${JSON.stringify(rect)} in ${JSON.stringify(viewport)}`,
    )
    assert.ok(
      await button.evaluate((element) => {
        const rect = element.getBoundingClientRect()
        return element.contains(
          document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2),
        )
      }),
      `choice covered: ${await button.innerText()}`,
    )
  }
}

async function checkAnswer(page, label, expected) {
  await page.evaluate(() => {
    window.__qaFeedback = []
    window.__qaFeedbackObserver = new MutationObserver(() => {
      const feedback = document.querySelector('.feedback')
      for (const state of ['correct', 'incorrect']) {
        if (feedback?.classList.contains(`feedback-${state}`)) window.__qaFeedback.push(state)
      }
    })
    window.__qaFeedbackObserver.observe(document.body, {
      subtree: true,
      childList: true,
      attributes: true,
    })
  })
  await page.getByRole('button', { name: label, exact: true }).click()
  await page.waitForFunction((state) => window.__qaFeedback.includes(state), expected)
  await page.evaluate(() => window.__qaFeedbackObserver.disconnect())
}

async function checkStartLayout(page) {
  const geometry = await page.evaluate(() => {
    const bounds = (selector) => {
      const rect = document.querySelector(selector).getBoundingClientRect()
      return { top: rect.top, bottom: rect.bottom }
    }
    return {
      copy: bounds('.mode-start-copy'),
      options: bounds('.mode-start-options'),
      actions: bounds('.mode-start-actions'),
    }
  })
  assert.ok(geometry.copy.bottom <= geometry.options.top + 1, 'start options overlap title')
  assert.ok(geometry.options.bottom <= geometry.actions.top + 1, 'start options overlap actions')
  const answerMode = page.getByRole('button', { name: '4たく', exact: true })
  assert.ok(await answerMode.evaluate((element) => {
    const rect = element.getBoundingClientRect()
    const parent = element.closest('.mode-start-options').getBoundingClientRect()
    return rect.top >= parent.top && rect.bottom <= parent.bottom && element.contains(
      document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2),
    )
  }), 'answer mode clipped or covered')
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
    page.on('pageerror', (error) => errors.push(`${viewport.width}: ${error.message}`))
    await page.goto(baseUrl)
    await page.getByLabel('よびな').fill('みらい')
    await page.getByRole('button', { name: 'はじめる', exact: true }).click()
    await page.getByRole('heading', { name: 'ホーム', exact: true }).waitFor()
    await page.getByRole('button', { name: 'スキップ', exact: true }).click()
    await checkLayout(page, 'home', viewport)
    await page.getByRole('link', { name: /たしざんのほし/ }).click()
    await page.getByRole('heading', { name: 'くさばなの おんしつ' }).waitFor()
    assert.ok(!(await page.locator('.home-mission-compact').innerText()).includes('のだん'))
    await checkLayout(page, 'addition-planet', viewport)
    await page.getByRole('link', { name: /おぼえる/ }).click()
    await page.getByRole('button', { name: /^くりあがりのたしざん/ }).click()
    await page.getByRole('button', { name: 'にゅうりょく', exact: true }).click()
    await page.getByRole('button', { name: '4たく', exact: true }).click()
    await checkStartLayout(page)
    await checkLayout(page, 'addition-ready', viewport)
    await page.getByRole('button', { name: 'すたーと！', exact: true }).click()
    await page.getByRole('heading', { name: /\d+ \+ \d+/ }).waitFor()
    await checkChoices(page, viewport)
    await page.getByRole('button', { name: /ひんと/, exact: false }).click()
    const dialog = page.getByRole('dialog', { name: 'ひんと', exact: true })
    await dialog.waitFor()
    const rect = await dialog.boundingBox()
    assert.ok(
      rect &&
        rect.x >= 0 &&
        rect.y >= 0 &&
        rect.x + rect.width <= viewport.width + 1 &&
        rect.y + rect.height <= viewport.height + 1,
      'hint dialog exceeds viewport',
    )
    await checkLayout(page, 'addition-hint', viewport)
    await page.getByRole('button', { name: 'ひんとをとじる' }).click()
    await checkChoices(page, viewport)
    const prompt = await page.locator('#question-title').innerText()
    const digits = prompt.match(/(\d+)\s*\+\s*(\d+)/)
    assert.ok(digits)
    await checkAnswer(page, String(Number(digits[1]) + Number(digits[2])), 'correct')

    await page.goto(`${baseUrl}#/home`)
    await page.getByRole('link', { name: /かけざんのほし/ }).click()
    await page.getByRole('link', { name: /おぼえる/ }).click()
    await page.getByRole('button', { name: 'スタート！', exact: true }).click()
    await page.getByRole('heading', { name: /\d+ × \d+/ }).waitFor()
    await checkChoices(page, viewport)
    await checkLayout(page, 'multiplication-practice', viewport)
    const multiplication = (await page.locator('#question-title').innerText()).match(/(\d+)\s*×\s*(\d+)/)
    assert.ok(multiplication)
    await checkAnswer(page, String(Number(multiplication[1]) * Number(multiplication[2])), 'correct')

    await page.evaluate(() => {
      const save = JSON.parse(localStorage.getItem('kukucchi-save-v1'))
      const id = 'divide:divide-with-remainder:13/4'
      save.progress.facts[id] = {
        id,
        operation: 'division',
        areaId: 'divide-with-remainder',
        left: 13,
        right: 4,
        correctCount: 0,
        incorrectCount: 1,
        consecutiveCorrect: 0,
        averageResponseTimeMs: 1000,
        bestResponseTimeMs: null,
        lastAnsweredAt: '2026-10-01T09:00:00.000Z',
        nextReviewAt: null,
        masteryLevel: 1,
        recentResults: [],
        firstIncorrectAt: '2026-10-01T09:00:00.000Z',
        overcomeAt: null,
      }
      localStorage.setItem('kukucchi-save-v1', JSON.stringify(save))
    })
    await page.goto(`${baseUrl}#/review?planet=divide`)
    await page.reload()
    await page.getByRole('heading', { name: 'ふくしゅう', exact: true }).waitFor()
    await page.getByRole('button', { name: 'ふくしゅうすたーと' }).click()
    await page.getByRole('heading', { name: /÷/ }).waitFor()
    await checkChoices(page, viewport)
    await checkLayout(page, 'division-review', viewport)
    await checkAnswer(page, '2あまり5', 'incorrect')

    await page.goto(`${baseUrl}#/settings`)
    await page.getByText('せんせい・ほごしゃ', { exact: true }).click()
    await page.getByLabel('せんせいコード').fill('9631')
    await page.getByRole('button', { name: 'ひらく', exact: true }).click()
    await page.getByRole('button', { name: 'じっくり', exact: true }).click()
    const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('kukucchi-save-v1')))
    assert.equal(stored.version, 15)
    assert.equal(stored.settings.practiceQuestionCount, 5)
    assert.equal(stored.settings.practiceAnswerMode, 'choice')
    assert.ok(stored.player.titles.every((title) => !title.includes('たしざん')))
    await checkLayout(page, 'settings', viewport)
    reports.push({ viewport, passed: true })
    console.log(`Passed ${viewport.width}x${viewport.height}`)
    await context.close()
  }
  assert.deepEqual(errors, [], 'browser runtime errors')
  await writeFile(
    join(output, 'report.json'),
    JSON.stringify({ baseUrl, reports, errors }, null, 2),
  )
  console.log(JSON.stringify({ reports, output, errors }, null, 2))
} finally {
  await browser.close()
}
