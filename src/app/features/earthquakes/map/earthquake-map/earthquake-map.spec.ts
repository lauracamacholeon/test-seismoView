import { TestBed } from '@angular/core/testing';
import { Store } from '@ngrx/store';
import { MockStore, provideMockStore } from '@ngrx/store/testing';

import { APP_CONFIG, type AppConfig } from '@core/config/app-config';
import { EarthquakesPageActions } from '@features/earthquakes/data-access/state/earthquakes.actions';
import {
  selectFilteredEarthquakes,
  selectHoveredId,
  selectSelection,
} from '@features/earthquakes/data-access/state/earthquakes.selectors';
import { createEarthquake } from '@features/earthquakes/data-access/testing/earthquake.factory';

import { EARTHQUAKES_LAYER_ID, EARTHQUAKES_SOURCE_ID } from '../earthquakes-layers';
import { MAP_FACTORY, POPUP_FACTORY } from '../map-adapter.token';
import { type EarthquakeFeatureCollection } from '../earthquakes-geojson';
import { type MapHandle, type PopupHandle } from '../map-handle';
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

/** A fake, chainable PopupHandle, matching MapLibre's real fluent Popup API. */
function createFakePopup() {
  const setLngLat = vi.fn();
  const setHTML = vi.fn();
  const addTo = vi.fn();
  const remove = vi.fn();

  const popup: PopupHandle = {
    setLngLat: (...args) => {
      setLngLat(...args);
      return popup;
    },
    setHTML: (...args) => {
      setHTML(...args);
      return popup;
    },
    addTo: (...args) => {
      addTo(...args);
      return popup;
    },
    remove: () => {
      remove();
      return popup;
    },
  };

  return { popup, popupFactory: vi.fn(() => popup), setLngLat, setHTML, addTo, remove };
}

