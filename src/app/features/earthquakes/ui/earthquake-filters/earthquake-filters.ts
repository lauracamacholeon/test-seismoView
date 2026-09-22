import { Component, computed, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule, type MatDatepickerInputEvent } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSliderModule } from '@angular/material/slider';
import { Store } from '@ngrx/store';

import { type EarthquakeFilters as EarthquakeFiltersModel } from '@features/earthquakes/data-access/models/earthquake-filters.model';
import { EarthquakesPageActions } from '@features/earthquakes/data-access/state/earthquakes.actions';
import {
  selectFilters,
  selectMagnitudeBounds,
  selectTimeBounds,
} from '@features/earthquakes/data-access/state/earthquakes.selectors';
import {
  endOfLocalDay,
  startOfLocalDay,
} from '@features/earthquakes/data-access/utils/day-boundary';

/**
 * Connects directly to the store, the same way EarthquakeList does: filters
 * are simple enough that splitting a presentational component out from a
 * container would only add indirection without adding testability.
 */
@Component({
  selector: 'sv-earthquake-filters',
  imports: [
    MatButtonModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatInputModule,
    MatSliderModule,
  ],
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

  protected readonly fromDate = computed(() => {
    const from = this.filters().from;
    return from === null ? null : new Date(from);
  });

  protected readonly toDate = computed(() => {
    const to = this.filters().to;
    return to === null ? null : new Date(to);
  });

  protected readonly minPickableDate = computed(() => {
    const bounds = this.timeBounds();
    return bounds === null ? null : new Date(bounds.min);
  });

  protected readonly maxPickableDate = computed(() => {
    const bounds = this.timeBounds();
    return bounds === null ? null : new Date(bounds.max);
  });

  protected onMinMagnitudeChange(minMagnitude: number): void {
    this.dispatchFilters({ ...this.filters(), minMagnitude });
  }

  protected onMaxMagnitudeChange(maxMagnitude: number): void {
    this.dispatchFilters({ ...this.filters(), maxMagnitude });
  }

  protected onFromDateChange(event: MatDatepickerInputEvent<Date>): void {
    const from = event.value === null ? null : startOfLocalDay(event.value);
    this.dispatchFilters({ ...this.filters(), from });
  }

  protected onToDateChange(event: MatDatepickerInputEvent<Date>): void {
    const to = event.value === null ? null : endOfLocalDay(event.value);
    this.dispatchFilters({ ...this.filters(), to });
  }

  protected onReset(): void {
    this.store.dispatch(EarthquakesPageActions.filtersReset());
  }

  private dispatchFilters(filters: EarthquakeFiltersModel): void {
    this.store.dispatch(EarthquakesPageActions.filtersChanged({ filters }));
  }
}
