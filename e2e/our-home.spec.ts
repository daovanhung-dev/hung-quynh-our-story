import { expect, test } from '@playwright/test';

async function expectNoHorizontalOverflow(page: import('@playwright/test').Page): Promise<void> {
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
}

test('direct route opens the house and every room remains freely accessible', async ({ page }) => {
  await page.goto('/our-home');
  await expect(page.getByRole('heading', { name: /Ngôi nhà nhỏ/i })).toBeVisible();
  await expect(page.locator('.welcome-card')).toBeVisible();
  await expect.poll(() => page.locator('.scene-stage').evaluate((stage) => {
    const bounds = stage.getBoundingClientRect();
    return bounds.top < window.innerHeight && bounds.bottom > 0;
  })).toBe(true);
  await expect(page.getByRole('button', { name: /Mở cánh cửa của chúng mình/i })).toBeVisible();
  await page.getByRole('button', { name: 'Bỏ qua lời chào' }).click();
  await expect(page.locator('.scene-stage')).toHaveAttribute('data-room-id', 'living');
  await expect.poll(() => page.locator('.room-art').evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0)).toBe(true);
  await expect(page.locator('.room-art')).toHaveCSS('animation-name', /scene-art-enter/);
  await expect.poll(() => page.locator('.scene-stage .hotspot').first().evaluate((button) => getComputedStyle(button, '::after').animationName)).toMatch(/hotspot-glow$/);

  for (const [id, title] of [
    ['entrance', 'Cửa nhà'], ['living', 'Phòng khách'], ['kitchen', 'Căn bếp'],
    ['study', 'Góc học tập'], ['bedroom', 'Phòng ngủ'], ['balcony', 'Ban công']
  ]) {
    await page.locator(`[data-room-nav="${id}"]`).click();
    await expect(page.locator('.scene-stage')).toHaveAttribute('data-room-id', id);
    await expect(page.locator('.room-art')).toHaveAttribute('data-room-art', id);
    await expect(page.locator('.scene-stage .hotspot')).toHaveCount(3);
    await expect.poll(() => page.locator('.room-art').evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0)).toBe(true);
    await expect(page.locator('.room-art')).toHaveCSS('animation-name', /scene-art-enter/);
    await expect(page.getByText(new RegExp(title, 'i')).first()).toBeVisible();

    if (id === 'kitchen') {
      await page.locator('[data-hotspot-id="tea"]').click();
      await expect(page.locator('.reveal-art--tea')).toBeVisible();
      await expect(page.locator('.tea-steam').first()).toHaveCSS('animation-name', /tea-steam-rise$/);
      await page.keyboard.press('Escape');
    }
    if (id === 'bedroom') {
      await page.locator('[data-hotspot-id="pillow"]').click();
      await expect(page.locator('.pillow-cushion')).toHaveCSS('animation-name', /pillow-hug$/);
      await expect(page.locator('.pillow-heart')).toHaveCSS('animation-name', /pillow-heart-pop$/);
      await page.keyboard.press('Escape');
    }
  }
});

test('welcome darkens the entrance and the greeting wakes the house before entry', async ({ page }, testInfo) => {
  await page.goto('/our-home');
  const scene = page.locator('.scene-stage');
  const wash = page.locator('.scene-wash');
  await expect(scene).toHaveClass(/is-welcome/);
  await expect.poll(() => wash.evaluate((element) => getComputedStyle(element, '::after').opacity)).toBe('0.66');
  const openDoor = page.getByRole('button', { name: 'Mở cánh cửa của chúng mình' });
  if (testInfo.project.name === 'mobile') await openDoor.tap();
  else {
    await openDoor.focus();
    await page.keyboard.press('Enter');
  }
  await expect(page.getByText('Vợ iu về nhà rồi! 🏡❤️')).toBeVisible();
  await expect(scene).toHaveClass(/is-waking/);
  await expect.poll(() => wash.evaluate((element) => getComputedStyle(element, '::after').animationName)).toMatch(/entrance-wake/);
  const enterHome = page.getByRole('button', { name: 'Vào nhà của chúng mình' });
  if (testInfo.project.name === 'mobile') await enterHome.tap();
  else {
    await enterHome.focus();
    await page.keyboard.press('Enter');
  }
  await expect(scene).toHaveAttribute('data-room-id', 'living');

  await page.goto('/events');
  await page.evaluate(() => localStorage.removeItem('hq:our-home:progress:v1'));
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/our-home');
  await page.getByRole('button', { name: 'Mở cánh cửa của chúng mình' }).click();
  await expect.poll(() => wash.evaluate((element) => getComputedStyle(element, '::after').animationName)).toBe('none');
  await expect.poll(() => wash.evaluate((element) => getComputedStyle(element, '::after').opacity)).toBe('0');
});

