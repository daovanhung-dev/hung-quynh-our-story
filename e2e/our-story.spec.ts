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

async function expectAmbientPhotos(page: Page, selector: string, count: number): Promise<string[]> {
  const photos = page.locator(`${selector} .ambient-photo`);
  await expect(photos).toHaveCount(count);
  const ids = await photos.evaluateAll((nodes) => nodes.map((node) => node.getAttribute('data-photo-id')));
  expect(new Set(ids).size).toBe(ids.length);
  return ids.filter((id): id is string => Boolean(id));
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

test('quick skip enters the gift, while a three-second hold opens the hidden Japan notes', async ({ page }) => {
  await page.goto('/birthday');
  const skip = page.getByRole('button', { name: /Bỏ qua/i });
  await skip.click();
  await expect(page.getByRole('heading', { name: /Có một món quà/i })).toBeVisible();

  await page.goto('/birthday');
  const hiddenSkip = page.getByRole('button', { name: /Bỏ qua/i });
  await hiddenSkip.dispatchEvent('pointerdown', { button: 0, pointerType: 'mouse', pointerId: 1, isPrimary: true });
  await expect(hiddenSkip.locator('.skip-progress')).toBeVisible();
  await page.waitForTimeout(3_150);
  await expect(page).toHaveURL(/\/japan-notes$/);
});

test('releasing the skip button early cancels the hidden hold', async ({ page }) => {
  await page.goto('/birthday');
  const skip = page.getByRole('button', { name: /Bỏ qua/i });
  await skip.dispatchEvent('pointerdown', { button: 0, pointerType: 'touch', pointerId: 2, isPrimary: true });
  await page.waitForTimeout(220);
  await skip.dispatchEvent('pointerup', { button: 0, pointerType: 'touch', pointerId: 2, isPrimary: true });
  await skip.click();
  await expect(page.getByRole('heading', { name: /Có một món quà/i })).toBeVisible();
  await expect(page).not.toHaveURL(/\/japan-notes$/);
});

test('Space can hold the skip button open for the hidden notes', async ({ page }) => {
  await page.goto('/birthday');
  const skip = page.getByRole('button', { name: /Bỏ qua/i });
  await skip.focus();
  await page.keyboard.down('Space');
  await page.waitForTimeout(3_150);
  await expect(page).toHaveURL(/\/japan-notes$/);
  await page.keyboard.up('Space');
});

test('Japan notes render five unique responsive memory photos', async ({ page }) => {
  const originalRequests: string[] = [];
  page.on('request', (request) => {
    const url = request.url();
    if (/\/images\/memories\/.*\.(?:jpe?g|png|heic|mp4)$/i.test(url)) originalRequests.push(url);
  });

  await page.goto('/japan-notes');
  await expect(page.getByRole('heading', { name: /Những điều anh muốn em nhớ ở Nhật/i })).toBeVisible();
  await expect(page.locator('.note-chapter')).toHaveCount(5);
  const ids = await page.locator('.chapter-photo').evaluateAll((nodes) => nodes.map((node) => node.getAttribute('data-photo-id')));
  expect(ids).toHaveLength(5);
  expect(new Set(ids).size).toBe(5);
  await expect(page.locator('.chapter-photo .media-frame source').first()).toHaveAttribute('srcset', /480w, .*960w/);
  await expect(page.getByRole('link', { name: /Quay lại món quà/i })).toHaveAttribute('href', '/');
  await expect(page.getByRole('link', { name: /Đi đến những kỷ niệm/i })).toHaveAttribute('href', '/timeline');
  expect(originalRequests).toEqual([]);
});

test('Japan notes stay usable on mobile and reduced motion shows all chapters', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'This scenario is covered by the mobile Playwright project.');
  await page.setViewportSize({ width: 320, height: 700 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/japan-notes');
  await expectNoHorizontalOverflow(page);
  await expect(page.locator('.note-chapter')).toHaveCount(5);
  await expect(page.locator('.note-chapter.reveal-pending')).toHaveCount(0);
  await expectTouchTarget(page.getByRole('link', { name: /Quay lại món quà/i }));
  await expectTouchTarget(page.getByRole('link', { name: /Đi đến những kỷ niệm/i }));
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

test('every view receives a small unique ambient photo composition', async ({ page }) => {
  await page.goto('/?seed=11');
  await page.evaluate(() => sessionStorage.setItem('hung-quynh-birthday-journey-seen', 'true'));
  await page.reload();
  await expectAmbientPhotos(page, '.hero-photos', 3);
  await expectAmbientPhotos(page, '.finale-photo', 1);

  await page.goto('/birthday?seed=11');
  await expect(page.locator('.flying-memory')).toHaveCount(5);
  const flyingIds = await page.locator('.flying-memory').evaluateAll((nodes) => nodes.map((node) => node.getAttribute('data-photo-id')));
  expect(new Set(flyingIds).size).toBe(flyingIds.length);
  await page.getByRole('button', { name: /Mở món quà của em/i }).click();
  await expectAmbientPhotos(page, '.gift-ambient', 3);
  await page.getByRole('button', { name: /Mở món quà$/i }).click();
  await page.getByRole('button', { name: /Mở lá thư/i }).click();
  await expectAmbientPhotos(page, '.stage-ambient--envelope', 2);
  await page.getByRole('button', { name: /Mở phong thư/i }).click();
  await expectAmbientPhotos(page, '.stage-ambient--letter', 2);

  await page.goto('/timeline?seed=11');
  await expectAmbientPhotos(page, '.timeline-ambient', 3);
  await page.goto('/memory/2025-11-04?seed=11');
  await expectAmbientPhotos(page, '.detail-ambient', 2);
  await page.goto('/memory/not-found?seed=11');
  await expectAmbientPhotos(page, '.missing-photo', 1);
  await page.goto('/missing-page?seed=11');
  await expectAmbientPhotos(page, '.not-found-photo', 1);
});

test('ambient photos change when a new random seed is provided', async ({ page }) => {
  await page.addInitScript(() => {
    const seed = Number(new URL(location.href).searchParams.get('seed') ?? '1');
    let state = Number.isFinite(seed) ? seed >>> 0 : 1;
    Math.random = () => {
      state = (state * 1664525 + 1013904223) >>> 0;
      return state / 4294967296;
    };
  });

  await page.goto('/timeline?seed=11');
  const first = await expectAmbientPhotos(page, '.timeline-ambient', 3);
  await page.goto('/timeline?seed=29');
  const second = await expectAmbientPhotos(page, '.timeline-ambient', 3);
  expect(second).not.toEqual(first);
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
    const mobileCardSource = page.locator('app-memory-card .media-frame source').first();
    await expect(mobileCardSource).toHaveAttribute('media', '(max-width: 700px)');
    await expect(mobileCardSource).toHaveAttribute('srcset', /480w, .*960w/);
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
  await expect(page.locator('.flying-memory')).toHaveCount(5);
  for (const image of await page.locator('.flying-memory img').all()) {
    await expect(image).toHaveAttribute('loading', 'eager');
  }
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
