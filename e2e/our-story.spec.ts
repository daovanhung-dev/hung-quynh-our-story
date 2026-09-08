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

async function expectTreasureLayersSeparated(page: Page): Promise<void> {
  const overlaps = await page.evaluate(() => {
    const toRect = (element: Element | null): { left: number; top: number; right: number; bottom: number } | null => {
      if (!element) return null;
      const rect = element.getBoundingClientRect();
      return { left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom };
    };
    const overlapsWithGap = (first: ReturnType<typeof toRect>, second: ReturnType<typeof toRect>, gap = 8): boolean => {
      if (!first || !second) return false;
      return first.left < second.right + gap && first.right > second.left - gap && first.top < second.bottom + gap && first.bottom > second.top - gap;
    };
    const record = toRect(document.querySelector('.record-stage'));
    const panel = toRect(document.querySelector('.music-panel'));
    const heading = toRect(document.querySelector('.treasure-heading'));
    const photos = [...document.querySelectorAll('.treasure-photo')].map((photo) => ({
      id: photo.getAttribute('data-photo-id'),
      rect: toRect(photo)
    }));
    return {
      photoRecord: photos.filter((photo) => overlapsWithGap(photo.rect, record)).map((photo) => photo.id),
      photoPanel: photos.filter((photo) => overlapsWithGap(photo.rect, panel)).map((photo) => photo.id),
      photoHeading: photos.filter((photo) => overlapsWithGap(photo.rect, heading)).map((photo) => photo.id),
      panelRecord: overlapsWithGap(panel, record)
    };
  });
  expect(overlaps.photoRecord).toEqual([]);
  expect(overlaps.photoPanel).toEqual([]);
  expect(overlaps.photoHeading).toEqual([]);
  expect(overlaps.panelRecord).toBe(false);
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

async function openLetterTrigger(page: Page): Promise<Locator> {
  await page.goto('/birthday');
  await page.getByRole('button', { name: /Mở món quà của em/i }).click();
  await expect(page.getByRole('heading', { name: /Có một món quà/i })).toBeVisible();
  await page.getByRole('button', { name: /Mở món quà$/i }).click();
  const trigger = page.getByRole('button', { name: /Mở lá thư/i });
  await expect(trigger).toBeVisible();
  return trigger;
}

async function openBirthdayLetter(page: Page): Promise<void> {
  const trigger = await openLetterTrigger(page);
  await trigger.click();
  await expect(page.getByRole('button', { name: /Mở phong thư/i })).toBeVisible();
  await page.getByRole('button', { name: /Mở phong thư/i }).click();
  await expect(page.getByRole('heading', { name: /Cho Quỳnh/i })).toBeVisible();
}

async function dragPointer(
  page: Page,
  locator: Locator,
  dx: number,
  dy: number,
  pointerType: 'mouse' | 'touch',
  pointerId: number
): Promise<void> {
  const box = await locator.boundingBox();
  expect(box).not.toBeNull();
  const startX = (box?.x ?? 0) + (box?.width ?? 0) / 2;
  const startY = (box?.y ?? 0) + (box?.height ?? 0) / 2;
  const endX = startX + dx;
  const endY = startY + dy;

  if (pointerType === 'mouse') {
    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(endX, endY);
    await page.mouse.up();
    return;
  }

  await locator.dispatchEvent('pointerdown', {
    button: 0,
    pointerType,
    pointerId,
    isPrimary: true,
    clientX: startX,
    clientY: startY
  });
  await locator.dispatchEvent('pointermove', {
    button: 0,
    pointerType,
    pointerId,
    isPrimary: true,
    clientX: endX,
    clientY: endY
  });
  await locator.dispatchEvent('pointerup', {
    button: 0,
    pointerType,
    pointerId,
    isPrimary: true,
    clientX: endX,
    clientY: endY
  });
}

test('quick click on Mở lá thư keeps the normal envelope flow', async ({ page }) => {
  const trigger = await openLetterTrigger(page);
  await trigger.click();
  await expect(page.getByRole('button', { name: /Mở phong thư/i })).toBeVisible();
  await expect(page).not.toHaveURL(/\/love-treasure$/);
});

test('birthday letter keeps the normal flow when the origami hint is ignored', async ({ page }) => {
  await openBirthdayLetter(page);
  await page.getByRole('button', { name: /Đi cùng anh nhé/i }).click();
  await expect(page).toHaveURL(/\/timeline$/);
  await expect(page).not.toHaveURL(/\/unsaid$/);
});

test('origami hint arms only after the reader reaches the end of the letter', async ({ page }) => {
  await openBirthdayLetter(page);
  const hint = page.locator('.origami-hint');
  const sentinel = hint.locator('.origami-sentinel');

  await expect(hint).toHaveAttribute('data-origami-armed', 'false');
  await expect(hint.locator('.origami-crease-handle')).toHaveCount(0);
  await sentinel.scrollIntoViewIfNeeded();
  await expect(hint).toHaveAttribute('data-origami-armed', 'true');
  await expect(hint.locator('.origami-crease-handle')).toBeVisible();
});

test('origami hint rejects short, wrong-direction and cancelled drags', async ({ page }) => {
  await openBirthdayLetter(page);
  const hint = page.locator('.origami-hint');
  await hint.locator('.origami-sentinel').scrollIntoViewIfNeeded();
  const crease = hint.locator('.origami-crease-handle');

  await dragPointer(page, crease, -15, -15, 'mouse', 201);
  await expect(hint).toHaveAttribute('data-fold-step', '0');
  await expect(hint).toHaveAttribute('data-origami-mode', 'false');

  await dragPointer(page, crease, 80, 80, 'mouse', 202);
  await expect(hint).toHaveAttribute('data-fold-step', '0');
  await expect(hint).toHaveAttribute('data-origami-mode', 'false');

  const box = await crease.boundingBox();
  expect(box).not.toBeNull();
  const startX = (box?.x ?? 0) + (box?.width ?? 0) / 2;
  const startY = (box?.y ?? 0) + (box?.height ?? 0) / 2;
  await crease.dispatchEvent('pointerdown', { button: 0, pointerType: 'touch', pointerId: 203, isPrimary: true, clientX: startX, clientY: startY });
  await crease.dispatchEvent('pointermove', { button: 0, pointerType: 'touch', pointerId: 203, isPrimary: true, clientX: startX - 60, clientY: startY - 45 });
  await crease.dispatchEvent('pointercancel', { button: 0, pointerType: 'touch', pointerId: 203, isPrimary: true, clientX: startX - 60, clientY: startY - 45 });
  await expect(hint).toHaveAttribute('data-drag-progress', '0');
  await expect(hint).toHaveAttribute('data-fold-step', '0');
});

test('origami hint unlocks with the four mouse folds', async ({ page }) => {
  await openBirthdayLetter(page);
  const hint = page.locator('.origami-hint');
  await hint.locator('.origami-sentinel').scrollIntoViewIfNeeded();
  const navigation = page.waitForURL(/\/unsaid$/);

  await dragPointer(page, hint.locator('.origami-crease-handle'), -80, -80, 'mouse', 211);
  await expect(hint).toHaveAttribute('data-fold-step', '1');
  await dragPointer(page, hint.locator('.origami-fold-handle'), 80, -80, 'mouse', 212);
  await expect(hint).toHaveAttribute('data-fold-step', '2');
  await dragPointer(page, hint.locator('.origami-fold-handle'), 0, -80, 'mouse', 213);
  await expect(hint).toHaveAttribute('data-fold-step', '3');
  await dragPointer(page, hint.locator('.origami-fold-handle'), 0, 80, 'mouse', 214);
  await navigation;
});

test('origami hint unlocks with the four touch folds', async ({ page }) => {
  await openBirthdayLetter(page);
  const hint = page.locator('.origami-hint');
  await hint.locator('.origami-sentinel').scrollIntoViewIfNeeded();
  const navigation = page.waitForURL(/\/unsaid$/);

  await dragPointer(page, hint.locator('.origami-crease-handle'), -80, -80, 'touch', 221);
  await dragPointer(page, hint.locator('.origami-fold-handle'), 80, -80, 'touch', 222);
  await dragPointer(page, hint.locator('.origami-fold-handle'), 0, -80, 'touch', 223);
  await dragPointer(page, hint.locator('.origami-fold-handle'), 0, 80, 'touch', 224);
  await navigation;
});

test('origami hint cancels with Escape and restores body scrolling', async ({ page }) => {
  await openBirthdayLetter(page);
  const hint = page.locator('.origami-hint');
  await hint.locator('.origami-sentinel').scrollIntoViewIfNeeded();
  const initialOverflow = await page.evaluate(() => document.body.style.overflow);

  await dragPointer(page, hint.locator('.origami-crease-handle'), -80, -80, 'mouse', 231);
  await expect(hint).toHaveAttribute('data-origami-mode', 'true');
  await expect.poll(() => page.evaluate(() => document.body.style.overflow)).toBe('hidden');
  await page.keyboard.press('Escape');
  await expect(hint).toHaveAttribute('data-origami-mode', 'false');
  await expect(hint).toHaveAttribute('data-fold-step', '0');
  await expect(hint).toHaveAttribute('data-drag-progress', '0');
  await expect.poll(() => page.evaluate(() => document.body.style.overflow)).toBe(initialOverflow);
  await expect(hint.locator('.origami-crease-handle')).toBeFocused();
});

test('origami hint advances one fold with Space and four folds with Enter', async ({ page }) => {
  await openBirthdayLetter(page);
  const hint = page.locator('.origami-hint');
  await hint.locator('.origami-sentinel').scrollIntoViewIfNeeded();
  const crease = hint.locator('.origami-crease-handle');
  await crease.focus();
  await page.keyboard.press('Space');
  await expect(hint).toHaveAttribute('data-fold-step', '1');
  await page.keyboard.press('Escape');

  await crease.focus();
  const navigation = page.waitForURL(/\/unsaid$/);
  await page.keyboard.press('Enter');
  await expect(hint).toHaveAttribute('data-fold-step', '1');
  await page.keyboard.press('Enter');
  await expect(hint).toHaveAttribute('data-fold-step', '2');
  await page.keyboard.press('Enter');
  await expect(hint).toHaveAttribute('data-fold-step', '3');
  await page.keyboard.press('Enter');
  await navigation;
});

test('origami hint still unlocks when reduced motion is requested', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openBirthdayLetter(page);
  const hint = page.locator('.origami-hint');
  await hint.locator('.origami-sentinel').scrollIntoViewIfNeeded();
  const navigation = page.waitForURL(/\/unsaid$/);
  await hint.locator('.origami-crease-handle').focus();
  await page.keyboard.press('Enter');
  await page.keyboard.press('Enter');
  await page.keyboard.press('Enter');
  await page.keyboard.press('Enter');
  await navigation;
});

