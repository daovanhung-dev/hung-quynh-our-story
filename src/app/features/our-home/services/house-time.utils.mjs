const JAPAN_ZONE = 'Asia/Tokyo';
const VIETNAM_ZONE = 'Asia/Ho_Chi_Minh';

export function getHouseMood(date) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: JAPAN_ZONE,
    hour: '2-digit',
    hourCycle: 'h23'
  }).formatToParts(date);
  const hour = Number(parts.find((part) => part.type === 'hour')?.value);
  if (hour < 5) return 'night';
  if (hour < 11) return 'dawn';
  if (hour < 17) return 'day';
  if (hour < 19) return 'sunset';
  return 'night';
}

export function formatHouseClock(date, timeZone, locale) {
  return new Intl.DateTimeFormat(locale, {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23'
  }).format(date);
}

export function formatHouseDate(date) {
  return new Intl.DateTimeFormat('ja-JP', {
    timeZone: JAPAN_ZONE,
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  }).format(date);
}

export const HOUSE_TIME_ZONES = Object.freeze({ japan: JAPAN_ZONE, vietnam: VIETNAM_ZONE });
