export interface TimelinePhoto {
  id: string;
  memoryId: string;
  date: string;
  year: number;
  month: number;
  day: number;
  monthKey: string;
  monthLabel: string;
  src: string;
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
  photos: readonly TimelinePhoto[];
}
