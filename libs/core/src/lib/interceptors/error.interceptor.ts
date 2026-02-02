/**
 * @flyfront/core - HTTP Error Interceptor
 * @license Apache-2.0
 */

import { Injectable, inject } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpErrorResponse,
  HttpInterceptorFn,
  HttpHandlerFn,
} from '@angular/common/http';
import { Observable, throwError, timer } from 'rxjs';
import { catchError, retry } from 'rxjs/operators';
import { LoggerService } from '../services/logger.service';
import { ConfigService } from '../services/config.service';

/**
 * Error codes that should trigger a retry
 */
const RETRYABLE_STATUS_CODES = [408, 429, 500, 502, 503, 504];

/**
 * Maximum number of retry attempts
 */
const MAX_RETRIES = 3;

/**
 * Base delay for exponential backoff (ms)
 */
const RETRY_DELAY = 1000;

/**
 * HTTP Error Interceptor (class-based)
 *
 * Provides centralized error handling for HTTP requests including:
 * - Logging errors
 * - Retry logic with exponential backoff
 * - Error transformation
 *
 * @deprecated Use httpErrorInterceptor function instead
 */
@Injectable()
export class HttpErrorInterceptor implements HttpInterceptor {
  private readonly logger = inject(LoggerService);
  private readonly config = inject(ConfigService);

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    return next.handle(req).pipe(
      retry({
        count: MAX_RETRIES,
        delay: (error, retryCount) => this.shouldRetry(error, retryCount),
      }),
      catchError((error: HttpErrorResponse) => this.handleError(error, req))
    );
  }

  private shouldRetry(error: unknown, retryCount: number): Observable<number> {
    if (
      error instanceof HttpErrorResponse &&
      RETRYABLE_STATUS_CODES.includes(error.status) &&
      retryCount <= MAX_RETRIES
    ) {
      const delay = RETRY_DELAY * Math.pow(2, retryCount - 1);
      this.logger.warn(`Retrying request (attempt ${retryCount}/${MAX_RETRIES})`, {
        status: error.status,
        delay,
      });
      return timer(delay);
    }
    return throwError(() => error);
  }

  private handleError(error: HttpErrorResponse, req: HttpRequest<unknown>): Observable<never> {
    const errorInfo = this.extractErrorInfo(error);

    this.logger.error('HTTP request failed', error, {
      url: req.url,
      method: req.method,
      ...errorInfo,
    });

    return throwError(() => ({
      status: error.status,
      statusText: error.statusText,
      message: errorInfo.message,
      url: req.url,
      error: error.error,
    }));
  }

  private extractErrorInfo(error: HttpErrorResponse): { message: string; code?: string } {
    // Handle different error response formats
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      return { message: error.error.message };
    }

    if (error.error && typeof error.error === 'object') {
      // Server error with body
      const body = error.error as Record<string, unknown>;
      return {
        message: (body['message'] as string) || (body['error'] as string) || error.message,
        code: body['code'] as string,
      };
    }

    // Default error message based on status
    return { message: this.getDefaultErrorMessage(error.status) };
  }

  private getDefaultErrorMessage(status: number): string {
    const messages: Record<number, string> = {
      0: 'Unable to connect to the server. Please check your internet connection.',
      400: 'The request was invalid. Please check your input.',
      401: 'You are not authenticated. Please log in.',
      403: 'You do not have permission to perform this action.',
      404: 'The requested resource was not found.',
      408: 'The request timed out. Please try again.',
      409: 'There was a conflict with the current state.',
      422: 'The request could not be processed. Please check your input.',
      429: 'Too many requests. Please wait before trying again.',
      500: 'An internal server error occurred. Please try again later.',
      502: 'The server is temporarily unavailable. Please try again later.',
      503: 'The service is temporarily unavailable. Please try again later.',
      504: 'The request timed out. Please try again.',
    };

    return messages[status] || `An unexpected error occurred (${status}).`;
  }
}

/**
 * Functional HTTP error interceptor
 *
 * @example
 * ```typescript
 * // In app.config.ts
 * export const appConfig: ApplicationConfig = {
 *   providers: [
 *     provideHttpClient(withInterceptors([httpErrorInterceptor])),
 *   ],
 * };
 * ```
 */
export const httpErrorInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
  const logger = inject(LoggerService);

  return next(req).pipe(
    retry({
      count: MAX_RETRIES,
      delay: (error, retryCount) => {
        if (
          error instanceof HttpErrorResponse &&
          RETRYABLE_STATUS_CODES.includes(error.status) &&
          retryCount <= MAX_RETRIES
        ) {
          const delay = RETRY_DELAY * Math.pow(2, retryCount - 1);
          logger.warn(`Retrying request (attempt ${retryCount}/${MAX_RETRIES})`, {
            status: error.status,
            delay,
          });
          return timer(delay);
        }
        return throwError(() => error);
      },
    }),
    catchError((error: HttpErrorResponse) => {
      const errorInfo = extractErrorInfo(error);

      logger.error('HTTP request failed', error, {
        url: req.url,
        method: req.method,
        ...errorInfo,
      });

      return throwError(() => ({
        status: error.status,
        statusText: error.statusText,
        message: errorInfo.message,
        url: req.url,
        error: error.error,
      }));
    })
  );
};

/**
 * Extract error information from HTTP error response
 */
function extractErrorInfo(error: HttpErrorResponse): { message: string; code?: string } {
  if (error.error instanceof ErrorEvent) {
    return { message: error.error.message };
  }

  if (error.error && typeof error.error === 'object') {
    const body = error.error as Record<string, unknown>;
    return {
      message: (body['message'] as string) || (body['error'] as string) || error.message,
      code: body['code'] as string,
    };
  }

  const messages: Record<number, string> = {
    0: 'Unable to connect to the server.',
    400: 'Invalid request.',
    401: 'Authentication required.',
    403: 'Access denied.',
    404: 'Resource not found.',
    500: 'Server error.',
  };

  return { message: messages[error.status] || `Error (${error.status})` };
}

/**
 * Provider for the error interceptor (class-based)
 */
export function provideHttpErrorInterceptor() {
  return {
    provide: 'HTTP_INTERCEPTORS',
    useClass: HttpErrorInterceptor,
    multi: true,
  };
}
