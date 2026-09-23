import { chromium } from 'playwright'

const BASE = 'http://localhost:5199/projectflow-test/'
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
await page.goto(BASE, { waitUntil: 'networkidle' })
await page.waitForSelector('article', { timeout: 15000 })

let failed = 0
const check = (name, pass, detail = '') => {
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`)
  if (!pass) failed += 1
}

const n1 = await page.locator('article').count()
const totalText = await page.locator('span[class*="counter"]').textContent().catch(() => null)
check('first page capped at 20', n1 === 20, `articles=${n1}`)
check('counter shows 20 of N', /^20 of \d+ repositories$/.test(totalText || ''), totalText || 'missing')

const showMore = page.getByRole('button', { name: /show more/i })
check('Show more button visible', await showMore.isVisible())

await showMore.click()
const n2 = await page.locator('article').count()
const total = Number((totalText || '').match(/\d+ of (\d+)/)?.[1])
check('after click shows up to 40 or all', n2 > n2 - 1 && n2 <= 40 && n2 >= Math.min(40, total), `articles=${n2}, total=${total}`)

if (n2 < total) {
  check('button still there for more', await showMore.isVisible())
  while (await showMore.isVisible().catch(() => false)) await showMore.click()
} else {
  check('all shown, button hidden', !(await showMore.isVisible().catch(() => false)))
}
const n3 = await page.locator('article').count()
check('eventually all repositories visible', n3 === total, `articles=${n3}, total=${total}`)
check('button gone at the end', !(await showMore.isVisible().catch(() => false)))

// pagination resets on new query
await page.locator('input[type="search"]').fill('a')
await page.waitForTimeout(150)
const filtered = await page.locator('article').count()
const counter2 = await page.locator('span[class*="counter"]').textContent().catch(() => null)
check('filter narrows list', filtered <= 20 && filtered < n3, `visible=${filtered}`)
console.log(`  counter after filter: ${counter2}`)

await browser.close()
console.log(failed ? `\n${failed} FAILED` : '\nall pagination checks passed')
process.exit(failed ? 1 : 0)
