export interface MemoryImage {
  id: string;
  src: string;
  thumbnailSrc?: string;
  alt?: string;
  width?: number;
  height?: number;
  caption?: string;
}

export interface Memory {
  id: string;
  date: string;
  title?: string;
  caption?: string;
  location?: string;
  cover: string;
  images: MemoryImage[];
  year: number;
  month: number;
  day: number;
}
