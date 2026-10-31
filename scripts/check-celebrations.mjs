import { chromium, devices } from 'playwright'
import { mkdir } from 'fs/promises'

const OUT = 'scripts/autoflip-screenshots'
await mkdir(OUT, { recursive: true }).catch(() => {})

const VIEWPORTS = [
  { name: 'pixel7',     device: 'Pixel 7' },
  { name: 'iphoneSE',   device: 'iPhone SE' },
  { name: '360x740',    viewport: { width: 360, height: 740 } },
  { name: 'iphone13',   device: 'iPhone 13' },
  { name: 'ipad',       viewport: { width: 768, height: 1024 } },
  { name: 'desktop1920', viewport: { width: 1920, height: 880 } },
  { name: 'desktop1366', viewport: { width: 1366, height: 650 } },
]

const browser = await chromium.launch()

for (const cfg of VIEWPORTS) {
  const ctxOpts = cfg.device ? { ...devices[cfg.device] } : { viewport: cfg.viewport }
  const ctx  = await browser.newContext(ctxOpts)
  const page = await ctx.newPage()

  // Use local preview server (port 4173 = vite preview default)
  // Navigate directly to the celebrations page via hash
  await page.goto('http://localhost:4173/pragati-gaurav-wedding/#celebrations', { waitUntil: 'networkidle', timeout: 20000 })

  await page.waitForTimeout(500)
  await page.screenshot({ path: `${OUT}/celebrations-${cfg.name}.png`, fullPage: false })
  console.log(`✓ ${cfg.name}`)
  await ctx.close()
}

await browser.close()
console.log('\nDone. Screenshots in', OUT)
