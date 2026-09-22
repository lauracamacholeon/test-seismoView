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
import { escapeHtml } from '@shared/utils/escape-html';

import { toEarthquakesGeoJson } from '../earthquakes-geojson';
import {
  earthquakesCircleLayer,
  EARTHQUAKES_LAYER_ID,
  EARTHQUAKES_SOURCE_ID,
} from '../earthquakes-layers';
import { MAP_FACTORY, POPUP_FACTORY } from '../map-adapter.token';
import { type MapHandle, type PopupHandle } from '../map-handle';
import { type Earthquake } from '@features/earthquakes/data-access/models/earthquake.model';
import { EarthquakesPageActions } from '@features/earthquakes/data-access/state/earthquakes.actions';
import {
  selectFilteredEarthquakes,
  selectHoveredId,
  selectSelection,
} from '@features/earthquakes/data-access/state/earthquakes.selectors';

/**
 * Renders the loaded, filtered earthquakes as a MapLibre point layer.
 * Selection and hover are pure feature-state changes (no re-fetching, no
 * setData), so they stay smooth even with hundreds of points on screen.
 *
 * Hover and selection are both driven by the store, not by local component
 * state: a mouse move here only dispatches an action, the same as a hover
 * on a list card does. A single effect then mirrors whatever the store
 * says onto feature-state (and the hover tooltip) regardless of which side
 * triggered it. That is what makes both the highlight and the tooltip work
 * the same way whether the hover started on the map or on a list card.
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
  private readonly createPopup = inject(POPUP_FACTORY);

  private readonly destroyRef = inject(DestroyRef);
  private readonly container = viewChild.required<ElementRef<HTMLElement>>('container');
  private readonly earthquakes = this.store.selectSignal(selectFilteredEarthquakes);
  private readonly selection = this.store.selectSignal(selectSelection);
  private readonly hoveredId = this.store.selectSignal(selectHoveredId);

  private map: MapHandle | null = null;
  private popup: PopupHandle | null = null;
  private readonly mapReady = signal(false);
  private selectedId: string | null = null;
  private hoveredFeatureId: string | null = null;

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
    effect(() => {
      this.syncHover();
    });
    this.destroyRef.onDestroy(() => {
      this.popup?.remove();
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

    this.map = map;
    this.popup = this.createPopup();
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

  /**
   * Mirrors the store's hovered id onto feature-state and the tooltip.
   * Whether the hover started on a map point or a list card, this is the
   * only place that ever touches setFeatureState or the popup for it, so
   * both directions stay consistent.
   */
  private syncHover(): void {
    const hoveredId = this.hoveredId();
    if (!this.mapReady() || !this.map) {
      return;
    }

    if (this.hoveredFeatureId !== null && this.hoveredFeatureId !== hoveredId) {
      this.map.setFeatureState(
        { source: EARTHQUAKES_SOURCE_ID, id: this.hoveredFeatureId },
        { hovered: false },
      );
    }

    this.hoveredFeatureId = hoveredId;

    if (hoveredId === null) {
      this.popup?.remove();
      return;
    }

    this.map.setFeatureState({ source: EARTHQUAKES_SOURCE_ID, id: hoveredId }, { hovered: true });

    const earthquake = this.earthquakes().find((candidate) => candidate.id === hoveredId);
    if (earthquake) {
      this.popup
        ?.setLngLat([earthquake.longitude, earthquake.latitude])
        .setHTML(this.popupContent(earthquake))
        .addTo(this.map);
    }
  }

  private popupContent(earthquake: Earthquake): string {
    return `<strong>M${earthquake.magnitude.toFixed(1)}</strong> · ${escapeHtml(earthquake.place)}`;
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
    if (typeof id !== 'string' || id === this.hoveredId()) {
      return;
    }

    this.store.dispatch(EarthquakesPageActions.earthquakeHovered({ id }));
  }

  private onMouseLeave(): void {
    this.store.dispatch(EarthquakesPageActions.earthquakeHovered({ id: null }));
  }
}
