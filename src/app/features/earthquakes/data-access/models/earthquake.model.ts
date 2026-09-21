export const EARTHQUAKE_STATUSES = ['automatic', 'reviewed', 'deleted'] as const;
export const EARTHQUAKE_ALERT_LEVELS = ['green', 'yellow', 'orange', 'red'] as const;

export type EarthquakeStatus = (typeof EARTHQUAKE_STATUSES)[number] | 'unknown';
export type EarthquakeAlertLevel = (typeof EARTHQUAKE_ALERT_LEVELS)[number];

/**
 * Earthquake as used across the app. Timestamps are epoch milliseconds and
 * every field is a plain serializable value, so it can live in the NgRx store.
 */
export interface Earthquake {
  readonly id: string;
  readonly magnitude: number;
  readonly magnitudeType: string | null;
  readonly place: string;
  readonly time: number;
  readonly updated: number;
  readonly longitude: number;
  readonly latitude: number;
  readonly depthKm: number;
  readonly status: EarthquakeStatus;
  readonly tsunami: boolean;
  /** Number of "felt it" reports submitted by people. */
  readonly felt: number | null;
  /** USGS significance score, from 0 to 1000. */
  readonly significance: number;
  readonly alert: EarthquakeAlertLevel | null;
  readonly url: string | null;
}
