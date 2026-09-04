import type { MemoryMediaKind } from './memory.model';

export interface TimelineMedia {
  id: string;
  memoryId: string;
  date: string;
  year: number;
  month: number;
  day: number;
  monthKey: string;
  monthLabel: string;
  kind: MemoryMediaKind;
  src: string;
  posterSrc?: string;
  alt?: string;
  title?: string;
  imageCount: number;
}

export interface TimelineMonthGroup {
  monthKey: string;
  monthLabel: string;
  year: number;
  month: number;
  photoCount: number;
  photos: readonly TimelineMedia[];
}

export interface UnresolvedMedia {
  id: string;
  sourceMonth: string;
  reason: string;
  kind: MemoryMediaKind;
  src: string;
  thumbnailSrc?: string;
  mediumSrc?: string;
  posterSrc?: string;
  originalSrc?: string;
  alt?: string;
  caption?: string;
}

export interface UnresolvedMediaGroup {
  sourceMonth: string;
  label: string;
  media: readonly UnresolvedMedia[];
}

/** Backwards-compatible name for callers that still refer to timeline media as photos. */
export type TimelinePhoto = TimelineMedia;
