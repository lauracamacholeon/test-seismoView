import { HttpErrorResponse } from '@angular/common/http';

import { ApiError, toApiError } from './api-error';

describe('toApiError', () => {
  it.each([
    { status: 0, kind: 'network' },
    { status: 400, kind: 'client' },
    { status: 404, kind: 'client' },
    { status: 429, kind: 'client' },
    { status: 500, kind: 'server' },
    { status: 503, kind: 'server' },
    { status: 200, kind: 'unknown' },
  ])('should classify HTTP status $status as $kind', ({ status, kind }) => {
    const error = toApiError(new HttpErrorResponse({ status }));

    expect(error.kind).toBe(kind);
  });

  it('should keep the HTTP status and the original error as cause', () => {
    const original = new HttpErrorResponse({ status: 502 });

    const error = toApiError(original);

    expect(error.status).toBe(502);
    expect(error.cause).toBe(original);
  });

  it('should classify non-HTTP failures as unknown without a status', () => {
    const original = new TypeError('unexpected');

    const error = toApiError(original);

    expect(error.kind).toBe('unknown');
    expect(error.status).toBeNull();
    expect(error.cause).toBe(original);
  });

  it('should return an existing ApiError unchanged', () => {
    const existing = new ApiError('server', 500);

    expect(toApiError(existing)).toBe(existing);
  });

  it('should expose a user-facing message that hides technical details', () => {
    const error = toApiError(new HttpErrorResponse({ status: 500, statusText: 'Internal' }));

    expect(error.message).toBe('The service is temporarily unavailable. Please try again later.');
    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe('ApiError');
  });
});
