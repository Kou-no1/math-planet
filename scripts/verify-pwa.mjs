import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { cp, mkdir, readFile, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { join, resolve, extname } from 'node:path'
import { spawnSync } from 'node:child_process'

const { chromium } = createRequire(import.meta.url)(
  process.env.PLAYWRIGHT_MODULE ?? 'playwright',
)
const output = resolve(
  process.env.QA_OUTPUT_DIR ?? join(tmpdir(), `keisan-pwa-${Date.now()}`),
)
await mkdir(output, { recursive: true })
const buildA = join(output, 'build-A')
const buildB = join(output, 'build-B')
await cp(resolve('dist'), buildA, { recursive: true })
let current = buildA
const mime = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.webmanifest': 'application/manifest+json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
}
const server = createServer(async (request, response) => {
  const path = new URL(request.url, 'http://localhost').pathname
  response.setHeader('Cache-Control', 'no-cache')
  if (path === '/guide/' || path === '/guide/sw.js') {
    response.setHeader(
      'Content-Type',
      path.endsWith('.js') ? 'text/javascript' : 'text/html',
    )
    response.end(
      path.endsWith('.js')
        ? 'self.addEventListener("install", () => {});'
        : '<!doctype html><title>Other app</title><h1>Other app</h1>',
    )
    return
  }
  if (!path.startsWith('/math-planet/')) {
    response.writeHead(404)
    response.end()
    return
  }
  const relative =
    decodeURIComponent(path.slice('/math-planet/'.length)) || 'index.html'
  const file = resolve(current, relative)
  if (
    !file.startsWith(`${resolve(current)}\\`) &&
    !file.startsWith(`${resolve(current)}/`)
  ) {
    response.writeHead(404)
    response.end()
    return
  }
  try {
    response.setHeader(
      'Content-Type',
      mime[extname(file)] ?? 'application/octet-stream',
    )
    response.end(await readFile(file))
  } catch {
    response.writeHead(404)
    response.end('Not found')
  }
})
await new Promise((done) => server.listen(0, '127.0.0.1', done))
const origin = `http://127.0.0.1:${server.address().port}`
const base = `${origin}/math-planet/`
const browser = await chromium.launch({
  channel: 'msedge',
  headless: true,
  args: ['--mute-audio'],
})
const report = {
  browser: browser.version(),
  base,
  buildA: null,
  cache: null,
  checks: [],
  layouts: [],
  expectedErrors: [],
}
const unexpected = []
const check = (label) => {
  report.checks.push(label)
  console.log(`PASS ${label}`)
}
const collectErrors = (page) => {
  page.on('pageerror', (error) => unexpected.push(error.message))
  page.on('request', (request) => {
    if (
      /^https?:/.test(request.url()) &&
      new URL(request.url()).origin !== origin
    )
      unexpected.push(`external request: ${request.url()}`)
  })
}
async function ready(page) {
  await page.waitForFunction(async () => {
    const r = await navigator.serviceWorker.getRegistration('/math-planet/')
    return r?.active?.state === 'activated'
  })
  await page.waitForFunction(() =>
    document.body.textContent.includes('オフライン準備ができています'),
  )
}
async function home(page) {
  await page.goto(`${base}#/home`)
  await page.getByRole('heading', { name: 'ホーム', exact: true }).waitFor()
}
async function onboarding(page) {
  await page.goto(base)
  await page
    .getByRole('heading', { name: 'けいさんのほし', exact: true })
    .waitFor()
  await page.getByLabel('よびな', { exact: true }).fill('みらい')
  await page.getByRole('button', { name: 'はじめる', exact: true }).click()
  await page.getByRole('button', { name: 'スキップ', exact: true }).click()
  await ready(page)
}
async function learn(page, input = false) {
  await home(page)
  await page.goto(`${base}#/learn`)
  await page.getByRole('button', { name: 'スタート！', exact: true }).waitFor()
  if (input)
    await page.getByRole('button', { name: '入力', exact: true }).click()
  await page.getByRole('button', { name: 'スタート！', exact: true }).click()
  await page.locator('#question-title').waitFor()
}
async function answer(page) {
  const text = await page.locator('#question-title').innerText()
  const match = text.match(/(\d+)\s*×\s*(\d+)/)
  assert.ok(match, text)
  await page
    .getByRole('button', {
      name: String(Number(match[1]) * Number(match[2])),
      exact: true,
    })
    .click()
  await page.waitForTimeout(1100)
}
async function geometry(page, label, viewport) {
  const data = await page.evaluate(() => ({
    width: innerWidth,
    document: document.documentElement.scrollWidth,
    body: document.body.scrollWidth,
  }))
  assert.ok(
    data.document <= data.width + 2 && data.body <= data.width + 2,
    `${label} overflows: ${JSON.stringify(data)}`,
  )
  for (const element of await page
    .locator('button:visible, a.icon-button:visible, a.primary-action:visible')
    .all()) {
    const rect = await element.boundingBox()
    assert.ok(
      rect && rect.height >= 43.5,
      `${label}: undersized button ${await element.innerText()} ${JSON.stringify(rect)}`,
    )
  }
  await page.screenshot({
    path: join(output, `${viewport.width}-${label}.png`),
    fullPage: true,
  })
  report.layouts.push(`${viewport.width}x${viewport.height} ${label}`)
}
async function choices(page, viewport) {
  const buttons = page.locator('.choice-grid button')
  assert.equal(await buttons.count(), 4)
  for (const button of await buttons.all()) {
    const r = await button.boundingBox()
    assert.ok(
      r &&
        r.x >= 0 &&
        r.y >= 0 &&
        r.x + r.width <= viewport.width + 1 &&
        r.y + r.height <= viewport.height + 1,
      `choice outside viewport: ${JSON.stringify(r)}`,
    )
    assert.ok(
      await button.evaluate((el) => {
        const r = el.getBoundingClientRect()
        return el.contains(
          document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2),
        )
      }),
      'choice covered',
    )
  }
}

