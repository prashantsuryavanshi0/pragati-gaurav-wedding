import { chromium } from 'playwright'

const browser = await chromium.launch()
const ctx  = await browser.newContext()
const page = await ctx.newPage()

const failed = []
const errors = []
page.on('requestfailed', r => failed.push(r.url()))
page.on('pageerror', e => errors.push(e.message))
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()) })

await page.goto('http://localhost:4173/pragati-gauuni-wedding/', { timeout: 10000 }).catch(() => {})
await page.goto('http://localhost:4173/pragati-gaurav-wedding/', { waitUntil: 'load', timeout: 10000 })
await page.waitForTimeout(3000)

const rootContent = await page.evaluate(() => document.getElementById('root')?.innerHTML?.slice(0, 300))
console.log('Root HTML:', rootContent || '(empty)')
console.log('Failed requests:', failed)
console.log('Errors:', errors.slice(0, 5))

await browser.close()
