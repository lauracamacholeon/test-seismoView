import {
  type CircleLayerSpecification,
  type DataDrivenPropertyValueSpecification,
} from 'maplibre-gl';

/** Id of the GeoJSON source the earthquake points are added to. */
export const EARTHQUAKES_SOURCE_ID = 'earthquakes';

/** Id of the circle layer that renders each earthquake as a point. */
export const EARTHQUAKES_LAYER_ID = 'earthquakes-circles';

/**
 * Radius grows with magnitude on a fixed scale, so a M7 reads clearly
 * bigger than a M4.5 without magnitude-independent circles all looking the
 * same size. `interpolate`/`linear` runs on the GPU: no JS recomputation
 * when the map is filtered or panned.
 */
const CIRCLE_RADIUS: DataDrivenPropertyValueSpecification<number> = [
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
 * setData call. Selected earthquakes get a visible white ring; hovered ones
 * get a thin highlight so the cursor's target is unambiguous even for
 * small, tightly packed points.
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
      2,
      1,
    ],
    'circle-stroke-color': [
      'case',
      ['boolean', ['feature-state', 'selected'], false],
      '#FFFFFF',
      '#2C2C2A',
    ],
  },
};