test('idle prefetch warms only the next room illustration under the current base path', async ({ page }) => {
  await page.goto('/our-home');
  const prefetchLinks = page.locator('link[data-our-home-prefetch]');
  await expect(prefetchLinks.first()).toHaveAttribute('data-our-home-prefetch', 'living');
  await expect(prefetchLinks.first()).toHaveAttribute('rel', 'prefetch');
  await expect(prefetchLinks.first()).toHaveAttribute('as', 'image');
  const expectedPath = await page.evaluate(() => new URL('our-home/rooms/living-isometric.webp', document.baseURI).pathname);
  expect(new URL(await prefetchLinks.first().getAttribute('href') ?? '').pathname).toBe(expectedPath);

  await page.locator('[data-room-nav="living"]').click();
  await expect(prefetchLinks.nth(1)).toHaveAttribute('data-our-home-prefetch', 'kitchen');
  await expect(prefetchLinks).toHaveCount(2);
});

test('mobile scene swipe changes rooms without intercepting hotspot taps or mouse drags', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'Swipe navigation is specific to touch input.');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/our-home');
  await page.getByRole('button', { name: 'Bỏ qua lời chào' }).click();

  const dispatchPointer = async (target: string, startX: number, endX: number, pointerType = 'touch'): Promise<void> => {
    await page.locator(target).evaluate((element, coordinates) => {
      const make = (eventType: string, x: number) => new PointerEvent(eventType, {
        bubbles: true,
        pointerId: 1,
        pointerType: coordinates.pointerType,
        clientX: x,
        clientY: 420
      });
      element.dispatchEvent(make('pointerdown', coordinates.startX));
      element.dispatchEvent(make('pointerup', coordinates.endX));
    }, { pointerType, startX, endX });
  };

  await dispatchPointer('.scene-stage', 280, 190);
  await expect(page.locator('.scene-stage')).toHaveAttribute('data-room-id', 'kitchen');
  await dispatchPointer('[data-hotspot-id="tea"]', 280, 190);
  await expect(page.locator('.scene-stage')).toHaveAttribute('data-room-id', 'kitchen');
  await dispatchPointer('.scene-stage', 190, 280);
  await expect(page.locator('.scene-stage')).toHaveAttribute('data-room-id', 'living');
  await dispatchPointer('.scene-stage', 280, 190, 'mouse');
  await expect(page.locator('.scene-stage')).toHaveAttribute('data-room-id', 'living');
});

test('missing room artwork shows a fallback and leaves room controls usable', async ({ page }) => {
  await page.route('**/our-home/rooms/*', (route) => route.abort());
  await page.goto('/our-home');
  await expect(page.locator('.scene-fallback')).toBeVisible();
  await page.locator('[data-room-nav="kitchen"]').click();
  await expect(page.locator('.scene-stage')).toHaveAttribute('data-room-id', 'kitchen');
  await expect(page.locator('.scene-fallback')).toBeVisible();
  await page.locator('[data-hotspot-id="tea"]').click();
  await expect(page.getByRole('dialog')).toContainText('Một cốc ấm cho vợ');
});

