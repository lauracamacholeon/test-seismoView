import { TestBed } from '@angular/core/testing';
import { provideNativeDateAdapter } from '@angular/material/core';
import { Store } from '@ngrx/store';
import { MockStore, provideMockStore } from '@ngrx/store/testing';

import { NO_FILTERS } from '@features/earthquakes/data-access/models/earthquake-filters.model';
import { EarthquakesPageActions } from '@features/earthquakes/data-access/state/earthquakes.actions';
import {
  selectFilters,
  selectMagnitudeBounds,
  selectTimeBounds,
} from '@features/earthquakes/data-access/state/earthquakes.selectors';

import { EarthquakeFilters } from './earthquake-filters';

const TIME_BOUNDS = { min: Date.UTC(2026, 0, 1), max: Date.UTC(2026, 0, 31) };

interface TestableFilters {
  onMinMagnitudeChange(value: number): void;
  onMaxMagnitudeChange(value: number): void;
  onFromDateChange(event: { value: Date | null }): void;
  onToDateChange(event: { value: Date | null }): void;
}

describe('EarthquakeFilters', () => {
  let store: Store;

  function render() {
    const fixture = TestBed.createComponent(EarthquakeFilters);
    fixture.detectChanges();
    return fixture;
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [EarthquakeFilters],
      providers: [
        provideNativeDateAdapter(),
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

  it('should default the range slider to the full data range when unfiltered', () => {
    const host = render().nativeElement as HTMLElement;

    expect(host.querySelector<HTMLInputElement>('input[matSliderStartThumb]')?.value).toBe('4');
    expect(host.querySelector<HTMLInputElement>('input[matSliderEndThumb]')?.value).toBe('8');
  });

  it('should dispatch filtersChanged when the minimum magnitude thumb moves', () => {
    const dispatch = vi.spyOn(store, 'dispatch');
    const fixture = render();

    (fixture.componentInstance as unknown as TestableFilters).onMinMagnitudeChange(5.5);

    expect(dispatch).toHaveBeenCalledWith(
      EarthquakesPageActions.filtersChanged({
        filters: { ...NO_FILTERS, minMagnitude: 5.5 },
      }),
    );
  });

  it('should dispatch filtersChanged when the maximum magnitude thumb moves', () => {
    const dispatch = vi.spyOn(store, 'dispatch');
    const fixture = render();

    (fixture.componentInstance as unknown as TestableFilters).onMaxMagnitudeChange(6.5);

    expect(dispatch).toHaveBeenCalledWith(
      EarthquakesPageActions.filtersChanged({
        filters: { ...NO_FILTERS, maxMagnitude: 6.5 },
      }),
    );
  });

  it('should dispatch filtersChanged with the start of the picked "from" day', () => {
    const dispatch = vi.spyOn(store, 'dispatch');
    const fixture = render();
    const picked = new Date(2026, 0, 10, 15, 0, 0);

    (fixture.componentInstance as unknown as TestableFilters).onFromDateChange({ value: picked });

    expect(dispatch).toHaveBeenCalledWith(
      EarthquakesPageActions.filtersChanged({
        filters: { ...NO_FILTERS, from: new Date(2026, 0, 10, 0, 0, 0, 0).getTime() },
      }),
    );
  });

  it('should dispatch filtersChanged with the end of the picked "to" day', () => {
    const dispatch = vi.spyOn(store, 'dispatch');
    const fixture = render();
    const picked = new Date(2026, 0, 10, 9, 0, 0);

    (fixture.componentInstance as unknown as TestableFilters).onToDateChange({ value: picked });

    expect(dispatch).toHaveBeenCalledWith(
      EarthquakesPageActions.filtersChanged({
        filters: { ...NO_FILTERS, to: new Date(2026, 0, 10, 23, 59, 59, 999).getTime() },
      }),
    );
  });

  it('should clear the "from" filter when the date is cleared', () => {
    const dispatch = vi.spyOn(store, 'dispatch');
    const fixture = render();

    (fixture.componentInstance as unknown as TestableFilters).onFromDateChange({ value: null });

    expect(dispatch).toHaveBeenCalledWith(
      EarthquakesPageActions.filtersChanged({ filters: { ...NO_FILTERS, from: null } }),
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
