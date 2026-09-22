import { TestBed } from '@angular/core/testing';
import { Store } from '@ngrx/store';
import { MockStore, provideMockStore } from '@ngrx/store/testing';

import { APP_CONFIG, type AppConfig } from '@core/config/app-config';
import { EarthquakesPageActions } from '@features/earthquakes/data-access/state/earthquakes.actions';
import {
  selectFilteredEarthquakes,
  selectSelection,
} from '@features/earthquakes/data-access/state/earthquakes.selectors';
import { createEarthquake } from '@features/earthquakes/data-access/testing/earthquake.factory';

import { EARTHQUAKES_LAYER_ID, EARTHQUAKES_SOURCE_ID } from '../earthquakes-layers';
import { MAP_FACTORY } from '../map-adapter.token';
import { type EarthquakeFeatureCollection } from '../earthquakes-geojson';
import { type MapHandle } from '../map-handle';
import { EarthquakeMap } from './earthquake-map';

const TEST_CONFIG: AppConfig = {
  earthquakeFeedUrl: '/feed.geojson',
  mapStyleUrl: '/style.json',
  map: { initialCenter: [0, 0], initialZoom: 1, focusZoom: 6 },
};

/**
 * A fake MapHandle that records every call instead of touching WebGL. Each
 * spy is a plain, standalone vi.fn so tests can assert on it directly
 * without reaching through an object property (which trips the
 * unbound-method lint rule).
 */
function createFakeMap() {
  const handlers = new Map<string, (event: never) => void>();
  const setData = vi.fn<(data: EarthquakeFeatureCollection) => void>();
  const addSource = vi.fn();
  const addLayer = vi.fn();
  const setFeatureState = vi.fn();
  const removeFeatureState = vi.fn();
  const flyTo = vi.fn();
  const resize = vi.fn();
  const remove = vi.fn();
  const on = vi.fn((event: string, layerOrHandler: unknown, maybeHandler?: unknown) => {
    const key = typeof layerOrHandler === 'string' ? `${event}:${layerOrHandler}` : event;
    const handler = (maybeHandler ?? layerOrHandler) as (event: never) => void;
    handlers.set(key, handler);
  });

  const map = {
    on,
    addSource,
    addLayer,
    getSource: () => ({ setData }),
    setFeatureState,
    removeFeatureState,
    flyTo,
    resize,
    remove,
  } as MapHandle;

  return {
    map,
    mapFactory: vi.fn(() => map),
    setData,
    addSource,
    addLayer,
    setFeatureState,
    flyTo,
    resize,
    /** Simulates MapLibre firing the 'load' event once the style is ready. */
    fireLoad: () => handlers.get('load')?.(undefined as never),
    fireClick: (event: unknown) => handlers.get(`click:${EARTHQUAKES_LAYER_ID}`)?.(event as never),
    fireMouseMove: (event: unknown) =>
      handlers.get(`mousemove:${EARTHQUAKES_LAYER_ID}`)?.(event as never),
    fireMouseLeave: () => handlers.get(`mouseleave:${EARTHQUAKES_LAYER_ID}`)?.(undefined as never),
  };
}