test('memory gallery reuses real MemoryService media and the shared PhotoViewer', async ({ page }) => {
  await page.goto('/our-home');
  await page.getByRole('button', { name: 'Bỏ qua lời chào' }).click();
  await page.locator('[data-hotspot-id="photo-wall"]').click();
  const gallery = page.getByRole('dialog', { name: 'Khung ảnh của chúng mình' });
  await expect(gallery.locator('.memory-tile')).toHaveCount(4);
  await expect.poll(() => gallery.locator('.memory-tile').evaluateAll((tiles) => tiles.map((tile) => tile.getAttribute('data-photo-id')))).toEqual([
    '2026-01-04-img-3745', '2026-01-04-img-7226', '2026-01-04-img-7230', '2026-01-04-img-7235'
  ]);
  await gallery.getByRole('button', { name: 'Mở ảnh kỷ niệm 1' }).click();
  await expect(page.getByRole('button', { name: 'Đóng trình xem ảnh' })).toBeVisible();
  await page.getByRole('button', { name: 'Đóng trình xem ảnh' }).click();
  await expect(gallery).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(gallery).toHaveCount(0);
});

test('record-player waits for a gesture, reports blocked playback, and cleans up its audio element', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 760 });
  await page.addInitScript(() => {
    const state = { playCalls: 0, pauseCalls: 0, loadCalls: 0, rejectPlay: false };
    Object.defineProperty(window, '__musicTest', { value: state, configurable: false });
    Object.defineProperty(HTMLMediaElement.prototype, 'play', {
      configurable: true,
      value: function (): Promise<void> {
        state.playCalls += 1;
        return state.rejectPlay ? Promise.reject(new DOMException('Playback blocked', 'NotAllowedError')) : Promise.resolve();
      }
    });
    Object.defineProperty(HTMLMediaElement.prototype, 'pause', {
      configurable: true,
      value: function (): void { state.pauseCalls += 1; }
    });
    Object.defineProperty(HTMLMediaElement.prototype, 'load', {
      configurable: true,
      value: function (): void { state.loadCalls += 1; }
    });
  });
  const musicRequests: string[] = [];
  page.on('request', (request) => { if (new URL(request.url()).pathname.includes('/mp3/')) musicRequests.push(request.url()); });

  await page.goto('/our-home');
  await page.getByRole('button', { name: 'Bỏ qua lời chào' }).click();
  await page.locator('[data-hotspot-id="record-player"]').click();
  const player = page.locator('[data-music-player]');
  const audio = player.locator('audio');
  await expect(player).toBeVisible();
  await expectNoHorizontalOverflow(page);
  await expect(audio).toHaveAttribute('preload', 'none');
  await expect(audio).not.toHaveAttribute('src');
  expect(await page.evaluate(() => (window as unknown as { __musicTest: { playCalls: number } }).__musicTest.playCalls)).toBe(0);
  expect(musicRequests).toHaveLength(0);

  await page.evaluate(() => { (window as unknown as { __musicTest: { rejectPlay: boolean } }).__musicTest.rejectPlay = true; });
  await player.getByRole('button', { name: 'Phát nhạc' }).click();
  await expect(player.getByRole('status')).toContainText('Trình duyệt chưa bật được bài hát');
  await expect(audio).toHaveAttribute('src', /\/mp3\/C%C3%A0%20ph%C3%AA%20%C4%91%E1%BA%AFng%20nh%C6%B0%20ly%20cafe\.mp3$/);

  await page.evaluate(() => { (window as unknown as { __musicTest: { rejectPlay: boolean } }).__musicTest.rejectPlay = false; });
  await player.getByRole('button', { name: 'Phát nhạc' }).click();
  await expect(player.getByRole('button', { name: 'Tạm dừng' })).toBeVisible();
  await player.getByRole('button', { name: 'Mascara' }).click();
  await expect(audio).toHaveAttribute('src', /\/mp3\/Mascara\.mp3$/);
  await expect(player.getByRole('button', { name: 'Tạm dừng' })).toBeVisible();
  await player.getByRole('button', { name: 'Tắt âm' }).click();
  await expect(audio).toHaveJSProperty('muted', true);
  await expect(player.getByRole('button', { name: 'Bật âm' })).toHaveAttribute('aria-pressed', 'true');
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('hq:our-home:progress:v1') ?? '{}').audioEnabled)).toBe(false);

  await page.keyboard.press('Escape');
  await expect(audio).toHaveCount(0);
  expect(await page.evaluate(() => (window as unknown as { __musicTest: { pauseCalls: number; loadCalls: number } }).__musicTest.pauseCalls)).toBeGreaterThan(0);

  await page.locator('[data-room-nav="living"]').click();
  await page.locator('[data-hotspot-id="record-player"]').click();
  await player.getByRole('button', { name: 'Phát nhạc' }).click();
  await page.locator('.home-footer a[href="/events"]').dispatchEvent('click');
  await expect(page).toHaveURL(/\/events$/);
  await expect(page.locator('[data-music-player]')).toHaveCount(0);
  expect(await page.evaluate(() => (window as unknown as { __musicTest: { pauseCalls: number } }).__musicTest.pauseCalls)).toBeGreaterThan(1);
});

