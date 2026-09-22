import {
  EARTHQUAKES_LAYER_ID,
  EARTHQUAKES_SOURCE_ID,
  earthquakesCircleLayer,
} from './earthquakes-layers';

describe('earthquakesCircleLayer', () => {
  it('should be a circle layer reading from the earthquakes source', () => {
    expect(earthquakesCircleLayer).toMatchObject({
      id: EARTHQUAKES_LAYER_ID,
      type: 'circle',
      source: EARTHQUAKES_SOURCE_ID,
    });
  });

  it('should drive circle radius and color from the magnitude property', () => {
    const { paint } = earthquakesCircleLayer;

    expect(paint?.['circle-radius']).toEqual(
      expect.arrayContaining(['interpolate', ['linear'], ['get', 'magnitude']]),
    );
    expect(paint?.['circle-color']).toEqual(
      expect.arrayContaining(['interpolate', ['linear'], ['get', 'magnitude']]),
    );
  });

  it('should grow the radius stops monotonically with magnitude', () => {
    const stops = (earthquakesCircleLayer.paint?.['circle-radius'] as unknown[]).slice(3);
    const magnitudes = stops.filter((_value, index) => index % 2 === 0) as number[];
    const radii = stops.filter((_value, index) => index % 2 === 1) as number[];

    for (let i = 1; i < magnitudes.length; i += 1) {
      expect(magnitudes[i]).toBeGreaterThan(magnitudes[i - 1]);
      expect(radii[i]).toBeGreaterThan(radii[i - 1]);
    }
  });

  it('should give the selected state the thickest, whitest stroke', () => {
    const strokeWidth = earthquakesCircleLayer.paint?.['circle-stroke-width'];
    const strokeColor = earthquakesCircleLayer.paint?.['circle-stroke-color'];

    expect(strokeWidth).toEqual(
      expect.arrayContaining([['boolean', ['feature-state', 'selected'], false]]),
    );
    expect(strokeColor).toEqual(
      expect.arrayContaining([['boolean', ['feature-state', 'selected'], false]]),
    );
  });
});
