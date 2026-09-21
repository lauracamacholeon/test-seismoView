import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { Shell } from './shell';

describe('Shell', () => {
  let host: HTMLElement;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [Shell],
      providers: [provideRouter([])],
    });

    const fixture = TestBed.createComponent(Shell);
    fixture.detectChanges();
    host = fixture.nativeElement as HTMLElement;
  });

  it('should render the application title as the page heading', () => {
    const heading = host.querySelector('h1');

    expect(heading?.textContent).toContain('SeismoView');
  });

  it('should describe the dataset in the tagline', () => {
    const tagline = host.querySelector('.shell__tagline');

    expect(tagline?.textContent).toContain('last 30 days');
  });

  it('should expose banner and main landmarks', () => {
    expect(host.querySelector('header')).not.toBeNull();
    expect(host.querySelector('main')).not.toBeNull();
  });

  it('should render the router outlet inside the main landmark', () => {
    expect(host.querySelector('main router-outlet')).not.toBeNull();
  });
});
