import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { App } from './app';

describe('App', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter([])],
    });
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);

    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render the application shell', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;

    expect(host.querySelector('sv-shell')).not.toBeNull();
  });
});
