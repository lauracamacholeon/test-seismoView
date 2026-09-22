import { TestBed } from '@angular/core/testing';

import { MAP_FACTORY, type MapFactory } from './map-adapter.token';

describe('MAP_FACTORY', () => {
  it('should throw by default, since the real implementation is provided by the route', () => {
    const factory = TestBed.inject(MAP_FACTORY);

    expect(() => factory({} as never)).toThrow();
  });

  it('should be overridable with a fake factory for tests', () => {
    const fakeMap = { fake: true };
    const fake: MapFactory = () => fakeMap as never;
    TestBed.configureTestingModule({ providers: [{ provide: MAP_FACTORY, useValue: fake }] });

    const factory = TestBed.inject(MAP_FACTORY);

    expect(factory({} as never)).toBe(fakeMap);
  });
});
