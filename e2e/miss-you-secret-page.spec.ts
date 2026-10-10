import { mkdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, test } from '@playwright/test';

const root = process.cwd();
const rawLetter = readFileSync(resolve(root, 'LOVE_LETTER_ORIGINAL.md'), 'utf8');
const visibleLetter = rawLetter.replace(/\*\*([\s\S]+?)\*\*/g, '$1');

async function openFromHome(page: import('@playwright/test').Page): Promise<void> {
  await page.goto('/');
  await page.getByRole('button', { name: /Có một điều nhỏ anh muốn gửi em/ }).click();
  await page.getByLabel('Mật mã').fill('HyeuQ');
  await page.getByRole('button', { name: 'Mở lời nhắn' }).click();
  await expect(page).toHaveURL(/\/hint\/miss-you$/);
  await expect(page.getByRole('heading', { name: 'Chồng nhớ em.' })).toBeVisible();
}

async function expectNoHorizontalOverflow(page: import('@playwright/test').Page, width: number): Promise<void> {
  const overflow = await page.evaluate(() => {
    const offenders = [...document.querySelectorAll<HTMLElement>('body *')]
      .filter((element) => {
        const style = getComputedStyle(element);
        if (style.display === 'none' || style.visibility === 'hidden') return false;
        if (element.closest('.autumn-scene')) return false;
        const rect = element.getBoundingClientRect();
        return rect.width > 0 && (rect.left < -1 || rect.right > window.innerWidth + 1);
      })
      .slice(0, 4)
      .map((element) => `${element.tagName.toLowerCase()}.${element.className}`);
    return { viewport: window.innerWidth, document: document.documentElement.scrollWidth, offenders };
  });
  expect(overflow.document, JSON.stringify(overflow)).toBeLessThanOrEqual(width + 1);
  expect(overflow.offenders, JSON.stringify(overflow)).toEqual([]);
}

test('Home keeps the existing welcome action and exposes the subtle secret gate', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /Góc kỷ niệm/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /Mở những lựa chọn cho em/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /Có một điều nhỏ anh muốn gửi em/ })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Mở lời nhắn bí mật' })).toBeVisible();
});

test('secret dialog opens by keyboard, rejects case and whitespace changes, and closes with Escape', async ({ page }) => {
  await page.goto('/');
  const trigger = page.getByRole('button', { name: /Có một điều nhỏ anh muốn gửi em/ });
  await trigger.focus();
  await page.keyboard.press('Enter');
  const dialog = page.getByRole('dialog', { name: 'Chồng nhớ Quỳnh' });
  const input = page.getByLabel('Mật mã');
  await expect(dialog).toBeVisible();
  await expect(input).toBeFocused();

  for (const wrongCode of ['hyeuQ', 'HyeuQ ']) {
    await input.fill(wrongCode);
    await input.press('Enter');
    await expect(page.getByRole('status')).toContainText('Chưa đúng rồi em');
    await expect(page).not.toHaveURL(/\/hint\/miss-you$/);
  }

  await page.keyboard.press('Escape');
  await expect(dialog).not.toBeVisible();
  await expect(trigger).toBeFocused();
});

test('shared header entry opens the gate from an existing route', async ({ page }) => {
  await page.goto('/events');
  await page.getByRole('link', { name: 'Mở lời nhắn bí mật' }).click();
  await expect(page.getByRole('dialog', { name: 'Chồng nhớ Quỳnh' })).toBeVisible();
  await expect(page).toHaveURL(/\/$/);
});

test('deep link redirects to the Home gate; refresh keeps the unlock only in the current tab', async ({ page, context }) => {
  await page.goto('/hint/miss-you');
  await expect(page.getByRole('dialog', { name: 'Chồng nhớ Quỳnh' })).toBeVisible();
  await expect(page).toHaveURL(/\/$/);
  await page.getByLabel('Mật mã').fill('HyeuQ');
  await page.getByRole('button', { name: 'Mở lời nhắn' }).click();
  await expect(page).toHaveURL(/\/hint\/miss-you$/);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Chồng nhớ em.' })).toBeVisible();

  const newTab = await context.newPage();
  await newTab.goto('/hint/miss-you');
  await expect(newTab.getByRole('dialog', { name: 'Chồng nhớ Quỳnh' })).toBeVisible();
  await expect(newTab.getByLabel('Mật mã')).toBeVisible();
  await newTab.close();

  await page.goBack();
  await expect(page.getByRole('heading', { name: /Góc kỷ niệm/ })).toBeVisible();
  await expect(page.getByRole('dialog', { name: 'Chồng nhớ Quỳnh' })).not.toBeVisible();
});

test.describe('Vietnam calendar counter', () => {
  test.use({ timezoneId: 'Asia/Tokyo' });

  test('shows 18 for 10 October VN even while the browser host is in Japan', async ({ page }) => {
    await page.clock.install({ time: new Date('2026-10-09T17:00:00.000Z') });
    await openFromHome(page);
    await expect(page.locator('.day-count')).toHaveText('18');
    await expect(page.locator('.day-count')).toHaveAttribute('aria-label', '18 ngày xa nhau');
    await expect(page.locator('.clock-row')).toContainText('Việt Nam');
    await expect(page.locator('.clock-row')).toContainText('Nhật Bản');
    await expect(page.locator('[lang="ja"]')).toHaveText('僕はずっと君だけを愛してる');
  });

  test('counter advances without a reload when Vietnam crosses midnight', async ({ page }) => {
    await page.clock.install({ time: new Date('2026-10-09T16:58:00.000Z') });
    await page.addInitScript(() => sessionStorage.setItem('hung-quynh-miss-you-unlocked', 'true'));
    await page.goto('/hint/miss-you');
    const counter = page.locator('.day-count');
    await expect(counter).toHaveText('17');
    await page.clock.pauseAt(new Date('2026-10-09T16:59:59.000Z'));
    await page.clock.runFor(1_001);
    await expect(counter).toHaveText('18');
  });
});

