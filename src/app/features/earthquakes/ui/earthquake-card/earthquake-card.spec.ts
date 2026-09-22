import { TestBed } from '@angular/core/testing';

import { createEarthquake } from '@features/earthquakes/data-access/testing/earthquake.factory';

import { EarthquakeCard } from './earthquake-card';

const NOW = 1_758_000_000_000;

describe('EarthquakeCard', () => {
  function render(overrides: Partial<ReturnType<typeof createEarthquake>> = {}) {
    const fixture = TestBed.createComponent(EarthquakeCard);
    fixture.componentRef.setInput('earthquake', createEarthquake(overrides));
    fixture.componentRef.setInput('now', NOW);
    fixture.detectChanges();
    return fixture;
  }

  it('should show the magnitude, place and relative time', () => {
    const host = render({
      magnitude: 5.2,
      place: '10 km N of Somewhere',
      time: NOW - 5 * 60_000,
    }).nativeElement as HTMLElement;

    expect(host.querySelector('.card__magnitude')?.textContent.trim()).toBe('5.2');
    expect(host.textContent).toContain('10 km N of Somewhere');
    expect(host.textContent).toContain('5m ago');
  });

  it('should show how many people felt it, only when known', () => {
    const withFelt = render({ felt: 42 }).nativeElement as HTMLElement;
    const withoutFelt = render({ felt: null }).nativeElement as HTMLElement;

    expect(withFelt.textContent).toContain('felt by 42');
    expect(withoutFelt.textContent).not.toContain('felt by');
  });

  it('should show a tsunami warning, only when flagged', () => {
    const withTsunami = render({ tsunami: true }).nativeElement as HTMLElement;
    const withoutTsunami = render({ tsunami: false }).nativeElement as HTMLElement;

    expect(withTsunami.textContent).toContain('tsunami alert');
    expect(withoutTsunami.textContent).not.toContain('tsunami alert');
  });

  it('should mark itself as pressed when selected', () => {
    const selected = render().nativeElement as HTMLElement;
    const fixture = render();
    fixture.componentRef.setInput('selected', true);
    fixture.detectChanges();
    const article = (fixture.nativeElement as HTMLElement).querySelector('article');

    expect(selected.querySelector('article')?.getAttribute('aria-pressed')).toBe('false');
    expect(article?.getAttribute('aria-pressed')).toBe('true');
  });

  it('should emit the earthquake id on click', () => {
    const fixture = render({ id: 'us0001' });
    const emitted: string[] = [];
    fixture.componentInstance.selectEarthquake.subscribe((id) => emitted.push(id));

    (fixture.nativeElement as HTMLElement)
      .querySelector('article')
      ?.dispatchEvent(new Event('click'));

    expect(emitted).toEqual(['us0001']);
  });

  it('should emit the id on mouseenter and null on mouseleave', () => {
    const fixture = render({ id: 'us0002' });
    const emitted: (string | null)[] = [];
    fixture.componentInstance.hoverEarthquake.subscribe((id) => emitted.push(id));
    const article = (fixture.nativeElement as HTMLElement).querySelector('article');

    article?.dispatchEvent(new Event('mouseenter'));
    article?.dispatchEvent(new Event('mouseleave'));

    expect(emitted).toEqual(['us0002', null]);
  });
});
