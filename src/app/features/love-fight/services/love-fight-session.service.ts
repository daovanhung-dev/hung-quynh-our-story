import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import type { MemoryMedia } from '../../../core/models/memory.model';
import {
  ALL_HUNG_OUTFIT_IDS,
  HUNG_OUTFITS,
  QUYNH_OUTFITS,
  SPECIALS,
  WEAPONS
} from '../data/love-fight-assets';
import type {
  CombatSnapshot,
  EndingKind,
  LoveFightState,
  MatchSetup,
  QuynhAction,
  RoundChoice,
  RoundWinner,
  SpecialDefinition
} from '../models/love-fight.model';
import { METER_MAX, clampMeter, roundTarget } from '../models/love-fight-rules';

const MATCH_SETUP_KEYS = {
  quynhOutfit: 'loveFight.quynhOutfit',
  hungPool: 'loveFight.hungOutfitPool',
  rounds: 'loveFight.rounds',
  weapon: 'loveFight.weapon'
} as const;
const PREFERENCE_KEYS = {
  muted: 'loveFight.audio.muted',
  lastWeapon: 'loveFight.lastWeapon',
  lastQuynhOutfit: 'loveFight.lastQuynhOutfit'
} as const;

const isRoundChoice = (value: number): value is RoundChoice => value === 1 || value === 3 || value === 5;

@Injectable({ providedIn: 'root' })
export class LoveFightSessionService {
  private readonly platformId = inject(PLATFORM_ID);
  private seed = this.createSeed();
  private readonly timers = new Set<ReturnType<typeof setTimeout>>();
  private feedbackToken = 0;

  readonly state = signal<LoveFightState>('intro');
  readonly setup = signal<MatchSetup>(this.restoreSetup());
  readonly selectedHungOutfitId = signal(this.setup().hungLockedOutfitId || HUNG_OUTFITS[0]?.id || 'H01');
  readonly activeSpecials = signal<readonly SpecialDefinition[]>([]);
  readonly roundNumber = signal(1);
  readonly timerSec = signal(60);
  readonly anger = signal(METER_MAX);
  readonly courage = signal(METER_MAX);
  readonly quynhWins = signal(0);
  readonly hungWins = signal(0);
  readonly quynhAction = signal<QuynhAction>('IDLE_ANGRY');
  readonly hungAction = signal('TIMID_IDLE');
  readonly quynhX = signal(270);
  readonly hungX = signal(690);
  readonly velocityX = signal(0);
  readonly velocityY = signal(0);
  readonly isGrounded = signal(true);
  readonly isCrouching = signal(false);
  readonly isDashing = signal(false);
  readonly comboCount = signal(0);
  readonly dashReady = signal(true);
  readonly engineReady = signal(false);
  readonly cameraX = signal(0);
  readonly cameraZoom = signal(1);
  readonly actionFeedback = signal('');
  readonly feedbackTone = signal<'neutral' | 'good' | 'warning'>('neutral');
  readonly paused = signal(false);
  readonly muted = signal(this.readPreference(PREFERENCE_KEYS.muted) === 'true');
  readonly photoRain = signal<readonly MemoryMedia[]>([]);
  readonly galleryPhotos = signal<readonly MemoryMedia[]>([]);
  readonly endingKind = signal<EndingKind | null>(null);
  readonly lastRoundWinner = signal<RoundWinner | null>(null);

  readonly roundTarget = computed(() => roundTarget(this.setup().rounds));
  readonly snapshot = computed<CombatSnapshot>(() => ({
    state: this.state(),
    roundNumber: this.roundNumber(),
    totalRounds: this.setup().rounds,
    timerSec: this.timerSec(),
    anger: this.anger(),
    courage: this.courage(),
    quynhWins: this.quynhWins(),
    hungWins: this.hungWins(),
    quynhAction: this.quynhAction(),
    hungAction: this.hungAction(),
    quynhX: this.quynhX(),
    hungX: this.hungX(),
    velocityX: this.velocityX(),
    velocityY: this.velocityY(),
    isGrounded: this.isGrounded(),
    isCrouching: this.isCrouching(),
    isDashing: this.isDashing(),
    comboCount: this.comboCount(),
    dashReady: this.dashReady(),
    cameraX: this.cameraX(),
    cameraZoom: this.cameraZoom()
  }));

