const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/**
 * Renders a past timestamp as a short, human-readable relative time (e.g.
 * "5m ago", "3h ago", "2d ago"). Takes `now` as a parameter, instead of
 * reading Date.now() internally, so it stays a pure function: same inputs,
 * same output, easy to test without mocking the clock.
 */
export function formatRelativeTime(timestamp: number, now: number): string {
  const elapsed = Math.max(0, now - timestamp);

  if (elapsed < MINUTE) {
    return 'just now';
  }
  if (elapsed < HOUR) {
    return `${Math.floor(elapsed / MINUTE)}m ago`;
  }
  if (elapsed < DAY) {
    return `${Math.floor(elapsed / HOUR)}h ago`;
  }
  return `${Math.floor(elapsed / DAY)}d ago`;
}
