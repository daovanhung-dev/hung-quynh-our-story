export const METER_MAX = 100;

export const clampMeter = (value: number): number => Math.max(0, Math.min(METER_MAX, Math.round(value)));

export const roundTarget = (rounds: 1 | 3 | 5): number => Math.ceil(rounds / 2);

export const cooldownReady = (now: number, availableAt: number): boolean => now >= availableAt;

export const resolveRoundState = (
  rounds: 1 | 3 | 5,
  quynhWins: number,
  hungWins: number
): 'continue' | 'ending-a' | 'ending-b' => {
  const target = roundTarget(rounds);
  if (quynhWins >= target) return 'ending-b';
  if (hungWins >= target) return 'ending-a';
  return 'continue';
};

export const HUNG_ALLOWED_ACTIONS = [
  'TIMID_IDLE', 'RECOIL', 'DODGE', 'PLEAD', 'HEART_CAST', 'APOLOGY_CLOUD',
  'LOVE_LETTER', 'MILK_TEA', 'CHOCOLATE', 'BOUQUET', 'HUG_AURA', 'RING_PROMISE', 'KNEEL_APOLOGY'
] as const;

export type LoveFightRuleState =
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

const STATE_TRANSITIONS: Readonly<Record<LoveFightRuleState, readonly LoveFightRuleState[]>> = {
  boot: ['intro'],
  intro: ['outfit-select'],
  'outfit-select': ['intro', 'round-select'],
  'round-select': ['outfit-select', 'weapon-select'],
  'weapon-select': ['round-select', 'vs'],
  vs: ['weapon-select', 'round-intro'],
  'round-intro': ['playing'],
  playing: ['round-result', 'match-result'],
  'round-result': ['round-intro', 'match-result'],
  'match-result': ['ending-a', 'ending-b'],
  'ending-a': ['photo-rain'],
  'ending-b': ['photo-rain'],
  'photo-rain': ['gallery'],
  gallery: ['intro']
};

export const canTransition = (from: LoveFightRuleState, to: LoveFightRuleState): boolean => (
  from === to || STATE_TRANSITIONS[from].includes(to)
);
