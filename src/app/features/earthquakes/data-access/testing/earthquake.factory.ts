import { type Earthquake } from '../models/earthquake.model';

export function createEarthquake(overrides: Partial<Earthquake> = {}): Earthquake {
  return {
    id: 'us0001',
    magnitude: 5,
    magnitudeType: 'mww',
    place: '10 km N of Somewhere',
    time: 1_758_000_000_000,
    updated: 1_758_000_000_000,
    longitude: 10,
    latitude: 20,
    depthKm: 30,
    status: 'reviewed',
    tsunami: false,
    felt: null,
    significance: 400,
    alert: null,
    url: null,
    ...overrides,
  };
}
