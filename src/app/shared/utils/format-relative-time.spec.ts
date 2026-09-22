import { formatRelativeTime } from './format-relative-time';

const NOW = 1_758_000_000_000;

describe('formatRelativeTime', () => {
  it('should report events under a minute old as "just now"', () => {
    expect(formatRelativeTime(NOW - 30_000, NOW)).toBe('just now');
    expect(formatRelativeTime(NOW, NOW)).toBe('just now');
  });

  it('should report minutes for events under an hour old', () => {
    expect(formatRelativeTime(NOW - 5 * 60_000, NOW)).toBe('5m ago');
    expect(formatRelativeTime(NOW - 59 * 60_000, NOW)).toBe('59m ago');
  });

  it('should report hours for events under a day old', () => {
    expect(formatRelativeTime(NOW - 3 * 3_600_000, NOW)).toBe('3h ago');
    expect(formatRelativeTime(NOW - 23 * 3_600_000, NOW)).toBe('23h ago');
  });

  it('should report days for events a day or older', () => {
    expect(formatRelativeTime(NOW - 2 * 86_400_000, NOW)).toBe('2d ago');
  });

  it('should treat a future timestamp the same as "just now", never negative', () => {
    expect(formatRelativeTime(NOW + 60_000, NOW)).toBe('just now');
  });
});