  goToOutfitSelection(): void {
    this.state.set('outfit-select');
  }

  goToRoundSelect(): void {
    this.state.set('round-select');
  }

  goToWeaponSelect(): void {
    this.state.set('weapon-select');
  }

  selectQuynhOutfit(id: string): void {
    if (!QUYNH_OUTFITS.some((outfit) => outfit.id === id)) return;
    this.updateSetup({ quynhOutfitId: id });
    this.writePreference(PREFERENCE_KEYS.lastQuynhOutfit, id);
  }

  toggleHungOutfit(id: string): void {
    if (!ALL_HUNG_OUTFIT_IDS.includes(id)) return;
    const pool = [...this.setup().hungOutfitPool];
    const index = pool.indexOf(id);
    if (index >= 0) {
      pool.splice(index, 1);
    } else if (pool.length < 3) {
      pool.push(id);
    }
    this.updateSetup({ hungOutfitPool: pool });
  }

  setHungLocked(id: string | undefined): void {
    if (id && !ALL_HUNG_OUTFIT_IDS.includes(id)) return;
    this.updateSetup({ hungLockedOutfitId: id });
    if (id) this.selectedHungOutfitId.set(id);
  }

  setRounds(rounds: RoundChoice): void {
    this.updateSetup({ rounds });
  }

  setWeapon(id: string): void {
    if (!WEAPONS.some((item) => item.id === id)) return;
    this.updateSetup({ weaponId: id });
    this.writePreference(PREFERENCE_KEYS.lastWeapon, id);
  }

  prepareMatch(): void {
    this.seed = this.createSeed();
    const current = this.setup();
    const pool = current.hungOutfitPool.length ? current.hungOutfitPool : ALL_HUNG_OUTFIT_IDS;
    const hungId = current.hungLockedOutfitId || this.pick(pool);
    this.selectedHungOutfitId.set(hungId);
    this.activeSpecials.set(this.shuffle(SPECIALS).slice(0, 4));
    this.roundNumber.set(1);
    this.lastRoundWinner.set(null);
    this.quynhWins.set(0);
    this.hungWins.set(0);
    this.resetRoundMeters();
    this.state.set('vs');
  }

  startFight(): void {
    this.paused.set(false);
    this.state.set('round-intro');
    this.schedule(() => {
      if (this.state() === 'round-intro') this.state.set('playing');
    }, 900);
  }

  togglePause(): void {
    if (this.state() !== 'playing') return;
    this.paused.update((paused) => !paused);
  }

  setEngineReady(ready: boolean): void {
    this.engineReady.set(ready);
  }

  announceFeedback(message: string, tone: 'neutral' | 'good' | 'warning' = 'neutral', durationMs = 850): void {
    const token = ++this.feedbackToken;
    this.actionFeedback.set(message);
    this.feedbackTone.set(tone);
    this.schedule(() => {
      if (token !== this.feedbackToken) return;
      this.actionFeedback.set('');
      this.feedbackTone.set('neutral');
    }, durationMs);
  }

  setTimer(seconds: number): void {
    if (this.state() !== 'playing' || this.paused()) return;
    this.timerSec.set(Math.max(0, Math.ceil(seconds)));
  }

  setCombatSnapshot(snapshot: Partial<CombatSnapshot>): void {
    if (snapshot.quynhAction) this.quynhAction.set(snapshot.quynhAction as QuynhAction);
    if (snapshot.hungAction) this.hungAction.set(snapshot.hungAction);
    if (typeof snapshot.quynhX === 'number') this.quynhX.set(Math.round(snapshot.quynhX));
    if (typeof snapshot.hungX === 'number') this.hungX.set(Math.round(snapshot.hungX));
    if (typeof snapshot.velocityX === 'number') this.velocityX.set(snapshot.velocityX);
    if (typeof snapshot.velocityY === 'number') this.velocityY.set(snapshot.velocityY);
    if (typeof snapshot.isGrounded === 'boolean') this.isGrounded.set(snapshot.isGrounded);
    if (typeof snapshot.isCrouching === 'boolean') this.isCrouching.set(snapshot.isCrouching);
    if (typeof snapshot.isDashing === 'boolean') this.isDashing.set(snapshot.isDashing);
    if (typeof snapshot.comboCount === 'number') this.comboCount.set(Math.max(0, Math.floor(snapshot.comboCount)));
    if (typeof snapshot.dashReady === 'boolean') this.dashReady.set(snapshot.dashReady);
    if (typeof snapshot.cameraX === 'number') this.cameraX.set(snapshot.cameraX);
    if (typeof snapshot.cameraZoom === 'number') this.cameraZoom.set(snapshot.cameraZoom);
  }

