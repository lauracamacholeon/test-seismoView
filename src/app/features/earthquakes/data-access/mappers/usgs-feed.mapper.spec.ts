import { ApiError } from '@core/errors/api-error';

import { type Earthquake } from '../models/earthquake.model';
import { parseUsgsFeed } from './usgs-feed.mapper';

function createFeature(
  overrides: { id?: unknown; properties?: unknown; geometry?: unknown } = {},
): unknown {
  return {
    type: 'Feature',
    id: 'us7000abcd',
    properties: {
      mag: 5.2,
      magType: 'mww',
      place: '45 km SW of Somewhere, Chile',
      time: 1_758_000_000_000,
      updated: 1_758_000_600_000,
      status: 'reviewed',
      tsunami: 0,
      felt: 12,
      sig: 416,
      alert: 'green',
      type: 'earthquake',
      url: 'https://earthquake.usgs.gov/earthquakes/eventpage/us7000abcd',
    },
    geometry: { type: 'Point', coordinates: [-70.5, -33.25, 35.4] },
    ...overrides,
  };
}

function createFeed(...features: unknown[]): unknown {
  return { type: 'FeatureCollection', metadata: { count: features.length }, features };
}

function withProperties(properties: Record<string, unknown>): unknown {
  const base = createFeature() as { properties: Record<string, unknown> };
  return createFeature({ properties: { ...base.properties, ...properties } });
}

function parseSingle(feature: unknown): Earthquake {
  const earthquakes = parseUsgsFeed(createFeed(feature));

  expect(earthquakes).toHaveLength(1);

  return earthquakes[0];
}

