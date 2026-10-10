const START_DATE = { year: 2026, month: 9, day: 22 } as const;
const DAY_MS = 86_400_000;
const VIETNAM_TIME_ZONE = 'Asia/Ho_Chi_Minh';

export interface CivilDate {
  readonly year: number;
  readonly month: number;
  readonly day: number;
}

export function getVietnamCivilDate(now: Date): CivilDate {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: VIETNAM_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(now);
  const value = (type: Intl.DateTimeFormatPartTypes): number => Number(parts.find((part) => part.type === type)?.value);
  return { year: value('year'), month: value('month'), day: value('day') };
}

function civilDayNumber(date: CivilDate): number {
  return Date.UTC(date.year, date.month - 1, date.day) / DAY_MS;
}

export function getDaysApart(now: Date = new Date()): number {
  return Math.max(0, civilDayNumber(getVietnamCivilDate(now)) - civilDayNumber(START_DATE));
}

export function getMillisecondsUntilVietnamMidnight(now: Date = new Date()): number {
  const { year, month, day } = getVietnamCivilDate(now);
  const nextMidnightUtc = Date.UTC(year, month - 1, day + 1) - 7 * 60 * 60 * 1_000;
  return Math.max(1, nextMidnightUtc - now.getTime());
}

export function formatVietnamClock(now: Date = new Date()): string {
  return new Intl.DateTimeFormat('vi-VN', {
    timeZone: VIETNAM_TIME_ZONE,
    hour: '2-digit',
    minute: '2-digit'
  }).format(now);
}

export function formatJapanClock(now: Date = new Date()): string {
  return new Intl.DateTimeFormat('ja-JP', {
    timeZone: 'Asia/Tokyo',
    hour: '2-digit',
    minute: '2-digit'
  }).format(now);
}
