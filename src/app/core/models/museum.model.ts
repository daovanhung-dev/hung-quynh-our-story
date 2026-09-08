import type { MemoryMedia } from './memory.model';

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
