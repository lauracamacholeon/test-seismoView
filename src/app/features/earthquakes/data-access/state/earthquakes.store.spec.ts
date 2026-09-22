import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideEffects } from '@ngrx/effects';
import { Store, provideState, provideStore } from '@ngrx/store';

import { APP_CONFIG, type AppConfig } from '@core/config/app-config';
import { httpErrorInterceptor } from '@core/interceptors/http-error-interceptor';

import { NO_FILTERS } from '../models/earthquake-filters.model';
import { EarthquakesPageActions } from './earthquakes.actions';
import * as earthquakesEffects from './earthquakes.effects';
import { earthquakesFeature } from './earthquakes.reducer';
import {
  selectError,
  selectFilteredEarthquakes,
  selectSelectedEarthquake,
  selectStatus,
} from './earthquakes.selectors';

const FEED_URL = '/test-feed.geojson';

const TEST_CONFIG: AppConfig = {
  earthquakeFeedUrl: FEED_URL,
  mapStyleUrl: '/test-style.json',
  map: { initialCenter: [0, 0], initialZoom: 1, focusZoom: 5 },
};

function createFeature(id: string, magnitude: number, time: number): unknown {
  return {
    id,
    properties: { mag: magnitude, time, place: `Place of ${id}`, type: 'earthquake' },
    geometry: { coordinates: [10, 20, 30] },
  };
}

describe('earthquakes store (integration)', () => {
  let store: Store;
  let controller: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: APP_CONFIG, useValue: TEST_CONFIG },
        provideHttpClient(withInterceptors([httpErrorInterceptor])),
        provideHttpClientTesting(),
        provideStore(
          {},
          {
            runtimeChecks: {
              strictStateSerializability: true,
              strictActionSerializability: true,
              strictActionTypeUniqueness: true,
            },
          },
        ),
        provideState(earthquakesFeature),
        provideEffects(earthquakesEffects),
      ],
    });
    store = TestBed.inject(Store) as Store;
    controller = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    controller.verify();
  });

  it('should load the feed into the store when the page opens', () => {
    const status = store.selectSignal(selectStatus);
    const earthquakes = store.selectSignal(selectFilteredEarthquakes);

    store.dispatch(EarthquakesPageActions.opened());
    expect(status()).toBe('loading');

    controller.expectOne(FEED_URL).flush({
      features: [createFeature('older', 5, 1_000), createFeature('newest', 6.5, 2_000)],
    });

    expect(status()).toBe('loaded');
    expect(earthquakes().map((earthquake) => earthquake.id)).toEqual(['newest', 'older']);
  });

  it('should expose a user-facing error when the feed is unavailable', () => {
    const status = store.selectSignal(selectStatus);
    const error = store.selectSignal(selectError);

    store.dispatch(EarthquakesPageActions.opened());
    controller
      .expectOne(FEED_URL)
      .flush('unavailable', { status: 503, statusText: 'Service Unavailable' });

    expect(status()).toBe('error');
    expect(error()).toBe('The service is temporarily unavailable. Please try again later.');
  });

  it('should recover when the user retries after a failure', () => {
    const status = store.selectSignal(selectStatus);

    store.dispatch(EarthquakesPageActions.opened());
    controller.expectOne(FEED_URL).error(new ProgressEvent('error'));
    store.dispatch(EarthquakesPageActions.retryClicked());
    controller.expectOne(FEED_URL).flush({ features: [createFeature('a', 5, 1_000)] });

    expect(status()).toBe('loaded');
  });

  it('should narrow the list and drop a selection that no longer matches', () => {
    const earthquakes = store.selectSignal(selectFilteredEarthquakes);
    const selected = store.selectSignal(selectSelectedEarthquake);

    store.dispatch(EarthquakesPageActions.opened());
    controller.expectOne(FEED_URL).flush({
      features: [createFeature('small', 4.6, 1_000), createFeature('large', 7, 2_000)],
    });
    store.dispatch(EarthquakesPageActions.earthquakeSelected({ id: 'small', source: 'list' }));
    expect(selected()?.id).toBe('small');

    store.dispatch(
      EarthquakesPageActions.filtersChanged({ filters: { ...NO_FILTERS, minMagnitude: 6 } }),
    );

    expect(earthquakes().map((earthquake) => earthquake.id)).toEqual(['large']);
    expect(selected()).toBeNull();
  });
});