describe('parseUsgsFeed', () => {
  describe('valid features', () => {
    it('should map a complete feature into the domain model', () => {
      const earthquake = parseSingle(createFeature());

      expect(earthquake).toEqual({
        id: 'us7000abcd',
        magnitude: 5.2,
        magnitudeType: 'mww',
        place: '45 km SW of Somewhere, Chile',
        time: 1_758_000_000_000,
        updated: 1_758_000_600_000,
        longitude: -70.5,
        latitude: -33.25,
        depthKm: 35.4,
        status: 'reviewed',
        tsunami: false,
        felt: 12,
        significance: 416,
        alert: 'green',
        url: 'https://earthquake.usgs.gov/earthquakes/eventpage/us7000abcd',
      });
    });

    it('should read coordinates as longitude, latitude and depth', () => {
      const feature = createFeature({
        geometry: { type: 'Point', coordinates: [139.7, 35.6, 10] },
      });

      const earthquake = parseSingle(feature);

      expect(earthquake).toMatchObject({ longitude: 139.7, latitude: 35.6, depthKm: 10 });
    });

    it('should flag tsunami warnings only when the feed sets the flag to 1', () => {
      const flagged = parseSingle(withProperties({ tsunami: 1 }));
      const unflagged = parseSingle(withProperties({ tsunami: 0 }));

      expect(flagged.tsunami).toBe(true);
      expect(unflagged.tsunami).toBe(false);
    });

    it('should keep the order of the feed', () => {
      const feed = createFeed(
        createFeature({ id: 'first' }),
        createFeature({ id: 'second' }),
        createFeature({ id: 'third' }),
      );

      const ids = parseUsgsFeed(feed).map((earthquake) => earthquake.id);

      expect(ids).toEqual(['first', 'second', 'third']);
    });

    it('should return an empty list for a feed without features', () => {
      expect(parseUsgsFeed(createFeed())).toEqual([]);
    });

    it.each(['mb', 'mww', 'mw', 'ml', 'mwr', 'ms_vx'])(
      'should accept the real-world magnitude type %s',
      (magType) => {
        const earthquake = parseSingle(withProperties({ magType }));

        expect(earthquake.magnitudeType).toBe(magType);
      },
    );
  });

  describe('optional and unexpected values', () => {
    it('should use null for missing optional values', () => {
      const earthquake = parseSingle(
        withProperties({ magType: null, felt: null, alert: null, url: null }),
      );

      expect(earthquake).toMatchObject({
        magnitudeType: null,
        felt: null,
        alert: null,
        url: null,
      });
    });

    it.each(['automatic', 'reviewed', 'deleted'])('should keep the known status %s', (status) => {
      const earthquake = parseSingle(withProperties({ status }));

      expect(earthquake.status).toBe(status);
    });

    it('should fall back to an unknown status for unexpected values', () => {
      const earthquake = parseSingle(withProperties({ status: 'pending' }));

      expect(earthquake.status).toBe('unknown');
    });

    it.each(['green', 'yellow', 'orange', 'red'])('should keep the alert level %s', (alert) => {
      const earthquake = parseSingle(withProperties({ alert }));

      expect(earthquake.alert).toBe(alert);
    });

    it('should ignore alert levels it does not know', () => {
      const earthquake = parseSingle(withProperties({ alert: 'purple' }));

      expect(earthquake.alert).toBeNull();
    });

    it('should fall back to a generic place when it is missing or blank', () => {
      const missing = parseSingle(withProperties({ place: null }));
      const blank = parseSingle(withProperties({ place: '   ' }));

      expect(missing.place).toBe('Unknown location');
      expect(blank.place).toBe('Unknown location');
    });

    it('should trim the place name', () => {
      const earthquake = parseSingle(withProperties({ place: '  Tokyo, Japan ' }));

      expect(earthquake.place).toBe('Tokyo, Japan');
    });

    it('should use the event time when the update time is missing', () => {
      const earthquake = parseSingle(withProperties({ updated: null }));

      expect(earthquake.updated).toBe(1_758_000_000_000);
    });

    it('should default the significance to zero when it is missing', () => {
      const earthquake = parseSingle(withProperties({ sig: null }));

      expect(earthquake.significance).toBe(0);
    });
  });

  describe('features that are not earthquakes', () => {
    it.each(['landslide', 'quarry blast', 'explosion', 'ice quake', 'other'])(
      'should skip a feature whose event type is %s',
      (type) => {
        expect(parseUsgsFeed(createFeed(withProperties({ type })))).toEqual([]);
      },
    );

    it('should reproduce the real M5.2 landslide event from the USGS feed', () => {
      const landslide = createFeature({
        id: 'us7000tbwb',
        properties: {
          mag: 5.2,
          place: '55 km NW of Kodāri̇̄, Nepal',
          time: 1_787_712_730_000,
          type: 'landslide',
          magType: 'ms_vx',
          status: 'reviewed',
          tsunami: 0,
          sig: 601,
        },
        geometry: { type: 'Point', coordinates: [85.515, 28.271, 0] },
      });

      expect(parseUsgsFeed(createFeed(landslide))).toEqual([]);
    });

    it('should keep the valid earthquakes when a landslide is mixed into the same feed', () => {
      const feed = createFeed(
        createFeature({ id: 'quake-1' }),
        withProperties({ type: 'landslide' }),
        createFeature({ id: 'quake-2' }),
      );

      const ids = parseUsgsFeed(feed).map((earthquake) => earthquake.id);

      expect(ids).toEqual(['quake-1', 'quake-2']);
    });
  });

  describe('features that cannot be used', () => {
    it.each([
      ['is not an object', 'not-a-feature'],
      ['is null', null],
      ['has no id', createFeature({ id: undefined })],
      ['has a blank id', createFeature({ id: '  ' })],
      ['has no properties', createFeature({ properties: null })],
      ['has no geometry', createFeature({ geometry: null })],
      ['has no magnitude', withProperties({ mag: null })],
      ['has a non-numeric magnitude', withProperties({ mag: '5.2' })],
      ['has no time', withProperties({ time: null })],
      ['has coordinates that are not a list', createFeature({ geometry: { coordinates: 'x' } })],
      ['has no depth', createFeature({ geometry: { type: 'Point', coordinates: [10, 20] } })],
      [
        'has non-finite coordinates',
        createFeature({ geometry: { type: 'Point', coordinates: [Number.NaN, 20, 5] } }),
      ],
      [
        'has a longitude out of range',
        createFeature({ geometry: { type: 'Point', coordinates: [190, 20, 5] } }),
      ],
      [
        'has a latitude out of range',
        createFeature({ geometry: { type: 'Point', coordinates: [10, -95, 5] } }),
      ],
    ])('should skip a feature that %s', (_reason, feature) => {
      expect(parseUsgsFeed(createFeed(feature))).toEqual([]);
    });

    it('should keep the valid features when others are skipped', () => {
      const feed = createFeed(
        createFeature({ id: 'valid-1' }),
        createFeature({ id: 'broken', properties: null }),
        createFeature({ id: 'valid-2' }),
      );

      const ids = parseUsgsFeed(feed).map((earthquake) => earthquake.id);

      expect(ids).toEqual(['valid-1', 'valid-2']);
    });
  });

  describe('payloads that are not a feed', () => {
    it.each([
      ['null', null],
      ['a string', '<html>Service Unavailable</html>'],
      ['a number', 42],
      ['an object without features', { type: 'FeatureCollection' }],
      ['an object whose features are not a list', { features: {} }],
    ])('should reject %s', (_description, payload) => {
      expect(() => parseUsgsFeed(payload)).toThrow(ApiError);
    });
  });
});
