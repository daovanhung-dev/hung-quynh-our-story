import { Injectable } from '@angular/core';
import { MEMORIES, UNRESOLVED_MEDIA } from '../../generated/memories.generated';
import { SITE_CONFIG } from '../constants/site.config';
import type { IntroPhoto } from '../models/birthday.model';
import type { Memory, MemoryMedia } from '../models/memory.model';
import type { TimelineMedia, TimelineMonthGroup, UnresolvedMediaGroup } from '../models/timeline.model';

export interface MemoryYearGroup {
  year: number;
  memories: readonly Memory[];
}

@Injectable({ providedIn: 'root' })
export class MemoryService {
  private readonly memories = [...MEMORIES].sort((a, b) => {
    const direction = SITE_CONFIG.timelineOrder === 'asc' ? 1 : -1;
    return a.date.localeCompare(b.date) * direction;
  });

  private readonly monthPhotos = this.buildMonthPhotos();

  getAllMemories(): readonly Memory[] {
    return this.memories;
  }

  getMemoryById(id: string): Memory | undefined {
    return this.memories.find((memory) => memory.id === id);
  }

  getMemoriesByYear(year: number): readonly Memory[] {
    return this.memories.filter((memory) => memory.year === year);
  }

  getYears(): readonly number[] {
    return [...new Set(this.memories.map((memory) => memory.year))];
  }

  getYearGroups(): readonly MemoryYearGroup[] {
    return this.getYears().map((year) => ({
      year,
      memories: this.getMemoriesByYear(year)
    }));
  }

  getMonthPhotoGroups(): readonly TimelineMonthGroup[] {
    return this.monthPhotos;
  }

  getUnresolvedMediaGroups(): readonly UnresolvedMediaGroup[] {
    return UNRESOLVED_MEDIA;
  }

  getIntroPhotos(): readonly IntroPhoto[] {
    const datedPhotos = this.memories.flatMap((memory) =>
      memory.images
        .filter((image) => image.kind === 'image')
        .map((image) => ({
          id: image.id,
          src: image.thumbnailSrc || image.src,
          alt: image.alt || memory.title || 'Ảnh kỷ niệm'
        }))
    );
    const unresolvedPhotos = UNRESOLVED_MEDIA.flatMap((group) =>
      group.media
        .filter((media) => media.kind === 'image')
        .map((media) => ({
          id: media.id,
          src: media.thumbnailSrc || media.src,
          alt: media.alt || 'Ảnh kỷ niệm'
        }))
    );

    return [...datedPhotos, ...unresolvedPhotos];
  }

  getLatestPhotos(limit = 10): readonly TimelineMedia[] {
    return this.monthPhotos
      .flatMap((group) => group.photos)
      .slice(-limit)
      .reverse();
  }

  formatDate(date: string): string {
    const value = new Date(`${date}T00:00:00`);
    return new Intl.DateTimeFormat('vi-VN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(value);
  }

  formatDayMonth(date: string): string {
    const value = new Date(`${date}T00:00:00`);
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(value);
  }

  formatMonthLabel(year: number, month: number): string {
    const value = new Date(Date.UTC(year, month - 1, 1));
    const monthLabel = new Intl.DateTimeFormat('vi-VN', {
      month: 'long'
    }).format(value);

    return `${monthLabel.charAt(0).toUpperCase()}${monthLabel.slice(1)} ${year}`;
  }

  private buildMonthPhotos(): readonly TimelineMonthGroup[] {
    const groupMap = new Map<string, TimelineMonthGroup>();

    for (const memory of this.memories) {
      const monthKey = `${memory.year}-${String(memory.month).padStart(2, '0')}`;
      const monthLabel = this.formatMonthLabel(memory.year, memory.month);
      const photos: TimelineMedia[] = memory.images.map((image: MemoryMedia, index) => ({
        id: `${memory.id}-photo-${index + 1}`,
        memoryId: memory.id,
        date: memory.date,
        year: memory.year,
        month: memory.month,
        day: memory.day,
        monthKey,
        monthLabel,
        kind: image.kind,
        src: image.thumbnailSrc || image.src,
        posterSrc: image.posterSrc,
        alt: image.alt,
        title: memory.title,
        imageCount: memory.images.length
      }));

      const existing = groupMap.get(monthKey);
      if (existing) {
        const combined = [...existing.photos, ...photos];
        groupMap.set(monthKey, {
          ...existing,
          photoCount: combined.length,
          photos: combined
        });
      } else {
        groupMap.set(monthKey, {
          monthKey,
          monthLabel,
          year: memory.year,
          month: memory.month,
          photoCount: photos.length,
          photos
        });
      }
    }

    return [...groupMap.values()].sort((a, b) => {
      const compare = `${a.year}-${String(a.month).padStart(2, '0')}`.localeCompare(
        `${b.year}-${String(b.month).padStart(2, '0')}`
      );
      return SITE_CONFIG.timelineOrder === 'asc' ? compare : compare * -1;
    });
  }
}
