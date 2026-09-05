export type BirthdayStage = 'celebration' | 'gift' | 'envelope' | 'letter';

export type BirthdayLetterBlockKind = 'salutation' | 'paragraph' | 'emphasis' | 'signature';

export interface BirthdayLetterBlock {
  kind: BirthdayLetterBlockKind;
  text: string;
}

export interface IntroPhoto {
  id: string;
  src: string;
  alt?: string;
}
