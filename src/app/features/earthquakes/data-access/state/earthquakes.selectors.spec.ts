import { type Action } from '@ngrx/store';

import { NO_FILTERS } from '../models/earthquake-filters.model';
import { createEarthquake } from '../testing/earthquake.factory';
import { EarthquakesApiActions, EarthquakesPageActions } from './earthquakes.actions';
import { earthquakesFeature, initialEarthquakesState } from './earthquakes.reducer';
import {
  selectFilteredEarthquakes,
  selectIsLoading,
  selectMagnitudeBounds,
  selectSelectedEarthquake,
  selectSelection,
  selectTimeBounds,
  selectTotalCount,
} from './earthquakes.selectors';

const older = createEarthquake({ id: 'older', magnitude: 4.6, time: 1_000 });
const newest = createEarthquake({ id: 'newest', magnitude: 7.2, time: 3_000 });
const middle = createEarthquake({ id: 'middle', magnitude: 5.5, time: 2_000 });

function rootState(...actions: Action[]): { earthquakes: typeof initialEarthquakesState } {
  return {
    earthquakes: actions.reduce(
      (state, action) => earthquakesFeature.reducer(state, action),
      initialEarthquakesState,
    ),
  };
}

const loaded = (...actions: Action[]) =>
  rootState(
    EarthquakesApiActions.loadSucceeded({ earthquakes: [older, newest, middle] }),
    ...actions,
  );

describe('earthquakes selectors', () => {
  describe('selectFilteredEarthquakes', () => {
    it('should return every earthquake, newest first, when no filter is active', () => {
      const ids = selectFilteredEarthquakes(loaded()).map((earthquake) => earthquake.id);

      expect(ids).toEqual(['newest', 'middle', 'older']);
    });

    it('should apply the magnitude range', () => {
      const state = loaded(
        EarthquakesPageActions.filtersChanged({
          filters: { ...NO_FILTERS, minMagnitude: 5, maxMagnitude: 6 },
        }),
      );

      expect(selectFilteredEarthquakes(state).map((earthquake) => earthquake.id)).toEqual([
        'middle',
      ]);
    });

    it('should apply the date range', () => {
      const state = loaded(
        EarthquakesPageActions.filtersChanged({
          filters: { ...NO_FILTERS, from: 1_500, to: 2_500 },
        }),
      );

      expect(selectFilteredEarthquakes(state).map((earthquake) => earthquake.id)).toEqual([
        'middle',
      ]);
    });

    it('should not depend on the selection or hover', () => {
      const before = selectFilteredEarthquakes(loaded());
      const after = selectFilteredEarthquakes(
        loaded(
          EarthquakesPageActions.earthquakeSelected({ id: 'older', source: 'map' }),
          EarthquakesPageActions.earthquakeHovered({ id: 'middle' }),
        ),
      );

      expect(after).toEqual(before);
    });
  });

  describe('bounds', () => {
    it('should round the magnitude bounds outwards to whole numbers', () => {
      expect(selectMagnitudeBounds(loaded())).toEqual({ min: 4, max: 8 });
    });

    it('should return the oldest and newest timestamps', () => {
      expect(selectTimeBounds(loaded())).toEqual({ min: 1_000, max: 3_000 });
    });

    it('should not depend on the active filters', () => {
      const state = loaded(
        EarthquakesPageActions.filtersChanged({ filters: { ...NO_FILTERS, minMagnitude: 7 } }),
      );

      expect(selectMagnitudeBounds(state)).toEqual({ min: 4, max: 8 });
    });

    it('should return null bounds while there is no data', () => {
      const state = rootState();

      expect(selectMagnitudeBounds(state)).toBeNull();
      expect(selectTimeBounds(state)).toBeNull();
    });
  });

  describe('selection', () => {
    it('should resolve the selected earthquake', () => {
      const state = loaded(
        EarthquakesPageActions.earthquakeSelected({ id: 'middle', source: 'list' }),
      );

      expect(selectSelectedEarthquake(state)).toEqual(middle);
    });

    it('should return null when nothing is selected', () => {
      expect(selectSelectedEarthquake(loaded())).toBeNull();
    });

    it('should return null when the selected id matches no earthquake', () => {
      expect(selectSelectedEarthquake.projector({ older }, 'missing')).toBeNull();
    });

    it('should expose the selected id together with its source', () => {
      const state = loaded(
        EarthquakesPageActions.earthquakeSelected({ id: 'middle', source: 'map' }),
      );

      expect(selectSelection(state)).toEqual({ id: 'middle', source: 'map' });
    });

    it('should expose no selection when nothing is selected', () => {
      expect(selectSelection(loaded())).toBeNull();
    });
  });

  describe('status', () => {
    it('should tell whether the earthquakes are loading', () => {
      expect(selectIsLoading(rootState(EarthquakesPageActions.opened()))).toBe(true);
      expect(selectIsLoading(loaded())).toBe(false);
    });

    it('should count every loaded earthquake regardless of the filters', () => {
      const state = loaded(
        EarthquakesPageActions.filtersChanged({ filters: { ...NO_FILTERS, minMagnitude: 7 } }),
      );

      expect(selectTotalCount(state)).toBe(3);
    });
  });
});
