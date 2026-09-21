import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { ApiError } from '../errors/api-error';
import { httpErrorInterceptor } from './http-error-interceptor';

describe('httpErrorInterceptor', () => {
  let http: HttpClient;
  let controller: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([httpErrorInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpClient);
    controller = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    controller.verify();
  });

  it('should pass successful responses through untouched', () => {
    let body: unknown;

    http.get('/api/data').subscribe((value) => {
      body = value;
    });
    controller.expectOne('/api/data').flush({ ok: true });

    expect(body).toEqual({ ok: true });
  });

  it('should map a failed response to an ApiError', () => {
    let captured: unknown;

    http.get('/api/data').subscribe({
      error: (error: unknown) => {
        captured = error;
      },
    });
    controller
      .expectOne('/api/data')
      .flush('boom', { status: 503, statusText: 'Service Unavailable' });

    expect(captured).toBeInstanceOf(ApiError);
    expect(captured).toMatchObject({ kind: 'server', status: 503 });
  });

  it('should map a connectivity failure to a network ApiError', () => {
    let captured: unknown;

    http.get('/api/data').subscribe({
      error: (error: unknown) => {
        captured = error;
      },
    });
    controller.expectOne('/api/data').error(new ProgressEvent('error'));

    expect(captured).toMatchObject({ kind: 'network', status: 0 });
  });
});
