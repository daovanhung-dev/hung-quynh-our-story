import type { MemoryMedia } from './memory.model';

export type BirthdayStage = 'celebration' | 'gift' | 'envelope' | 'letter';

export type BirthdayLetterBlockKind = 'salutation' | 'paragraph' | 'emphasis' | 'signature';

export interface BirthdayLetterBlock {
  kind: BirthdayLetterBlockKind;
  text: string;
}

export type IntroPhoto = Pick<
  MemoryMedia,
  'id' | 'src' | 'thumbnailSrc' | 'displaySrc' | 'mediumSrc' | 'alt' | 'width' | 'height'
>;
