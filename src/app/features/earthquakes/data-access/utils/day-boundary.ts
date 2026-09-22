/**
 * Local-day boundary helpers for the date range filter. mat-datepicker
 * (with the native date adapter) works with Date objects in the browser's
 * local timezone, so these stay in local time too rather than UTC: mixing
 * the two would make "the day the user picked" and "the day stored in the
 * filter" drift apart near midnight, depending on the viewer's timezone.
 */

/** Epoch ms at the very start of the given date's local day. */
export function startOfLocalDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0).getTime();
}

/** Epoch ms at the last millisecond of the given date's local day. */
export function endOfLocalDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999).getTime();
}
