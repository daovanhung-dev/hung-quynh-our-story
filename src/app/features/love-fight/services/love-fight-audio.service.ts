import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { LOVE_FIGHT_AUDIO } from '../data/love-fight-assets';
import { LoveFightSessionService } from './love-fight-session.service';

export type LoveFightSound = keyof typeof LOVE_FIGHT_AUDIO;

@Injectable({ providedIn: 'root' })
export class LoveFightAudioService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly session = inject(LoveFightSessionService);
  private readonly sounds = new Map<LoveFightSound, HTMLAudioElement>();

  play(sound: LoveFightSound): void {
    if (!isPlatformBrowser(this.platformId) || this.session.muted()) return;
    const current = this.sounds.get(sound) || this.create(sound);
    current.currentTime = 0;
    void current.play().catch(() => undefined);
  }

  private create(sound: LoveFightSound): HTMLAudioElement {
    const source = new URL(LOVE_FIGHT_AUDIO[sound], document.baseURI).toString();
    const audio = new Audio(source);
    audio.preload = 'auto';
    audio.volume = sound === 'ending' ? 0.7 : 0.48;
    this.sounds.set(sound, audio);
    return audio;
  }
}
