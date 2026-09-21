/**
 * Inclusive filter bounds. A null bound leaves that side open.
 * Dates are epoch milliseconds, like the earthquake timestamps.
 */
export interface EarthquakeFilters {
  readonly minMagnitude: number | null;
  readonly maxMagnitude: number | null;
  readonly from: number | null;
  readonly to: number | null;
}

export const NO_FILTERS: EarthquakeFilters = {
  minMagnitude: null,
  maxMagnitude: null,
  from: null,
  to: null,
};
