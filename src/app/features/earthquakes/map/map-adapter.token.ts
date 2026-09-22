import { InjectionToken } from '@angular/core';
import { type Map as MapLibreMap, type MapOptions } from 'maplibre-gl';

/**
 * Thin seam around the MapLibre constructor. Nothing else in the app
 * imports 'maplibre-gl' directly: components ask for this token instead.
 * That keeps the heavy library out of unit tests (jsdom has no WebGL) and
 * out of every bundle that doesn't render a map.
 */
export type MapFactory = (options: MapOptions) => MapLibreMap;

/** No default factory: the real one is provided by the earthquakes route. */
function missingMapFactory(): never {
  throw new Error('MAP_FACTORY has no default implementation; see earthquakes.routes.ts');
}

export const MAP_FACTORY = new InjectionToken<MapFactory>('MAP_FACTORY', {
  providedIn: 'root',
  factory: () => missingMapFactory,
});
