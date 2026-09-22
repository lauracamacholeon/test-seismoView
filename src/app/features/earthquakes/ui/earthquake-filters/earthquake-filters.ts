import { Component, computed, inject } from '@angular/core';
import { Store } from '@ngrx/store';

import { EarthquakesPageActions } from '@features/earthquakes/data-access/state/earthquakes.actions';
import {
  selectFilters,
  selectMagnitudeBounds,
  selectTimeBounds,
} from '@features/earthquakes/data-access/state/earthquakes.selectors';
import {
  dateInputToEndOfDay,
  dateInputToStartOfDay,
  epochToDateInput,
} from '@features/earthquakes/data-access/utils/date-input';
import { type EarthquakeFilters as EarthquakeFiltersModel } from '@features/earthquakes/data-access/models/earthquake-filters.model';

/**
 * Connects directly to the store, the same way EarthquakeList does: filters
 * are simple enough that splitting a presentational component out from a
 * container would only add indirection without adding testability.
 */
@Component({
  selector: 'sv-earthquake-filters',
  templateUrl: './earthquake-filters.html',
  styleUrl: './earthquake-filters.scss',
})
export class EarthquakeFilters {
  private readonly store = inject(Store);

  protected readonly filters = this.store.selectSignal(selectFilters);
  protected readonly magnitudeBounds = this.store.selectSignal(selectMagnitudeBounds);
  protected readonly timeBounds = this.store.selectSignal(selectTimeBounds);

  protected readonly isFiltered = computed(() => {
    const filters = this.filters();
    return (
      filters.minMagnitude !== null ||
      filters.maxMagnitude !== null ||
      filters.from !== null ||
      filters.to !== null
    );
  });

  protected readonly epochToDateInput = epochToDateInput;

  protected readonly fromDateInput = computed(() => {
    const from = this.filters().from;
    return from === null ? '' : epochToDateInput(from);
  });

  protected readonly toDateInput = computed(() => {
    const to = this.filters().to;
    return to === null ? '' : epochToDateInput(to);
  });

  protected onMinMagnitudeChange(value: string): void {
    const minMagnitude = value === '' ? null : Number(value);
    this.dispatchFilters({ ...this.filters(), minMagnitude });
  }

  protected onMaxMagnitudeChange(value: string): void {
    const maxMagnitude = value === '' ? null : Number(value);
    this.dispatchFilters({ ...this.filters(), maxMagnitude });
  }

  protected onFromDateChange(value: string): void {
    const from = value === '' ? null : dateInputToStartOfDay(value);
    this.dispatchFilters({ ...this.filters(), from });
  }

  protected onToDateChange(value: string): void {
    const to = value === '' ? null : dateInputToEndOfDay(value);
    this.dispatchFilters({ ...this.filters(), to });
  }

  protected onReset(): void {
    this.store.dispatch(EarthquakesPageActions.filtersReset());
  }

  private dispatchFilters(filters: EarthquakeFiltersModel): void {
    this.store.dispatch(EarthquakesPageActions.filtersChanged({ filters }));
  }
}