  damageCourage(amount: number): void {
    if (this.state() !== 'playing' || this.paused()) return;
    this.courage.update((value) => clampMeter(value - Math.max(0, amount)));
    if (this.courage() <= 0) this.resolveRound('quynh');
  }

  reduceAnger(amount: number): void {
    if (this.state() !== 'playing' || this.paused()) return;
    this.anger.update((value) => clampMeter(value - Math.max(0, amount)));
    if (this.anger() <= 0) this.resolveRound('hung');
  }

  resolveTimeout(): void {
    if (this.state() !== 'playing') return;
    const quynhProgress = METER_MAX - this.courage();
    const hungProgress = METER_MAX - this.anger();
    this.resolveRound(quynhProgress >= hungProgress ? 'quynh' : 'hung');
  }

  resolveRound(winner: RoundWinner): void {
    if (this.state() !== 'playing') return;
    const resolvedWinner = winner === 'timeout' ? 'quynh' : winner;
    this.lastRoundWinner.set(resolvedWinner);
    if (resolvedWinner === 'quynh') {
      this.quynhWins.update((value) => value + 1);
      this.quynhAction.set('VICTORY_ANGRY');
    } else {
      this.hungWins.update((value) => value + 1);
    }
    this.state.set('round-result');

    this.schedule(() => {
      if (this.quynhWins() >= this.roundTarget()) {
        this.state.set('match-result');
        this.schedule(() => this.beginEnding('b'), 550);
        return;
      }
      if (this.hungWins() >= this.roundTarget()) {
        this.state.set('match-result');
        this.schedule(() => this.beginEnding('a'), 550);
        return;
      }
      this.roundNumber.update((value) => value + 1);
      this.resetRoundMeters();
      this.state.set('round-intro');
      this.schedule(() => {
        if (this.state() === 'round-intro') this.state.set('playing');
      }, 850);
    }, 900);
  }

  beginEnding(kind: EndingKind): void {
    this.endingKind.set(kind);
    this.state.set(kind === 'a' ? 'ending-a' : 'ending-b');
  }

  openPhotoRain(photos: readonly MemoryMedia[]): void {
    this.photoRain.set(photos);
    this.state.set('photo-rain');
  }

  openGallery(photos: readonly MemoryMedia[]): void {
    this.galleryPhotos.set(photos);
    this.state.set('gallery');
  }

  toggleMute(): void {
    this.muted.update((muted) => {
      const next = !muted;
      this.writePreference(PREFERENCE_KEYS.muted, String(next));
      return next;
    });
  }

  reset(): void {
    this.timers.forEach((timer) => clearTimeout(timer));
    this.timers.clear();
    this.feedbackToken += 1;
    this.actionFeedback.set('');
    this.feedbackTone.set('neutral');
    this.photoRain.set([]);
    this.galleryPhotos.set([]);
    this.endingKind.set(null);
    this.lastRoundWinner.set(null);
    this.selectedHungOutfitId.set(this.setup().hungLockedOutfitId || 'H01');
    this.resetRoundMeters();
    this.state.set('intro');
  }

  debugSetAnger(value: number): void {
    this.anger.set(clampMeter(value));
  }

  debugSetCourage(value: number): void {
    this.courage.set(clampMeter(value));
  }

  debugForceEnding(kind: EndingKind): void {
    this.beginEnding(kind);
  }

