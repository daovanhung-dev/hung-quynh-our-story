export type LoveFightState =
  | 'boot'
  | 'intro'
  | 'outfit-select'
  | 'round-select'
  | 'weapon-select'
  | 'vs'
  | 'round-intro'
  | 'playing'
  | 'round-result'
  | 'match-result'
  | 'ending-a'
  | 'ending-b'
  | 'photo-rain'
  | 'gallery';

export type FighterId = 'quynh' | 'hung';
export type RoundChoice = 1 | 3 | 5;
export type RoundWinner = FighterId | 'timeout';
export type EndingKind = 'a' | 'b';

export interface OutfitDefinition {
  readonly id: string;
  readonly fighter: FighterId;
  readonly name: string;
  readonly previewSrc: string;
  readonly battleSrc: string;
}

export interface WeaponDefinition {
  readonly id: string;
  readonly name: string;
  readonly iconSrc: string;
  readonly courageDamage: number;
  readonly cooldownMs: number;
  readonly action: string;
}

export interface SpecialDefinition {
  readonly id: string;
  readonly name: string;
  readonly effectSrc: string;
  readonly action: string;
  readonly angerReduction: number;
  readonly cooldownMs: number;
  readonly aiWeight: number;
}

export interface MatchSetup {
  readonly quynhOutfitId: string;
  readonly hungOutfitPool: readonly string[];
  readonly hungLockedOutfitId?: string;
  readonly weaponId: string;
  readonly rounds: RoundChoice;
}

export interface CombatSnapshot {
  readonly state: LoveFightState;
  readonly roundNumber: number;
  readonly totalRounds: RoundChoice;
  readonly timerSec: number;
  readonly anger: number;
  readonly courage: number;
  readonly quynhWins: number;
  readonly hungWins: number;
  readonly quynhAction: string;
  readonly hungAction: string;
  readonly quynhX: number;
  readonly hungX: number;
  readonly velocityX: number;
  readonly velocityY: number;
  readonly isGrounded: boolean;
  readonly isCrouching: boolean;
  readonly isDashing: boolean;
  readonly comboCount: number;
  readonly dashReady: boolean;
  readonly cameraX: number;
  readonly cameraZoom: number;
}

export const ENDING_COPY = {
  a: {
    title: 'Vợ bớt dỗi rồi ❤️',
    body: 'Vợ yêu ơi! Chồng trân thành xin lũi em! Vợ iu gọi ngay cho ck iu nhó, ck iu xin lũi vợ ạ !!!'
  },
  b: {
    title: 'CHỒNG XIN THUA 😭🌹',
    body: 'Có lẽ đối khi chúng ta còn chưa hiểu nhau một chút thoi nhưng có lẽ sau cuộc cãi vã, anh vẫn bên em, anh vẫn mãi yêu em!!!'
  }
} as const;

export type HungAction =
  | 'TIMID_IDLE'
  | 'RECOIL'
  | 'DODGE'
  | 'PLEAD'
  | 'HEART_CAST'
  | 'APOLOGY_CLOUD'
  | 'LOVE_LETTER'
  | 'MILK_TEA'
  | 'CHOCOLATE'
  | 'BOUQUET'
  | 'HUG_AURA'
  | 'RING_PROMISE'
  | 'KNEEL_APOLOGY';

export type QuynhAction =
  | 'IDLE_ANGRY'
  | 'STEP'
  | 'PUNCH'
  | 'KICK'
  | 'SLIPPER_THROW'
  | 'BROOM_SWING'
  | 'PILLOW_SMASH'
  | 'HIT'
  | 'VICTORY_ANGRY'
  | 'ENDING_HAPPY';
