import { TestBed } from '@angular/core/testing';

import {
  MAP_FACTORY,
  POPUP_FACTORY,
  type MapFactory,
  type PopupFactory,
} from './map-adapter.token';

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

describe('POPUP_FACTORY', () => {
  it('should throw by default, since the real implementation is provided by the route', () => {
    const factory = TestBed.inject(POPUP_FACTORY);

    expect(() => factory()).toThrow();
  });

  it('should be overridable with a fake factory for tests', () => {
    const fakePopup = { fake: true };
    const fake: PopupFactory = () => fakePopup as never;
    TestBed.configureTestingModule({ providers: [{ provide: POPUP_FACTORY, useValue: fake }] });

    const factory = TestBed.inject(POPUP_FACTORY);

    expect(factory()).toBe(fakePopup);
  });
});
