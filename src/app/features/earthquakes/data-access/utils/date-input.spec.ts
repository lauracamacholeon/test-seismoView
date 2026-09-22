import { dateInputToEndOfDay, dateInputToStartOfDay, epochToDateInput } from './date-input';

describe('epochToDateInput', () => {
  it('should format an epoch timestamp as a yyyy-MM-dd string', () => {
    expect(epochToDateInput(Date.UTC(2026, 8, 22, 15, 30))).toBe('2026-09-22');
  });
});

describe('dateInputToStartOfDay', () => {
  it('should parse a date input value as UTC midnight', () => {
    expect(dateInputToStartOfDay('2026-09-22')).toBe(Date.UTC(2026, 8, 22, 0, 0, 0, 0));
  });
});

describe('dateInputToEndOfDay', () => {
  it('should parse a date input value as the last millisecond of that day', () => {
    expect(dateInputToEndOfDay('2026-09-22')).toBe(Date.UTC(2026, 8, 22, 23, 59, 59, 999));
  });
});

describe('round trip', () => {
  it('should return the same date string it started from', () => {
    const epoch = dateInputToStartOfDay('2026-01-05');

    expect(epochToDateInput(epoch)).toBe('2026-01-05');
  });
});
