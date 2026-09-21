import { type Routes } from '@angular/router';

export const EARTHQUAKES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./containers/earthquake-viewer/earthquake-viewer').then((m) => m.EarthquakeViewer),
  },
];
