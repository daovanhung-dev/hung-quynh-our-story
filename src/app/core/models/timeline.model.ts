import type { Memory, MemoryMedia } from './memory.model';

export interface MemoryMonthGroup {
  monthKey: string;
  monthLabel: string;
  year: number;
  month: number;
  memoryCount: number;
  mediaCount: number;
  memories: readonly Memory[];
}

export interface UnresolvedMedia extends MemoryMedia {
  sourceMonth: string;
  reason: string;
}

export interface UnresolvedMediaGroup {
  sourceMonth: string;
  label: string;
  media: readonly UnresolvedMedia[];
}
