import {
  afterNextRender,
  Component,
  DestroyRef,
  effect,
  inject,
  signal,
  viewChild,
  type ElementRef,
} from '@angular/core';
import { Store } from '@ngrx/store';

import { APP_CONFIG } from '@core/config/app-config';

import { toEarthquakesGeoJson } from '../earthquakes-geojson';
import {
  earthquakesCircleLayer,
  EARTHQUAKES_LAYER_ID,
  EARTHQUAKES_SOURCE_ID,
} from '../earthquakes-layers';
import { MAP_FACTORY } from '../map-adapter.token';
import { type MapHandle } from '../map-handle';
import { EarthquakesPageActions } from '@features/earthquakes/data-access/state/earthquakes.actions';
import {
  selectFilteredEarthquakes,
  selectSelection,
} from '@features/earthquakes/data-access/state/earthquakes.selectors';

/**
 * Renders the loaded, filtered earthquakes as a MapLibre point layer.
 * Selection and hover are pure feature-state changes (no re-fetching, no
 * setData), so they stay smooth even with hundreds of points on screen.
 */
@Component({
  imports: [],
  selector: 'sv-earthquake-map',
  styleUrl: './earthquake-map.scss',
  templateUrl: './earthquake-map.html',
})
export class EarthquakeMap {
  private readonly store = inject(Store);
  private readonly config = inject(APP_CONFIG);
  private readonly createMap = inject(MAP_FACTORY);

  private readonly destroyRef = inject(DestroyRef);
  private readonly container = viewChild.required<ElementRef<HTMLElement>>('container');
  private readonly earthquakes = this.store.selectSignal(selectFilteredEarthquakes);
  private readonly selection = this.store.selectSignal(selectSelection);

  private map: MapHandle | null = null;
  private readonly mapReady = signal(false);
  private hoveredId: string | null = null;
  private selectedId: string | null = null;

  constructor() {
    afterNextRender(() => {
      this.createMapInstance();
    });
    effect(() => {
      this.syncData();
    });
    effect(() => {
      this.syncSelection();
    });
    this.destroyRef.onDestroy(() => {
      this.map?.remove();
    });
  }

  private createMapInstance(): void {
    // MAP_FACTORY returns the real MapLibre Map; only the slice of its API
    // this component uses is exposed through MapHandle (see map-handle.ts).
    const map = this.createMap({
      container: this.container().nativeElement,
      style: this.config.mapStyleUrl,
      center: [...this.config.map.initialCenter],
      zoom: this.config.map.initialZoom,
    }) as unknown as MapHandle;

    map.on('load', () => {
      map.addSource(EARTHQUAKES_SOURCE_ID, {
        type: 'geojson',
        data: toEarthquakesGeoJson(this.earthquakes()),
        promoteId: 'id',
      });
      map.addLayer(earthquakesCircleLayer);
      map.on('click', EARTHQUAKES_LAYER_ID, (event) => {
        this.onClick(event);
      });
      map.on('mousemove', EARTHQUAKES_LAYER_ID, (event) => {
        this.onMouseMove(event);
      });
      map.on('mouseleave', EARTHQUAKES_LAYER_ID, () => {
        this.onMouseLeave();
      });
      // The map's viewport is computed from the container's size at the
      // moment `load` fires. If Angular's layout hadn't fully settled when
      // the map was constructed, MapLibre may have measured a 0-size
      // container and concluded no tiles are visible, so it never requests
      // any: only the style and its metadata load, and the canvas shows
      // just the background color. Forcing a resize here, once layout has
      // had a chance to settle, makes it recompute against the real size.
      map.resize();
      this.mapReady.set(true);
    });

    // MapLibre swallows most internal failures (a bad source, a missing
    // sprite, a worker that never came up) unless something listens for
    // this event, so a real problem would otherwise look identical to "it
    // just hasn't loaded yet".
    map.on('error', (event) => {
      console.error('MapLibre error', event.error);
    });

    // TEMPORARY diagnostic logging, to see exactly how far map init gets.
    const container = this.container().nativeElement;
    console.warn('[map-debug] container size at creation', {
      width: container.clientWidth,
      height: container.clientHeight,
    });
    const debugOn = map as unknown as {
      on(event: string, handler: (event?: unknown) => void): void;
    };
    debugOn.on('styledata', () => {
      console.warn('[map-debug] styledata');
    });
    debugOn.on('sourcedata', (event) => {
      console.warn('[map-debug] sourcedata', event);
    });
    debugOn.on('idle', () => {
      console.warn('[map-debug] idle');
    });
    debugOn.on('render', () => {
      console.warn('[map-debug] render');
    });

    this.map = map;
    this.observeContainerResize(map);
  }

