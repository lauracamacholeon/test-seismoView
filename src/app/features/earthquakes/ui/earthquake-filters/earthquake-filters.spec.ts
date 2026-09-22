import { TestBed } from '@angular/core/testing';
import { Store } from '@ngrx/store';
import { MockStore, provideMockStore } from '@ngrx/store/testing';

import { EarthquakesPageActions } from '@features/earthquakes/data-access/state/earthquakes.actions';
import { NO_FILTERS } from '@features/earthquakes/data-access/models/earthquake-filters.model';
import {
  selectFilters,
  selectMagnitudeBounds,
  selectTimeBounds,
} from '@features/earthquakes/data-access/state/earthquakes.selectors';

import { EarthquakeFilters } from './earthquake-filters';

const TIME_BOUNDS = { min: Date.UTC(2026, 0, 1), max: Date.UTC(2026, 0, 31) };

describe('EarthquakeFilters', () => {
  let store: Store;

  function render() {
    const fixture = TestBed.createComponent(EarthquakeFilters);
    fixture.detectChanges();
    return fixture;
  }

  function setInputValue(fixture: ReturnType<typeof render>, id: string, value: string): void {
    const input = (fixture.nativeElement as HTMLElement).querySelector<HTMLInputElement>(`#${id}`);
    if (!input) {
      throw new Error(`No input found with id "${id}"`);
    }
    input.value = value;
    input.dispatchEvent(new Event(id.includes('date') ? 'change' : 'input'));
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [EarthquakeFilters],
      providers: [
        provideMockStore({
          selectors: [
            { selector: selectFilters, value: NO_FILTERS },
            { selector: selectMagnitudeBounds, value: { min: 4, max: 8 } },
            { selector: selectTimeBounds, value: TIME_BOUNDS },
          ],
        }),
      ],
    });
    store = TestBed.inject(Store) as Store;
  });

  it('should render nothing until the magnitude bounds are known', () => {
    const mockStore = TestBed.inject(MockStore);
    mockStore.overrideSelector(selectMagnitudeBounds, null);

    const host = render().nativeElement as HTMLElement;

    expect(host.querySelector('.filters')).toBeNull();
  });

  it('should default the sliders to the full data range when unfiltered', () => {
    const host = render().nativeElement as HTMLElement;

    expect(host.querySelector<HTMLInputElement>('#min-magnitude')?.value).toBe('4');
    expect(host.querySelector<HTMLInputElement>('#max-magnitude')?.value).toBe('8');
  });

  it('should dispatch filtersChanged with the new minimum magnitude', () => {
    const dispatch = vi.spyOn(store, 'dispatch');
    const fixture = render();

    setInputValue(fixture, 'min-magnitude', '5.5');

    expect(dispatch).toHaveBeenCalledWith(
      EarthquakesPageActions.filtersChanged({
        filters: { ...NO_FILTERS, minMagnitude: 5.5 },
      }),
    );
  });

  it('should dispatch filtersChanged with the new maximum magnitude', () => {
    const dispatch = vi.spyOn(store, 'dispatch');
    const fixture = render();

    setInputValue(fixture, 'max-magnitude', '6.5');

    expect(dispatch).toHaveBeenCalledWith(
      EarthquakesPageActions.filtersChanged({
        filters: { ...NO_FILTERS, maxMagnitude: 6.5 },
      }),
    );
  });

  it('should dispatch filtersChanged with the start of the selected "from" day', () => {
    const dispatch = vi.spyOn(store, 'dispatch');
    const fixture = render();

    setInputValue(fixture, 'from-date', '2026-01-10');

    expect(dispatch).toHaveBeenCalledWith(
      EarthquakesPageActions.filtersChanged({
        filters: { ...NO_FILTERS, from: Date.UTC(2026, 0, 10, 0, 0, 0, 0) },
      }),
    );
  });

  it('should dispatch filtersChanged with the end of the selected "to" day', () => {
    const dispatch = vi.spyOn(store, 'dispatch');
    const fixture = render();

    setInputValue(fixture, 'to-date', '2026-01-10');

    expect(dispatch).toHaveBeenCalledWith(
      EarthquakesPageActions.filtersChanged({
        filters: { ...NO_FILTERS, to: Date.UTC(2026, 0, 10, 23, 59, 59, 999) },
      }),
    );
  });

  it('should not show a reset button while nothing is filtered', () => {
    const host = render().nativeElement as HTMLElement;

    expect(host.querySelector('.filters__reset')).toBeNull();
  });

  it('should show a reset button once a filter is active, and dispatch filtersReset on click', () => {
    const mockStore = TestBed.inject(MockStore);
    mockStore.overrideSelector(selectFilters, { ...NO_FILTERS, minMagnitude: 5 });
    const dispatch = vi.spyOn(store, 'dispatch');

    const host = render().nativeElement as HTMLElement;
    const resetButton = host.querySelector<HTMLButtonElement>('.filters__reset');
    resetButton?.click();

    expect(resetButton).not.toBeNull();
    expect(dispatch).toHaveBeenCalledWith(EarthquakesPageActions.filtersReset());
  });
});
