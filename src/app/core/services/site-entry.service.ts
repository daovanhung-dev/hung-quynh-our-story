import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class SiteEntryService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly sessionKey = 'hung-quynh-site-entry-seen';

  hasSeenWelcome(): boolean {
    if (!isPlatformBrowser(this.platformId)) return false;

    try {
      return window.sessionStorage.getItem(this.sessionKey) === 'true';
    } catch {
      return false;
    }
  }

  markWelcomeSeen(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    try {
      window.sessionStorage.setItem(this.sessionKey, 'true');
    } catch {
      // Session storage can be unavailable in privacy-restricted browsers.
    }
  }
}
