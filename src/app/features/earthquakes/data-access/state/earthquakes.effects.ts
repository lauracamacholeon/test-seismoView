import { inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, map, of, switchMap } from 'rxjs';

import { toApiError } from '@core/errors/api-error';

import { EarthquakesApi } from '../api/earthquakes-api';
import { EarthquakesApiActions, EarthquakesPageActions } from './earthquakes.actions';

export const loadEarthquakes = createEffect(
  (actions$ = inject(Actions), api = inject(EarthquakesApi)) =>
    actions$.pipe(
      ofType(EarthquakesPageActions.opened, EarthquakesPageActions.retryClicked),
      switchMap(() =>
        api.getEarthquakes().pipe(
          map((earthquakes) => EarthquakesApiActions.loadSucceeded({ earthquakes })),
          catchError((error: unknown) =>
            of(EarthquakesApiActions.loadFailed({ message: toApiError(error).message })),
          ),
        ),
      ),
    ),
  { functional: true },
);
