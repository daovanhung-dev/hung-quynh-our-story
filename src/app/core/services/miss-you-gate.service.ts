import { Injectable } from '@angular/core';
import { isMissYouCodeCorrect, MISS_YOU_SESSION_KEY } from '../../features/miss-you/miss-you-gate.utils';

@Injectable({ providedIn: 'root' })
export class MissYouGateService {
  private unlockedInMemory = false;

  isUnlocked(): boolean {
    if (this.unlockedInMemory) return true;
    try {
      return window.sessionStorage.getItem(MISS_YOU_SESSION_KEY) === 'true';
    } catch {
      return false;
    }
  }

  unlock(code: string): boolean {
    if (!isMissYouCodeCorrect(code)) return false;
    try {
      window.sessionStorage.setItem(MISS_YOU_SESSION_KEY, 'true');
    } catch {
      this.unlockedInMemory = true;
    }
    return this.isUnlocked();
  }
}
