import { type EarthquakeFeatureCollection } from './earthquakes-geojson';

/**
 * The small slice of the MapLibre Map API this app actually calls. Keeping
 * a narrow interface here, instead of using MapLibreMap everywhere, means
 * the component and its tests don't need to satisfy (or mock) the library's
 * full, very large surface — just the handful of methods we use.
 */
export interface MapFeature {
  readonly id?: string | number;
  readonly properties: Record<string, unknown>;
}

export interface MapFeatureEvent {
  readonly features?: readonly MapFeature[];
}

export interface MapHandle {
  on(event: 'load', handler: () => void): void;
  on(event: 'error', handler: (event: { error: Error }) => void): void;
  on(
    event: 'click' | 'mousemove' | 'mouseleave',
    layerId: string,
    handler: (event: MapFeatureEvent) => void,
  ): void;
  addSource(
    id: string,
    source: { type: 'geojson'; data: EarthquakeFeatureCollection; promoteId?: string },
  ): void;
  addLayer(layer: unknown): void;
  getSource(id: string): { setData(data: EarthquakeFeatureCollection): void } | undefined;
  setFeatureState(feature: { source: string; id: string }, state: Record<string, unknown>): void;
  removeFeatureState(feature: { source: string; id: string }, key?: string): void;
  flyTo(options: { center: readonly [number, number]; zoom: number }): void;
  resize(): void;
  remove(): void;
}
