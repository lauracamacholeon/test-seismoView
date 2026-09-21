import { createEntityAdapter, type EntityState } from '@ngrx/entity';
import { createFeature, createReducer, on } from '@ngrx/store';

import { NO_FILTERS, type EarthquakeFilters } from '../models/earthquake-filters.model';
import { type Earthquake } from '../models/earthquake.model';
import { matchesFilters } from '../utils/filter-earthquakes';
import {
  EarthquakesApiActions,
  EarthquakesPageActions,
  type SelectionSource,
} from './earthquakes.actions';

export type LoadStatus = 'idle' | 'loading' | 'loaded' | 'error';

export interface EarthquakesState extends EntityState<Earthquake> {
  readonly status: LoadStatus;
  readonly error: string | null;
  readonly filters: EarthquakeFilters;
  readonly selectedId: string | null;
  readonly selectionSource: SelectionSource | null;
  readonly hoveredId: string | null;
}

export const earthquakesAdapter = createEntityAdapter<Earthquake>({
  sortComparer: (a, b) => b.time - a.time,
});

export const initialEarthquakesState: EarthquakesState = {
  ...earthquakesAdapter.getInitialState(),
  status: 'idle',
  error: null,
  filters: NO_FILTERS,
  selectedId: null,
  selectionSource: null,
  hoveredId: null,
};

/**
 * Hover is transient, so it is always cleared. The selection survives only if
 * the selected earthquake still matches the new filters.
 */
function applyFilters(state: EarthquakesState, filters: EarthquakeFilters): EarthquakesState {
  const selected = state.selectedId === null ? undefined : state.entities[state.selectedId];
  const keepSelection = selected !== undefined && matchesFilters(selected, filters);

  return {
    ...state,
    filters,
    hoveredId: null,
    selectedId: keepSelection ? state.selectedId : null,
    selectionSource: keepSelection ? state.selectionSource : null,
  };
}

export const earthquakesFeature = createFeature({
  name: 'earthquakes',
  reducer: createReducer(
    initialEarthquakesState,
    on(
      EarthquakesPageActions.opened,
      EarthquakesPageActions.retryClicked,
      (state): EarthquakesState => ({ ...state, status: 'loading', error: null }),
    ),
    on(EarthquakesApiActions.loadSucceeded, (state, { earthquakes }): EarthquakesState =>
      earthquakesAdapter.setAll(earthquakes, {
        ...state,
        status: 'loaded',
        error: null,
        selectedId: null,
        selectionSource: null,
        hoveredId: null,
      }),
    ),
    on(EarthquakesApiActions.loadFailed, (state, { message }): EarthquakesState => ({
      ...state,
      status: 'error',
      error: message,
    })),
    on(EarthquakesPageActions.filtersChanged, (state, { filters }): EarthquakesState =>
      applyFilters(state, filters),
    ),
    on(EarthquakesPageActions.filtersReset, (state): EarthquakesState =>
      applyFilters(state, NO_FILTERS),
    ),
    on(EarthquakesPageActions.earthquakeSelected, (state, { id, source }): EarthquakesState => {
      return state.entities[id] === undefined
        ? state
        : { ...state, selectedId: id, selectionSource: source };
    }),
    on(EarthquakesPageActions.selectionCleared, (state): EarthquakesState => ({
      ...state,
      selectedId: null,
      selectionSource: null,
    })),
    on(EarthquakesPageActions.earthquakeHovered, (state, { id }): EarthquakesState => ({
      ...state,
      hoveredId: id,
    })),
  ),
  extraSelectors: ({ selectEarthquakesState }) => {
    const { selectAll, selectTotal } = earthquakesAdapter.getSelectors(selectEarthquakesState);

    return { selectAllEarthquakes: selectAll, selectTotalCount: selectTotal };
  },
});
