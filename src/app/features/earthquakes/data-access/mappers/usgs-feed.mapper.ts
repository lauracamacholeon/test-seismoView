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
 * Converts a USGS GeoJSON summary feed into domain earthquakes. The payload is
 * treated as untrusted: features that cannot be used are skipped, and a payload
 * that is not a feature collection is rejected.
 */
export function parseUsgsFeed(payload: unknown): Earthquake[] {
  if (!isRecord(payload) || !Array.isArray(payload['features'])) {
    throw new ApiError('unknown');
  }

  const features: unknown[] = payload['features'];

  return features.flatMap((feature) => toEarthquake(feature) ?? []);
}

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

function parseStatus(value: unknown): EarthquakeStatus {
  return EARTHQUAKE_STATUSES.find((status) => status === value) ?? 'unknown';
}

function parseAlertLevel(value: unknown): EarthquakeAlertLevel | null {
  return EARTHQUAKE_ALERT_LEVELS.find((level) => level === value) ?? null;
}

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function readNumber(record: UnknownRecord, key: string): number | null {
  const value = record[key];
  return isFiniteNumber(value) ? value : null;
}

function readString(record: UnknownRecord, key: string): string | null {
  const value = record[key];
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
}
