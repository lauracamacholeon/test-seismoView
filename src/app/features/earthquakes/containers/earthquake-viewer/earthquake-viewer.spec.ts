import { TestBed } from '@angular/core/testing';

import { EarthquakeViewer } from './earthquake-viewer';

describe('EarthquakeViewer', () => {
  let host: HTMLElement;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [EarthquakeViewer] });

    const fixture = TestBed.createComponent(EarthquakeViewer);
    fixture.detectChanges();
    host = fixture.nativeElement as HTMLElement;
  });

  it('should render a labelled sidebar for filters and list', () => {
    const sidebar = host.querySelector('aside');

    expect(sidebar?.getAttribute('aria-label')).toBe('Earthquake filters and list');
  });

  it('should render a labelled region for the map', () => {
    const map = host.querySelector('section');

    expect(map?.getAttribute('aria-label')).toBe('Earthquake map');
  });
});