test('origami hint and unsaid page remain usable on mobile', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'The mobile project covers the narrow viewport interaction checks.');
  await page.setViewportSize({ width: 390, height: 844 });
  await openBirthdayLetter(page);
  const hint = page.locator('.origami-hint');
  await hint.locator('.origami-sentinel').scrollIntoViewIfNeeded();
  await expectTouchTarget(hint.locator('.origami-crease-handle'));
  await expectNoHorizontalOverflow(page);
  await page.keyboard.press('Escape');

  await page.goto('/unsaid');
  await expectNoHorizontalOverflow(page);
  await expectTouchTarget(page.locator('.unsaid-note').first());
  await expectTouchTarget(page.getByRole('link', { name: /Quay lại lá thư/i }));
  await expectTouchTarget(page.getByRole('link', { name: /Đi đến những kỷ niệm/i }));
});

test('unsaid opens notes by click and keyboard without exposing the route in navigation', async ({ page }) => {
  await page.goto('/unsaid');
  await expect(page.getByRole('heading', { name: /Những điều anh chưa nói/i })).toBeVisible();
  await expect(page.locator('.unsaid-note')).toHaveCount(8);
  await expect(page.locator('.site-header nav')).not.toContainText(/chưa nói/i);
  const progress = page.locator('.unsaid-progress');
  await expect(progress).toHaveAttribute('aria-label', '0 trên 8 lời nhắn đã được mở');

  const first = page.locator('.unsaid-note').nth(0);
  await first.click();
  await expect(first).toHaveAttribute('data-opened', 'true');
  await expect(first).toContainText(/Có những đêm em đã ngủ rồi/i);
  await expect(progress).toHaveAttribute('aria-label', '1 trên 8 lời nhắn đã được mở');
  await first.click();
  await expect(first).toHaveAttribute('data-opened', 'true');

  const second = page.locator('.unsaid-note').nth(1);
  await second.focus();
  await page.keyboard.press('Enter');
  await expect(second).toHaveAttribute('data-opened', 'true');
  await expect(progress).toHaveAttribute('aria-label', '2 trên 8 lời nhắn đã được mở');
});

