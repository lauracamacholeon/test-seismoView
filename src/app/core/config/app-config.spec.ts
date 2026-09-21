import { TestBed } from '@angular/core/testing';

import { APP_CONFIG, type AppConfig } from './app-config';

describe('APP_CONFIG', () => {
  it('should default to the USGS monthly feed of magnitude 4.5+ earthquakes', () => {
    const config = TestBed.inject(APP_CONFIG);

    expect(config.earthquakeFeedUrl).toBe(
      'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_month.geojson',
    );
  });

  it('should default to the public MapLibre demo style', () => {
    const config = TestBed.inject(APP_CONFIG);

    expect(config.mapStyleUrl).toBe('https://demotiles.maplibre.org/style.json');
  });

  it('should define an initial map center within valid coordinates', () => {
    const [longitude, latitude] = TestBed.inject(APP_CONFIG).map.initialCenter;

    expect(longitude).toBeGreaterThanOrEqual(-180);
    expect(longitude).toBeLessThanOrEqual(180);
    expect(latitude).toBeGreaterThanOrEqual(-90);
    expect(latitude).toBeLessThanOrEqual(90);
  });

  it('should zoom closer when focusing an earthquake than in the initial view', () => {
    const { initialZoom, focusZoom } = TestBed.inject(APP_CONFIG).map;

    expect(focusZoom).toBeGreaterThan(initialZoom);
  });

  it('should be overridable through providers', () => {
    const custom: AppConfig = {
      earthquakeFeedUrl: '/fake-feed.geojson',
      mapStyleUrl: '/fake-style.json',
      map: { initialCenter: [10, 20], initialZoom: 2, focusZoom: 6 },
    };
    TestBed.configureTestingModule({ providers: [{ provide: APP_CONFIG, useValue: custom }] });

    expect(TestBed.inject(APP_CONFIG)).toBe(custom);
  });
});
