import type { MemoryMedia } from './memory.model';

export type MuseumAssetKind = 'environment' | 'prop' | 'visitor';

export interface MuseumAssetDefinition {
  id: string;
  kind: MuseumAssetKind;
  src: string;
  sourceUrl: string;
  license: 'CC0';
}

export type MuseumDialogueMood = 'warm' | 'admiring' | 'curious' | 'playful' | 'tender';

export interface MuseumDialogue {
  id: string;
  text: string;
  mood: MuseumDialogueMood;
  speakerProfile: string;
  roomTags: readonly string[];
  weight: number;
}

export interface MuseumDisplay {
  id: string;
  media: MemoryMedia;
  memoryId?: string;
  date?: string;
  title?: string;
  caption?: string;
  location?: string;
}

export interface MuseumRoom {
  id: string;
  label: string;
  year: number;
  month?: number;
  isArchive: boolean;
  displays: readonly MuseumDisplay[];
}
