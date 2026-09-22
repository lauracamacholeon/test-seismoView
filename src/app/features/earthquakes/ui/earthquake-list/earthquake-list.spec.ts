import { TestBed } from '@angular/core/testing';
import { Store } from '@ngrx/store';
import { MockStore, provideMockStore } from '@ngrx/store/testing';

import { EarthquakesPageActions } from '@features/earthquakes/data-access/state/earthquakes.actions';
import {
  selectError,
  selectFilteredEarthquakes,
  selectHoveredId,
  selectSelection,
  selectStatus,
} from '@features/earthquakes/data-access/state/earthquakes.selectors';
import { createEarthquake } from '@features/earthquakes/data-access/testing/earthquake.factory';

import { EarthquakeList } from './earthquake-list';

describe('EarthquakeList', () => {
  const first = createEarthquake({ id: 'first', place: 'First place' });
  const second = createEarthquake({ id: 'second', place: 'Second place' });

  let store: Store;

  function render() {
    const fixture = TestBed.createComponent(EarthquakeList);
    fixture.detectChanges();
    return fixture;
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [EarthquakeList],
      providers: [
        provideMockStore({
          selectors: [
            { selector: selectStatus, value: 'loaded' },
            { selector: selectError, value: null },
            { selector: selectFilteredEarthquakes, value: [first, second] },
            { selector: selectSelection, value: null },
            { selector: selectHoveredId, value: null },
          ],
        }),
      ],
    });
    store = TestBed.inject(Store) as Store;
  });

  it('should show the earthquake count and a card per earthquake', () => {
    const host = render().nativeElement as HTMLElement;

    expect(host.textContent).toContain('2 earthquakes');
    expect(host.querySelectorAll('sv-earthquake-card')).toHaveLength(2);
  });

  it('should tell the user that the earthquakes are loading', () => {
    const mockStore = TestBed.inject(MockStore);
    mockStore.overrideSelector(selectStatus, 'loading');

    expect((render().nativeElement as HTMLElement).textContent).toContain('Loading earthquakes');
  });

  it('should show the error message when the load fails', () => {
    const mockStore = TestBed.inject(MockStore);
    mockStore.overrideSelector(selectStatus, 'error');
    mockStore.overrideSelector(selectError, 'Something went wrong.');

    expect((render().nativeElement as HTMLElement).textContent).toContain('Something went wrong.');
  });

  it('should tell the user when no earthquake matches the filters', () => {
    const mockStore = TestBed.inject(MockStore);
    mockStore.overrideSelector(selectFilteredEarthquakes, []);

    expect((render().nativeElement as HTMLElement).textContent).toContain(
      'No earthquakes match the current filters.',
    );
  });

  it('should dispatch earthquakeSelected with source "list" when a card is selected', () => {
    const dispatch = vi.spyOn(store, 'dispatch');
    const fixture = render();

    const card = fixture.debugElement.query((el) => el.name === 'sv-earthquake-card');
    (
      card.componentInstance as { selectEarthquake: { emit: (id: string) => void } }
    ).selectEarthquake.emit('first');

    expect(dispatch).toHaveBeenCalledWith(
      EarthquakesPageActions.earthquakeSelected({ id: 'first', source: 'list' }),
    );
  });

  it('should dispatch earthquakeHovered when a card reports hover', () => {
    const dispatch = vi.spyOn(store, 'dispatch');
    const fixture = render();

    const card = fixture.debugElement.query((el) => el.name === 'sv-earthquake-card');
    (
      card.componentInstance as { hoverEarthquake: { emit: (id: string | null) => void } }
    ).hoverEarthquake.emit('second');

    expect(dispatch).toHaveBeenCalledWith(
      EarthquakesPageActions.earthquakeHovered({ id: 'second' }),
    );
  });

  it('should scroll the selected card into view when the selection came from the map', () => {
    const mockStore = TestBed.inject(MockStore);
    const fixture = render();
    const card = (fixture.nativeElement as HTMLElement).querySelector('#earthquake-second');
    const scrollIntoView = vi.fn();
    if (card) {
      card.scrollIntoView = scrollIntoView;
    }

    mockStore.overrideSelector(selectSelection, { id: 'second', source: 'map' });
    mockStore.refreshState();
    TestBed.tick();

    expect(scrollIntoView).toHaveBeenCalled();
  });

  it('should not scroll when the selection came from this list', () => {
    const mockStore = TestBed.inject(MockStore);
    const fixture = render();
    const card = (fixture.nativeElement as HTMLElement).querySelector('#earthquake-second');
    const scrollIntoView = vi.fn();
    if (card) {
      card.scrollIntoView = scrollIntoView;
    }

    mockStore.overrideSelector(selectSelection, { id: 'second', source: 'list' });
    mockStore.refreshState();
    TestBed.tick();

    expect(scrollIntoView).not.toHaveBeenCalled();
  });
});
