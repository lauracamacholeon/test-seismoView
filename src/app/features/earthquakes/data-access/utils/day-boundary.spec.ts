import { endOfLocalDay, startOfLocalDay } from './day-boundary';

describe('startOfLocalDay', () => {
  it('should return the local midnight of the given date', () => {
    const date = new Date(2026, 8, 22, 15, 30, 45);

    expect(startOfLocalDay(date)).toBe(new Date(2026, 8, 22, 0, 0, 0, 0).getTime());
  });
});

describe('endOfLocalDay', () => {
  it('should return the last millisecond of the given date, in local time', () => {
    const date = new Date(2026, 8, 22, 9, 0, 0);

    expect(endOfLocalDay(date)).toBe(new Date(2026, 8, 22, 23, 59, 59, 999).getTime());
  });
});

describe('round trip', () => {
  it('should keep a date within its own day when taking start then end', () => {
    const date = new Date(2026, 0, 5, 12, 0, 0);

    expect(startOfLocalDay(date)).toBeLessThan(endOfLocalDay(date));
  });
});
