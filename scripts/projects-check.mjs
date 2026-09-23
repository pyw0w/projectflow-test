import { chromium } from 'playwright'

/**
 * E2E check for the test "Projects" page (#/projects):
 * - toolbar: search + button in a row (desktop) / column below 420px, no overlap
 * - modal form: open, validate, create (private flag), close
 * - persistence: project survives a page reload
 * - live search filters the list
 * - delete removes the entry
 * Requires: dev server on :5199 (`npm run dev -- --port 5199`).
 */

const BASE = 'http://localhost:5199/projectflow-test/#/projects'
const results = []
const check = (name, pass, detail = '') => {
  results.push(pass)
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`)
}

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })

// Fresh state per run.
await page.goto(BASE, { waitUntil: 'networkidle' })
await page.evaluate(() => localStorage.clear())
await page.reload({ waitUntil: 'networkidle' })

// --- routing: both pages reachable, search page unchanged ---
await page.click('a[href="#/"]')
await page.waitForSelector('h1:has-text("Repo Search")')
check('route #/ shows Repo Search', true)
await page.click('a[href="#/projects"]')
await page.waitForSelector('h1:has-text("Projects")')
check('route #/projects shows Projects', true)

// --- empty state ---
check('empty state on fresh browser', await page.locator('[role="status"]').isVisible())

// --- toolbar layout (desktop row) ---
const search = page.locator('input[type="search"]')
const create = page.getByRole('button', { name: /new project/i })
const bS = await search.boundingBox()
const bC = await create.boundingBox()
const overlap = bS.x < bC.x + bC.width && bC.x < bS.x + bS.width && bS.y < bC.y + bC.height && bC.y < bS.y + bS.height
check('desktop: search and button do not overlap', !overlap)
check('desktop: toolbar is row', (await page.locator('div[class*="toolbar"]').first().evaluate((el) => getComputedStyle(el).flexDirection)) === 'row')

// --- modal form: validation ---
await create.click()
await page.waitForSelector('[role="dialog"]')
await page.click('button:has-text("Create project")')
check('empty name blocked with error', await page.locator('[role="alert"]').isVisible())
check('dialog stays open on invalid submit', await page.locator('[role="dialog"]').isVisible())

// --- create a private project ---
await page.fill('[role="dialog"] input:not([type="checkbox"]) >> nth=0', 'e2e-private-repo')
await page.fill('textarea', 'Created by projects-check')
await page.click('[role="dialog"] input[type="checkbox"]')
await page.click('button:has-text("Create project")')
await page.waitForSelector('[role="dialog"]', { state: 'detached' })
check('project card appears after submit', await page.locator('article:has-text("e2e-private-repo")').isVisible())
check('Private badge visible', await page.locator('article span[class*="privateBadge"]').isVisible())
check('counter shows 1', (await page.locator('span[class*="count"]').textContent()) === '1')

// --- persistence after reload ---
await page.reload({ waitUntil: 'networkidle' })
check('project survives reload (localStorage)', await page.locator('article:has-text("e2e-private-repo")').isVisible())

// --- live search ---
await search.fill('e2e')
check('search matches the project', await page.locator('article:has-text("e2e-private-repo")').isVisible())
await search.fill('does-not-exist')
check('search miss shows empty state', await page.locator('[role="status"]').isVisible())
await search.fill('')

// --- Escape closes the modal ---
await create.click()
await page.waitForSelector('[role="dialog"]')
await page.keyboard.press('Escape')
check('Escape closes the dialog', (await page.locator('[role="dialog"]').count()) === 0)

// --- delete ---
await page.click('button[aria-label="Delete project e2e-private-repo"]')
check('delete removes the card', (await page.locator('article').count()) === 0)
await page.reload({ waitUntil: 'networkidle' })
check('delete persists after reload', (await page.locator('article').count()) === 0)

await page.close()

// --- mobile 375px: column toolbar, no overlap ---
const mobile = await browser.newPage({ viewport: { width: 375, height: 700 } })
await mobile.goto(BASE, { waitUntil: 'networkidle' })
const mS = await mobile.locator('input[type="search"]').boundingBox()
const mC = await mobile.getByRole('button', { name: /new project/i }).boundingBox()
const mOverlap = mS.x < mC.x + mC.width && mC.x < mS.x + mS.width && mS.y < mC.y + mC.height && mC.y < mS.y + mS.height
check('375px: search and button do not overlap', !mOverlap)
check(
  '375px: toolbar is column',
  (await mobile.locator('div[class*="toolbar"]').first().evaluate((el) => getComputedStyle(el).flexDirection)) === 'column',
)
check('375px: both inside viewport', mS.x >= 0 && mS.x + mS.width <= 375 && mC.x >= 0 && mC.x + mC.width <= 375)
await mobile.close()

await browser.close()

const failed = results.filter((r) => !r).length
console.log(`\n${results.length - failed}/${results.length} checks passed`)
process.exit(failed ? 1 : 0)
