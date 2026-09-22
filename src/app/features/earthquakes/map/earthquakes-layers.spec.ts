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

  it('should grow the base radius from the magnitude property, before any hover boost', () => {
    const radius = earthquakesCircleLayer.paint?.['circle-radius'] as unknown[];
    // radius = ['case', ['boolean', ['feature-state', 'hovered'], false], [...boost], baseRadius]
    const baseRadius = radius[3] as unknown[];

    expect(baseRadius).toEqual(
      expect.arrayContaining(['interpolate', ['linear'], ['get', 'magnitude']]),
    );
  });

  it('should drive circle color from the magnitude property', () => {
    const { paint } = earthquakesCircleLayer;

    expect(paint?.['circle-color']).toEqual(
      expect.arrayContaining(['interpolate', ['linear'], ['get', 'magnitude']]),
    );
  });

  it('should boost the radius when hovered', () => {
    const radius = earthquakesCircleLayer.paint?.['circle-radius'] as unknown[];

    expect(radius[0]).toBe('case');
    expect(radius[1]).toEqual(['boolean', ['feature-state', 'hovered'], false]);
    expect(radius[2]).toEqual(expect.arrayContaining(['*']));
  });

  it('should grow the base radius stops monotonically with magnitude', () => {
    const radius = earthquakesCircleLayer.paint?.['circle-radius'] as unknown[];
    const baseRadius = radius[3] as unknown[];
    const stops = baseRadius.slice(3);
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

  it('should give the hovered state a distinct brand-colored stroke, thicker than the default', () => {
    const strokeWidth = earthquakesCircleLayer.paint?.['circle-stroke-width'] as unknown[];
    const strokeColor = earthquakesCircleLayer.paint?.['circle-stroke-color'] as unknown[];

    // Both are ['case', selectedCond, selectedValue, hoveredCond, hoveredValue, default]
    expect(strokeWidth[3]).toEqual(['boolean', ['feature-state', 'hovered'], false]);
    expect(strokeColor[3]).toEqual(['boolean', ['feature-state', 'hovered'], false]);
    expect(strokeColor[4]).not.toBe(strokeColor[5]);
    expect(strokeWidth[4]).toBeGreaterThan(strokeWidth[5] as number);
  });
});
