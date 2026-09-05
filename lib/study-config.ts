export const DAILY_TARGET = 60;
export const MAX_DAILY_REVIEWS = 10;
export const EXTRA_DAILY_BATCH = 20;
export const QUIZ_BATCH_SIZE = 40;
export const EXAM_AT = '2026-12-12T15:00:00+08:00';
export const EXAM_IS_ESTIMATED = true;

export function examCountdownDays(now = new Date()) {
  return Math.max(0, Math.ceil((new Date(EXAM_AT).getTime() - now.getTime()) / 86_400_000));
}
