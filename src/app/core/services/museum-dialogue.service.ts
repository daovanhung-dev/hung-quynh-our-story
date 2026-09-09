import { Injectable } from '@angular/core';
import { MUSEUM_DIALOGUES } from '../content/museum-dialogue.content';
import type { MuseumDialogue } from '../models/museum.model';

@Injectable({ providedIn: 'root' })
export class MuseumDialogueService {
  private readonly recentIds: string[] = [];
  private readonly cycleIds = new Set<string>();

  getAll(): readonly MuseumDialogue[] {
    return MUSEUM_DIALOGUES;
  }

  getNext(roomTags: readonly string[], visitorId: string): MuseumDialogue {
    const eligible = MUSEUM_DIALOGUES.filter((dialogue) => dialogue.roomTags.some((tag) => roomTags.includes(tag)));
    const pool = eligible.length ? eligible : MUSEUM_DIALOGUES;
    let candidates: readonly MuseumDialogue[] = pool.filter((dialogue) => !this.cycleIds.has(dialogue.id) && !this.recentIds.includes(dialogue.id));
    if (!candidates.length) {
      candidates = pool.filter((dialogue) => !this.cycleIds.has(dialogue.id));
    }
    if (!candidates.length) {
      this.cycleIds.clear();
      candidates = pool;
    }
    const offset = this.hash(`${visitorId}:${this.recentIds.length}`) % candidates.length;
    const dialogue = candidates[offset] ?? MUSEUM_DIALOGUES[0];

    this.recentIds.push(dialogue.id);
    this.cycleIds.add(dialogue.id);
    if (this.recentIds.length > 32) {
      this.recentIds.shift();
    }
    return dialogue;
  }

  private hash(value: string): number {
    let hash = 0;
    for (let index = 0; index < value.length; index += 1) {
      hash = (hash * 31 + value.charCodeAt(index)) | 0;
    }
    return Math.abs(hash);
  }
}