describe('EarthquakeMap', () => {
  const first = createEarthquake({ id: 'first', longitude: 10, latitude: 20 });
  const second = createEarthquake({ id: 'second', longitude: -10, latitude: -20 });

  let store: Store;
  let fake: ReturnType<typeof createFakeMap>;

  function createComponent() {
    const fixture = TestBed.createComponent(EarthquakeMap);
    fixture.detectChanges();
    return fixture;
  }

  beforeEach(() => {
    fake = createFakeMap();
    TestBed.configureTestingModule({
      imports: [EarthquakeMap],
      providers: [
        { provide: APP_CONFIG, useValue: TEST_CONFIG },
        { provide: MAP_FACTORY, useValue: fake.mapFactory },
        provideMockStore({
          selectors: [
            { selector: selectFilteredEarthquakes, value: [first, second] },
            { selector: selectSelection, value: null },
          ],
        }),
      ],
    });
    store = TestBed.inject(Store) as Store;
  });

  it('should create the map through MAP_FACTORY with the configured style and center', () => {
    createComponent();

    expect(fake.mapFactory).toHaveBeenCalledWith(
      expect.objectContaining({ style: '/style.json', center: [0, 0], zoom: 1 }),
    );
  });

  it('should resize the map once it loads, in case the container was measured at 0x0 earlier', () => {
    createComponent();

    fake.fireLoad();

    expect(fake.resize).toHaveBeenCalled();
  });

  it('should resize the map again whenever its container is resized later', () => {
    let observerCallback: (() => void) | undefined;
    const observe = vi.fn();

    // A plain function, not a vi.fn wrapping an arrow: ResizeObserver is
    // constructed with `new`, and mocks built from arrow implementations
    // are not reliably constructable.
    function FakeResizeObserver(this: unknown, callback: () => void) {
      observerCallback = callback;
      return { observe, disconnect: vi.fn() };
    }
    vi.stubGlobal('ResizeObserver', FakeResizeObserver);

    createComponent();
    fake.fireLoad();
    fake.resize.mockClear();

    observerCallback?.();

    expect(observe).toHaveBeenCalled();
    expect(fake.resize).toHaveBeenCalled();

    vi.unstubAllGlobals();
  });

  it('should add the earthquakes source and layer once the map loads', () => {
    createComponent();

    fake.fireLoad();

    expect(fake.addSource).toHaveBeenCalledWith(
      EARTHQUAKES_SOURCE_ID,
      expect.objectContaining({ type: 'geojson', promoteId: 'id' }),
    );
    expect(fake.addLayer).toHaveBeenCalled();
  });

  it('should push the filtered earthquakes into the source once the map is ready', () => {
    createComponent();

    fake.fireLoad();
    TestBed.tick();

    const [collection] = fake.setData.mock.calls[0];

    expect(collection.features.map((feature) => feature.id)).toEqual(['first', 'second']);
  });

  it('should not touch the map before it has loaded', () => {
    createComponent();

    expect(fake.setData).not.toHaveBeenCalled();
  });

  it('should dispatch earthquakeSelected with source "map" on click', () => {
    const dispatch = vi.spyOn(store, 'dispatch');
    createComponent();
    fake.fireLoad();

    fake.fireClick({ features: [{ properties: { id: 'first' } }] });

    expect(dispatch).toHaveBeenCalledWith(
      EarthquakesPageActions.earthquakeSelected({ id: 'first', source: 'map' }),
    );
  });

  it('should mark a feature as hovered and dispatch earthquakeHovered on mouse move', () => {
    const dispatch = vi.spyOn(store, 'dispatch');
    createComponent();
    fake.fireLoad();

    fake.fireMouseMove({ features: [{ properties: { id: 'first' } }] });

    expect(fake.setFeatureState).toHaveBeenCalledWith(
      { source: EARTHQUAKES_SOURCE_ID, id: 'first' },
      { hovered: true },
    );
    expect(dispatch).toHaveBeenCalledWith(
      EarthquakesPageActions.earthquakeHovered({ id: 'first' }),
    );
  });

  it('should clear the previous hover before marking a new one', () => {
    createComponent();
    fake.fireLoad();

    fake.fireMouseMove({ features: [{ properties: { id: 'first' } }] });
    fake.fireMouseMove({ features: [{ properties: { id: 'second' } }] });

    expect(fake.setFeatureState).toHaveBeenCalledWith(
      { source: EARTHQUAKES_SOURCE_ID, id: 'first' },
      { hovered: false },
    );
  });

  it('should clear the hover and dispatch a null id on mouse leave', () => {
    const dispatch = vi.spyOn(store, 'dispatch');
    createComponent();
    fake.fireLoad();
    fake.fireMouseMove({ features: [{ properties: { id: 'first' } }] });

    fake.fireMouseLeave();

    expect(fake.setFeatureState).toHaveBeenCalledWith(
      { source: EARTHQUAKES_SOURCE_ID, id: 'first' },
      { hovered: false },
    );
    expect(dispatch).toHaveBeenCalledWith(EarthquakesPageActions.earthquakeHovered({ id: null }));
  });

  it('should mark the selected earthquake as selected once the map is ready', () => {
    const mockStore = TestBed.inject(MockStore);
    createComponent();
    fake.fireLoad();

    mockStore.overrideSelector(selectSelection, { id: 'second', source: 'list' });
    mockStore.refreshState();
    TestBed.tick();

    expect(fake.setFeatureState).toHaveBeenCalledWith(
      { source: EARTHQUAKES_SOURCE_ID, id: 'second' },
      { selected: true },
    );
  });

  it('should fly to the selected earthquake only when the selection came from the list', () => {
    const mockStore = TestBed.inject(MockStore);
    createComponent();
    fake.fireLoad();

    mockStore.overrideSelector(selectSelection, { id: 'second', source: 'list' });
    mockStore.refreshState();
    TestBed.tick();

    expect(fake.flyTo).toHaveBeenCalledWith({ center: [-10, -20], zoom: 6 });
  });

  it('should not fly to the selected earthquake when the selection came from the map itself', () => {
    const mockStore = TestBed.inject(MockStore);
    createComponent();
    fake.fireLoad();

    mockStore.overrideSelector(selectSelection, { id: 'second', source: 'map' });
    mockStore.refreshState();
    TestBed.tick();

    expect(fake.flyTo).not.toHaveBeenCalled();
  });
});
