import { Component, inject } from '@angular/core';
import { Store } from '@ngrx/store';

import { EarthquakesPageActions } from '@features/earthquakes/data-access/state/earthquakes.actions';
import { EarthquakeList } from '@features/earthquakes/ui/earthquake-list/earthquake-list';
import { EarthquakeMap } from '@features/earthquakes/map/earthquake-map/earthquake-map';

@Component({
  selector: 'sv-earthquake-viewer',
  imports: [EarthquakeList, EarthquakeMap],
  templateUrl: './earthquake-viewer.html',
  styleUrl: './earthquake-viewer.scss',
})
export class EarthquakeViewer {
  private readonly store = inject(Store);

  constructor() {
    this.store.dispatch(EarthquakesPageActions.opened());
  }
}