test('letter text renders from first to last line with exact Unicode and safe bold markup', async ({ page }) => {
  await openFromHome(page);
  const letter = page.locator('.letter-copy');
  await expect(letter).toBeVisible();
  const rendered = await letter.evaluate((element) => element.textContent ?? '');
  expect(rendered).toBe(visibleLetter);
  expect(rendered.startsWith('Vợ iu ơiiii!')).toBeTruthy();
  expect(rendered.includes('siu siu siu nhiều lun áaaa! ❤️')).toBeTruthy();
  expect(rendered.endsWith('🥺💕\n')).toBeTruthy();
  expect(await letter.locator('strong').count()).toBeGreaterThan(0);
  await expect(letter).not.toContainText('**');
  await expect(letter.locator('img,script')).toHaveCount(0);
});

test('gallery uses real heart-clipped photos and the shared accessible lightbox', async ({ page }) => {
  await openFromHome(page);
  const photos = page.getByRole('button', { name: /Mở ảnh kỷ niệm/ });
  await expect(photos).toHaveCount(4);
  const clipPath = await photos.first().locator('img').evaluate((image) => getComputedStyle(image).clipPath);
  expect(clipPath).toContain('miss-you-heart-mask');
  await photos.nth(1).click();
  const viewer = page.getByRole('dialog', { name: 'Xem kỷ niệm toàn màn hình' });
  await expect(viewer).toBeVisible();
  await expect(viewer.locator('img')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(viewer).not.toBeVisible();
  await expect(photos.nth(1)).toBeFocused();
});

test('real MP3 starts only after a user gesture and the player follows actual media events', async ({ page }) => {
  const mediaRequest = page.waitForRequest((request) => request.resourceType() === 'media' && request.url().includes('/mp3/'));
  await openFromHome(page);
  const audio = page.locator('.music-player audio');
  await expect(audio).toHaveJSProperty('paused', true);
  await expect(page.locator('.vinyl-record')).not.toHaveClass(/is-playing/);
  await page.getByRole('button', { name: 'Phát nhạc' }).click();
  const request = await mediaRequest;
  expect(request.url()).toContain('/mp3/');
  await expect(audio).toHaveJSProperty('paused', false, { timeout: 8_000 });
  await expect(page.locator('.playback-state')).toHaveText('Đang phát');
  await expect(page.locator('.vinyl-record')).toHaveClass(/is-playing/);
  await page.getByRole('button', { name: 'Tạm dừng nhạc' }).click();
  await expect(audio).toHaveJSProperty('paused', true);
  await expect(page.locator('.playback-state')).toHaveText('Chờ em bật nhạc');
});

test('missing MP3 is announced as an actual playback error', async ({ page }) => {
  await page.route('**/mp3/**', (route) => route.abort('failed'));
  await openFromHome(page);
  await page.getByRole('button', { name: 'Phát nhạc' }).click();
  await expect(page.getByRole('status')).toContainText(/bài hát chưa phát được|không mở được/i);
  await expect(page.locator('.vinyl-record')).not.toHaveClass(/is-playing/);
});

test('autumn background failure leaves the CSS fallback and page content intact', async ({ page }) => {
  await page.route('**/miss-you-autumn.webp', (route) => route.abort('failed'));
  await openFromHome(page);
  await expect(page.locator('.scene-image')).toHaveClass(/is-unavailable/);
  await expect(page.locator('.days-panel')).toBeVisible();
  const fallbackColor = await page.locator('.autumn-scene').evaluate((element) => getComputedStyle(element).backgroundImage);
  expect(fallbackColor).toContain('radial-gradient');
});

test('reduced motion keeps the page usable and stops leaf and vinyl animation', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openFromHome(page);
  await expect(page.locator('.falling-leaves')).toHaveCount(0);
  await page.getByRole('button', { name: 'Phát nhạc' }).click();
  await expect(page.locator('.playback-state')).toHaveText('Đang phát');
  const animation = await page.locator('.vinyl-record').evaluate((element) => getComputedStyle(element).animationName);
  expect(animation).toBe('none');
});

test('all required widths reflow without clipping the page or its controls', async ({ page }, testInfo) => {
  await openFromHome(page);
  const viewports = [
    [320, 568], [360, 740], [375, 812], [390, 844], [820, 1180], [1366, 768], [1440, 900]
  ] as const;
  mkdirSync('/tmp/hq-miss-you-qa', { recursive: true });

  for (const [width, height] of viewports) {
    await page.setViewportSize({ width, height });
    await expect(page.locator('.days-panel')).toBeVisible();
    await expect(page.locator('.music-player')).toBeVisible();
    await expect(page.locator('.letter-panel')).toBeVisible();
    await expectNoHorizontalOverflow(page, width);
    if (width === 390 || width === 1440) {
      await page.screenshot({ path: `/tmp/hq-miss-you-qa/final-miss-you-${testInfo.project.name}-${width}.png`, fullPage: true });
    }
  }
});
