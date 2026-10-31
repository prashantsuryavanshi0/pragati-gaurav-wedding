import { chromium, devices } from 'playwright'
import { mkdir } from 'fs/promises'

await mkdir('scripts/autoflip-screenshots', { recursive: true }).catch(() => {})

const browser = await chromium.launch()
const ctx = await browser.newContext({ ...devices['Pixel 7'] })
const page = await ctx.newPage()

const imgLoads = {}
page.on('response', r => {
  if (r.url().includes('portrait')) imgLoads[r.url()] = r.status()
})

await page.goto('https://prashantsuryavanshi0.github.io/pragati-gaurav-wedding/', {
  waitUntil: 'networkidle', timeout: 30000,
})

// Navigate to Couple page (page index 1)
const nextBtn = page.locator('[aria-label="Next page"]').first()
await nextBtn.click()
await page.waitForTimeout(3500)

const imgs = await page.evaluate(() =>
  [...document.querySelectorAll('img')].map(img => ({
    src: img.src,
    naturalWidth: img.naturalWidth,
    complete: img.complete,
  }))
)

console.log('\nNetwork responses for portrait URLs:')
for (const [url, status] of Object.entries(imgLoads)) {
  console.log(`  ${status}  ${url}`)
}

console.log('\nImg elements found:')
for (const img of imgs) {
  const ok = img.naturalWidth > 0
  console.log(`  ${ok ? 'PASS' : 'FAIL'}  naturalWidth=${img.naturalWidth}  ${img.src.slice(-60)}`)
}

const screenshotPath = 'C:/Users/prash/AppData/Local/Temp/claude/c--Users-prash-OneDrive-Desktop-wedding-invitation-card/125c8622-912e-4bcf-88b0-adb965a910ba/scratchpad/couple-pixel7.png'
await page.screenshot({ path: screenshotPath, fullPage: false })
console.log(`\nScreenshot: ${screenshotPath}`)

await browser.close()
