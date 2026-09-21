import { type Action } from '@ngrx/store';

import { NO_FILTERS } from '../models/earthquake-filters.model';
import { createEarthquake } from '../testing/earthquake.factory';
import { EarthquakesApiActions, EarthquakesPageActions } from './earthquakes.actions';
import {
  earthquakesFeature,
  initialEarthquakesState,
  type EarthquakesState,
} from './earthquakes.reducer';

const older = createEarthquake({ id: 'older', magnitude: 5, time: 1_000 });
const newest = createEarthquake({ id: 'newest', magnitude: 7, time: 3_000 });
const middle = createEarthquake({ id: 'middle', magnitude: 6, time: 2_000 });

function reduce(state: EarthquakesState, ...actions: Action[]): EarthquakesState {
  return actions.reduce((current, action) => earthquakesFeature.reducer(current, action), state);
}

function loaded(): EarthquakesState {
  return reduce(
    initialEarthquakesState,
    EarthquakesApiActions.loadSucceeded({ earthquakes: [older, newest, middle] }),
  );
}

describe('earthquakes reducer', () => {
  it('should start idle, empty and without filters or selection', () => {
    const state = earthquakesFeature.reducer(undefined, { type: '@@init' });

    expect(state).toEqual({
      ids: [],
      entities: {},
      status: 'idle',
      error: null,
      filters: NO_FILTERS,
      selectedId: null,
      selectionSource: null,
      hoveredId: null,
    });
  });

  describe('loading', () => {
    it.each([
      ['the page opens', EarthquakesPageActions.opened()],
      ['the user retries', EarthquakesPageActions.retryClicked()],
    ])('should enter the loading status when %s', (_reason, action) => {
      const state = reduce(initialEarthquakesState, action);

      expect(state.status).toBe('loading');
    });

    it('should clear a previous error when loading again', () => {
      const failed = reduce(
        initialEarthquakesState,
        EarthquakesApiActions.loadFailed({ message: 'boom' }),
      );

      const state = reduce(failed, EarthquakesPageActions.retryClicked());

      expect(state.error).toBeNull();
    });

    it('should store the earthquakes sorted from newest to oldest', () => {
      const state = loaded();

      expect(state.ids).toEqual(['newest', 'middle', 'older']);
      expect(state.status).toBe('loaded');
    });

    it('should replace the previous earthquakes on a new load', () => {
      const state = reduce(
        loaded(),
        EarthquakesApiActions.loadSucceeded({ earthquakes: [middle] }),
      );

      expect(state.ids).toEqual(['middle']);
    });

    it('should reset the selection and hover when new data arrives', () => {
      const state = reduce(
        loaded(),
        EarthquakesPageActions.earthquakeSelected({ id: 'newest', source: 'list' }),
        EarthquakesPageActions.earthquakeHovered({ id: 'older' }),
        EarthquakesApiActions.loadSucceeded({ earthquakes: [older, newest, middle] }),
      );

      expect(state).toMatchObject({ selectedId: null, selectionSource: null, hoveredId: null });
    });

    it('should keep the active filters when new data arrives', () => {
      const filters = { ...NO_FILTERS, minMagnitude: 6 };

      const state = reduce(
        loaded(),
        EarthquakesPageActions.filtersChanged({ filters }),
        EarthquakesApiActions.loadSucceeded({ earthquakes: [older] }),
      );

      expect(state.filters).toEqual(filters);
    });

    it('should store the failure message', () => {
      const state = reduce(
        initialEarthquakesState,
        EarthquakesApiActions.loadFailed({ message: 'Service unavailable' }),
      );

      expect(state).toMatchObject({ status: 'error', error: 'Service unavailable' });
    });

    it('should keep the loaded earthquakes when a later load fails', () => {
      const state = reduce(loaded(), EarthquakesApiActions.loadFailed({ message: 'boom' }));

      expect(state.ids).toHaveLength(3);
    });
  });

  describe('filters', () => {
    it('should store the new filters', () => {
      const filters = { ...NO_FILTERS, minMagnitude: 5.5, maxMagnitude: 7 };

      const state = reduce(loaded(), EarthquakesPageActions.filtersChanged({ filters }));

      expect(state.filters).toEqual(filters);
    });

    it('should clear the hovered earthquake', () => {
      const state = reduce(
        loaded(),
        EarthquakesPageActions.earthquakeHovered({ id: 'older' }),
        EarthquakesPageActions.filtersChanged({ filters: { ...NO_FILTERS, minMagnitude: 6 } }),
      );

      expect(state.hoveredId).toBeNull();
    });

    it('should keep the selection while the selected earthquake still matches', () => {
      const state = reduce(
        loaded(),
        EarthquakesPageActions.earthquakeSelected({ id: 'newest', source: 'map' }),
        EarthquakesPageActions.filtersChanged({ filters: { ...NO_FILTERS, minMagnitude: 6 } }),
      );

      expect(state).toMatchObject({ selectedId: 'newest', selectionSource: 'map' });
    });

    it('should clear the selection when the selected earthquake no longer matches', () => {
      const state = reduce(
        loaded(),
        EarthquakesPageActions.earthquakeSelected({ id: 'older', source: 'map' }),
        EarthquakesPageActions.filtersChanged({ filters: { ...NO_FILTERS, minMagnitude: 6 } }),
      );

      expect(state).toMatchObject({ selectedId: null, selectionSource: null });
    });

    it('should restore the default filters on reset', () => {
      const state = reduce(
        loaded(),
        EarthquakesPageActions.filtersChanged({ filters: { ...NO_FILTERS, minMagnitude: 6 } }),
        EarthquakesPageActions.filtersReset(),
      );

      expect(state.filters).toEqual(NO_FILTERS);
    });
  });

  describe('selection and hover', () => {
    it('should select an earthquake and remember where the selection came from', () => {
      const state = reduce(
        loaded(),
        EarthquakesPageActions.earthquakeSelected({ id: 'middle', source: 'list' }),
      );

      expect(state).toMatchObject({ selectedId: 'middle', selectionSource: 'list' });
    });

    it('should ignore the selection of an unknown earthquake', () => {
      const before = loaded();

      const after = reduce(
        before,
        EarthquakesPageActions.earthquakeSelected({ id: 'missing', source: 'map' }),
      );

      expect(after).toBe(before);
    });

    it('should clear the selection', () => {
      const state = reduce(
        loaded(),
        EarthquakesPageActions.earthquakeSelected({ id: 'middle', source: 'list' }),
        EarthquakesPageActions.selectionCleared(),
      );

      expect(state).toMatchObject({ selectedId: null, selectionSource: null });
    });

    it('should track and release the hovered earthquake', () => {
      const hovered = reduce(loaded(), EarthquakesPageActions.earthquakeHovered({ id: 'older' }));
      const released = reduce(hovered, EarthquakesPageActions.earthquakeHovered({ id: null }));

      expect(hovered.hoveredId).toBe('older');
      expect(released.hoveredId).toBeNull();
    });
  });
});
