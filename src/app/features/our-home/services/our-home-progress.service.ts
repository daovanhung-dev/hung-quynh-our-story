import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { HOUSE_LETTER_IDS, HOUSE_ROOMS, HOUSE_STAMP_IDS } from '../content/room-map.content';
import type { HouseProgressV1, HouseRoomId } from '../models/our-home.model';

export const OUR_HOME_PROGRESS_KEY = 'hq:our-home:progress:v1';

export const DEFAULT_HOUSE_PROGRESS: HouseProgressV1 = {
  schemaVersion: 1,
  introSeen: false,
  exploredRooms: [],
  collectedStamps: [],
  openedLetters: [],
  finaleSeen: false,
  audioEnabled: true,
  reducedMotionOverride: null
};

const KNOWN_ROOMS = new Set<string>(HOUSE_ROOMS.map((room) => room.id));
const KNOWN_STAMPS = new Set<string>(HOUSE_STAMP_IDS);
const KNOWN_LETTERS = new Set<string>(HOUSE_LETTER_IDS);

@Injectable({ providedIn: 'root' })
export class OurHomeProgressService {
  private readonly document = inject(DOCUMENT);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  readonly progress = signal<HouseProgressV1>(this.readProgress());

  markIntroSeen(): void {
    this.update({ introSeen: true });
  }

  exploreRoom(roomId: HouseRoomId): void {
    const exploredRooms = unique([...this.progress().exploredRooms, roomId]);
    this.update({ exploredRooms });
  }

  collectStamp(stampId: string): void {
    if (!KNOWN_STAMPS.has(stampId)) return;
    const collectedStamps = unique([...this.progress().collectedStamps, stampId]);
    this.update({ collectedStamps });
  }

  openLetter(letterId: string): void {
    if (!KNOWN_LETTERS.has(letterId)) return;
    const openedLetters = unique([...this.progress().openedLetters, letterId]);
    this.update({ openedLetters });
    this.collectStamp('letters');
  }

  markFinaleSeen(): void {
    this.update({ finaleSeen: true });
  }

  setAudioEnabled(value: boolean): void {
    this.update({ audioEnabled: value });
  }

  setReducedMotionOverride(value: boolean | null): void {
    this.update({ reducedMotionOverride: value });
  }

  reset(): void {
    this.progress.set({ ...DEFAULT_HOUSE_PROGRESS });
    this.writeProgress();
  }

  private readProgress(): HouseProgressV1 {
    if (!this.isBrowser) return { ...DEFAULT_HOUSE_PROGRESS };
    try {
      const stored = this.document.defaultView?.localStorage.getItem(OUR_HOME_PROGRESS_KEY);
      if (!stored) return { ...DEFAULT_HOUSE_PROGRESS };
      const parsed: unknown = JSON.parse(stored);
      return this.validateProgress(parsed) ?? { ...DEFAULT_HOUSE_PROGRESS };
    } catch {
      return { ...DEFAULT_HOUSE_PROGRESS };
    }
  }

  private validateProgress(value: unknown): HouseProgressV1 | undefined {
    if (!value || typeof value !== 'object') return undefined;
    const record = value as Record<string, unknown>;
    if (record['schemaVersion'] !== 1) return undefined;
    if (typeof record['introSeen'] !== 'boolean' || typeof record['finaleSeen'] !== 'boolean') return undefined;

    const rooms = this.validateList(record['exploredRooms'], KNOWN_ROOMS, 6);
    const stamps = this.validateList(record['collectedStamps'], KNOWN_STAMPS, 5);
    const letters = this.validateList(record['openedLetters'], KNOWN_LETTERS, 5);
    if (!rooms || !stamps || !letters) return undefined;
    if (typeof record['audioEnabled'] !== 'boolean') return undefined;
    const reducedMotion = record['reducedMotionOverride'];
    if (reducedMotion !== null && typeof reducedMotion !== 'boolean') return undefined;

    return {
      schemaVersion: 1,
      introSeen: record['introSeen'],
      exploredRooms: rooms as HouseRoomId[],
      collectedStamps: stamps,
      openedLetters: letters,
      finaleSeen: record['finaleSeen'],
      audioEnabled: record['audioEnabled'],
      reducedMotionOverride: reducedMotion
    };
  }

  private validateList(value: unknown, known: ReadonlySet<string>, maximum: number): string[] | undefined {
    if (!Array.isArray(value) || value.length > maximum * 2 || !value.every((item) => typeof item === 'string')) return undefined;
    return unique(value.filter((item): item is string => known.has(item))).slice(0, maximum);
  }

  private update(patch: Partial<HouseProgressV1>): void {
    this.progress.update((current) => ({ ...current, ...patch }));
    this.writeProgress();
  }

  private writeProgress(): void {
    if (!this.isBrowser) return;
    try {
      this.document.defaultView?.localStorage.setItem(OUR_HOME_PROGRESS_KEY, JSON.stringify(this.progress()));
    } catch {
      // In-memory state remains available when storage is blocked or full.
    }
  }
}

function unique<T>(values: readonly T[]): T[] {
  return [...new Set(values)];
}
