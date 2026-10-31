import { chromium, devices } from 'playwright'

const browser = await chromium.launch()
const ctx  = await browser.newContext({ ...devices['Pixel 7'] })
const page = await ctx.newPage()

const errors = []
page.on('pageerror', e => errors.push(e.message))
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()) })

await page.goto('http://localhost:4173/pragati-gaurav-wedding/#celebrations', { waitUntil: 'networkidle', timeout: 15000 })
await page.waitForTimeout(2000)

const info = await page.evaluate(() => {
  const root = document.getElementById('root')
  const slots = document.querySelectorAll('[data-page-index]')
  return {
    rootChildren: root?.children.length,
    pageSlots: [...slots].map(s => ({
      idx: s.dataset.pageIndex,
      transform: s.style.transform,
      zIndex: s.style.zIndex,
      visible: s.style.transform !== 'translateX(200vw)',
    })),
    celebHeading: document.querySelector('#celebrations h2')?.textContent,
  }
})

console.log('Root children:', info.rootChildren)
console.log('Page slots:', JSON.stringify(info.pageSlots, null, 2))
console.log('Celebrations heading:', info.celebHeading)
console.log('JS errors:', errors)

await browser.close()
