import { expect, test } from '@playwright/test';

test('first session opens birthday celebration, then keeps the original journey and direct routes refreshable', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /Happy Birthday\s*My Love/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /Bỏ qua/i })).toBeVisible();

  await page.getByRole('button', { name: /Bỏ qua/i }).click();
  await expect(page.getByRole('heading', { name: /Có một điều nhỏ/i })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page).toHaveURL(/\/timeline$/);
  await expect(page.getByRole('heading', { name: /Những ngày mình có nhau/i })).toBeVisible();

  await page.goto('/birthday');
  await expect(page.getByRole('heading', { name: /Happy Birthday\s*My Love/i })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: /Mở lời nhắn/i })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { name: /Happy Birthday\s*My Love/i })).toBeVisible();
});

test('birthday celebration stays within the mobile viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/birthday');
  await expect(page.getByRole('heading', { name: /Happy Birthday\s*My Love/i })).toBeVisible();
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await expect(page.locator('canvas.fireworks')).toBeVisible();
});

test('timeline stays within the viewport and archive media is mounted on demand', async ({ page }) => {
  const unnecessaryRequests: string[] = [];
  page.on('request', (request) => {
    const url = request.url();
    if (/\/images\/memories\/.*\.(?:jpe?g|png|heic)$/i.test(url) || /\/images\/memories\/.*\.mp4$/i.test(url)) unnecessaryRequests.push(url);
  });

  await page.goto('/timeline');
  await expect(page.locator('.archive-media')).toHaveCount(0);
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.getByRole('button', { name: /Mở kho lưu trữ/i }).click();
  await expect(page.locator('.archive-media').first()).toBeVisible();
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

test('reduced motion settles birthday celebration immediately and timeline cards remain settled', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/birthday');
  await expect(page.getByRole('button', { name: /Mở món quà của em/i })).toBeVisible();
  await page.getByRole('button', { name: /Mở món quà của em/i }).click();
  await expect(page.getByRole('heading', { name: /Có một điều nhỏ/i })).toBeVisible();

  await page.goto('/timeline');
  await expect(page.locator('app-memory-card').first()).toBeVisible();
  const state = await page.locator('app-memory-card article').first().evaluate((element) => ({
    opacity: getComputedStyle(element).opacity,
    pending: element.classList.contains('reveal-pending'),
    visible: element.classList.contains('reveal-visible')
  }));
  expect(state).toEqual({ opacity: '1', pending: false, visible: true });
});
