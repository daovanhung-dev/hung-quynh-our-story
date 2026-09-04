import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class BirthdayJourneyService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly sessionKey = 'hung-quynh-birthday-journey-seen';

  readonly active = signal(false);

  hasSeenThisSession(): boolean {
    if (!isPlatformBrowser(this.platformId)) return false;

    try {
      return window.sessionStorage.getItem(this.sessionKey) === 'true';
    } catch {
      return false;
    }
  }

  start(): void {
    this.active.set(true);
  }

  markSeen(): void {
    if (isPlatformBrowser(this.platformId)) {
      try {
        window.sessionStorage.setItem(this.sessionKey, 'true');
      } catch {
        // Session storage can be unavailable in privacy-restricted browsers.
      }
    }
  }

  complete(): void {
    this.markSeen();
    this.active.set(false);
  }

  stop(): void {
    this.active.set(false);
  }
}
