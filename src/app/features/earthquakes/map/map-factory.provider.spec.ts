import { TestBed } from '@angular/core/testing';

import { MAP_FACTORY } from './map-adapter.token';
import { mapFactoryProvider } from './map-factory.provider';

const fakeMapInstance = { fake: true };
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- the param documents the spy's call signature
const mapConstructorSpy = vi.fn((_options: unknown): unknown => fakeMapInstance);

vi.mock('maplibre-gl', () => ({
  Map: function fakeMap(this: unknown, options: unknown) {
    return mapConstructorSpy(options);
  },
  setWorkerUrl: vi.fn(),
}));

describe('mapFactoryProvider', () => {
  beforeEach(() => {
    mapConstructorSpy.mockClear();
    TestBed.configureTestingModule({ providers: [mapFactoryProvider] });
  });

  it('should register a factory under the MAP_FACTORY token', () => {
    const factory = TestBed.inject(MAP_FACTORY);

    expect(typeof factory).toBe('function');
  });

  it('should construct a MapLibre map with the options it receives', () => {
    const factory = TestBed.inject(MAP_FACTORY);
    const options = { container: 'map', style: '/style.json' };

    const map = factory(options);

    expect(mapConstructorSpy).toHaveBeenCalledWith(options);
    expect(map).toBe(fakeMapInstance);
  });
});