  private beginRoundMeters(): void {
    this.feedbackToken += 1;
    this.actionFeedback.set('');
    this.feedbackTone.set('neutral');
    this.anger.set(METER_MAX);
    this.courage.set(METER_MAX);
    this.timerSec.set(60);
    this.quynhAction.set('IDLE_ANGRY');
    this.hungAction.set('TIMID_IDLE');
    this.quynhX.set(270);
    this.hungX.set(690);
    this.velocityX.set(0);
    this.velocityY.set(0);
    this.isGrounded.set(true);
    this.isCrouching.set(false);
    this.isDashing.set(false);
    this.comboCount.set(0);
    this.dashReady.set(true);
    this.cameraX.set(0);
    this.cameraZoom.set(1);
    this.engineReady.set(false);
  }

  private resetRoundMeters(): void {
    this.beginRoundMeters();
    this.paused.set(false);
  }

  private updateSetup(patch: Partial<MatchSetup>): void {
    const next = { ...this.setup(), ...patch };
    this.setup.set(next);
    this.writeStorage(MATCH_SETUP_KEYS.quynhOutfit, next.quynhOutfitId);
    this.writeStorage(MATCH_SETUP_KEYS.hungPool, JSON.stringify(next.hungOutfitPool));
    this.writeStorage(MATCH_SETUP_KEYS.rounds, String(next.rounds));
    this.writeStorage(MATCH_SETUP_KEYS.weapon, next.weaponId);
  }

  private restoreSetup(): MatchSetup {
    const quynhOutfitId = this.readStorage(PREFERENCE_KEYS.lastQuynhOutfit) || this.readStorage(MATCH_SETUP_KEYS.quynhOutfit) || 'Q01';
    const weaponId = this.readStorage(PREFERENCE_KEYS.lastWeapon) || this.readStorage(MATCH_SETUP_KEYS.weapon) || 'slipper';
    const roundsValue = Number(this.readStorage(MATCH_SETUP_KEYS.rounds));
    let hungPool: readonly string[] = [];
    try {
      const parsed = JSON.parse(this.readStorage(MATCH_SETUP_KEYS.hungPool) || '[]') as unknown;
      if (Array.isArray(parsed)) hungPool = parsed.filter((id): id is string => typeof id === 'string' && ALL_HUNG_OUTFIT_IDS.includes(id)).slice(0, 3);
    } catch {
      hungPool = [];
    }
    return {
      quynhOutfitId: QUYNH_OUTFITS.some((outfit) => outfit.id === quynhOutfitId) ? quynhOutfitId : 'Q01',
      hungOutfitPool: hungPool,
      weaponId: WEAPONS.some((item) => item.id === weaponId) ? weaponId : 'slipper',
      rounds: isRoundChoice(roundsValue) ? roundsValue : 3
    };
  }

  private schedule(callback: () => void, delay: number): void {
    const timer = setTimeout(() => {
      this.timers.delete(timer);
      callback();
    }, delay);
    this.timers.add(timer);
  }

  private createSeed(): number {
    if (isPlatformBrowser(this.platformId) && 'crypto' in window && window.crypto.getRandomValues) {
      return window.crypto.getRandomValues(new Uint32Array(1))[0] || 1;
    }
    return Date.now() & 0xffffffff;
  }

  private nextRandom(): number {
    this.seed = (1664525 * this.seed + 1013904223) >>> 0;
    return this.seed / 0x100000000;
  }

  private pick<T>(items: readonly T[]): T {
    return items[Math.floor(this.nextRandom() * items.length)] ?? items[0];
  }

  private shuffle<T>(items: readonly T[]): T[] {
    const result = [...items];
    for (let index = result.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(this.nextRandom() * (index + 1));
      [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
    }
    return result;
  }

  private readStorage(key: string): string | null {
    if (!isPlatformBrowser(this.platformId)) return null;
    try {
      return window.sessionStorage.getItem(key) || window.localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  private readPreference(key: string): string | null {
    if (!isPlatformBrowser(this.platformId)) return null;
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  private writePreference(key: string, value: string): void {
    if (!isPlatformBrowser(this.platformId)) return;
    try {
      window.localStorage.setItem(key, value);
    } catch {
      // Storage can be unavailable in privacy-restricted browsers.
    }
  }

  private writeStorage(key: string, value: string): void {
    if (!isPlatformBrowser(this.platformId)) return;
    try {
      window.sessionStorage.setItem(key, value);
    } catch {
      // Storage can be unavailable in privacy-restricted browsers.
    }
  }
}
