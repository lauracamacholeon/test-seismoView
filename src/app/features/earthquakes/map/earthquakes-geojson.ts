import { type Feature, type FeatureCollection, type Point } from 'geojson';

import { type Earthquake } from '../data-access/models/earthquake.model';

/**
 * Fields MapLibre's paint expressions and feature-state need on the map.
 * The id is duplicated into properties because feature-state is looked up
 * by GeoJSON feature id, but expressions can only read from properties.
 */
export interface EarthquakeFeatureProperties {
  readonly id: string;
  readonly magnitude: number;
  readonly place: string;
  readonly time: number;
}

export type EarthquakeFeature = Feature<Point, EarthquakeFeatureProperties>;
export type EarthquakeFeatureCollection = FeatureCollection<Point, EarthquakeFeatureProperties>;

/** Converts one earthquake into a GeoJSON point feature for the map source. */
export function toEarthquakeFeature(earthquake: Earthquake): EarthquakeFeature {
  return {
    type: 'Feature',
    id: earthquake.id,
    geometry: { type: 'Point', coordinates: [earthquake.longitude, earthquake.latitude] },
    properties: {
      id: earthquake.id,
      magnitude: earthquake.magnitude,
      place: earthquake.place,
      time: earthquake.time,
    },
  };
}

/** Converts the filtered earthquake list into the FeatureCollection the map source consumes. */
export function toEarthquakesGeoJson(
  earthquakes: readonly Earthquake[],
): EarthquakeFeatureCollection {
  return { type: 'FeatureCollection', features: earthquakes.map(toEarthquakeFeature) };
}
