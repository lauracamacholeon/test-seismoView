import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { map, type Observable } from 'rxjs';

import { APP_CONFIG } from '@core/config/app-config';

import { type Earthquake } from '../models/earthquake.model';
import { parseUsgsFeed } from '../mappers/usgs-feed.mapper';

@Service()
export class EarthquakesApi {
  private readonly http = inject(HttpClient);
  private readonly config = inject(APP_CONFIG);

  getEarthquakes(): Observable<Earthquake[]> {
    return this.http.get<unknown>(this.config.earthquakeFeedUrl).pipe(map(parseUsgsFeed));
  }
}