async function setupGeometry(page) {
  const copy = await page.locator('.mode-start-copy').boundingBox()
  const options = await page.locator('.mode-start-options').boundingBox()
  const actions = await page.locator('.mode-start-actions').boundingBox()
  assert.ok(
    copy.y + copy.height <= options.y + 1,
    'setup header overlaps choices',
  )
  assert.ok(
    options.y + options.height <= actions.y + 1,
    'setup choices overlap start',
  )
  assert.ok(
    await page.locator('.mode-start-options > div').evaluateAll((panels) => {
      const rects = panels.map((panel) => panel.getBoundingClientRect())
      return panels.every((panel, index) => {
        const bounds = rects[index]
        const controlsFit = [...panel.querySelectorAll('button')].every(
          (button) => {
            const rect = button.getBoundingClientRect()
            return (
              rect.left >= bounds.left &&
              rect.right <= bounds.right + 1 &&
              rect.top >= bounds.top &&
              rect.bottom <= bounds.bottom + 1
            )
          },
        )
        return (
          controlsFit &&
          rects.every(
            (rect, other) =>
              other === index ||
              rect.right <= bounds.left + 1 ||
              rect.left >= bounds.right - 1 ||
              rect.bottom <= bounds.top + 1 ||
              rect.top >= bounds.bottom - 1,
          )
        )
      })
    }),
    'setup panel boundaries overlap or contain overflowing buttons',
  )
  const label = page.locator('.learn-practice-label')
  if (await label.count())
    assert.ok(
      await label.evaluate(
        (element) =>
          element.getBoundingClientRect().height <=
            parseFloat(getComputedStyle(element).lineHeight) + 1 &&
          element.scrollWidth <= element.clientWidth + 1,
      ),
      'practice label should not split into isolated characters',
    )
  for (const tab of await page.locator('.learn-kind-segmented button').all()) {
    assert.ok(
      (await tab.boundingBox()).width >= 95,
      'learn tab is squeezed instead of wrapping',
    )
  }
}
async function useFixture(context, fixture) {
  await context.addInitScript((data) => {
    if (!localStorage.getItem('kukucchi-save-v1'))
      localStorage.setItem('kukucchi-save-v1', JSON.stringify(data))
  }, fixture)
}

