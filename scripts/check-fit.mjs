/**
 * check-fit.mjs — verify every section fits within its viewport
 * Usage: node scripts/check-fit.mjs [base-url]
 * Default base-url: http://localhost:5173
 */

import { chromium } from 'playwright'
import { mkdir } from 'fs/promises'
import { join } from 'path'

const BASE = process.argv[2] ?? 'http://localhost:5173'
const OUT  = 'scripts/fit-screenshots'

const VIEWPORTS = [
  { name: '1920x1080', width: 1920, height: 1080 },
  { name: '1920x880',  width: 1920, height: 880  },
  { name: '1536x730',  width: 1536, height: 730  },
  { name: '1440x900',  width: 1440, height: 900  },
  { name: '1366x650',  width: 1366, height: 650  },
  { name: '1280x720',  width: 1280, height: 720  },
  { name: '1024x768',  width: 1024, height: 768  },
  { name: '820x1180',  width: 820,  height: 1180 },
  { name: '768x1024',  width: 768,  height: 1024 },
  { name: '412x915',   width: 412,  height: 915  },
  { name: '390x844',   width: 390,  height: 844  },
  { name: '375x667',   width: 375,  height: 667  },
  { name: '360x740',   width: 360,  height: 740  },
]

const SECTIONS = ['hero', 'couple', 'celebrations', 'bigday', 'venue']

const FAIL_THRESHOLD = 2 // px tolerance

async function main() {
  await mkdir(OUT, { recursive: true })

  const browser = await chromium.launch()
  const failures = []

  for (const vp of VIEWPORTS) {
    const vpDir = join(OUT, vp.name)
    await mkdir(vpDir, { recursive: true })

    const page = await browser.newPage()
    await page.setViewportSize({ width: vp.width, height: vp.height })
    await page.goto(BASE, { waitUntil: 'networkidle' })

    // Check horizontal overflow on full page
    const hasHScroll = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 2)
    if (hasHScroll) {
      const scrollW = await page.evaluate(() => document.documentElement.scrollWidth)
      failures.push(`[${vp.name}] HORIZONTAL SCROLL: scrollWidth=${scrollW} > viewportWidth=${vp.width}`)
    }

    for (const sectionId of SECTIONS) {
      const section = page.locator(`#${sectionId}`)
      const exists = await section.count()
      if (!exists) {
        console.warn(`  [${vp.name}] #${sectionId} not found, skipping`)
        continue
      }

      // Scroll section into view
      await section.scrollIntoViewIfNeeded()
      await page.waitForTimeout(300)

      // Check section height vs viewport height
      const box = await section.boundingBox()
      if (box) {
        const sectionH = Math.round(box.height)
        const vpH = vp.height
        if (sectionH > vpH + FAIL_THRESHOLD) {
          failures.push(`[${vp.name}] #${sectionId}: height=${sectionH}px > viewport=${vpH}px (overflow=${sectionH - vpH}px)`)
        }
      }

      // Screenshot
      await section.screenshot({ path: join(vpDir, `${sectionId}.png`) })
    }

    await page.close()
  }

  await browser.close()

  console.log('\n=== check-fit results ===')
  if (failures.length === 0) {
    console.log('✓ All sections fit within their viewports. No horizontal scroll detected.')
  } else {
    console.log(`✗ ${failures.length} issue(s) found:\n`)
    failures.forEach(f => console.log(' ', f))
    process.exitCode = 1
  }
  console.log(`\nScreenshots saved to: ${OUT}/`)
}

main().catch(err => { console.error(err); process.exit(1) })
