import { createSelector } from '@ngrx/store';

import { filterEarthquakes } from '../utils/filter-earthquakes';
import { earthquakesFeature } from './earthquakes.reducer';

export const {
  selectAllEarthquakes,
  selectEntities,
  selectError,
  selectFilters,
  selectHoveredId,
  selectSelectedId,
  selectSelectionSource,
  selectStatus,
  selectTotalCount,
} = earthquakesFeature;

export interface NumericRange {
  readonly min: number;
  readonly max: number;
}

export const selectIsLoading = createSelector(selectStatus, (status) => status === 'loading');

export const selectFilteredEarthquakes = createSelector(
  selectAllEarthquakes,
  selectFilters,
  filterEarthquakes,
);

/** Whole-number magnitude bounds of the loaded data, or null while it is empty. */
export const selectMagnitudeBounds = createSelector(selectAllEarthquakes, (earthquakes) => {
  const bounds = rangeOf(earthquakes.map((earthquake) => earthquake.magnitude));

  return bounds === null ? null : { min: Math.floor(bounds.min), max: Math.ceil(bounds.max) };
});

export const selectTimeBounds = createSelector(selectAllEarthquakes, (earthquakes) =>
  rangeOf(earthquakes.map((earthquake) => earthquake.time)),
);

export const selectSelectedEarthquake = createSelector(
  selectEntities,
  selectSelectedId,
  (entities, id) => (id === null ? null : (entities[id] ?? null)),
);

export const selectSelection = createSelector(
  selectSelectedId,
  selectSelectionSource,
  (id, source) => (id === null || source === null ? null : { id, source }),
);

function rangeOf(values: readonly number[]): NumericRange | null {
  if (values.length === 0) {
    return null;
  }

  return values.reduce<NumericRange>(
    (range, value) => ({ min: Math.min(range.min, value), max: Math.max(range.max, value) }),
    { min: values[0], max: values[0] },
  );
}
