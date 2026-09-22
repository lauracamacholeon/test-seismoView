import { TestBed } from '@angular/core/testing';
import { Store } from '@ngrx/store';
import { type MockStore, provideMockStore } from '@ngrx/store/testing';

import { EarthquakesPageActions } from '@features/earthquakes/data-access/state/earthquakes.actions';
import {
  selectError,
  selectFilteredEarthquakes,
  selectSelection,
  selectStatus,
  selectTotalCount,
} from '@features/earthquakes/data-access/state/earthquakes.selectors';
import { MAP_FACTORY } from '@features/earthquakes/map/map-adapter.token';

import { EarthquakeViewer } from './earthquake-viewer';

describe('EarthquakeViewer', () => {
  let store: MockStore;

  function render(): HTMLElement {
    const fixture = TestBed.createComponent(EarthquakeViewer);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [EarthquakeViewer],
      providers: [
        // EarthquakeMap, rendered inside this component, needs its own map
        // and never touches WebGL in tests, so a fake factory stands in.
        {
          provide: MAP_FACTORY,
          useValue: () => ({ on: () => undefined, remove: () => undefined }),
        },
        provideMockStore({
          selectors: [
            { selector: selectStatus, value: 'loaded' },
            { selector: selectError, value: null },
            { selector: selectTotalCount, value: 0 },
            { selector: selectFilteredEarthquakes, value: [] },
            { selector: selectSelection, value: null },
          ],
        }),
      ],
    });
    store = TestBed.inject(Store) as MockStore;
  });

  it('should render a labelled sidebar for filters and list', () => {
    const sidebar = render().querySelector('aside');

    expect(sidebar?.getAttribute('aria-label')).toBe('Earthquake filters and list');
  });

  it('should render a labelled region for the map', () => {
    const map = render().querySelector('section');

    expect(map?.getAttribute('aria-label')).toBe('Earthquake map');
  });

  it('should render the earthquake map inside the map region', () => {
    const map = render().querySelector('section');

    expect(map?.querySelector('sv-earthquake-map')).not.toBeNull();
  });

  it('should ask for the earthquakes as soon as it is created', () => {
    const dispatch = vi.spyOn(store, 'dispatch');

    render();

    expect(dispatch).toHaveBeenCalledWith(EarthquakesPageActions.opened());
  });

  it('should tell the user that the earthquakes are loading', () => {
    store.overrideSelector(selectStatus, 'loading');

    expect(render().querySelector('aside')?.textContent).toContain('Loading earthquakes');
  });

  it('should show the error message when the load fails', () => {
    store.overrideSelector(selectStatus, 'error');
    store.overrideSelector(selectError, 'The service is temporarily unavailable.');

    expect(render().querySelector('aside')?.textContent).toContain(
      'The service is temporarily unavailable.',
    );
  });

  it('should show how many earthquakes were loaded', () => {
    store.overrideSelector(selectTotalCount, 42);

    expect(render().querySelector('aside')?.textContent).toContain('42 earthquakes loaded');
  });
});