test('the five letters can be opened and read again, while the gift can open at zero stamps', async ({ page }) => {
  await page.goto('/our-home');
  const giftButton = page.getByRole('button', { name: 'Mở hộp quà' });
  await expect(giftButton).not.toHaveClass(/is-ready/);
  await giftButton.click();
  await expect(page.locator('[data-finale]')).toContainText('0/5');
  await expect(page.locator('[data-finale]').getByRole('link', { name: 'Về các lựa chọn' })).toHaveAttribute('href', '/events');
  await page.locator('[data-finale]').getByRole('button', { name: /Chồng ôm vợ một cái nhé/ }).click();
  await expect(page.locator('.hug-heart')).toHaveCount(5);
  await expect(page.locator('.hug-heart').first()).toHaveCSS('animation-name', /hug-heart-float$/);
  await page.keyboard.press('Escape');
  await page.locator('[data-room-nav="bedroom"]').click();
  await page.locator('[data-hotspot-id="letter-box"]').click();
  const letterDialog = page.getByRole('dialog', { name: 'Mở khi em…' });
  for (const id of ['sad', 'miss-me', 'tired', 'lonely', 'happy']) {
    await letterDialog.locator(`[data-letter-id="${id}"]`).click();
    await expect(page.locator('.letter-content p')).not.toHaveText('');
    if (id === 'sad') await expect(page.locator('.letter-content')).toHaveCSS('animation-name', /letter-unfold$/);
    await expect(page.locator('.letter-content')).not.toContainText(/bản nháp chờ Hùng duyệt/i);
    await page.getByRole('button', { name: 'Chọn lá thư khác' }).click();
    await expect(page.getByRole('dialog', { name: 'Mở khi em…' })).toBeVisible();
  }
  await expect(page.locator('.progress-summary')).toContainText('5/5 lá thư đã mở');
  await expect(page.locator('.progress-summary')).toContainText('1/5 dấu ấn');
  await page.getByRole('button', { name: 'Đóng cửa sổ' }).click();
  await page.getByRole('button', { name: 'Xem từ đầu' }).click();
  await expect(page.getByRole('dialog')).toContainText('Tiến trình chỉ lưu trên trình duyệt này');
  await page.getByRole('button', { name: 'Giữ lại' }).click();
  await expect(page.locator('.progress-summary')).toContainText('5/5 lá thư đã mở');
  await page.getByRole('button', { name: 'Xem từ đầu' }).click();
  await page.getByRole('button', { name: 'Xóa tiến trình Our Home' }).click();
  await expect(page.locator('.progress-summary')).toContainText('0/6 góc đã ghé');
  await expect(page.locator('.progress-summary')).toContainText('0/5 lá thư đã mở');
});

test('the final gift can navigate back to the Event Hub', async ({ page }) => {
  await page.goto('/our-home');
  await page.getByRole('button', { name: 'Bỏ qua lời chào' }).click();
  await page.getByRole('button', { name: 'Mở hộp quà' }).click();
  await page.locator('[data-finale]').getByRole('link', { name: 'Về các lựa chọn' }).click();
  await expect(page).toHaveURL(/\/events$/);
  await expect(page.locator('.site-footer')).not.toHaveClass(/journey-hidden/);
});

