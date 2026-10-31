import { chromium, devices } from 'playwright'
import { mkdir } from 'fs/promises'

const OUT = 'scripts/autoflip-screenshots'
await mkdir(OUT, { recursive: true }).catch(() => {})

const browser = await chromium.launch({ headless: false })
const ctx  = await browser.newContext({ ...devices['Pixel 7'] })
const page = await ctx.newPage()

const errors = []
page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()) })
page.on('pageerror', e => errors.push(e.message))

await page.goto('http://localhost:4173/pragati-gaurav-wedding/', { waitUntil: 'domcontentloaded', timeout: 15000 })
await page.waitForTimeout(2000)

const html = await page.evaluate(() => document.body.innerHTML.slice(0, 500))
console.log('Body HTML snippet:', html)
console.log('Console errors:', errors)

await page.screenshot({ path: `${OUT}/debug-home.png`, fullPage: false })
await browser.close()
