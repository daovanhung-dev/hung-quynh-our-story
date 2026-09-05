export type MemoryMediaKind = 'image' | 'video';

export interface MemoryMedia {
  id: string;
  kind: MemoryMediaKind;
  src: string;
  thumbnailSrc?: string;
  /** A responsive 960px rendition used by cards and the photo essay. */
  displaySrc?: string;
  mediumSrc?: string;
  posterSrc?: string;
  originalSrc?: string;
  alt?: string;
  width?: number;
  height?: number;
  caption?: string;
}

/** Backwards-compatible name for code that still refers to media as images. */
export type MemoryImage = MemoryMedia;

export interface Memory {
  id: string;
  date: string;
  title?: string;
  caption?: string;
  location?: string;
  cover: MemoryMedia;
  images: readonly MemoryMedia[];
  year: number;
  month: number;
  day: number;
}