try {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
  })
  const page = await context.newPage()
  collectErrors(page)
  await onboarding(page)
  assert.equal(
    await page.locator('[data-testid="install-reminder"]').count(),
    0,
  )
  const manifest = await (
    await context.request.get(`${base}manifest.webmanifest`)
  ).json()
  assert.equal(manifest.name, 'けいさんのほし')
  assert.equal(manifest.short_name, manifest.name)
  assert.equal(await page.title(), manifest.name)
  for (const name of ['application-name', 'apple-mobile-web-app-title'])
    assert.equal(
      await page.locator(`meta[name="${name}"]`).getAttribute('content'),
      manifest.name,
    )
  const favicon = await page.locator('link[rel="icon"]').getAttribute('href')
  const appleIcon = await page
    .locator('link[rel="apple-touch-icon"]')
    .getAttribute('href')
  assert.equal(favicon, '/math-planet/icons/keisan-no-hoshi-v2.svg')
  assert.equal(appleIcon, '/math-planet/icons/keisan-no-hoshi-apple-180-v2.png')
  assert.equal(
    (await context.request.get(new URL(favicon, base).href)).status(),
    200,
  )
  assert.equal(manifest.lang, 'ja')
  assert.equal(manifest.start_url, '/math-planet/')
  assert.equal(manifest.scope, '/math-planet/')
  assert.equal(manifest.id, '/math-planet/')
  assert.equal(manifest.display, 'standalone')
  for (const icon of [
    ...manifest.icons,
    { src: 'icons/keisan-no-hoshi-apple-180-v2.png', sizes: '180x180' },
  ]) {
    const response = await context.request.get(new URL(icon.src, base).href)
    assert.ok(
      icon.src.startsWith('icons/keisan-no-hoshi-') &&
        icon.src.endsWith('-v2.png'),
    )
    assert.equal(response.status(), 200)
    const bytes = await response.body()
    const size = Number(icon.sizes.split('x')[0])
    assert.equal(bytes.readUInt32BE(16), size)
    assert.equal(bytes.readUInt32BE(20), size)
  }
  const scope = await page.evaluate(
    async () => (await navigator.serviceWorker.getRegistration()).scope,
  )
  assert.equal(scope, base)
  report.buildA = await page.locator('html').getAttribute('data-pwa-build')
  report.cache = JSON.parse(
    await readFile(join(buildA, 'pwa-cache-report.json'), 'utf8'),
  )
  assert.ok(report.cache.files.some((entry) => /LearnPage/.test(entry.url)))
  assert.ok(report.cache.files.some((entry) => /ResultPage/.test(entry.url)))
  check(
    'Japanese browser/Apple/manifest names, versioned subpath icons, scope, PNG dimensions, actual cache graph',
  )
  await page.evaluate(() => {
    const data = JSON.parse(localStorage.getItem('kukucchi-save-v1'))
    data.settings.soundEnabled = false
    data.settings.speechEnabled = false
    data.settings.reduceMotion = true
    data.settings.dailyBudgetMinutes = 0
    data.settings.practiceQuestionCount = 5
    data.tutorial.modeTipsSeen = ['learn', 'speed', 'rocket']
    localStorage.setItem('kukucchi-save-v1', JSON.stringify(data))
  })
  await page.reload()
  const fixture = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('kukucchi-save-v1')),
  )
  await page.reload() // Controlled cold start after preparing, not an already loaded React view.
  await context.setOffline(true)
  await page.reload()
  await page.getByRole('heading', { name: 'ホーム', exact: true }).waitFor()
  await learn(page)
  for (let i = 0; i < 5; i++) await answer(page)
  await page.getByRole('button', { name: 'けっかへ', exact: true }).click()
  await page
    .getByRole('heading', { name: /けっか|結果/ })
    .first()
    .waitFor()
  const completed = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('kukucchi-save-v1')),
  )
  assert.ok(
    completed.progress.history.some(
      (entry) => entry.mode === 'learn' && entry.totalQuestions === 5,
    ),
  )
  assert.ok(Object.keys(completed.progress.facts).length >= 5)
  assert.ok(completed.player.coins > fixture.player.coins)
  await home(page)
  await page.locator('[data-testid="install-reminder"]').waitFor()
  await page.getByRole('button', { name: '今はしない', exact: true }).click()
  await page.reload()
  assert.equal(
    await page.locator('[data-testid="install-reminder"]').count(),
    0,
  )
  assert.ok(
    await page.evaluate(
      () =>
        JSON.parse(localStorage.getItem('keisan-no-hoshi-pwa-install-v1'))
          .dismissedUntil > Date.now(),
    ),
  )
  await context.setOffline(false)
  check(
    'offline cold reload -> lazy practice -> five correct answers -> saved result/reward -> delayed reminder/dismissal',
  )
  await context.close()

  for (const viewport of [
    { width: 320, height: 568 },
    { width: 360, height: 740 },
    { width: 390, height: 844 },
    { width: 430, height: 932 },
    { width: 768, height: 1024 },
    { width: 1366, height: 768 },
  ]) {
    const c = await browser.newContext({ viewport })
    await useFixture(c, fixture)
    const p = await c.newPage()
    collectErrors(p)
    await home(p)
    await geometry(p, 'home', viewport)
    await p
      .getByRole('button', {
        name: 'ホーム画面に追加・オフライン',
        exact: true,
      })
      .click()
    await p.getByRole('dialog').waitFor()
    await p
      .getByText('SNSの中のブラウザ・追加できないとき', { exact: true })
      .click()
    await geometry(p, 'install-help', viewport)
    await p.getByRole('button', { name: 'とじる', exact: true }).click()
    assert.ok(
      await p
        .getByRole('button', {
          name: 'ホーム画面に追加・オフライン',
          exact: true,
        })
        .evaluate((element) => element === document.activeElement),
      'dialog must restore focus',
    )
    await p.goto(`${base}#/learn?planet=add`)
    await p.getByRole('button', { name: 'すたーと！', exact: true }).waitFor()
    await geometry(p, 'addition-ready', viewport)
    const selected = await p
      .getByRole('button', { name: '4たく', exact: true })
      .boundingBox()
    const start = await p
      .getByRole('button', { name: 'すたーと！', exact: true })
      .boundingBox()
    assert.ok(
      selected.y + selected.height <= start.y,
      'answer mode overlaps start',
    )
    await p.getByRole('button', { name: 'すたーと！', exact: true }).click()
    await p.locator('#question-title').waitFor()
    await geometry(p, 'addition-choice', viewport)
    await choices(p, viewport)
    await learn(p, true)
    await p.getByRole('button', { name: '7', exact: true }).click()
    assert.equal(
      await p.locator('.keypad input').count(),
      0,
      'own keypad must not summon a second native keyboard',
    )
    await geometry(p, 'integer-keypad', viewport)
    for (const path of ['custom', 'book']) {
      await p.goto(`${base}#/${path}`)
      await p
        .getByRole('heading', {
          name: path === 'custom' ? 'カスタム' : '図かん',
          exact: true,
        })
        .waitFor()
      await geometry(p, path, viewport)
      if (path === 'custom') {
        assert.ok(
          await p.locator('.custom-item-card').evaluateAll((cards) =>
            cards.every((card) => {
              const bounds = card.getBoundingClientRect()
              return [...card.children].every((child) => {
                const rect = child.getBoundingClientRect()
                return (
                  rect.top >= bounds.top &&
                  rect.bottom <= bounds.bottom &&
                  rect.left >= bounds.left &&
                  rect.right <= bounds.right
                )
              })
            }),
          ),
          'custom card content overlaps another card',
        )
      }
    }
    await p.goto(`${base}#/settings`)
    await p.getByRole('heading', { name: 'せってい', exact: true }).waitFor()
    await geometry(p, 'settings', viewport)
    await home(p)
    await p.goto(`${base}#/learn?planet=multiply`)
    await p.getByRole('button', { name: '九九', exact: true }).waitFor()
    for (const [label, key] of [
      ['九九', 'kuku'],
      ['たしざん', 'add'],
      ['わりざん', 'divide'],
      ['平方数', 'square'],
      ['円周率', 'pi'],
    ]) {
      await p.getByRole('button', { name: label, exact: true }).click()
      assert.equal(
        await p
          .getByRole('button', { name: label, exact: true })
          .getAttribute('aria-pressed'),
        'true',
      )
      await setupGeometry(p)
      await geometry(p, `learn-setup-${key}`, viewport)
    }
    for (const planet of [
      'multiply',
      'add',
      'subtract',
      'divide',
      'decimal',
      'fraction',
    ]) {
      await p.goto(`${base}#/planet/${planet}`)
      await p.locator('.planet-mode-grid .mode-description').first().waitFor()
      const cards = p.locator('.planet-mode-card:has(.mode-description)')
      assert.equal(await cards.count(), 3)
      assert.ok(
        await cards.evaluateAll((elements) =>
          elements.every((card) => {
            const bounds = card.getBoundingClientRect()
            if (
              getComputedStyle(card.querySelector('.mode-description'))
                .color !== getComputedStyle(card.querySelector('strong')).color
            )
              return false
            return [...card.children].every((child) => {
              const rect = child.getBoundingClientRect()
              return (
                rect.left >= bounds.left &&
                rect.right <= bounds.right + 1 &&
                rect.top >= bounds.top &&
                rect.bottom <= bounds.bottom + 1 &&
                child.scrollWidth <= child.clientWidth + 1
              )
            })
          }),
        ),
        `${planet} mode card text overflows its frame`,
      )
      await cards
        .first()
        .screenshot({
          path: join(output, `${viewport.width}-menu-${planet}-card.png`),
        })
      await geometry(p, `menu-${planet}`, viewport)
    }
    await p.goto(`${base}#/settings`)
    await p.getByRole('heading', { name: 'せってい', exact: true }).waitFor()
    await p.getByLabel('キャラのなまえ', { exact: true }).focus()
    if (viewport.width < 500) {
      await p.setViewportSize({
        width: viewport.width,
        height: Math.max(320, viewport.height - 280),
      })
      await p
        .getByLabel('キャラのなまえ', { exact: true })
        .scrollIntoViewIfNeeded()
      await geometry(p, 'keyboard-height-simulation', {
        ...viewport,
        height: Math.max(320, viewport.height - 280),
      })
      await p.setViewportSize({
        width: viewport.height,
        height: viewport.width,
      })
      await geometry(p, 'landscape', {
        width: viewport.height,
        height: viewport.width,
      })
    }
    console.log(`PASS layout ${viewport.width}x${viewport.height}`)
    await c.close()
  }
  check(
    'six viewport layouts, all five learn tabs and setup frames, descriptions on six planet menus, choice hit tests, keypad, reduced viewport and rotation simulations',
  )

  for (const scenario of ['get-denied', 'set-quota', 'corrupt', 'future']) {
    const c = await browser.newContext({ serviceWorkers: 'block' })
    await c.addInitScript(
      ({ scenario, fixture }) => {
        const store = localStorage
        const raw =
          scenario === 'corrupt'
            ? '{broken'
            : JSON.stringify({
                ...fixture,
                ...(scenario === 'future' ? { version: 99 } : {}),
              })
        store.setItem('kukucchi-save-v1', raw)
        window.__original = raw
        window.__store = store
        if (scenario === 'get-denied')
          Object.defineProperty(window, 'localStorage', {
            get() {
              throw new DOMException('denied', 'SecurityError')
            },
          })
        if (scenario === 'set-quota')
          Storage.prototype.setItem = () => {
            throw new DOMException('full', 'QuotaExceededError')
          }
      },
      { scenario, fixture },
    )
    const p = await c.newPage()
    collectErrors(p)
    await p.goto(base)
    if (scenario === 'set-quota') {
      await p.getByRole('heading', { name: 'ホーム', exact: true }).waitFor()
      await p.goto(`${base}#/settings`)
      await p.getByLabel('効果音', { exact: true }).click()
    }
    await p.getByRole('alert').waitFor()
    await p
      .getByRole('button', { name: 'バックアップ・ひきつぎ', exact: true })
      .click()
    const recovery = p.getByRole('dialog', {
      name: 'きろくをまもる',
      exact: true,
    })
    await recovery.getByLabel('コピー用セーブデータ').waitFor()
    const backup = JSON.parse(
      await recovery.getByLabel('コピー用セーブデータ').inputValue(),
    )
    assert.equal(backup.version, 15)
    if (scenario === 'set-quota') assert.equal(backup.player.nickname, 'みらい')
    assert.equal(
      await p.evaluate(() => window.__store.getItem('kukucchi-save-v1')),
      await p.evaluate(() => window.__original),
    )
    if (scenario === 'corrupt' || scenario === 'future') {
      await p
        .getByText('よみこめなかった もとのきろく', { exact: true })
        .click()
      assert.equal(
        await p.getByLabel('元のセーブデータ').inputValue(),
        await p.evaluate(() => window.__original),
      )
    }
    await c.close()
    check(`${scenario}: readable UI, memory export, unchanged original`)
  }

  const missingContext = await browser.newContext({ serviceWorkers: 'block' })
  await useFixture(missingContext, fixture)
  const missingPage = await missingContext.newPage()
  missingPage.on('pageerror', (error) =>
    report.expectedErrors.push(error.message),
  )
  await missingPage.route('**/assets/LearnPage-*.js', (route) => route.abort())
  await home(missingPage)
  await missingPage.goto(`${base}#/learn`)
  await missingPage
    .getByRole('heading', {
      name: 'がめんを よみこめませんでした',
      exact: true,
    })
    .waitFor()
  assert.equal(
    JSON.parse(
      await missingPage.getByLabel('コピー用セーブデータ').inputValue(),
    ).player.nickname,
    'みらい',
  )
  await missingPage.unroute('**/assets/LearnPage-*.js')
  await missingPage
    .getByRole('button', {
      name: 'ほぞんして ホームをひらきなおす',
      exact: true,
    })
    .click()
  await missingPage
    .getByRole('heading', { name: 'ホーム', exact: true })
    .waitFor()
  await missingContext.close()
  check(
    'missing lazy chunk shows recovery/backup instead of a blank screen or forced reload',
  )

  const restoreContext = await browser.newContext({ serviceWorkers: 'block' })
  await useFixture(restoreContext, fixture)
  const restorePage = await restoreContext.newPage()
  collectErrors(restorePage)
  let confirmations = 0
  restorePage.on('dialog', async (dialog) => {
    confirmations++
    await dialog.accept()
  })
  await restorePage.goto(`${base}#/settings`)
  const original = await restorePage.evaluate(() =>
    localStorage.getItem('kukucchi-save-v1'),
  )
  await restorePage.getByLabel('貼り付け用セーブデータ').fill('{bad')
  await restorePage
    .getByRole('button', { name: 'データをひきつぐ', exact: true })
    .click()
  assert.equal(confirmations, 0)
  assert.equal(
    await restorePage.evaluate(() => localStorage.getItem('kukucchi-save-v1')),
    original,
  )
  const imported = {
    ...fixture,
    player: { ...fixture.player, nickname: 'ひきつぎ', coins: 123 },
  }
  await restorePage
    .getByLabel('貼り付け用セーブデータ')
    .fill(JSON.stringify(imported))
  await restorePage
    .getByRole('button', { name: 'データをひきつぐ', exact: true })
    .click()
  await restorePage.getByText('ひきつぎました。', { exact: true }).waitFor()
  assert.equal(confirmations, 1)
  assert.equal(
    await restorePage.evaluate(
      () => JSON.parse(localStorage.getItem('kukucchi-save-v1')).player.coins,
    ),
    123,
  )
  assert.equal(
    await restorePage.evaluate(() =>
      localStorage.getItem('kukucchi-save-before-restore'),
    ),
    original,
  )
  await restorePage.evaluate(() => {
    URL.createObjectURL = () => {
      throw new Error('download denied')
    }
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: async () => {
          throw new Error('clipboard denied')
        },
      },
      configurable: true,
    })
  })
  await restorePage
    .getByRole('button', { name: 'データをほぞんする', exact: true })
    .click()
  await restorePage
    .getByText('ファイルにできませんでした。したのデータを コピーしてね。', {
      exact: true,
    })
    .waitFor()
  await restorePage
    .getByRole('button', { name: 'データをコピーする', exact: true })
    .click()
  await restorePage
    .getByText(
      'コピーできませんでした。したのデータを えらんでコピーしてね。',
      { exact: true },
    )
    .waitFor()
  assert.equal(
    JSON.parse(
      await restorePage.getByLabel('コピー用セーブデータ').inputValue(),
    ).player.coins,
    123,
  )
  await restoreContext.close()
  check(
    'validated restore, exact pre-restore backup, download/clipboard failure alternatives',
  )

  const updateContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
  })
  await useFixture(updateContext, fixture)
  const primary = await updateContext.newPage()
  collectErrors(primary)
  await home(primary)
  await ready(primary)
  await primary.reload()
  await learn(primary)
  const guide = await updateContext.newPage()
  await guide.goto(`${origin}/guide/`)
  await guide.evaluate(async () => {
    await navigator.serviceWorker.register('/guide/sw.js', {
      scope: '/guide/',
    })
    const cache = await caches.open('other-app-cache')
    await cache.put('/guide/fixture.js', new Response('untouched'))
  })
  console.log('Building B for waiting-worker tests...')
  const build = spawnSync(
    process.execPath,
    ['node_modules/vite/bin/vite.js', 'build'],
    {
      env: { ...process.env, PWA_BUILD_ID: 'phase-18-qa-B' },
      encoding: 'utf8',
    },
  )
  assert.equal(build.status, 0, build.stdout + build.stderr)
  await cp(resolve('dist'), buildB, { recursive: true })
  current = buildB
  await primary.bringToFront()
  await primary.evaluate(async () => {
    await (
      await navigator.serviceWorker.getRegistration('/math-planet/')
    ).update()
  })
  await primary.waitForFunction(
    async () =>
      !!(await navigator.serviceWorker.getRegistration('/math-planet/'))
        ?.waiting,
  )
  assert.equal(
    await primary.locator('html').getAttribute('data-pwa-build'),
    report.buildA,
  )
  assert.equal(await primary.locator('[data-testid="pwa-update"]').count(), 0)
  await answer(primary)
  check(
    'new build waits during play without reloading or interrupting an answer',
  )
  // Finish instead of throwing away an active run; then return home via the result.
  for (let i = 1; i < 5; i++) await answer(primary)
  await primary.getByRole('button', { name: 'けっかへ', exact: true }).click()
  await primary
    .getByRole('heading', { name: /けっか|結果/ })
    .first()
    .waitFor()
  assert.equal(await primary.locator('[data-testid="pwa-update"]').count(), 0)
  await primary
    .getByRole('link', { name: /ホーム/ })
    .last()
    .click()
  await primary.locator('[data-testid="pwa-update"]').waitFor()
  await updateContext.setOffline(true)
  await primary.getByRole('link', { name: '図かん', exact: true }).click()
  await primary.getByRole('heading', { name: '図かん', exact: true }).waitFor()
  assert.equal(
    await primary.locator('html').getAttribute('data-pwa-build'),
    report.buildA,
  )
  await primary.getByRole('link', { name: 'もどる', exact: true }).click()
  await updateContext.setOffline(false)
  check(
    'postponed old-build unread book chunk still opens offline after server changes',
  )
  const savedBeforeUpdate = await primary.evaluate(() =>
    localStorage.getItem('kukucchi-save-v1'),
  )
  await primary.evaluate(() => {
    window.__setItem = Storage.prototype.setItem
    Storage.prototype.setItem = () => {
      throw new DOMException('full', 'QuotaExceededError')
    }
  })
  await primary
    .getByRole('button', { name: 'ほぞんして更新', exact: true })
    .click()
  await primary.getByRole('alert').waitFor()
  assert.equal(
    await primary.locator('html').getAttribute('data-pwa-build'),
    report.buildA,
  )
  assert.equal(await primary.locator('[data-testid="pwa-update"]').count(), 0)
  await primary.evaluate(() => {
    Storage.prototype.setItem = window.__setItem
  })
  await primary
    .getByRole('button', { name: 'ほぞんをためす', exact: true })
    .click()
  await primary.locator('[data-testid="pwa-update"]').waitFor()
  check(
    'waiting update stops on quota error and can retry saving without losing the session',
  )
  const peer = await updateContext.newPage()
  collectErrors(peer)
  await home(peer)
  await learn(peer)
  await primary.bringToFront()
  await primary
    .getByRole('button', { name: 'ほぞんして更新', exact: true })
    .click()
  await primary.getByText(/ほかの「けいさんのほし」のタブやアプリを/).waitFor()
  assert.equal(
    await peer.locator('html').getAttribute('data-pwa-build'),
    report.buildA,
  )
  assert.equal(
    await primary.locator('html').getAttribute('data-pwa-build'),
    report.buildA,
  )
  await peer.close()
  await primary
    .getByRole('button', { name: 'ほぞんして更新', exact: true })
    .click()
  await primary.waitForFunction(
    () => document.documentElement.dataset.pwaBuild === 'phase-18-qa-B',
  )
  await primary.getByRole('heading', { name: 'ホーム', exact: true }).waitFor()
  assert.equal(
    await primary.evaluate(() => localStorage.getItem('kukucchi-save-v1')),
    savedBeforeUpdate,
  )
  assert.equal(
    await guide.evaluate(async () =>
      (await caches.open('other-app-cache'))
        .match('/guide/fixture.js')
        .then((r) => r.text()),
    ),
    'untouched',
  )
  assert.ok(
    await guide.evaluate(
      async () => !!(await navigator.serviceWorker.getRegistration('/guide/')),
    ),
  )
  check(
    'active peer blocks update; single-app-window flush/update preserves saved results and unrelated app SW/cache',
  )
  await updateContext.close()
  assert.deepEqual(unexpected, [])
  await writeFile(join(output, 'report.json'), JSON.stringify(report, null, 2))
  console.log(`PWA QA passed. Report and screenshots: ${output}`)
} catch (error) {
  for (const [index, page] of browser
    .contexts()
    .flatMap((context) => context.pages())
    .entries()) {
    try {
      await page.screenshot({
        path: join(output, `failure-${index}.png`),
        fullPage: true,
      })
      await writeFile(
        join(output, `failure-${index}.txt`),
        await page.locator('body').innerText(),
      )
    } catch {
      /* Best-effort diagnostics. */
    }
  }
  await writeFile(
    join(output, 'failed.json'),
    JSON.stringify({ ...report, unexpected, failure: String(error) }, null, 2),
  )
  throw error
} finally {
  await browser.close()
  await new Promise((done) => server.close(done))
}
