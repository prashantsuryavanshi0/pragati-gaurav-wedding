/**
 * check-autoflip.mjs — verify auto-flip works without any user interaction.
 *
 * Usage: node scripts/check-autoflip.mjs [base-url]
 * Default: http://localhost:5173
 *
 * Requires the dev server to be running.
 * Exposes window.__flipbook.currentPage (set by FlipBook.jsx).
 */
import { chromium } from 'playwright'
import { mkdir } from 'fs/promises'
import { join } from 'path'

const BASE    = process.argv[2] ?? 'http://localhost:5173'
const OUT     = 'scripts/autoflip-screenshots'
const POLL_MS = 1000      // how often to sample currentPage
const RUN_S   = 75        // total seconds to watch auto-flip
const PAUSE_WAIT_S = 20   // seconds to wait after clicking Pause to verify no flip
const PLAY_WAIT_S  = 12   // seconds to wait after clicking Play for a flip to happen

const FAILURES = []
function fail(msg) { console.error('  ✗', msg); FAILURES.push(msg) }

async function runViewport(browser, vp) {
  const vpDir = join(OUT, vp.name)
  await mkdir(vpDir, { recursive: true })

  const page = await browser.newPage()
  await page.setViewportSize({ width: vp.width, height: vp.height })

  console.log(`\n${'═'.repeat(60)}`)
  console.log(`Viewport: ${vp.name}`)
  console.log('═'.repeat(60))

  await page.goto(BASE, { waitUntil: 'networkidle', timeout: 30_000 })
  await page.waitForTimeout(500)

  // Move mouse to center — proves that hover/mousemove does NOT pause auto-flip
  await page.mouse.move(Math.round(vp.width / 2), Math.round(vp.height / 2))
  console.log(`Mouse parked at center (${Math.round(vp.width / 2)}, ${Math.round(vp.height / 2)})`)

  // ── Phase 1: watch auto-flip for RUN_S seconds ─────────────────────────
  console.log(`\nWatching for ${RUN_S}s without touching anything…`)

  const timeline = []  // { t, page }
  let prevPage   = -1
  const t0       = Date.now()

  for (let s = 0; s < RUN_S; s++) {
    await page.waitForTimeout(POLL_MS)
    const cur = await page.evaluate(() => window.__flipbook?.currentPage ?? -1)
    const elapsed = ((Date.now() - t0) / 1000).toFixed(1)

    if (cur !== prevPage) {
      const entry = { t: parseFloat(elapsed), page: cur }
      timeline.push(entry)
      console.log(`  t=${elapsed.padStart(5)}s  →  page ${cur}`)
      prevPage = cur

      // Screenshot on each page change
      await page.screenshot({ path: join(vpDir, `page-${cur}-at-${elapsed}s.png`) })
    }
  }

  // Verify we saw at least 5 distinct pages (covers → blessings)
  const seen = [...new Set(timeline.map(e => e.page))]
  if (seen.length < 5) {
    fail(`[${vp.name}] Only saw ${seen.length} unique pages in ${RUN_S}s: [${seen.join(', ')}]`)
  } else {
    console.log(`\n  ✓ Saw ${seen.length} unique pages: [${seen.join(', ')}]`)
  }

  // Verify no long gaps (no page stuck for > max-dwell + 4s safety margin)
  let maxGap = 0
  for (let i = 1; i < timeline.length; i++) {
    const gap = timeline[i].t - timeline[i - 1].t
    if (gap > maxGap) maxGap = gap
  }
  console.log(`  Max dwell gap: ${maxGap.toFixed(1)}s`)
  if (timeline.length > 1 && maxGap > 14) {
    fail(`[${vp.name}] Page stuck for ${maxGap.toFixed(1)}s (expected ≤13s)`)
  } else if (timeline.length > 1) {
    console.log(`  ✓ Max dwell gap ${maxGap.toFixed(1)}s is within expected range`)
  }

  // ── Phase 2: Pause button ──────────────────────────────────────────────
  console.log(`\nTesting Pause button…`)

  // Wait until the page has been stable (no flip) for at least 2 consecutive
  // seconds. This ensures we click Pause right after a flip completes, giving
  // us the full dwell window before the next timer fires.
  {
    let lastSeen = -1, streak = 0
    while (streak < 2) {
      await page.waitForTimeout(1000)
      const c = await page.evaluate(() => window.__flipbook?.currentPage ?? -1)
      if (c === lastSeen) streak++
      else { lastSeen = c; streak = 0 }
    }
    console.log(`  Page stable at ${lastSeen} — proceeding to Pause test`)
  }

  const pauseBtn = page.locator('[aria-label="Pause auto flip"]')

  if (await pauseBtn.count() === 0) {
    fail(`[${vp.name}] Pause button not found`)
  } else {
    const pageBeforePause = await page.evaluate(() => window.__flipbook?.currentPage)
    await pauseBtn.click()
    console.log(`  Clicked Pause on page ${pageBeforePause}`)

    await page.waitForTimeout(PAUSE_WAIT_S * 1000)
    const pageAfterPause = await page.evaluate(() => window.__flipbook?.currentPage)

    if (pageAfterPause !== pageBeforePause) {
      fail(`[${vp.name}] Page changed while paused: ${pageBeforePause} → ${pageAfterPause}`)
    } else {
      console.log(`  ✓ Stayed on page ${pageBeforePause} for ${PAUSE_WAIT_S}s while paused`)
    }

    // ── Phase 3: Play button ───────────────────────────────────────────────
    console.log(`\nTesting Play button…`)
    const playBtn = page.locator('[aria-label="Resume auto flip"]')
    if (await playBtn.count() === 0) {
      fail(`[${vp.name}] Play button not found after pausing`)
    } else {
      await playBtn.click()
      console.log(`  Clicked Play`)

      await page.waitForTimeout(PLAY_WAIT_S * 1000)
      const pageAfterPlay = await page.evaluate(() => window.__flipbook?.currentPage)

      if (pageAfterPlay === pageAfterPause) {
        fail(`[${vp.name}] Auto-flip did not resume after Play (still on page ${pageAfterPause})`)
      } else {
        console.log(`  ✓ Resumed: advanced from page ${pageAfterPause} to ${pageAfterPlay}`)
      }
    }
  }

  await page.screenshot({ path: join(vpDir, 'final-after-play.png') })
  await page.close()
}

async function main() {
  await mkdir(OUT, { recursive: true })
  const browser = await chromium.launch()

  const VIEWPORTS = [
    { name: '1920x880', width: 1920, height: 880 },
    { name: '390x844',  width: 390,  height: 844 },
  ]

  for (const vp of VIEWPORTS) {
    await runViewport(browser, vp)
  }

  await browser.close()

  console.log(`\n${'═'.repeat(60)}`)
  if (FAILURES.length === 0) {
    console.log('✓ All auto-flip checks passed.')
  } else {
    console.error(`✗ ${FAILURES.length} failure(s):`)
    FAILURES.forEach(f => console.error('  ', f))
    process.exitCode = 1
  }
  console.log(`Screenshots: ${OUT}/`)
}

main().catch(err => { console.error(err); process.exit(1) })
