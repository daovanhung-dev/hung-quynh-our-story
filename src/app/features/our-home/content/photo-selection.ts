import type { MemoryMedia } from '../../../core/models/memory.model';

/** Photo selection approved by Hùng for the public Our Home gallery. */
export const OUR_HOME_PHOTO_IDS = [
  '2026-01-04-img-3745', // couple portrait in the elevator
  '2026-01-04-img-7226', // themed photo-booth portrait
  '2026-01-04-img-7230', // wider elevator portrait
  '2026-01-04-img-7235' // playful photo-booth pose
] as const;

export function selectOurHomePhotos(media: readonly MemoryMedia[]): readonly MemoryMedia[] {
  const byId = new Map(media.filter((item) => item.kind === 'image' && item.src).map((item) => [item.id, item]));
  return OUR_HOME_PHOTO_IDS.flatMap((id) => {
    const item = byId.get(id);
    return item ? [item] : [];
  });
}
