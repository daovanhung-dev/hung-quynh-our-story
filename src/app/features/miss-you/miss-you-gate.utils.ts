export const MISS_YOU_SESSION_KEY = 'hung-quynh-miss-you-unlocked';

export function isMissYouCodeCorrect(value: string): boolean {
  return value === 'HyeuQ';
}
