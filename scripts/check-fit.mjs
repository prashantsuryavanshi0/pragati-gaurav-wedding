/**
 * check-fit.mjs — verify every FlipBook page fits within its viewport
 * Usage: node scripts/check-fit.mjs [base-url]
 * Default base-url: http://localhost:5173
 *
 * Navigates between pages by clicking the "next" arrow, checks each page fits,
 * tests keyboard navigation, checks the Maps link, and tests navbar links.
 */

import { chromium } from 'playwright'
import { mkdir } from 'fs/promises'
import { join } from 'path'

const BASE = process.argv[2] ?? 'http://localhost:5173'
const OUT  = 'scripts/fit-screenshots'

const VIEWPORTS = [
  { name: '1920x880',  width: 1920, height: 880  },
  { name: '1366x650',  width: 1366, height: 650  },
  { name: '768x1024',  width: 768,  height: 1024 },
  { name: '390x844',   width: 390,  height: 844  },
  { name: '360x740',   width: 360,  height: 740  },
]

const PAGE_NAMES  = ['hero', 'couple', 'celebrations', 'bigday', 'venue', 'blessings']
const FLIP_WAIT   = 3200   // ms to wait after a flip animation (2.6s + buffer)
const FAILURES    = []

function fail(msg) {
  console.error('  ✗', msg)
  FAILURES.push(msg)
}

async function waitForFlip(page) {
  await page.waitForTimeout(FLIP_WAIT)
}

async function getNavHeight(page) {
  return page.evaluate(() =>
    document.querySelector('nav')?.getBoundingClientRect().height ?? 52
  )
}

async function checkNoHorizontalScroll(page, label) {
  const overflow = await page.evaluate(() =>
    document.documentElement.scrollWidth > window.innerWidth + 2
  )
  if (overflow) {
    const sw = await page.evaluate(() => document.documentElement.scrollWidth)
    fail(`[${label}] horizontal scroll: scrollWidth=${sw}`)
  }
}

async function checkCurrentPageVisible(page, vpWidth, vpHeight, navH, pageIdx, label) {
  // The book container fills top:0 to bottom:0.
  // Content inside should not be cut above navH or below vpHeight.
  // We check that there's no overflow by looking at the active page slot.
  const result = await page.evaluate(({ navH, vpH }) => {
    const slot = document.querySelector('[data-page-index]:not([aria-hidden])')
      ?? document.querySelector('[data-page-index]')
    if (!slot) return { ok: false, reason: 'no page slot found' }
    const children = slot.querySelectorAll('section, footer')
    if (!children.length) return { ok: true }
    let minTop = Infinity, maxBot = -Infinity
    children.forEach(el => {
      const r = el.getBoundingClientRect()
      if (r.top < minTop) minTop = r.top
      if (r.bottom > maxBot) maxBot = r.bottom
    })
    if (minTop < navH - 2) return { ok: false, reason: `content top ${minTop.toFixed(0)}px is above nav bottom ${navH}px` }
    if (maxBot > vpH + 2)  return { ok: false, reason: `content bottom ${maxBot.toFixed(0)}px overflows viewport ${vpH}px` }
    return { ok: true }
  }, { navH, vpH: vpHeight })
  if (!result.ok) fail(`[${label}] page ${PAGE_NAMES[pageIdx]}: ${result.reason}`)
}

async function checkOnlyOneVideoPlaying(page, label) {
  const result = await page.evaluate(() => {
    const videos = [...document.querySelectorAll('video')]
    const playing = videos.filter(v => !v.paused && !v.ended && v.readyState > 2)
    return { count: playing.length, srcs: playing.map(v => v.currentSrc) }
  })
  if (result.count > 1) {
    fail(`[${label}] ${result.count} videos playing simultaneously: ${result.srcs.join(', ')}`)
  }
}

async function checkMapsLink(page, vpName) {
  const href = await page.evaluate(() => {
    const a = document.querySelector('a[href*="maps"]')
    return a ? a.href : null
  })
  if (!href) {
    fail(`[${vpName}] no maps link found on venue page`)
  } else if (!href.includes('maps')) {
    fail(`[${vpName}] maps link looks wrong: ${href}`)
  } else {
    console.log(`  ✓ maps link: ${href.slice(0, 70)}`)
  }
}

