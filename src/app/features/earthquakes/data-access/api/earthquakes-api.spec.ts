import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { APP_CONFIG, type AppConfig } from '@core/config/app-config';
import { ApiError } from '@core/errors/api-error';
import { httpErrorInterceptor } from '@core/interceptors/http-error-interceptor';

import { type Earthquake } from '../models/earthquake.model';
import { EarthquakesApi } from './earthquakes-api';

const FEED_URL = '/test-feed.geojson';

const TEST_CONFIG: AppConfig = {
  earthquakeFeedUrl: FEED_URL,
  mapStyleUrl: '/test-style.json',
  map: { initialCenter: [0, 0], initialZoom: 1, focusZoom: 5 },
};

function createFeature(id: string): unknown {
  return {
    id,
    properties: { mag: 5.1, time: 1_758_000_000_000, place: 'Somewhere' },
    geometry: { coordinates: [10, 20, 30] },
  };
}

describe('EarthquakesApi', () => {
  let api: EarthquakesApi;
  let controller: HttpTestingController;

  function load(): { earthquakes?: Earthquake[]; error?: unknown } {
    const outcome: { earthquakes?: Earthquake[]; error?: unknown } = {};

    api.getEarthquakes().subscribe({
      next: (earthquakes) => {
        outcome.earthquakes = earthquakes;
      },
      error: (error: unknown) => {
        outcome.error = error;
      },
    });

    return outcome;
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: APP_CONFIG, useValue: TEST_CONFIG },
        provideHttpClient(withInterceptors([httpErrorInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    api = TestBed.inject(EarthquakesApi);
    controller = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    controller.verify();
  });

  it('should request the feed configured in the app config', () => {
    load();

    const request = controller.expectOne(FEED_URL);

    expect(request.request.method).toBe('GET');
    request.flush({ features: [] });
  });

  it('should emit the earthquakes parsed from the feed', () => {
    const outcome = load();

    controller
      .expectOne(FEED_URL)
      .flush({ features: [createFeature('us0001'), createFeature('us0002')] });

    expect(outcome.earthquakes?.map((earthquake) => earthquake.id)).toEqual(['us0001', 'us0002']);
  });

  it('should emit an empty list when the feed has no earthquakes', () => {
    const outcome = load();

    controller.expectOne(FEED_URL).flush({ features: [] });

    expect(outcome.earthquakes).toEqual([]);
  });

  it('should fail with an ApiError when the response is not a feed', () => {
    const outcome = load();

    controller.expectOne(FEED_URL).flush({ message: 'not a feed' });

    expect(outcome.error).toBeInstanceOf(ApiError);
    expect(outcome.earthquakes).toBeUndefined();
  });

  it('should fail with a server ApiError when the service is unavailable', () => {
    const outcome = load();

    controller
      .expectOne(FEED_URL)
      .flush('unavailable', { status: 503, statusText: 'Service Unavailable' });

    expect(outcome.error).toMatchObject({ kind: 'server', status: 503 });
  });

  it('should fail with a network ApiError when the request cannot be sent', () => {
    const outcome = load();

    controller.expectOne(FEED_URL).error(new ProgressEvent('error'));

    expect(outcome.error).toMatchObject({ kind: 'network' });
  });
});
