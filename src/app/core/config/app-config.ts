import { InjectionToken } from '@angular/core';

export interface AppConfig {
  /** GeoJSON feed with the magnitude 4.5+ earthquakes of the last 30 days. */
  readonly earthquakeFeedUrl: string;
  /** Public MapLibre demo style, no API key required. */
  readonly mapStyleUrl: string;
  readonly map: {
    /** Initial view as [longitude, latitude]. */
    readonly initialCenter: readonly [number, number];
    readonly initialZoom: number;
    /** Zoom applied when the map flies to a selected earthquake. */
    readonly focusZoom: number;
  };
}

export const APP_CONFIG = new InjectionToken<AppConfig>('APP_CONFIG', {
  providedIn: 'root',
  factory: () => ({
    earthquakeFeedUrl:
      'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_month.geojson',
    mapStyleUrl: 'https://demotiles.maplibre.org/style.json',
    map: {
      initialCenter: [0, 20],
      initialZoom: 1.5,
      focusZoom: 5,
    },
  }),
});
