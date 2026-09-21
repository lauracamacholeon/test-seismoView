import { TestBed } from '@angular/core/testing';
import { provideMockActions } from '@ngrx/effects/testing';
import { type Action } from '@ngrx/store';
import { of, Subject, throwError, type Observable } from 'rxjs';

import { ApiError } from '@core/errors/api-error';

import { EarthquakesApi } from '../api/earthquakes-api';
import { type Earthquake } from '../models/earthquake.model';
import { createEarthquake } from '../testing/earthquake.factory';
import { EarthquakesApiActions, EarthquakesPageActions } from './earthquakes.actions';
import { loadEarthquakes } from './earthquakes.effects';

describe('loadEarthquakes', () => {
  const first = createEarthquake({ id: 'first' });
  const second = createEarthquake({ id: 'second' });

  let actions$: Observable<Action>;
  let getEarthquakes: ReturnType<typeof vi.fn<() => Observable<Earthquake[]>>>;

  function collect(): Action[] {
    const emitted: Action[] = [];
    TestBed.runInInjectionContext(() => loadEarthquakes()).subscribe((action) => {
      emitted.push(action);
    });
    return emitted;
  }

  beforeEach(() => {
    getEarthquakes = vi.fn<() => Observable<Earthquake[]>>();
    TestBed.configureTestingModule({
      providers: [
        provideMockActions(() => actions$),
        { provide: EarthquakesApi, useValue: { getEarthquakes } },
      ],
    });
  });

  it.each([
    ['the page opens', EarthquakesPageActions.opened()],
    ['the user retries', EarthquakesPageActions.retryClicked()],
  ])('should load the earthquakes when %s', (_reason, trigger) => {
    getEarthquakes.mockReturnValue(of([first, second]));
    actions$ = of(trigger);

    const emitted = collect();

    expect(emitted).toEqual([
      EarthquakesApiActions.loadSucceeded({ earthquakes: [first, second] }),
    ]);
  });

  it('should ignore unrelated actions', () => {
    actions$ = of(EarthquakesPageActions.filtersReset());

    const emitted = collect();

    expect(emitted).toEqual([]);
    expect(getEarthquakes).not.toHaveBeenCalled();
  });

  it('should report the user-facing message when the request fails', () => {
    getEarthquakes.mockReturnValue(throwError(() => new ApiError('server', 503)));
    actions$ = of(EarthquakesPageActions.opened());

    const emitted = collect();

    expect(emitted).toEqual([
      EarthquakesApiActions.loadFailed({
        message: 'The service is temporarily unavailable. Please try again later.',
      }),
    ]);
  });

  it('should report a generic message for unexpected errors', () => {
    getEarthquakes.mockReturnValue(throwError(() => new TypeError('unexpected')));
    actions$ = of(EarthquakesPageActions.opened());

    const emitted = collect();

    expect(emitted).toEqual([
      EarthquakesApiActions.loadFailed({ message: 'Something went wrong. Please try again.' }),
    ]);
  });

  it('should keep listening after a failed request', () => {
    const requests = new Subject<Action>();
    getEarthquakes
      .mockReturnValueOnce(throwError(() => new ApiError('network')))
      .mockReturnValueOnce(of([first]));
    actions$ = requests;

    const emitted = collect();
    requests.next(EarthquakesPageActions.opened());
    requests.next(EarthquakesPageActions.retryClicked());

    expect(emitted.map((action) => action.type)).toEqual([
      EarthquakesApiActions.loadFailed.type,
      EarthquakesApiActions.loadSucceeded.type,
    ]);
  });

  it('should discard the response of a request that was superseded', () => {
    const requests = new Subject<Action>();
    const slow = new Subject<Earthquake[]>();
    const fast = new Subject<Earthquake[]>();
    getEarthquakes.mockReturnValueOnce(slow).mockReturnValueOnce(fast);
    actions$ = requests;

    const emitted = collect();
    requests.next(EarthquakesPageActions.opened());
    requests.next(EarthquakesPageActions.retryClicked());
    slow.next([first]);
    fast.next([second]);

    expect(emitted).toEqual([EarthquakesApiActions.loadSucceeded({ earthquakes: [second] })]);
  });
});