test('unsaid reveals the finale after all eight notes are opened', async ({ page }) => {
  await page.goto('/unsaid');
  for (const note of await page.locator('.unsaid-note').all()) await note.click();
  await expect(page.locator('.unsaid-finale')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Anh vẫn muốn chọn em.', exact: true })).toBeVisible();
  await expect(page.getByText('04 · 01 · 2026 → ∞', { exact: true })).toBeVisible();
  await expect(page.locator('.unsaid-progress')).toHaveAttribute('aria-label', '8 trên 8 lời nhắn đã được mở');
});

test('unsaid navigation returns to the letter or continues to the timeline', async ({ page }) => {
  await page.goto('/unsaid');
  await page.getByRole('link', { name: /Quay lại lá thư/i }).click();
  await expect(page).toHaveURL(/\/birthday\?stage=letter$/);
  await expect(page.getByRole('heading', { name: /Cho Quỳnh/i })).toBeVisible();

  await page.goto('/unsaid');
  await page.getByRole('link', { name: /Đi đến những kỷ niệm/i }).click();
  await expect(page).toHaveURL(/\/timeline$/);
});

test('holding Mở lá thư for three seconds opens the love treasure with mouse and touch', async ({ page }) => {
  let trigger = await openLetterTrigger(page);
  const mouseNavigation = page.waitForURL(/\/love-treasure$/);
  await trigger.dispatchEvent('pointerdown', { button: 0, pointerType: 'mouse', pointerId: 10, isPrimary: true });
  await mouseNavigation;
  await expect(page.getByRole('heading', { name: /Chúc mừng vợ yêu khám phá được thêm một kho báu/i })).toBeVisible();

  trigger = await openLetterTrigger(page);
  const touchNavigation = page.waitForURL(/\/love-treasure$/);
  await trigger.dispatchEvent('pointerdown', { button: 0, pointerType: 'touch', pointerId: 11, isPrimary: true });
  await touchNavigation;
});

test('early release and pointer cancel clear the hidden hold', async ({ page }) => {
  const trigger = await openLetterTrigger(page);
  await trigger.dispatchEvent('pointerdown', { button: 0, pointerType: 'mouse', pointerId: 12, isPrimary: true });
  await page.waitForTimeout(220);
  await trigger.dispatchEvent('pointercancel', { button: 0, pointerType: 'mouse', pointerId: 12, isPrimary: true });
  await expect(trigger.locator('[role="progressbar"]')).toHaveAttribute('aria-valuenow', '0');
  await trigger.click();
  await expect(page.getByRole('button', { name: /Mở phong thư/i })).toBeVisible();
  await expect(page).not.toHaveURL(/\/love-treasure$/);
});

test('Space can hold Mở lá thư open for the hidden treasure', async ({ page }) => {
  const trigger = await openLetterTrigger(page);
  await trigger.focus();
  const navigation = page.waitForURL(/\/love-treasure$/);
  await page.keyboard.down('Space');
  await navigation;
  await page.keyboard.up('Space');
});

test('Enter can hold Mở lá thư open for the hidden treasure', async ({ page }) => {
  const trigger = await openLetterTrigger(page);
  await trigger.focus();
  const navigation = page.waitForURL(/\/love-treasure$/);
  await page.keyboard.down('Enter');
  try {
    await expect(trigger.locator('[role="progressbar"]')).toHaveAttribute('aria-valuenow', /[1-9]/, { timeout: 5_000 });
    await navigation;
  } finally {
    if (!page.isClosed()) await page.keyboard.up('Enter');
  }
});

test('love treasure streams unique responsive photos and pauses cleanly', async ({ page }) => {
  const originalRequests: string[] = [];
  page.on('request', (request) => {
    const url = request.url();
    if (/\/images\/memories\/.*\.(?:jpe?g|png|heic|mp4)$/i.test(url)) originalRequests.push(url);
  });

  await page.goto('/love-treasure');
  await expect(page.getByRole('heading', { name: /Chúc mừng vợ yêu khám phá được thêm một kho báu/i })).toBeVisible();
  const stream = page.locator('.treasure-stream');
  const totalPhotos = Number(await stream.getAttribute('data-total-photos'));
  const activeLimit = Number(await stream.getAttribute('data-active-limit'));
  expect(totalPhotos).toBeGreaterThan(0);
  expect(activeLimit).toBe(page.viewportSize()?.width && page.viewportSize()!.width <= 680 ? 6 : 8);
  await expect(page.locator('.treasure-photo')).toHaveCount(activeLimit);

  const initialIds = await page.locator('.treasure-photo').evaluateAll((nodes) => nodes.map((node) => node.getAttribute('data-photo-id')));
  expect(new Set(initialIds).size).toBe(initialIds.length);
  await page.waitForTimeout(1_100);
  const progressedIds = await page.locator('.treasure-photo').evaluateAll((nodes) => nodes.map((node) => node.getAttribute('data-photo-id')));
  expect(progressedIds).not.toEqual(initialIds);

  const firstPhoto = page.locator('.treasure-photo').first();
  const secondPhoto = page.locator('.treasure-photo').nth(1);
  await firstPhoto.click();
  await expect(firstPhoto).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.treasure-memory-panel')).toBeVisible();
  await expect(page.locator('.treasure-note')).toContainText(/Đang giữ lại một vì sao/i);
  await secondPhoto.click();
  await expect(firstPhoto).toHaveAttribute('aria-pressed', 'false');
  await expect(secondPhoto).toHaveAttribute('aria-pressed', 'true');
  await page.keyboard.press('Escape');
  await expect(page.locator('.treasure-memory-panel')).toHaveCount(0);

  const pause = page.locator('.treasure-control--pause');
  await pause.click();
  await expect(pause).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.treasure-photo').first()).toHaveCSS('animation-play-state', 'paused');
  const pausedIds = await page.locator('.treasure-photo').evaluateAll((nodes) => nodes.map((node) => node.getAttribute('data-photo-id')));
  await page.waitForTimeout(1_100);
  await expect(page.locator('.treasure-photo')).toHaveCount(activeLimit);
  const stillPausedIds = await page.locator('.treasure-photo').evaluateAll((nodes) => nodes.map((node) => node.getAttribute('data-photo-id')));
  expect(stillPausedIds).toEqual(pausedIds);
  await page.getByRole('button', { name: /Tiếp tục trình chiếu/i }).click();
  await page.waitForTimeout(700);
  expect(await page.locator('.treasure-photo').evaluateAll((nodes) => nodes.map((node) => node.getAttribute('data-photo-id')))).not.toEqual(pausedIds);
  expect(originalRequests).toEqual([]);
});

test('love treasure returns to the letter and respects reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/love-treasure');
  await expect(page.locator('.treasure-page')).toHaveClass(/is-reduced-motion/);
  await expect(page.locator('.treasure-photo').first()).toHaveCSS('animation-name', 'none');
  await expect(page.locator('.vinyl-record')).toHaveCSS('animation-name', 'none');
  await expect(page.locator('.vinyl-disc-face')).toHaveCSS('animation-name', 'none');
  await page.getByRole('button', { name: /Quay lại lá thư/i }).click();
  await expect(page).toHaveURL(/\/birthday\?stage=letter$/);
  await expect(page.getByRole('heading', { name: /Cho Quỳnh/i })).toBeVisible();
});