test('kitchen, study, clocks and accessibility controls respond to mouse and keyboard', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/our-home');
  await page.getByRole('button', { name: 'Bỏ qua lời chào' }).click();

  await page.locator('[data-room-nav="living"]').focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('.scene-stage')).toHaveAttribute('data-room-id', 'kitchen');
  await expect(page.locator('[data-room-nav="kitchen"]')).toBeFocused();
  await page.keyboard.press('ArrowLeft');
  await expect(page.locator('.scene-stage')).toHaveAttribute('data-room-id', 'living');
  await page.keyboard.press('ArrowRight');
  await page.locator('[data-hotspot-id="tea"]').click();
  await expect(page.getByRole('dialog')).toContainText('Một cốc ấm cho vợ');
  await expect(page.locator('.tea-steam').first()).toHaveCSS('animation-name', 'none');
  await page.keyboard.press('Escape');

  await page.locator('[data-room-nav="study"]').click();
  await expect(page.locator('[data-study-date]')).toBeVisible();
  await expect(page.locator('[data-study-date]')).toContainText('Hôm nay ở Nhật');
  await expect(page.locator('[data-study-date]')).toContainText(/\d{2}:\d{2}/);
  const lamp = page.locator('[data-hotspot-id="desk-lamp"]');
  await lamp.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('dialog')).toContainText('Đèn bàn đã đổi sáng');
  await page.keyboard.press('Escape');

  await page.locator('[data-room-nav="balcony"]').click();
  await page.locator('[data-hotspot-id="two-clocks"]').click();
  await expect(page.getByRole('dialog')).toContainText('Asia/Ho_Chi_Minh');
  await expect(page.getByRole('dialog')).toContainText('Asia/Tokyo');
  await expect(page.locator('.clock-row article')).toHaveCount(2);
  await page.keyboard.press('Escape');

  await page.getByRole('button', { name: 'Bật chuyển động tinh tế' }).click();
  await expect(page.locator('.scene-stage')).not.toHaveClass(/is-reduced-motion/);
  await page.getByRole('button', { name: 'Tắt chuyển động' }).click();
  await expect(page.locator('.scene-stage')).toHaveClass(/is-reduced-motion/);
  await expect(page.locator('.room-art')).toHaveCSS('animation-name', 'none');
  await expectNoHorizontalOverflow(page);
  await expect(page.locator('.scene-stage .hotspot').first()).toHaveCSS('transition-duration', '0s');
  await page.getByRole('button', { name: 'Mở hộp quà' }).click();
  await expect(page.locator('.gift-box')).toHaveCSS('animation-name', 'none');
  await page.locator('[data-finale]').getByRole('button', { name: /Chồng ôm vợ một cái nhé/ }).click();
  await expect(page.locator('.hug-heart').first()).toHaveCSS('animation-name', 'none');
  await expect(page.locator('.hug-heart').first()).toHaveCSS('opacity', '1');
});

test('Vietnam and Japan clocks update on the minute and when the tab becomes visible', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-10-12T15:59:30Z') });
  await page.goto('/our-home');
  await page.getByRole('button', { name: 'Bỏ qua lời chào' }).click();
  await page.locator('[data-room-nav="balcony"]').click();
  await page.locator('[data-hotspot-id="two-clocks"]').click();

  const clockValues = page.locator('.clock-row article p');
  await expect(clockValues.nth(0)).toHaveText('22:59');
  await expect(clockValues.nth(1)).toHaveText('00:59');

  await page.clock.fastForward(30_000);
  await expect(clockValues.nth(0)).toHaveText('23:00');
  await expect(clockValues.nth(1)).toHaveText('01:00');

  await page.clock.setSystemTime(new Date('2026-10-12T16:05:00Z'));
  await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
  await expect(clockValues.nth(0)).toHaveText('23:05');
  await expect(clockValues.nth(1)).toHaveText('01:05');
});

