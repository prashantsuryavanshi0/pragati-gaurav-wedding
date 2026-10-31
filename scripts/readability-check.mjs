import { chromium, devices } from 'playwright'
import { mkdir } from 'fs/promises'

const OUT = 'scripts/readability-screenshots'
await mkdir(OUT, { recursive: true }).catch(() => {})
const browser = await chromium.launch()
const pages_list = ['#hero','#couple','#celebrations','#bigday','#venue','#blessings']
const ctx = await browser.newContext({ ...devices['Pixel 7'] })
for (const hash of pages_list) {
  const page = await ctx.newPage()
  await page.goto(`https://prashantsuryavanshi0.github.io/pragati-gaurav-wedding/${hash}`, { waitUntil: 'networkidle', timeout: 30000 })
  await page.waitForTimeout(1200)
  const name = hash.replace('#','')
  await page.screenshot({ path: `${OUT}/${name}-pixel7.png` })
  console.log(`${name}: done`)
  await page.close()
}
await browser.close()
