import { type Provider } from '@angular/core';
import { Map as MapLibreMap } from 'maplibre-gl';

import { MAP_FACTORY } from './map-adapter.token';

/**
 * Real MAP_FACTORY implementation: builds an actual MapLibre map. This is
 * the only file in the app that imports 'maplibre-gl' as a value (not just
 * as types), so it is also the only place the library's code actually loads.
 * Registered by the earthquakes route, never at the app root, so it stays
 * out of the initial bundle and out of every test that doesn't need it.
 */
export const mapFactoryProvider: Provider = {
  provide: MAP_FACTORY,
  useValue: (options: ConstructorParameters<typeof MapLibreMap>[0]) => new MapLibreMap(options),
};
