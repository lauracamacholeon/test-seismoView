import { type Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadChildren: () =>
      import('@features/earthquakes/earthquakes.routes').then((m) => m.EARTHQUAKES_ROUTES),
  },
  { path: '**', redirectTo: '' },
];
