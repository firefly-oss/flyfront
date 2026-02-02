/**
 * @flyfront/core - Auth Token Interceptor
 * @license Apache-2.0
 */

import { inject } from '@angular/core';
import {
  HttpRequest,
  HttpHandlerFn,
  HttpEvent,
  HttpInterceptorFn,
} from '@angular/common/http';
import { Observable, from, switchMap, catchError, throwError } from 'rxjs';

/**
 * Token provider interface for flexibility
 */
export interface TokenProvider {
  getAccessToken(): string | null;
  refreshToken?(): Observable<string>;
  isTokenExpired?(): boolean;
}

/**
 * Auth interceptor configuration
 */
export interface AuthInterceptorConfig {
  /** Header name for the token (default: 'Authorization') */
  headerName?: string;
  /** Token prefix (default: 'Bearer') */
  tokenPrefix?: string;
  /** URLs to exclude from token injection */
  excludeUrls?: string[];
  /** Whether to attempt token refresh on 401 */
  refreshOnUnauthorized?: boolean;
}

/** Injection token for TokenProvider */
import { InjectionToken } from '@angular/core';

export const TOKEN_PROVIDER = new InjectionToken<TokenProvider>('TokenProvider');
export const AUTH_INTERCEPTOR_CONFIG = new InjectionToken<AuthInterceptorConfig>(
  'AuthInterceptorConfig'
);

/**
 * Create an auth token interceptor
 *
 * @example
 * ```typescript
 * // In app.config.ts
 * export const appConfig: ApplicationConfig = {
 *   providers: [
 *     provideHttpClient(
 *       withInterceptors([
 *         authTokenInterceptor({
 *           excludeUrls: ['/api/auth/login', '/api/auth/refresh'],
 *           refreshOnUnauthorized: true,
 *         })
 *       ])
 *     ),
 *     { provide: TOKEN_PROVIDER, useExisting: TokenService },
 *   ],
 * };
 * ```
 */
export function authTokenInterceptor(config: AuthInterceptorConfig = {}): HttpInterceptorFn {
  const {
    headerName = 'Authorization',
    tokenPrefix = 'Bearer',
    excludeUrls = [],
    refreshOnUnauthorized = false,
  } = config;

  return (req: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> => {
    // Check if URL should be excluded
    const shouldExclude = excludeUrls.some(
      (url) => req.url.includes(url) || req.url.endsWith(url)
    );

    if (shouldExclude) {
      return next(req);
    }

    // Try to get token provider
    let tokenProvider: TokenProvider | null = null;
    try {
      tokenProvider = inject(TOKEN_PROVIDER, { optional: true });
    } catch {
      // Provider not available
    }

    if (!tokenProvider) {
      return next(req);
    }

    const token = tokenProvider.getAccessToken();

    if (!token) {
      return next(req);
    }

    // Check if token is expired and refresh is available
    if (refreshOnUnauthorized && tokenProvider.isTokenExpired?.() && tokenProvider.refreshToken) {
      return tokenProvider.refreshToken().pipe(
        switchMap((newToken) => {
          const authReq = addTokenToRequest(req, newToken, headerName, tokenPrefix);
          return next(authReq);
        }),
        catchError((error) => {
          // Refresh failed, proceed without token
          return next(req);
        })
      );
    }

    // Add token to request
    const authReq = addTokenToRequest(req, token, headerName, tokenPrefix);
    return next(authReq);
  };
}

/**
 * Add token to request headers
 */
function addTokenToRequest(
  req: HttpRequest<unknown>,
  token: string,
  headerName: string,
  tokenPrefix: string
): HttpRequest<unknown> {
  return req.clone({
    setHeaders: {
      [headerName]: tokenPrefix ? `${tokenPrefix} ${token}` : token,
    },
  });
}

/**
 * Simple auth interceptor that just adds the token
 * Use this when you don't need refresh logic
 */
export const simpleAuthInterceptor: HttpInterceptorFn = (req, next) => {
  let tokenProvider: TokenProvider | null = null;
  try {
    tokenProvider = inject(TOKEN_PROVIDER, { optional: true });
  } catch {
    // Provider not available
  }

  if (!tokenProvider) {
    return next(req);
  }

  const token = tokenProvider.getAccessToken();

  if (!token) {
    return next(req);
  }

  const authReq = req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`,
    },
  });

  return next(authReq);
};
