import { type Provider } from '@angular/core';
import { Map as MapLibreMap, setWorkerUrl } from 'maplibre-gl';

import { MAP_FACTORY } from './map-adapter.token';

// MapLibre v6 loads its rendering worker from a URL rather than through
// the bundler's module graph, and neither Vite (dev server) nor esbuild
// (production) resolves that URL correctly on their own: the map mounts,
// the style loads, but no source ever requests a single tile. The fix is
// to serve the worker (and the sibling chunk it imports internally) as a
// plain static file, copied into public/ by
// scripts/copy-maplibre-worker.mjs before every `npm start` and
// `npm run build`, and point MapLibre at it explicitly, once, before any
// map is created.
setWorkerUrl('/maplibre-gl-worker.mjs');

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
