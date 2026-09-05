import { expect, test } from '@playwright/test';

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
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.evaluate(() => sessionStorage.setItem('hung-quynh-birthday-journey-seen', 'true'));
  await page.reload();
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.goto('/timeline');
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test('reduced motion keeps the birthday journey usable', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/birthday');
  await expect(page.getByRole('heading', { name: 'Happy 22nd Birthday My Love', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: /Mở món quà của em/i })).toBeVisible();
});
