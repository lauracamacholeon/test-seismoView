import { HttpErrorResponse } from '@angular/common/http';

export type ApiErrorKind = 'network' | 'server' | 'client' | 'unknown';

const MESSAGES: Record<ApiErrorKind, string> = {
  network: 'Unable to reach the server. Check your connection and try again.',
  server: 'The service is temporarily unavailable. Please try again later.',
  client: 'The request could not be completed.',
  unknown: 'Something went wrong. Please try again.',
};

/** Application-level HTTP error whose message is safe to show to the user. */
export class ApiError extends Error {
  override readonly name = 'ApiError';

  constructor(
    readonly kind: ApiErrorKind,
    readonly status: number | null = null,
    options?: ErrorOptions,
  ) {
    super(MESSAGES[kind], options);
  }
}

export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) {
    return error;
  }

  if (error instanceof HttpErrorResponse) {
    return new ApiError(kindFromStatus(error.status), error.status, { cause: error });
  }

  return new ApiError('unknown', null, { cause: error });
}

function kindFromStatus(status: number): ApiErrorKind {
  if (status === 0) {
    return 'network';
  }
  if (status >= 500) {
    return 'server';
  }
  if (status >= 400) {
    return 'client';
  }
  return 'unknown';
}
