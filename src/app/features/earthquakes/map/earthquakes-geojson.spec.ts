import { createEarthquake } from '../data-access/testing/earthquake.factory';
import { toEarthquakeFeature, toEarthquakesGeoJson } from './earthquakes-geojson';

describe('toEarthquakeFeature', () => {
  it('should convert an earthquake into a GeoJSON point feature', () => {
    const earthquake = createEarthquake({
      id: 'us0001',
      longitude: -70.5,
      latitude: -33.25,
      magnitude: 5.2,
      place: 'Somewhere, Chile',
      time: 1_758_000_000_000,
    });

    expect(toEarthquakeFeature(earthquake)).toEqual({
      type: 'Feature',
      id: 'us0001',
      geometry: { type: 'Point', coordinates: [-70.5, -33.25] },
      properties: {
        id: 'us0001',
        magnitude: 5.2,
        place: 'Somewhere, Chile',
        time: 1_758_000_000_000,
      },
    });
  });

  it('should duplicate the id into properties, for expressions that cannot read the feature id', () => {
    const earthquake = createEarthquake({ id: 'duplicated' });

    const feature = toEarthquakeFeature(earthquake);

    expect(feature.id).toBe('duplicated');
    expect(feature.properties.id).toBe('duplicated');
  });
});

describe('toEarthquakesGeoJson', () => {
  it('should wrap the converted features in a FeatureCollection', () => {
    const earthquakes = [createEarthquake({ id: 'a' }), createEarthquake({ id: 'b' })];

    const collection = toEarthquakesGeoJson(earthquakes);

    expect(collection.type).toBe('FeatureCollection');
    expect(collection.features.map((feature) => feature.id)).toEqual(['a', 'b']);
  });

  it('should return an empty FeatureCollection for an empty list', () => {
    expect(toEarthquakesGeoJson([])).toEqual({ type: 'FeatureCollection', features: [] });
  });
});
