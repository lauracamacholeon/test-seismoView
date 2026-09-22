import { Component, inject } from '@angular/core';
import { Store } from '@ngrx/store';

import { EarthquakesPageActions } from '@features/earthquakes/data-access/state/earthquakes.actions';
import {
  selectError,
  selectStatus,
  selectTotalCount,
} from '@features/earthquakes/data-access/state/earthquakes.selectors';
import { EarthquakeMap } from '@features/earthquakes/map/earthquake-map/earthquake-map';

@Component({
  selector: 'sv-earthquake-viewer',
  imports: [EarthquakeMap],
  templateUrl: './earthquake-viewer.html',
  styleUrl: './earthquake-viewer.scss',
})
export class EarthquakeViewer {
  private readonly store = inject(Store);

  protected readonly status = this.store.selectSignal(selectStatus);
  protected readonly error = this.store.selectSignal(selectError);
  protected readonly total = this.store.selectSignal(selectTotalCount);

  constructor() {
    this.store.dispatch(EarthquakesPageActions.opened());
  }
}
