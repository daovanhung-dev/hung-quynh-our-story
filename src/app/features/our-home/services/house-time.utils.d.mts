export type HouseMood = 'dawn' | 'day' | 'sunset' | 'night';
export function getHouseMood(date: Date): HouseMood;
export function formatHouseClock(date: Date, timeZone: string, locale: string): string;
export function formatHouseDate(date: Date): string;
export const HOUSE_TIME_ZONES: Readonly<{ japan: 'Asia/Tokyo'; vietnam: 'Asia/Ho_Chi_Minh' }>;
