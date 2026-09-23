/* Temporary manual-check script (task-5): runs the app in headless Chromium
 * and verifies toolbar layout at 375px/desktop, client-side filter speed,
 * and absence of API calls while typing. Not part of the shipped project. */
import { chromium } from 'playwright'

const BASE = 'http://localhost:5199/projectflow-test/'
const results = []
const ok = (name, pass, detail = '') => {
  results.push({ name, pass, detail })
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`)
}

const browser = await chromium.launch()

async function checkViewport(width, height, label) {
  const page = await browser.newPage({ viewport: { width, height } })
  let apiCallsWhileTyping = 0
  page.on('request', (req) => {
    if (req.url().includes('api.github.com')) apiCallsWhileTyping += 1
  })

  await page.goto(BASE, { waitUntil: 'networkidle' })
  await page.waitForSelector('article', { timeout: 15000 })

  // --- toolbar layout ---
  const search = page.locator('input[type="search"]')
  const refresh = page.getByRole('button', { name: /refresh/i })
  const sort = page.getByLabel('Sort repositories')
  const bSearch = await search.boundingBox()
  const bRefresh = await refresh.boundingBox()
  const bSort = await sort.boundingBox()

  const overlaps = (a, b) =>
    a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height

  ok(`[${label}] search & refresh do not overlap`, !overlaps(bSearch, bRefresh),
    `search=${JSON.stringify(bSearch)} refresh=${JSON.stringify(bRefresh)}`)
  ok(`[${label}] search & sort do not overlap`, !overlaps(bSearch, bSort))
  ok(`[${label}] all toolbar elements inside viewport`,
    [bSearch, bRefresh, bSort].every((b) => b.x >= 0 && b.x + b.width <= width + 1))

  const dir = await page
    .locator('div[class*="toolbar"]')
    .first()
    .evaluate((el) => getComputedStyle(el).flexDirection)
  if (width < 420) {
    ok(`[${label}] toolbar is column below 420px`, dir === 'column', `flex-direction=${dir}`)
  } else {
    ok(`[${label}] toolbar is row on desktop`, dir === 'row', `flex-direction=${dir}`)
  }

  // --- safe-area padding present on app container ---
  const padTop = await page
    .locator('div[class*="app"]')
    .first()
    .evaluate((el) => getComputedStyle(el).paddingTop)
  ok(`[${label}] app has top padding (safe-area aware)`, parseFloat(padTop) > 0, `paddingTop=${padTop}`)

  // --- live filter: instant, no network ---
  const before = await page.locator('article').count()
  const apiBefore = apiCallsWhileTyping
  const t0 = Date.now()
  await search.fill('a')
  await page.waitForTimeout(50)
  await search.fill('zzz-no-such-repo')
  await page.waitForSelector('[role="status"]', { timeout: 3000 })
  const elapsed = Date.now() - t0
  const apiDelta = apiCallsWhileTyping - apiBefore
  ok(`[${label}] filter is client-side (0 API calls while typing)`, apiDelta === 0, `apiDelta=${apiDelta}`)
  ok(`[${label}] filter+empty state fast (<1000ms)`, elapsed < 1000, `${elapsed}ms`)
  ok(`[${label}] empty state visible for no matches`,
    (await page.getByText(/No repositories found/i).count()) > 0)

  await search.fill('')
  await page.waitForTimeout(100)
  const after = await page.locator('article').count()
  ok(`[${label}] clearing query restores list`, after === before && after > 0, `${before} -> ${after}`)

  // --- card content sanity ---
  const firstCard = page.locator('article').first()
  const hasName = (await firstCard.locator('a[target="_blank"]').count()) > 0
  ok(`[${label}] card has external link`, hasName)

  await page.close()
}

await checkViewport(375, 700, '375px')
await checkViewport(1280, 900, 'desktop')

await browser.close()

const failed = results.filter((r) => !r.pass)
console.log(`\n${results.length - failed.length}/${results.length} checks passed`)
process.exit(failed.length ? 1 : 0)
