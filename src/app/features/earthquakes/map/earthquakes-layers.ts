import {
  type CircleLayerSpecification,
  type DataDrivenPropertyValueSpecification,
} from 'maplibre-gl';

/** Id of the GeoJSON source the earthquake points are added to. */
export const EARTHQUAKES_SOURCE_ID = 'earthquakes';

/** Id of the circle layer that renders each earthquake as a point. */
export const EARTHQUAKES_LAYER_ID = 'earthquakes-circles';

/** The app's brand color, used here to make the hover state unmistakable. */
const BRAND_COLOR = '#0161A2';

/**
 * Radius grows with magnitude on a fixed scale, so a M7 reads clearly
 * bigger than a M4.5 without magnitude-independent circles all looking the
 * same size. `interpolate`/`linear` runs on the GPU: no JS recomputation
 * when the map is filtered or panned.
 */
const BASE_CIRCLE_RADIUS: DataDrivenPropertyValueSpecification<number> = [
  'interpolate',
  ['linear'],
  ['get', 'magnitude'],
  4.5,
  5,
  6,
  10,
  7,
  16,
  9,
  26,
];

/**
 * The hovered point also grows by a third, on top of its magnitude-based
 * size: a color and stroke change alone can be subtle on small, tightly
 * packed points, so the size change makes it unambiguous which one is
 * under the cursor even at a glance.
 */
const CIRCLE_RADIUS: DataDrivenPropertyValueSpecification<number> = [
  'case',
  ['boolean', ['feature-state', 'hovered'], false],
  ['*', BASE_CIRCLE_RADIUS, 1.35],
  BASE_CIRCLE_RADIUS,
];

/**
 * Color encodes severity, from a calm green at the reporting threshold to a
 * strong red for major earthquakes. Matches the traffic-light intuition
 * most people already have for "how bad is this".
 */
const CIRCLE_COLOR: DataDrivenPropertyValueSpecification<string> = [
  'interpolate',
  ['linear'],
  ['get', 'magnitude'],
  4.5,
  '#639922',
  5.5,
  '#EF9F27',
  6.5,
  '#D85A30',
  7.5,
  '#A32D2D',
];

/**
 * The hover and selected states are set via setFeatureState (feature-state
 * expressions), not by rewriting properties, so a hover never triggers a
 * setData call. Selected earthquakes get a white ring; hovered ones get a
 * thick ring in the brand color plus the size bump above, so the hover
 * state is unmistakable even against the busiest cluster of points.
 */
export const earthquakesCircleLayer: CircleLayerSpecification = {
  id: EARTHQUAKES_LAYER_ID,
  type: 'circle',
  source: EARTHQUAKES_SOURCE_ID,
  paint: {
    'circle-radius': CIRCLE_RADIUS,
    'circle-color': CIRCLE_COLOR,
    'circle-opacity': 0.85,
    'circle-stroke-width': [
      'case',
      ['boolean', ['feature-state', 'selected'], false],
      3,
      ['boolean', ['feature-state', 'hovered'], false],
      4,
      1,
    ],
    'circle-stroke-color': [
      'case',
      ['boolean', ['feature-state', 'selected'], false],
      '#FFFFFF',
      ['boolean', ['feature-state', 'hovered'], false],
      BRAND_COLOR,
      '#2C2C2A',
    ],
  },
};
