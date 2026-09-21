import { type EarthquakeFilters } from '../models/earthquake-filters.model';
import { type Earthquake } from '../models/earthquake.model';

export function matchesFilters(earthquake: Earthquake, filters: EarthquakeFilters): boolean {
  return (
    isWithin(earthquake.magnitude, filters.minMagnitude, filters.maxMagnitude) &&
    isWithin(earthquake.time, filters.from, filters.to)
  );
}

export function filterEarthquakes(
  earthquakes: readonly Earthquake[],
  filters: EarthquakeFilters,
): Earthquake[] {
  return earthquakes.filter((earthquake) => matchesFilters(earthquake, filters));
}

function isWithin(value: number, min: number | null, max: number | null): boolean {
  return (min === null || value >= min) && (max === null || value <= max);
}