describe('EarthquakeMap', () => {
  const first = createEarthquake({ id: 'first', longitude: 10, latitude: 20 });
  const second = createEarthquake({ id: 'second', longitude: -10, latitude: -20 });

  let store: Store;
  let fake: ReturnType<typeof createFakeMap>;
  let fakePopup: ReturnType<typeof createFakePopup>;

  function createComponent() {
    const fixture = TestBed.createComponent(EarthquakeMap);
    fixture.detectChanges();
    return fixture;
  }

  beforeEach(() => {
    fake = createFakeMap();
    fakePopup = createFakePopup();
    TestBed.configureTestingModule({
      imports: [EarthquakeMap],
      providers: [
        { provide: APP_CONFIG, useValue: TEST_CONFIG },
        { provide: MAP_FACTORY, useValue: fake.mapFactory },
        { provide: POPUP_FACTORY, useValue: fakePopup.popupFactory },
        provideMockStore({
          selectors: [
            { selector: selectFilteredEarthquakes, value: [first, second] },
            { selector: selectSelection, value: null },
            { selector: selectHoveredId, value: null },
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

  it('should dispatch earthquakeHovered on mouse move, without touching feature-state directly', () => {
    const dispatch = vi.spyOn(store, 'dispatch');
    createComponent();
    fake.fireLoad();

    fake.fireMouseMove({ features: [{ properties: { id: 'first' } }] });

    expect(dispatch).toHaveBeenCalledWith(
      EarthquakesPageActions.earthquakeHovered({ id: 'first' }),
    );
    // Feature-state is only ever set by the store->map sync effect (tested
    // below), never directly from the mouse handler: that is what makes a
    // hover started on a list card work the same way as one started here.
    expect(fake.setFeatureState).not.toHaveBeenCalled();
  });

  it('should dispatch a null id on mouse leave', () => {
    const dispatch = vi.spyOn(store, 'dispatch');
    createComponent();
    fake.fireLoad();

    fake.fireMouseLeave();

    expect(dispatch).toHaveBeenCalledWith(EarthquakesPageActions.earthquakeHovered({ id: null }));
  });

  it("should mirror the store's hovered id onto feature-state, however the hover started", () => {
    const mockStore = TestBed.inject(MockStore);
    createComponent();
    fake.fireLoad();

    // No mouse event on the map at all: this is exactly what happens when
    // the hover starts on a list card instead.
    mockStore.overrideSelector(selectHoveredId, 'first');
    mockStore.refreshState();
    TestBed.tick();

    expect(fake.setFeatureState).toHaveBeenCalledWith(
      { source: EARTHQUAKES_SOURCE_ID, id: 'first' },
      { hovered: true },
    );
  });

  it('should clear the previously hovered feature when the hovered id changes', () => {
    const mockStore = TestBed.inject(MockStore);
    createComponent();
    fake.fireLoad();
    mockStore.overrideSelector(selectHoveredId, 'first');
    mockStore.refreshState();
    TestBed.tick();

    mockStore.overrideSelector(selectHoveredId, 'second');
    mockStore.refreshState();
    TestBed.tick();

    expect(fake.setFeatureState).toHaveBeenCalledWith(
      { source: EARTHQUAKES_SOURCE_ID, id: 'first' },
      { hovered: false },
    );
    expect(fake.setFeatureState).toHaveBeenCalledWith(
      { source: EARTHQUAKES_SOURCE_ID, id: 'second' },
      { hovered: true },
    );
  });

  it('should clear the hovered feature when the hovered id goes back to null', () => {
    const mockStore = TestBed.inject(MockStore);
    createComponent();
    fake.fireLoad();
    mockStore.overrideSelector(selectHoveredId, 'first');
    mockStore.refreshState();
    TestBed.tick();

    mockStore.overrideSelector(selectHoveredId, null);
    mockStore.refreshState();
    TestBed.tick();

    expect(fake.setFeatureState).toHaveBeenCalledWith(
      { source: EARTHQUAKES_SOURCE_ID, id: 'first' },
      { hovered: false },
    );
  });

  it("should show a tooltip at the hovered earthquake's coordinates, however the hover started", () => {
    const mockStore = TestBed.inject(MockStore);
    createComponent();
    fake.fireLoad();

    mockStore.overrideSelector(selectHoveredId, 'first');
    mockStore.refreshState();
    TestBed.tick();

    expect(fakePopup.setLngLat).toHaveBeenCalledWith([10, 20]);
    expect(fakePopup.setHTML).toHaveBeenCalledWith(expect.stringContaining(first.place));
    expect(fakePopup.addTo).toHaveBeenCalledWith(fake.map);
  });

  it('should include the magnitude in the tooltip', () => {
    const mockStore = TestBed.inject(MockStore);
    createComponent();
    fake.fireLoad();

    mockStore.overrideSelector(selectHoveredId, 'first');
    mockStore.refreshState();
    TestBed.tick();

    const [html] = fakePopup.setHTML.mock.calls[0] as [string];

    expect(html).toContain(`M${first.magnitude.toFixed(1)}`);
  });

  it('should escape the place name in the tooltip', () => {
    const mockStore = TestBed.inject(MockStore);
    mockStore.overrideSelector(selectFilteredEarthquakes, [
      createEarthquake({ id: 'unsafe', place: '<b>Somewhere</b>' }),
    ]);
    createComponent();
    fake.fireLoad();

    mockStore.overrideSelector(selectHoveredId, 'unsafe');
    mockStore.refreshState();
    TestBed.tick();

    const [html] = fakePopup.setHTML.mock.calls[0] as [string];

    expect(html).not.toContain('<b>Somewhere</b>');
    expect(html).toContain('&lt;b&gt;');
  });

  it('should remove the tooltip once nothing is hovered', () => {
    const mockStore = TestBed.inject(MockStore);
    createComponent();
    fake.fireLoad();
    mockStore.overrideSelector(selectHoveredId, 'first');
    mockStore.refreshState();
    TestBed.tick();

    mockStore.overrideSelector(selectHoveredId, null);
    mockStore.refreshState();
    TestBed.tick();

    expect(fakePopup.remove).toHaveBeenCalled();
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
