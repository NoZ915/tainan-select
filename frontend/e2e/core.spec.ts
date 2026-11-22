import { expect, test as base } from '@playwright/test'
import { apiBaseUrl, apiOrigin } from './environment'

const test = base.extend<{ verifyBrowser: void }>({
  verifyBrowser: [async ({ page }, use) => {
    const pageErrors: string[] = []
    const productionRequests: string[] = []
    page.on('pageerror', error => pageErrors.push(error.message))
    await page.route(/^https?:\/\/(?:(?:api|www)\.)?nutnselect\.com(?:\/|$)/, async route => {
      productionRequests.push(new URL(route.request().url()).origin)
      await route.abort()
    })
    const health = await page.goto(`${apiOrigin}/health`)
    expect(health?.status()).toBe(200)
    await use()
    expect(productionRequests, '前端不得呼叫正式站').toEqual([])
    expect(pageErrors, '不得出現未捕捉的前端例外').toEqual([])
  }, { auto: true }],
})

test('訪客可以搜尋課程並開啟及重新整理詳情', async ({ page }) => {
  await page.goto('/')
  const courseLinks = page.locator('main a[href^="/course/"]')
  await expect(courseLinks.first()).toBeVisible()
  const courseName = (await courseLinks.first().locator('p').first().innerText()).trim()
  const searchTerm = courseName.slice(0, 4)
  await page.getByPlaceholder('「課程名」或「教師名」').fill(searchTerm)
  const searchResponse = page.waitForResponse(response => {
    const url = new URL(response.url())
    return response.request().method() === 'GET' && url.origin === apiOrigin
      && url.pathname === '/api/courses' && url.searchParams.get('search') === searchTerm
  })
  await page.getByRole('button', { name: '搜尋', exact: true }).click()
  const search = await searchResponse
  expect(search.status()).toBe(200)
  expect((await search.json()).courses.length).toBeGreaterThan(0)
  await expect(page).toHaveURL(url => url.searchParams.get('search') === searchTerm)
  await expect(courseLinks.filter({ hasText: courseName }).first()).toBeVisible()
  const courseLink = courseLinks.filter({ hasText: courseName }).first()
  const coursePath = await courseLink.getAttribute('href')
  expect(coursePath).toMatch(/^\/course\/\d+$/)
  const courseId = coursePath!.split('/').pop()
  const detailResponse = page.waitForResponse(response => response.request().method() === 'GET'
    && response.url() === `${apiBaseUrl}/courses/${courseId}`)
  await courseLink.click()
  expect((await detailResponse).status()).toBe(200)
  await expect(page).toHaveURL(url => url.pathname === coursePath)
  await expect(page.getByRole('main')).toContainText(courseName)
  expect((await page.reload())?.status()).toBe(200)
  await expect(page).toHaveURL(url => url.pathname === coursePath)
  await expect(page.getByRole('main')).toContainText(courseName)
})

for (const [pathname, title] of [['/timetable', '課表'], ['/wishlist', '功能許願']] as const) {
  test(`${title}可直接開啟及重新整理`, async ({ page }) => {
    expect((await page.goto(pathname))?.status()).toBe(200)
    await expect(page).toHaveURL(url => url.pathname === pathname)
    await expect(page).toHaveTitle(new RegExp(title))
    expect((await page.reload())?.status()).toBe(200)
    await expect(page).toHaveURL(url => url.pathname === pathname)
    await expect(page).toHaveTitle(new RegExp(title))
  })
}

test('未登入時評論、收藏、課表寫入與管理功能皆受保護', async ({ page }) => {
  await page.goto('/')
  const results = await page.evaluate(async api => {
    const results: { path: string, status: number }[] = []
    for (const [path, method] of [
      ['/interests/toggleInterest', 'POST'], ['/reviews/upsertReview', 'POST'],
      ['/timetables/1/items', 'POST'], ['/admin/status', 'GET'],
    ]) {
      const response = await fetch(api + path, {
        method, credentials: 'include',
        ...(method === 'POST' ? { headers: { 'Content-Type': 'application/json' }, body: '{}' } : {}),
      })
      results.push({ path, status: response.status })
    }
    return results
  }, apiBaseUrl)
  for (const result of results) expect(result.status, result.path).toBe(401)
})

test('登入入口提供正確 callback 與安全 cookie，並清除測試嘗試', async ({ page, context }) => {
  let owner: string | null = null
  await page.route('https://accounts.google.com/**', route => route.abort())
  try {
    await page.goto('/')
    await page.getByRole('button', { name: '登入/註冊', exact: true }).click()
    const startRequest = page.waitForRequest(request => {
      const url = new URL(request.url())
      return url.origin === apiOrigin && url.pathname === '/api/auth/google'
    })
    const googleRequest = page.waitForRequest(request => new URL(request.url()).origin === 'https://accounts.google.com')
    await page.getByRole('button', { name: '確定', exact: true }).click()
    owner = new URL((await startRequest).url()).searchParams.get('owner')
    expect(Boolean(owner)).toBe(true)
    const googleUrl = new URL((await googleRequest).url())
    expect(googleUrl.searchParams.get('redirect_uri')).toBe(`${apiBaseUrl}/auth/google/callback`)
    const cookies = await context.cookies(`${apiBaseUrl}/auth/google/callback`)
    const stateCookie = cookies.find(cookie => cookie.name.startsWith('oauth_state_'))
    expect(stateCookie?.httpOnly).toBe(true)
    if (new URL(apiOrigin).protocol === 'https:') expect(stateCookie?.secure).toBe(true)
    expect(stateCookie?.sameSite).toBe('Lax')
    expect(stateCookie?.path).toBe('/api/auth/google/callback')
  } finally {
    if (owner) {
      const cancelled = await context.request.post(`${apiBaseUrl}/auth/google/cancel`, { data: { owner } })
      expect(cancelled.status()).toBe(200)
      expect((await cancelled.json()).status).toBe('cancelled')
    }
  }
})
