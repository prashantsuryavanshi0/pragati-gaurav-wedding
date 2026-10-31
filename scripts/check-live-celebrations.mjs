import { chromium, devices } from 'playwright'
import { mkdir } from 'fs/promises'

const OUT = 'scripts/autoflip-screenshots'
await mkdir(OUT, { recursive: true }).catch(() => {})

const browser = await chromium.launch()
const ctx  = await browser.newContext({ ...devices['Pixel 7'] })
const page = await ctx.newPage()

await page.goto('https://prashantsuryavanshi0.github.io/pragati-gaurav-wedding/#celebrations', {
  waitUntil: 'networkidle', timeout: 30000,
})
await page.waitForTimeout(1000)

const info = await page.evaluate(() => {
  const cards = document.querySelectorAll('#celebrations [class*="card"]')
  const navActive = document.querySelector('[class*="active"]')?.textContent?.trim()
  return { cardCount: cards.length, navActive }
})

console.log('Cards found:', info.cardCount)
console.log('Active nav:', info.navActive)

await page.screenshot({ path: `${OUT}/live-celebrations-pixel7.png` })
console.log('Screenshot saved.')
await browser.close()
