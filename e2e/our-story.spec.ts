import { expect, test, type Locator, type Page } from '@playwright/test';

async function expectTouchTarget(locator: Locator): Promise<void> {
  const box = await locator.boundingBox();
  expect(box).not.toBeNull();
  expect(box?.width ?? 0).toBeGreaterThanOrEqual(44);
  expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
}

async function expectNoHorizontalOverflow(page: Page): Promise<void> {
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
}

test('first session opens the birthday journey and can continue into memories', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Happy 22nd Birthday My Love', exact: true })).toBeVisible({ timeout: 10_000 });
  await page.getByRole('button', { name: /Mở món quà của em/i }).click();
  await expect(page.getByRole('heading', { name: /Có một món quà/i })).toBeVisible();

  await page.getByRole('button', { name: /Mở món quà$/i }).click();
  await page.getByRole('button', { name: /Mở lá thư/i }).click();
  await expect(page.getByRole('button', { name: /Mở phong thư/i })).toBeVisible();
  await page.getByRole('button', { name: /Mở phong thư/i }).click();
  await expect(page.getByRole('heading', { name: /Cho Quỳnh/i })).toBeVisible();

  await page.getByRole('button', { name: /Đi cùng anh nhé/i }).click();
  await expect(page).toHaveURL(/\/timeline$/);
  await expect(page.getByRole('heading', { name: 'Những ngày đã đưa anh đến gần em hơn.', exact: true })).toBeVisible();
});

test('after the journey the root becomes birthday home instead of redirecting to timeline', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => sessionStorage.setItem('hung-quynh-birthday-journey-seen', 'true'));
  await page.reload();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole('heading', { name: 'Happy 22nd Birthday, Quỳnh ♡', exact: true })).toBeVisible();
  await expect(page.getByText(/ngày có nhau/i)).toBeVisible();
  await expect(page.getByRole('heading', { name: /Mười hai điều/i })).toBeVisible();
});

test('birthday route always replays the full gift experience', async ({ page }) => {
  await page.goto('/birthday');
  await expect(page.getByRole('heading', { name: 'Happy 22nd Birthday My Love', exact: true })).toBeVisible({ timeout: 10_000 });
  await page.reload();
  await expect(page.getByRole('button', { name: /Mở món quà của em/i })).toBeVisible({ timeout: 10_000 });
});

test('timeline stays within the viewport and bonus media mounts on demand', async ({ page }) => {
  const unnecessaryRequests: string[] = [];
  page.on('request', (request) => {
    const url = request.url();
    if (/\/images\/memories\/.*\.(?:jpe?g|png|heic)$/i.test(url) || /\/images\/memories\/.*\.mp4$/i.test(url)) unnecessaryRequests.push(url);
  });

  await page.goto('/timeline');
  await expect(page.locator('.bonus-media')).toHaveCount(0);
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  const bonusButton = page.getByRole('button', { name: /Mở những khoảnh khắc khác/i });
  if (await bonusButton.count()) {
    await bonusButton.click();
    await expect(page.locator('.bonus-media').first()).toBeVisible();
  }
  expect(unnecessaryRequests).toEqual([]);
});

test('gallery dialog closes with Escape and returns focus to its thumbnail', async ({ page }) => {
  await page.goto('/timeline');
  await page.locator('app-memory-card .cover-link').first().click();
  const thumbnail = page.locator('.essay button').first();
  await thumbnail.click();
  await expect(page.locator('dialog[open]')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('dialog[open]')).toHaveCount(0);
  await expect(thumbnail).toBeFocused();
});

