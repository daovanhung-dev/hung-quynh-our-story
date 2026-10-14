import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { DestroyRef, Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { formatHouseClock, formatHouseDate, getHouseMood } from './house-time.utils.mjs';

export type HouseMood = 'dawn' | 'day' | 'sunset' | 'night';

@Injectable({ providedIn: 'root' })
export class HouseTimeService {
  private readonly document = inject(DOCUMENT);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private interval?: ReturnType<typeof setInterval>;
  private timeout?: ReturnType<typeof setTimeout>;
  readonly now = signal(new Date());

  constructor() {
    inject(DestroyRef).onDestroy(() => this.destroy());
    if (!this.isBrowser) return;
    const untilNextMinute = 60_000 - (Date.now() % 60_000);
    this.timeout = setTimeout(() => {
      this.refresh();
      this.interval = setInterval(() => this.refresh(), 60_000);
    }, untilNextMinute);
    this.document.addEventListener('visibilitychange', this.onVisibilityChange);
  }

  destroy(): void {
    if (this.interval) clearInterval(this.interval);
    if (this.timeout) clearTimeout(this.timeout);
    this.document.removeEventListener('visibilitychange', this.onVisibilityChange);
  }

  getJapanClock(): string {
    return formatHouseClock(this.now(), 'Asia/Tokyo', 'ja-JP');
  }

  getVietnamClock(): string {
    return formatHouseClock(this.now(), 'Asia/Ho_Chi_Minh', 'vi-VN');
  }

  getJapanDate(): string {
    return formatHouseDate(this.now());
  }

  getMood(): HouseMood {
    return getHouseMood(this.now());
  }

  private readonly onVisibilityChange = (): void => {
    if (!this.document.hidden) this.refresh();
  };

  private refresh(): void {
    this.now.set(new Date());
  }
}