test('native dialogs trap and restore focus and stay usable at 200% text size', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 760 });
  await page.goto('/our-home');
  await page.getByRole('button', { name: 'Bỏ qua lời chào' }).click();

  const galleryTrigger = page.locator('[data-hotspot-id="photo-wall"]');
  await galleryTrigger.click();
  const gallery = page.getByRole('dialog', { name: 'Khung ảnh của chúng mình' });
  await expect(gallery).toBeVisible();
  await expect(page.locator('.dialog-close')).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(gallery.locator('.memory-tile').last()).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.locator('.dialog-close')).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(gallery).toHaveCount(0);
  await expect(galleryTrigger).toBeFocused();
  await galleryTrigger.click();
  await expect(gallery).toBeVisible();
  await page.mouse.click(2, 2);
  await expect(gallery).toHaveCount(0);

  await page.locator('[data-room-nav="bedroom"]').click();
  await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
  await page.locator('[data-hotspot-id="letter-box"]').click();
  const letters = page.getByRole('dialog', { name: 'Mở khi em…' });
  await letters.locator('[data-letter-id="sad"]').click();
  await expect(page.locator('.letter-content p')).toBeVisible();
  await expectNoHorizontalOverflow(page);
  await expect(page.locator('app-house-dialog dialog')).toHaveJSProperty('open', true);
  const dialogWidth = await page.locator('app-house-dialog dialog').evaluate((dialog) => dialog.getBoundingClientRect().width);
  expect(dialogWidth).toBeLessThanOrEqual(320);
});

test('storage errors and broken memory images leave the house usable', async ({ page }) => {
  await page.addInitScript(() => {
    const key = 'hq:our-home:progress:v1';
    localStorage.setItem(key, '{broken json');
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (name: string, value: string): void {
      if (name === key) throw new DOMException('Storage blocked', 'SecurityError');
      original.call(this, name, value);
    };
    const originalGet = Storage.prototype.getItem;
    Storage.prototype.getItem = function (name: string): string | null {
      if (name === key) throw new DOMException('Storage blocked', 'SecurityError');
      return originalGet.call(this, name);
    };
  });
  await page.route('**/images/generated/memories/**', (route) => route.abort());
  await page.setViewportSize({ width: 320, height: 760 });
  await page.goto('/our-home');
  await page.getByRole('button', { name: 'Bỏ qua lời chào' }).click();
  await expect(page.locator('.progress-summary')).toContainText('1/6 góc đã ghé');
  await page.locator('[data-hotspot-id="photo-wall"]').click();
  await expect(page.locator('.photo-fallback').first()).toBeVisible();
  await expectNoHorizontalOverflow(page);
  await expect(page.locator('audio')).toHaveCount(0);
});

test('stored progress removes unknown and duplicate IDs and survives a refresh', async ({ page }) => {
  await page.goto('/events');
  await page.evaluate(() => localStorage.setItem('hq:our-home:progress:v1', JSON.stringify({
    schemaVersion: 1,
    introSeen: true,
    exploredRooms: ['living', 'living', 'unknown-room'],
    collectedStamps: ['memory', 'memory', 'unknown-stamp'],
    openedLetters: ['sad', 'sad', 'unknown-letter'],
    finaleSeen: false,
    audioEnabled: false,
    reducedMotionOverride: null,
    unexpected: 'ignored'
  })));
  await page.goto('/our-home');
  await expect(page.locator('.progress-summary')).toContainText('1/6 góc đã ghé');
  await expect(page.locator('.progress-summary')).toContainText('1/5 dấu ấn');
  await expect(page.locator('.progress-summary')).toContainText('1/5 lá thư đã mở');
  await page.locator('[data-room-nav="bedroom"]').click();
  await page.reload();
  await expect(page.locator('.scene-stage')).toHaveAttribute('data-room-id', 'entrance');
  await expect(page.locator('.progress-summary')).toContainText('2/6 góc đã ghé');
  await expect(page.locator('.progress-summary')).toContainText('1/5 dấu ấn');

  await page.goto('/events');
  await page.evaluate(() => localStorage.setItem('hq:our-home:progress:v1', JSON.stringify({
    schemaVersion: 1,
    introSeen: true,
    exploredRooms: ['living'],
    collectedStamps: ['memory', 'care', 'courage', 'moon', 'unknown-stamp'],
    openedLetters: [],
    finaleSeen: false,
    audioEnabled: false,
    reducedMotionOverride: null
  })));
  await page.goto('/our-home');
  const giftButton = page.getByRole('button', { name: 'Mở hộp quà' });
  await expect(giftButton).toHaveClass(/is-ready/);
  await giftButton.click();
  await expect(page.locator('[data-finale]')).toContainText('4/5');

  await page.keyboard.press('Escape');
  await page.goto('/events');
  await page.evaluate(() => localStorage.setItem('hq:our-home:progress:v1', JSON.stringify({ schemaVersion: 2 })));
  await page.goto('/our-home');
  await expect(page.locator('.progress-summary')).toContainText('0/6 góc đã ghé');
  await expect(page.locator('.progress-summary')).toContainText('0/5 dấu ấn');
});

