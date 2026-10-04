import { readFile, mkdir } from 'node:fs/promises'
import { createRequire } from 'node:module'

const { chromium } = createRequire(import.meta.url)(
  process.env.PLAYWRIGHT_MODULE ?? 'playwright',
)
const source = await readFile('public/icons/app-icon.svg', 'utf8')
await mkdir('public/icons', { recursive: true })
const browser = await chromium.launch({
  channel: process.env.QA_BROWSER_CHANNEL ?? 'msedge',
  headless: true,
})
try {
  for (const [name, size, maskable] of [
    ['pwa-192.png', 192, false],
    ['pwa-512.png', 512, false],
    ['pwa-maskable-512.png', 512, true],
    ['apple-touch-icon-180.png', 180, false],
  ]) {
    const page = await browser.newPage({
      viewport: { width: size, height: size },
      deviceScaleFactor: 1,
    })
    const art = maskable
      ? `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" fill="#102b45"/><g transform="translate(46 46) scale(.82)">${source.replace('<svg ', '<svg width="512" height="512" ')}</g></svg>`
      : source
    await page.setContent(
      `<style>body{margin:0}svg{display:block;width:100%;height:100%}</style>${art}`,
    )
    await page.screenshot({ path: `public/icons/${name}` })
    await page.close()
  }
} finally {
  await browser.close()
}
