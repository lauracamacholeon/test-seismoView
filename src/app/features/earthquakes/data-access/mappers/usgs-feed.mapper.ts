import { ApiError } from '@core/errors/api-error';

import {
  EARTHQUAKE_ALERT_LEVELS,
  EARTHQUAKE_STATUSES,
  type Earthquake,
  type EarthquakeAlertLevel,
  type EarthquakeStatus,
} from '../models/earthquake.model';

type UnknownRecord = Record<string, unknown>;

interface Coordinates {
  readonly longitude: number;
  readonly latitude: number;
  readonly depthKm: number;
}

const UNKNOWN_PLACE = 'Unknown location';

/**
 * USGS summary feeds are shared across event types (earthquakes, quarry
 * blasts, landslides triggered by an earthquake, and so on). This app only
 * shows earthquakes, so every other event type is filtered out.
 */
const EARTHQUAKE_EVENT_TYPE = 'earthquake';

/**
 * Entry point of this file: turns a USGS GeoJSON summary feed into a list of
 * domain earthquakes. The payload is treated as untrusted network input —
 * a feature that cannot be used is skipped instead of throwing, but a
 * payload that is not a feature collection at all is rejected outright.
 */
export function parseUsgsFeed(payload: unknown): Earthquake[] {
  if (!isRecord(payload) || !Array.isArray(payload['features'])) {
    throw new ApiError('unknown');
  }

  const features: unknown[] = payload['features'];

  return features.flatMap((feature) => toEarthquake(feature) ?? []);
}

/**
 * Validates and converts a single GeoJSON feature. Returns null for
 * anything that cannot become a valid Earthquake (wrong shape, non-quake
 * event type, missing id, unusable magnitude, time or coordinates), so the
 * caller can drop it and keep processing the rest of the feed.
 */
function toEarthquake(feature: unknown): Earthquake | null {
  if (!isRecord(feature)) {
    return null;
  }

  const id = readString(feature, 'id');
  const properties = feature['properties'];
  const geometry = feature['geometry'];
  if (id === null || !isRecord(properties) || !isRecord(geometry)) {
    return null;
  }

  // The feed mixes event types under the same magnitude threshold (e.g. a
  // landslide can be reported as "M 5.2 Landslide"). Only earthquakes belong
  // in this app's map and list.
  if (properties['type'] !== EARTHQUAKE_EVENT_TYPE) {
    return null;
  }

  const coordinates = readCoordinates(geometry['coordinates']);
  const magnitude = readNumber(properties, 'mag');
  const time = readNumber(properties, 'time');
  if (coordinates === null || magnitude === null || time === null) {
    return null;
  }

  return {
    id,
    magnitude,
    magnitudeType: readString(properties, 'magType'),
    place: readString(properties, 'place') ?? UNKNOWN_PLACE,
    time,
    updated: readNumber(properties, 'updated') ?? time,
    ...coordinates,
    status: parseStatus(properties['status']),
    tsunami: readNumber(properties, 'tsunami') === 1,
    felt: readNumber(properties, 'felt'),
    significance: readNumber(properties, 'sig') ?? 0,
    alert: parseAlertLevel(properties['alert']),
    url: readString(properties, 'url'),
  };
}

/**
 * Reads GeoJSON [longitude, latitude, depthKm] coordinates and rejects
 * anything that is not a well-formed, geographically valid triple.
 */
function readCoordinates(value: unknown): Coordinates | null {
  if (!Array.isArray(value)) {
    return null;
  }

  const [longitude, latitude, depthKm] = value as unknown[];
  if (!isFiniteNumber(longitude) || !isFiniteNumber(latitude) || !isFiniteNumber(depthKm)) {
    return null;
  }
  if (Math.abs(longitude) > 180 || Math.abs(latitude) > 90) {
    return null;
  }

  return { longitude, latitude, depthKm };
}

/** Narrows a raw status string to a known EarthquakeStatus, defaulting to 'unknown'. */
function parseStatus(value: unknown): EarthquakeStatus {
  return EARTHQUAKE_STATUSES.find((status) => status === value) ?? 'unknown';
}

/** Narrows a raw alert string to a known EarthquakeAlertLevel, defaulting to null. */
function parseAlertLevel(value: unknown): EarthquakeAlertLevel | null {
  return EARTHQUAKE_ALERT_LEVELS.find((level) => level === value) ?? null;
}

/** Type guard: true when the value is a non-null plain object we can index into. */
function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null;
}

/** True for real, usable numbers (excludes NaN, Infinity and non-numbers). */
function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

/** Reads a numeric field from a record, or null if it is missing or not a finite number. */
function readNumber(record: UnknownRecord, key: string): number | null {
  const value = record[key];
  return isFiniteNumber(value) ? value : null;
}

/** Reads a string field from a record, trimmed, or null if missing/blank/not a string. */
function readString(record: UnknownRecord, key: string): string | null {
  const value = record[key];
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
}
