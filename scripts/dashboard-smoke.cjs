// Explicit opt-in credentials; no tokens/cookies are persisted or logged.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE);
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');

(async () => {
  assert(process.env.WORKSPACE_DEMO_PASSWORD, 'Set WORKSPACE_DEMO_PASSWORD');
  const browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM });
  const dir = path.join(process.env.TEMP, 'codementor-dashboard-verification');
  fs.mkdirSync(dir, { recursive: true });
  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
    const anonymous = await context.request.get('http://localhost:3000/api/backend/activity/me/dashboard');
    assert.equal(anonymous.status(), 401);
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto('http://localhost:3000/login', { timeout: 60000 });
    await page.locator('#username').fill('workspace.owner.e2e@codementor.test');
    await page.locator('#password').fill(process.env.WORKSPACE_DEMO_PASSWORD);
    await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
    await page.waitForURL(/\/(practice|dashboard|explore)/, { timeout: 60000 });
    console.log('Password login passed:', new URL(page.url()).pathname);
    await page.goto('http://localhost:3000/dashboard');
    await page.getByRole('heading', { name: 'Tiếp tục học', exact: true }).waitFor({ timeout: 60000 });
    for (const route of ['/activity/me/dashboard', '/workspaces/me/pending-assignments', '/me/stats', '/me/preferences', '/exercises/topics']) {
      const response = await context.request.get(`http://localhost:3000/api/backend${route}`);
      assert.equal(response.status(), 200, `${route}: ${await response.text()}`);
      const body = (await response.json()).data;
      if (route === '/activity/me/dashboard') {
        assert(body.courses !== null && body.roadmaps !== null && body.calendar !== null);
        assert.equal(body.calendar.days.length, 56);
        assert(Number.isFinite(body.totalStudySeconds));
        console.log('Learning data:', { courses: body.courses.length, roadmaps: body.roadmaps.length, activities: body.activities.length, totalStudySeconds: body.totalStudySeconds, timezone: body.timezone });
      }
      if (route === '/workspaces/me/pending-assignments') console.log('Pending assignment IDs:', body.map((item) => item.id));
      console.log('API passed:', route);
    }
    const coach = await context.request.get('http://localhost:3000/api/backend/ai/dashboard/insight');
    assert.equal(coach.status(), 200);
    console.log('AI Coach cache:', (await coach.json()).data.status);
    await page.getByRole('button', { name: 'Khóa học', exact: true }).click();
    await page.getByLabel('Đang tải đề xuất', { exact: true }).waitFor({ state: 'hidden', timeout: 25000 });
    await page.screenshot({ path: path.join(dir, 'desktop.png'), fullPage: true });
    console.log('Scroll containers:', await page.evaluate(() => [...document.querySelectorAll('*')].filter((e) => e.scrollHeight > e.clientHeight + 50 && ['auto','scroll'].includes(getComputedStyle(e).overflowY)).map((e) => ({ tag: e.tagName, className: e.className, height: e.scrollHeight }))));
    await page.getByRole('heading', { name: 'Nhịp học của bạn' }).scrollIntoViewIfNeeded();
    await page.screenshot({ path: path.join(dir, 'desktop-activity.png'), fullPage: true });
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'Desktop overflow');
    await page.setViewportSize({ width: 390, height: 844 });
    await page.getByRole('heading', { name: 'Nhịp học của bạn' }).scrollIntoViewIfNeeded();
    await page.screenshot({ path: path.join(dir, 'mobile.png'), fullPage: true });
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'Mobile overflow');
    await page.evaluate(() => document.documentElement.classList.add('dark'));
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(dir, 'dark.png'), fullPage: true });
    await page.reload();
    await page.getByRole('heading', { name: 'Tiếp tục học', exact: true }).waitFor();
    assert.equal(new URL(page.url()).pathname, '/dashboard');
    // Fault injection is confined to this browser test, never production responses.
    await page.route('**/api/backend/activity/me/dashboard', (route) => route.fulfill({ status: 503, contentType: 'application/json', body: '{}' }));
    await page.reload();
    await page.getByRole('heading', { name: 'Việc cần hoàn thành' }).waitFor();
    assert(await page.getByText('Phần này chưa tải được.', { exact: false }).count() > 0);
    await page.unroute('**/api/backend/activity/me/dashboard');
    console.log('Reload, partial failure, desktop/mobile overflow checks passed');
    console.log('Page errors:', errors);
    assert.equal(errors.length, 0);
    console.log('Screenshots:', dir);
  } finally { await browser.close(); }
})().catch((error) => { console.error(error.message); process.exitCode = 1; });
