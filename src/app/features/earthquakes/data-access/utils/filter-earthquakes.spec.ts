import { NO_FILTERS, type EarthquakeFilters } from '../models/earthquake-filters.model';
import { createEarthquake } from '../testing/earthquake.factory';
import { filterEarthquakes, matchesFilters } from './filter-earthquakes';

const DAY = 86_400_000;
const NOW = 1_758_000_000_000;

function filters(overrides: Partial<EarthquakeFilters>): EarthquakeFilters {
  return { ...NO_FILTERS, ...overrides };
}

describe('matchesFilters', () => {
  it('should match everything when no bound is set', () => {
    expect(matchesFilters(createEarthquake({ magnitude: 9.1 }), NO_FILTERS)).toBe(true);
  });

  describe('magnitude', () => {
    it('should include the minimum and maximum magnitudes', () => {
      const range = filters({ minMagnitude: 5, maxMagnitude: 6 });

      expect(matchesFilters(createEarthquake({ magnitude: 5 }), range)).toBe(true);
      expect(matchesFilters(createEarthquake({ magnitude: 6 }), range)).toBe(true);
    });

    it('should reject magnitudes outside the range', () => {
      const range = filters({ minMagnitude: 5, maxMagnitude: 6 });

      expect(matchesFilters(createEarthquake({ magnitude: 4.9 }), range)).toBe(false);
      expect(matchesFilters(createEarthquake({ magnitude: 6.1 }), range)).toBe(false);
    });

    it('should apply each bound independently', () => {
      const onlyMin = filters({ minMagnitude: 6 });
      const onlyMax = filters({ maxMagnitude: 5 });

      expect(matchesFilters(createEarthquake({ magnitude: 8 }), onlyMin)).toBe(true);
      expect(matchesFilters(createEarthquake({ magnitude: 5.5 }), onlyMin)).toBe(false);
      expect(matchesFilters(createEarthquake({ magnitude: 4.5 }), onlyMax)).toBe(true);
      expect(matchesFilters(createEarthquake({ magnitude: 5.5 }), onlyMax)).toBe(false);
    });
  });

  describe('date range', () => {
    it('should include the first and last instants of the range', () => {
      const range = filters({ from: NOW - DAY, to: NOW });

      expect(matchesFilters(createEarthquake({ time: NOW - DAY }), range)).toBe(true);
      expect(matchesFilters(createEarthquake({ time: NOW }), range)).toBe(true);
    });

    it('should reject earthquakes before or after the range', () => {
      const range = filters({ from: NOW - DAY, to: NOW });

      expect(matchesFilters(createEarthquake({ time: NOW - DAY - 1 }), range)).toBe(false);
      expect(matchesFilters(createEarthquake({ time: NOW + 1 }), range)).toBe(false);
    });

    it('should apply each bound independently', () => {
      const onlyFrom = filters({ from: NOW });
      const onlyTo = filters({ to: NOW });

      expect(matchesFilters(createEarthquake({ time: NOW + DAY }), onlyFrom)).toBe(true);
      expect(matchesFilters(createEarthquake({ time: NOW - DAY }), onlyFrom)).toBe(false);
      expect(matchesFilters(createEarthquake({ time: NOW - DAY }), onlyTo)).toBe(true);
      expect(matchesFilters(createEarthquake({ time: NOW + DAY }), onlyTo)).toBe(false);
    });
  });

  it('should require both the magnitude and the date range to match', () => {
    const combined = filters({ minMagnitude: 6, from: NOW });

    expect(matchesFilters(createEarthquake({ magnitude: 6.5, time: NOW }), combined)).toBe(true);
    expect(matchesFilters(createEarthquake({ magnitude: 5, time: NOW }), combined)).toBe(false);
    expect(matchesFilters(createEarthquake({ magnitude: 6.5, time: NOW - 1 }), combined)).toBe(
      false,
    );
  });
});

describe('filterEarthquakes', () => {
  const small = createEarthquake({ id: 'small', magnitude: 4.6 });
  const medium = createEarthquake({ id: 'medium', magnitude: 5.5 });
  const large = createEarthquake({ id: 'large', magnitude: 7.2 });

  it('should keep only the earthquakes that match, preserving their order', () => {
    const result = filterEarthquakes([large, small, medium], filters({ minMagnitude: 5 }));

    expect(result.map((earthquake) => earthquake.id)).toEqual(['large', 'medium']);
  });

  it('should return every earthquake when no bound is set', () => {
    expect(filterEarthquakes([small, medium, large], NO_FILTERS)).toHaveLength(3);
  });

  it('should return an empty list when nothing matches', () => {
    expect(filterEarthquakes([small, medium], filters({ minMagnitude: 8 }))).toEqual([]);
  });

  it('should not modify the input list', () => {
    const input = [small, medium, large];

    filterEarthquakes(input, filters({ minMagnitude: 7 }));

    expect(input).toHaveLength(3);
  });
});