test('love treasure music lounge renders the five local tracks and changes the active song', async ({ page }) => {
  const audioRequests: string[] = [];
  page.on('request', (request) => {
    if (/\/mp3\/.*\.mp3(?:\?|$)/i.test(request.url())) audioRequests.push(request.url());
  });

  await page.goto('/love-treasure');
  await expect(page.locator('.music-track')).toHaveCount(5);
  await expect(page.locator('.music-track').nth(0)).toContainText('Cà phê đắng như ly cafe');
  await expect(page.locator('.music-track').nth(1)).toContainText('Mascara');
  await expect(page.locator('.music-track').nth(2)).toContainText('Mơ');
  await expect(page.locator('.music-track').nth(3)).toContainText('Thằng Điên');
  await expect(page.locator('.music-track').nth(4)).toContainText('Vì anh đâu có biết');

  const audio = page.locator('audio.love-audio-source');
  await expect(audio).toHaveAttribute('preload', 'metadata');
  await expect(audio).toHaveAttribute('src', /mp3\/C%C3%A0%20ph%C3%AA%20%C4%91%E1%BA%AFng%20nh%C6%B0%20ly%20cafe\.mp3/);
  await page.locator('.music-track').nth(1).click();
  await expect(page.locator('.music-track').nth(1)).toHaveAttribute('aria-current', 'true');
  await expect(audio).toHaveAttribute('src', /mp3\/Mascara\.mp3/);
  await expect.poll(() => audioRequests.some((url) => decodeURIComponent(url).includes('/mp3/Mascara.mp3'))).toBe(true);
  expect(audioRequests.every((url) => !/\.(?:jpe?g|png|heic|mp4)(?:\?|$)/i.test(url))).toBe(true);
});

