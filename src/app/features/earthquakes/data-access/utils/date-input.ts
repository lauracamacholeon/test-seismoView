const DAY_MS = 86_400_000;

/** Formats an epoch-ms timestamp as the yyyy-MM-dd string <input type="date"> expects. */
export function epochToDateInput(epoch: number): string {
  return new Date(epoch).toISOString().slice(0, 10);
}

/** Parses a yyyy-MM-dd date input value as the start of that day, in UTC. */
export function dateInputToStartOfDay(value: string): number {
  return Date.parse(`${value}T00:00:00.000Z`);
}

/**
 * Parses a yyyy-MM-dd date input value as the end of that day, in UTC. Used
 * for the "to" bound: picking a day should include everything that
 * happened on it, not just the first millisecond.
 */
export function dateInputToEndOfDay(value: string): number {
  return dateInputToStartOfDay(value) + DAY_MS - 1;
}
