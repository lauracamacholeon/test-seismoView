import { Component, effect, inject, viewChild, type ElementRef } from '@angular/core';
import { Store } from '@ngrx/store';

import {
  EarthquakesPageActions,
  type SelectionSource,
} from '@features/earthquakes/data-access/state/earthquakes.actions';
import {
  selectError,
  selectFilteredEarthquakes,
  selectHoveredId,
  selectSelection,
  selectStatus,
} from '@features/earthquakes/data-access/state/earthquakes.selectors';
import { EarthquakeCard } from '@features/earthquakes/ui/earthquake-card/earthquake-card';

@Component({
  selector: 'sv-earthquake-list',
  imports: [EarthquakeCard],
  templateUrl: './earthquake-list.html',
  styleUrl: './earthquake-list.scss',
})
export class EarthquakeList {
  private readonly store = inject(Store);
  private readonly container = viewChild.required<ElementRef<HTMLElement>>('container');

  protected readonly status = this.store.selectSignal(selectStatus);
  protected readonly error = this.store.selectSignal(selectError);
  protected readonly earthquakes = this.store.selectSignal(selectFilteredEarthquakes);
  protected readonly selection = this.store.selectSignal(selectSelection);
  protected readonly hoveredId = this.store.selectSignal(selectHoveredId);

  constructor() {
    // A selection that came from the map should bring its card into view;
    // one that came from this list is already visible, so nothing to do.
    effect(() => {
      const selection = this.selection();
      if (selection?.source === ('map' satisfies SelectionSource)) {
        this.scrollCardIntoView(selection.id);
      }
    });
  }

  protected onSelect(id: string): void {
    this.store.dispatch(EarthquakesPageActions.earthquakeSelected({ id, source: 'list' }));
  }

  protected onHover(id: string | null): void {
    this.store.dispatch(EarthquakesPageActions.earthquakeHovered({ id }));
  }

  private scrollCardIntoView(id: string): void {
    // Building the id lookup by attribute comparison, rather than a CSS
    // selector built from the id, sidesteps CSS.escape(): a good idea
    // anyway since USGS ids are not guaranteed CSS-selector-safe, and
    // CSS.escape isn't available in every test environment.
    const elementId = `earthquake-${id}`;
    const card = Array.from(
      this.container().nativeElement.querySelectorAll<HTMLElement>('[id]'),
    ).find((element) => element.id === elementId);
    card?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }
}