  /**
   * Keeps the map's viewport in sync with its container's actual size,
   * beyond the one-time resize() above: a sidebar collapsing, a window
   * resize, or any later layout change would otherwise leave the map
   * rendering at a stale size.
   */
  private observeContainerResize(map: MapHandle): void {
    if (typeof ResizeObserver === 'undefined') {
      return;
    }

    const observer = new ResizeObserver(() => {
      map.resize();
    });
    observer.observe(this.container().nativeElement);
    this.destroyRef.onDestroy(() => {
      observer.disconnect();
    });
  }

  /** Pushes the currently filtered earthquakes into the map's GeoJSON source. */
  private syncData(): void {
    const earthquakes = this.earthquakes();
    if (!this.mapReady()) {
      return;
    }

    this.map?.getSource(EARTHQUAKES_SOURCE_ID)?.setData(toEarthquakesGeoJson(earthquakes));
  }

  /**
   * Mirrors the store's selection onto feature-state, and flies to the
   * selected point only when the selection came from the list, since a map
   * click already centers the point the user just clicked.
   */
  private syncSelection(): void {
    const selection = this.selection();
    if (!this.mapReady() || !this.map) {
      return;
    }

    if (this.selectedId !== null && this.selectedId !== selection?.id) {
      this.map.setFeatureState(
        { source: EARTHQUAKES_SOURCE_ID, id: this.selectedId },
        { selected: false },
      );
    }

    this.selectedId = selection?.id ?? null;
    if (this.selectedId === null) {
      return;
    }

    this.map.setFeatureState(
      { source: EARTHQUAKES_SOURCE_ID, id: this.selectedId },
      { selected: true },
    );

    if (selection?.source === 'list') {
      const target = this.earthquakes().find((earthquake) => earthquake.id === this.selectedId);
      if (target) {
        this.map.flyTo({
          center: [target.longitude, target.latitude],
          zoom: this.config.map.focusZoom,
        });
      }
    }
  }

  private onClick(event: { features?: readonly { properties: Record<string, unknown> }[] }): void {
    const id = event.features?.[0]?.properties['id'];
    if (typeof id === 'string') {
      this.store.dispatch(EarthquakesPageActions.earthquakeSelected({ id, source: 'map' }));
    }
  }

  private onMouseMove(event: {
    features?: readonly { properties: Record<string, unknown> }[];
  }): void {
    const id = event.features?.[0]?.properties['id'];
    if (typeof id !== 'string' || id === this.hoveredId) {
      return;
    }

    this.clearHover();
    this.hoveredId = id;
    this.map?.setFeatureState({ source: EARTHQUAKES_SOURCE_ID, id }, { hovered: true });
    this.store.dispatch(EarthquakesPageActions.earthquakeHovered({ id }));
  }

  private onMouseLeave(): void {
    this.clearHover();
    this.store.dispatch(EarthquakesPageActions.earthquakeHovered({ id: null }));
  }

  private clearHover(): void {
    if (this.hoveredId !== null) {
      this.map?.setFeatureState(
        { source: EARTHQUAKES_SOURCE_ID, id: this.hoveredId },
        { hovered: false },
      );
      this.hoveredId = null;
    }
  }
}