async function runViewport(browser, vp) {
  const vpDir = join(OUT, vp.name)
  await mkdir(vpDir, { recursive: true })

  const page = await browser.newPage()
  await page.setViewportSize({ width: vp.width, height: vp.height })
  await page.goto(BASE, { waitUntil: 'networkidle', timeout: 30000 })
  await page.waitForTimeout(800) // let initial animations settle

  const navH = await getNavHeight(page)
  const label = (pageName) => `${vp.name}/${pageName}`

  console.log(`\n── ${vp.name} (navH=${Math.round(navH)}px) ──`)

  // ── Page 0: Hero ───────────────────────────────────────────────────────────
  await page.screenshot({ path: join(vpDir, '00-hero.png') })
  await checkNoHorizontalScroll(page, label('hero'))
  await checkCurrentPageVisible(page, vp.width, vp.height, navH, 0, label('hero'))
  console.log(`  ✓ hero`)

  // ── Pages 1-5: navigate with next arrow ────────────────────────────────────
  for (let i = 1; i < PAGE_NAMES.length; i++) {
    const name = PAGE_NAMES[i]

    // Click the next arrow
    const nextBtn = page.locator('[aria-label="Next page"]')
    if (await nextBtn.count() === 0) {
      fail(`[${label(name)}] next arrow not found (still on page ${i-1})`)
      break
    }

    // Mid-flip screenshot (capture quickly after click)
    await nextBtn.click()
    await page.waitForTimeout(400)
    await page.screenshot({ path: join(vpDir, `${String(i).padStart(2,'0')}-${name}-mid-flip.png`) })

    await waitForFlip(page)
    await page.screenshot({ path: join(vpDir, `${String(i).padStart(2,'0')}-${name}.png`) })

    await checkNoHorizontalScroll(page, label(name))
    await checkCurrentPageVisible(page, vp.width, vp.height, navH, i, label(name))
    await checkOnlyOneVideoPlaying(page, label(name))

    // Check the maps link when on venue page (page index 4)
    if (i === 4) await checkMapsLink(page, vp.name)

    console.log(`  ✓ ${name}`)
  }

  // ── Keyboard navigation test ────────────────────────────────────────────────
  // We're on page 5 (blessings). Press ArrowLeft → should go to venue (4).
  await page.keyboard.press('ArrowLeft')
  await waitForFlip(page)
  const afterLeft = await page.evaluate(() => window.location.hash)
  if (afterLeft !== '#venue') {
    fail(`[${vp.name}] ArrowLeft from blessings → expected #venue, got ${afterLeft}`)
  } else {
    console.log(`  ✓ ArrowLeft: hash=${afterLeft}`)
  }

  // Press ArrowRight → should go back to blessings (5).
  await page.keyboard.press('ArrowRight')
  await waitForFlip(page)
  const afterRight = await page.evaluate(() => window.location.hash)
  if (afterRight !== '#blessings') {
    fail(`[${vp.name}] ArrowRight from venue → expected #blessings, got ${afterRight}`)
  } else {
    console.log(`  ✓ ArrowRight: hash=${afterRight}`)
  }

  // ── Navbar link test ────────────────────────────────────────────────────────
  // Click "The Couple" nav link → should jump to #couple
  const coupleLink = page.locator('nav a[href="#couple"]')
  if (await coupleLink.count() > 0) {
    await coupleLink.click()
    await waitForFlip(page)
    const afterNav = await page.evaluate(() => window.location.hash)
    if (afterNav !== '#couple') {
      fail(`[${vp.name}] navbar "The Couple" → expected #couple, got ${afterNav}`)
    } else {
      console.log(`  ✓ navbar link: hash=${afterNav}`)
    }
  } else {
    // Mobile: try burger menu first
    const burger = page.locator('[aria-label="Open menu"]')
    if (await burger.count() > 0) {
      await burger.click()
      await page.waitForTimeout(200)
      const drawerLink = page.locator('nav a[href="#couple"]')
      if (await drawerLink.count() > 0) {
        await drawerLink.click()
        await waitForFlip(page)
        const afterNav = await page.evaluate(() => window.location.hash)
        if (afterNav !== '#couple') {
          fail(`[${vp.name}] mobile navbar → expected #couple, got ${afterNav}`)
        } else {
          console.log(`  ✓ mobile navbar link: hash=${afterNav}`)
        }
      }
    }
  }

  await page.close()
}

async function main() {
  await mkdir(OUT, { recursive: true })
  const browser = await chromium.launch()

  for (const vp of VIEWPORTS) {
    await runViewport(browser, vp)
  }

  await browser.close()

  console.log('\n═══ check-fit results ═══')
  if (FAILURES.length === 0) {
    console.log('✓ All pages fit. No horizontal scroll. Videos: one at a time. Navigation: correct.')
  } else {
    console.error(`✗ ${FAILURES.length} issue(s):\n`)
    FAILURES.forEach(f => console.error('  ', f))
    process.exitCode = 1
  }
  console.log(`\nScreenshots: ${OUT}/`)
}

main().catch(err => { console.error(err); process.exit(1) })