test('love treasure exposes an autoplay fallback and synchronizes player state', async ({ page }) => {
  await page.addInitScript(() => {
    HTMLMediaElement.prototype.play = () => Promise.reject(new DOMException('Autoplay blocked', 'NotAllowedError'));
  });
  await page.goto('/love-treasure');
  await expect(page.locator('.autoplay-fallback')).toBeVisible();
  await expect(page.locator('.autoplay-hint')).toHaveText('Chạm vào nút phát để mở nhạc cho kho báu này.');
  await expect(page.locator('.now-playing')).toContainText('Chạm để mở nhạc');

  const audio = page.locator('audio.love-audio-source');
  const playButton = page.locator('.music-play-button');
  await audio.dispatchEvent('play');
  await expect(playButton).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.now-playing')).toContainText('Đĩa đang quay');
  await audio.dispatchEvent('pause');
  await expect(playButton).toHaveAttribute('aria-pressed', 'false');
  await expect(page.locator('.now-playing')).toContainText('Tạm dừng');

  await audio.dispatchEvent('ended');
  await expect(page.locator('.music-track').nth(1)).toHaveAttribute('aria-current', 'true');
});

test('love treasure music sliders seek and change volume', async ({ page }) => {
  await page.goto('/love-treasure');
  const audio = page.locator('audio.love-audio-source');
  await audio.evaluate((element) => {
    let currentTime = 0;
    Object.defineProperty(element, 'duration', { configurable: true, value: 240 });
    Object.defineProperty(element, 'currentTime', {
      configurable: true,
      get: () => currentTime,
      set: (value: number) => { currentTime = value; }
    });
    element.dispatchEvent(new Event('loadedmetadata'));
  });

  const progress = page.locator('.music-progress-range');
  await expect(progress).toHaveAttribute('max', '240');
  await progress.evaluate((element) => {
    const input = element as HTMLInputElement;
    input.value = '42';
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await expect(progress).toHaveValue('42');
  await expect.poll(() => audio.evaluate((element) => element.currentTime)).toBe(42);

  const volume = page.locator('.music-volume input');
  await volume.fill('35');
  await expect.poll(() => audio.evaluate((element) => element.volume)).toBeCloseTo(.35, 2);
});

test('love treasure keeps the vinyl fixed and lets the desktop music menu move safely', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'The touch layout is covered by the mobile drag scenario.');
  await page.goto('/love-treasure');
  await page.waitForTimeout(850);
  await expectTreasureLayersSeparated(page);

  const recordStage = page.locator('.record-stage');
  const vinyl = page.locator('.vinyl-disc-face');
  const recordBefore = await recordStage.boundingBox();
  expect(recordBefore).not.toBeNull();

  await page.locator('audio.love-audio-source').dispatchEvent('play');
  await expect(page.locator('.vinyl-disc-face')).toHaveCSS('animation-play-state', 'running');
  await page.waitForTimeout(1_100);
  expect(await recordStage.boundingBox()).toEqual(recordBefore);
  await page.locator('audio.love-audio-source').dispatchEvent('pause');
  await expect(page.locator('.vinyl-disc-face')).toHaveCSS('animation-play-state', 'paused');

  const panel = page.locator('.music-panel');
  const handle = page.locator('.music-panel-drag-handle');
  const handleBox = await handle.boundingBox();
  expect(handleBox).not.toBeNull();
  await page.mouse.move((handleBox?.x ?? 0) + 24, (handleBox?.y ?? 0) + 20);
  await page.mouse.down();
  await page.mouse.move((handleBox?.x ?? 0) + 52, (handleBox?.y ?? 0) + 20);
  await page.mouse.up();
  await expect(panel).toHaveAttribute('data-panel-position', 'custom');
  await expectTreasureLayersSeparated(page);
  const stageBox = await page.locator('.treasure-stage').boundingBox();
  const movedPanel = await panel.boundingBox();
  expect(stageBox).not.toBeNull();
  expect(movedPanel).not.toBeNull();
  expect(movedPanel?.x ?? 0).toBeGreaterThanOrEqual((stageBox?.x ?? 0) + 16);
  expect(movedPanel?.y ?? 0).toBeGreaterThanOrEqual((stageBox?.y ?? 0) + 16);
  expect(movedPanel?.x ?? 0).toBeLessThanOrEqual((stageBox?.x ?? 0) + (stageBox?.width ?? 0) - (movedPanel?.width ?? 0) - 16);

  const customPanel = await panel.boundingBox();
  expect(customPanel).not.toBeNull();
  await handle.focus();
  await page.keyboard.press('ArrowLeft');
  await expect(panel).toHaveAttribute('data-panel-position', 'custom');
  const nudgedPanel = await panel.boundingBox();
  expect(nudgedPanel?.x ?? 0).toBeLessThanOrEqual(customPanel?.x ?? 0);
  await expectTreasureLayersSeparated(page);

  await page.getByRole('button', { name: /Đặt lại vị trí menu phát nhạc/i }).click();
  await expect(panel).toHaveAttribute('data-panel-position', 'default');
  await expectTreasureLayersSeparated(page);
  await page.locator('.music-track').nth(1).click();
  await expect(page.locator('.music-track').nth(1)).toHaveAttribute('aria-current', 'true');
});

