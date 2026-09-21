import { createActionGroup, emptyProps, props } from '@ngrx/store';

import { type EarthquakeFilters } from '../models/earthquake-filters.model';
import { type Earthquake } from '../models/earthquake.model';

export type SelectionSource = 'map' | 'list';

export const EarthquakesPageActions = createActionGroup({
  source: 'Earthquakes Page',
  events: {
    Opened: emptyProps(),
    'Retry Clicked': emptyProps(),
    'Filters Changed': props<{ filters: EarthquakeFilters }>(),
    'Filters Reset': emptyProps(),
    'Earthquake Selected': props<{ id: string; source: SelectionSource }>(),
    'Selection Cleared': emptyProps(),
    'Earthquake Hovered': props<{ id: string | null }>(),
  },
});

export const EarthquakesApiActions = createActionGroup({
  source: 'Earthquakes API',
  events: {
    'Load Succeeded': props<{ earthquakes: Earthquake[] }>(),
    'Load Failed': props<{ message: string }>(),
  },
});
