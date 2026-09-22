import { type Routes } from '@angular/router';
import { provideEffects } from '@ngrx/effects';
import { provideState } from '@ngrx/store';

import * as earthquakesEffects from './data-access/state/earthquakes.effects';
import { earthquakesFeature } from './data-access/state/earthquakes.reducer';
import { mapFactoryProvider } from './map/map-factory.provider';

export const EARTHQUAKES_ROUTES: Routes = [
  {
    path: '',
    providers: [
      provideState(earthquakesFeature),
      provideEffects(earthquakesEffects),
      mapFactoryProvider,
    ],
    loadComponent: () =>
      import('./containers/earthquake-viewer/earthquake-viewer').then((m) => m.EarthquakeViewer),
  },
];