test('love treasure music menu supports touch dragging without covering the vertical photo layout', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/love-treasure');
  await page.waitForTimeout(850);
  await expectTreasureLayersSeparated(page);

  const handle = page.locator('.music-panel-drag-handle');
  const initialTop = (await page.locator('.music-panel').boundingBox())?.y ?? 0;
  await handle.dispatchEvent('pointerdown', { button: 0, pointerType: 'touch', pointerId: 91, isPrimary: true, clientX: 180, clientY: 1200 });
  await handle.dispatchEvent('pointermove', { button: 0, pointerType: 'touch', pointerId: 91, isPrimary: true, clientX: 180, clientY: 1224 });
  await handle.dispatchEvent('pointerup', { button: 0, pointerType: 'touch', pointerId: 91, isPrimary: true, clientX: 180, clientY: 1224 });
  await expect(page.locator('.music-panel')).toHaveAttribute('data-panel-position', 'custom');
  const movedTop = (await page.locator('.music-panel').boundingBox())?.y ?? 0;
  expect(movedTop).toBeGreaterThan(initialTop);
  await expectTreasureLayersSeparated(page);
  await expectTouchTarget(page.getByRole('button', { name: /Đặt lại vị trí menu phát nhạc/i }));
});

test('love treasure does not overflow on the narrow mobile viewport', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'This scenario is covered by the mobile Playwright project.');
  for (const width of [320, 390, 430]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto('/love-treasure');
    await expectNoHorizontalOverflow(page);
    await expect(page.locator('.treasure-photo')).toHaveCount(Number(await page.locator('.treasure-stream').getAttribute('data-active-limit')));
    await expectTouchTarget(page.getByRole('button', { name: /Tạm dừng trình chiếu/i }));
    await expectTouchTarget(page.locator('.music-play-button'));
    await expectTouchTarget(page.getByRole('button', { name: /Quay lại lá thư/i }));
  }
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