test('mobile birthday home and timeline do not overflow', async ({ page }) => {
  for (const width of [320, 390, 430]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto('/');
    await page.evaluate(() => sessionStorage.setItem('hung-quynh-birthday-journey-seen', 'true'));
    await page.reload();
    await expectNoHorizontalOverflow(page);
    await expect(page.locator('.hero-photos img')).toHaveCount(3);
    await expect(page.locator('.hero-photos img').nth(0)).toHaveAttribute('loading', 'eager');
    await expect(page.locator('.hero-photos img').nth(1)).toHaveAttribute('loading', 'lazy');
    await expect(page.locator('.finale img')).toHaveAttribute('loading', 'lazy');
    await expectTouchTarget(page.getByRole('link', { name: /Đi lại những ngày/i }));
    await expectTouchTarget(page.getByRole('link', { name: /Xem lại món quà/i }));

    await page.goto('/timeline');
    await expectNoHorizontalOverflow(page);
    await expectTouchTarget(page.locator('.site-header nav a').nth(0));
    await expectTouchTarget(page.locator('.site-header nav a').nth(1));
    await expectTouchTarget(page.locator('.site-header nav a').nth(2));

    await page.locator('app-memory-card .cover-link').first().click();
    await expect(page).toHaveURL(/\/memory\//);
    await expectNoHorizontalOverflow(page);
  }
});

test('mobile birthday journey remains usable on a narrow viewport', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'This scenario is covered by the mobile Playwright project.');
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto('/birthday');
  await expect(page.getByRole('heading', { name: 'Happy 22nd Birthday My Love', exact: true })).toBeVisible({ timeout: 10_000 });
  await expect(page.locator('.flying-memory')).toHaveCount(6);
  await expect(page.locator('.flying-memory img').nth(0)).toHaveAttribute('loading', 'eager');
  await expect(page.locator('.flying-memory img').nth(1)).toHaveAttribute('loading', 'lazy');
  await expectTouchTarget(page.getByRole('button', { name: /Bỏ qua/i }));
  await expectTouchTarget(page.getByRole('button', { name: /Mở món quà của em/i }));
  await expectNoHorizontalOverflow(page);

  await page.getByRole('button', { name: /Mở món quà của em/i }).click();
  await expect(page.getByRole('heading', { name: /Có một món quà/i })).toBeVisible();
  await expectNoHorizontalOverflow(page);
  await page.getByRole('button', { name: /Mở món quà$/i }).click();
  await expectTouchTarget(page.getByRole('button', { name: /Mở lá thư/i }));
  await page.getByRole('button', { name: /Mở lá thư/i }).click();
  await expect(page.getByRole('button', { name: /Mở phong thư/i })).toBeVisible();
  await expectNoHorizontalOverflow(page);
  await page.getByRole('button', { name: /Mở phong thư/i }).click();
  await expect(page.getByRole('heading', { name: /Cho Quỳnh/i })).toBeVisible();
  await expectTouchTarget(page.getByRole('button', { name: /Đi cùng anh nhé/i }));
  await expectNoHorizontalOverflow(page);
});

test('mobile photo viewer supports swipe and safe touch controls', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'This scenario is covered by the mobile Playwright project.');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/timeline');
  const multiImageCard = page.locator('app-memory-card').filter({ hasText: /(?:[2-9]|[1-9][0-9]+) khoảnh khắc/ }).first();
  await multiImageCard.locator('.cover-link').click();
  const thumbnail = page.locator('.essay button').first();
  await thumbnail.click();
  await expect(page.locator('dialog[open]')).toBeVisible();
  await expectTouchTarget(page.getByRole('button', { name: /Đóng trình xem ảnh/i }));
  await page.evaluate(() => {
    const image = document.querySelector<HTMLImageElement>('dialog[open] img');
    if (!image) throw new Error('Expected an image in the viewer.');
    const touch = (clientX: number): Touch => new Touch({ identifier: 1, target: image, clientX, clientY: 300 });
    image.dispatchEvent(new TouchEvent('touchstart', { changedTouches: [touch(300)] }));
    image.dispatchEvent(new TouchEvent('touchend', { changedTouches: [touch(80)] }));
  });
  await expect(page.locator('.counter')).toContainText('2 /');
  await page.keyboard.press('Escape');
  await expect(page.locator('dialog[open]')).toHaveCount(0);
  await expect(thumbnail).toBeFocused();
});

test('reduced motion keeps the birthday journey usable', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/birthday');
  await expect(page.getByRole('heading', { name: 'Happy 22nd Birthday My Love', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: /Mở món quà của em/i })).toBeVisible();
});
