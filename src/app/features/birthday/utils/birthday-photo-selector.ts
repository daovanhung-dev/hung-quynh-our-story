import type { IntroPhoto } from '../../../core/models/birthday.model';

export interface FlyingMemory {
  key: string;
  photo: IntroPhoto;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  midX: number;
  midY: number;
  rotationStart: number;
  rotationEnd: number;
  scale: number;
  opacity: number;
  delayMs: number;
  durationMs: number;
  zIndex: number;
  blurPx: number;
}

export function pickRandomPhotos(
  photos: readonly IntroPhoto[],
  count: number,
  random: () => number = Math.random
): readonly IntroPhoto[] {
  const shuffled = [...photos];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }
  return shuffled.slice(0, Math.max(0, Math.min(count, shuffled.length)));
}

export function buildFlyingMemories(
  photos: readonly IntroPhoto[],
  random: () => number = Math.random
): readonly FlyingMemory[] {
  return photos.map((photo, index) => {
    const fromLeft = index % 2 === 0;
    const depth = index % 3;
    const startX = fromLeft ? -28 - random() * 25 : 103 + random() * 24;
    const endX = fromLeft ? 105 + random() * 24 : -30 - random() * 24;
    const startY = 6 + random() * 76;
    const verticalDrift = (random() - 0.5) * 42;
    const endY = Math.max(-12, Math.min(102, startY + verticalDrift));
    const scale = depth === 0 ? 0.68 + random() * 0.12 : depth === 1 ? 0.86 + random() * 0.16 : 1.02 + random() * 0.16;

    return {
      key: `${photo.id}-${index}`,
      photo,
      startX,
      startY,
      endX,
      endY,
      midX: (startX + endX) / 2,
      midY: (startY + endY) / 2,
      rotationStart: -13 + random() * 26,
      rotationEnd: -10 + random() * 20,
      scale,
      opacity: depth === 0 ? 0.42 : depth === 1 ? 0.66 : 0.88,
      delayMs: 550 + index * 270 + random() * 700,
      durationMs: 6800 + random() * 3600,
      zIndex: depth === 0 ? 12 : depth === 1 ? 26 : 44,
      blurPx: depth === 0 ? 2.2 : 0
    };
  });
}
