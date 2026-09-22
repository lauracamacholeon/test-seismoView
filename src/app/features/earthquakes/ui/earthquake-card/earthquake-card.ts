import { Component, computed, input, output } from '@angular/core';

import { type Earthquake } from '@features/earthquakes/data-access/models/earthquake.model';
import { formatRelativeTime } from '@shared/utils/format-relative-time';

/**
 * Purely presentational: renders one earthquake and reports interaction
 * through outputs. It never touches the store, so it is reusable and easy
 * to test without any NgRx setup.
 */
@Component({
  selector: 'sv-earthquake-card',
  templateUrl: './earthquake-card.html',
  styleUrl: './earthquake-card.scss',
})
export class EarthquakeCard {
  readonly earthquake = input.required<Earthquake>();
  readonly selected = input(false);
  /** Wall-clock time to compare against; passed in so this stays testable. */
  readonly now = input(Date.now());

  readonly selectEarthquake = output<string>();
  readonly hoverEarthquake = output<string | null>();

  protected readonly relativeTime = computed(() =>
    formatRelativeTime(this.earthquake().time, this.now()),
  );

  protected onSelect(): void {
    this.selectEarthquake.emit(this.earthquake().id);
  }

  protected onMouseEnter(): void {
    this.hoverEarthquake.emit(this.earthquake().id);
  }

  protected onMouseLeave(): void {
    this.hoverEarthquake.emit(null);
  }
}