test('scene hotspots stay visible and at least 44 pixels across the target viewport matrix', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'The viewport matrix is covered in the desktop project; mobile flow runs separately.');
  test.setTimeout(60_000);
  const rooms = ['entrance', 'living', 'kitchen', 'study', 'bedroom', 'balcony'];
  for (const width of [320, 360, 375, 390, 768, 1024, 1366, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    if (width === 320) await page.goto('/our-home');
    for (const roomId of rooms) {
      await page.locator(`[data-room-nav="${roomId}"]`).click();
      const scene = page.locator('.scene-stage');
      await expect(scene).toHaveAttribute('data-room-id', roomId);
      const { stage, art, boxes } = await scene.evaluate((stageElement) => {
        const readBox = (element: Element | null) => {
          if (!element) return null;
          const rect = element.getBoundingClientRect();
          return { left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom, width: rect.width, height: rect.height };
        };
        return {
          stage: readBox(stageElement),
          art: readBox(stageElement.querySelector('.room-art')),
          boxes: Array.from(stageElement.querySelectorAll('.hotspot')).map((button) => readBox(button))
        };
      });
      expect(stage).not.toBeNull();
      expect(art).not.toBeNull();
      expect(Math.abs((stage?.width ?? 0) / (stage?.height ?? 1) - 1), `${roomId} diorama stage stays square at ${width}px`).toBeLessThan(0.02);
      expect(Math.abs((art?.width ?? 0) / (art?.height ?? 1) - 1), `${roomId} room artwork stays square at ${width}px`).toBeLessThan(0.02);
      await expect(page.locator('.room-art')).toHaveCSS('object-fit', 'contain');
      expect(boxes).toHaveLength(3);
      for (const box of boxes) {
        expect(box).not.toBeNull();
        expect(Math.min(box?.width ?? 0, box?.height ?? 0), `${roomId} at ${width}px has ${JSON.stringify(box)}`).toBeGreaterThanOrEqual(44);
        expect(box?.left).toBeGreaterThanOrEqual((stage?.left ?? 0) - 1);
        expect(box?.top).toBeGreaterThanOrEqual((stage?.top ?? 0) - 1);
        expect(box?.right).toBeLessThanOrEqual((stage?.right ?? 0) + 1);
        expect(box?.bottom).toBeLessThanOrEqual((stage?.bottom ?? 0) + 1);
      }
      for (let first = 0; first < boxes.length; first += 1) {
        for (let second = first + 1; second < boxes.length; second += 1) {
          const a = boxes[first]!;
          const b = boxes[second]!;
          const overlapX = Math.min(a.right!, b.right!) - Math.max(a.left!, b.left!);
          const overlapY = Math.min(a.bottom!, b.bottom!) - Math.max(a.top!, b.top!);
          expect(overlapX > 0 && overlapY > 0, `${roomId} hotspots overlap at ${width}px`).toBe(false);
        }
      }
    }
    await expectNoHorizontalOverflow(page);
  }
});
