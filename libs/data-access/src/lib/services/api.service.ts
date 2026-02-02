/**
 * @flyfront/data-access - API Service
 * @license Apache-2.0
 */

import { Injectable, inject, NgZone, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import {
  HttpClient,
  HttpHeaders,
  HttpParams,
  HttpErrorResponse,
  HttpEvent,
  HttpEventType,
} from '@angular/common/http';
import {
  Observable,
  throwError,
  timer,
  Subject,
  BehaviorSubject,
  of,
  EMPTY,
  defer,
  fromEvent,
} from 'rxjs';
import {
  catchError,
  map,
  shareReplay,
  switchMap,
  takeUntil,
  tap,
  retryWhen,
  delay,
  scan,
  distinctUntilChanged,
  startWith,
  finalize,
  filter,
} from 'rxjs/operators';
import { ConfigService } from '@flyfront/core';
import {
  RequestConfig,
  PaginatedResponse,
  PaginationParams,
  QueryParams,
  ApiErrorResponse,
  UploadProgress,
  RetryConfig,
  PollingConfig,
  SSEConfig,
  SSEMessage,
  ReactiveRequestConfig,
} from '../models/data-access.models';

/**
 * Type-safe HTTP client wrapper for API communication
 *
 * @example
 * ```typescript
 * // Inject the service
 * private api = inject(ApiService);
 *
 * // GET request
 * getUsers() {
 *   return this.api.get<User[]>('/users');
 * }
 *
 * // POST request
 * createUser(data: CreateUserDto) {
 *   return this.api.post<User>('/users', data);
 * }
 *
 * // Paginated request
 * getUsers(params: PaginationParams) {
 *   return this.api.getPaginated<User>('/users', params);
 * }
 * ```
 */
/**
 * Default retry configuration
 */
const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  retryDelay: 1000,
  retryStatuses: [408, 429, 500, 502, 503, 504],
  exponentialBackoff: true,
};

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(ConfigService);
  private readonly ngZone = inject(NgZone);
  private readonly platformId = inject(PLATFORM_ID);

  private readonly cache = new Map<string, { data: unknown; expiry: number }>();
  private readonly activePolls = new Map<string, Subject<void>>();
  private readonly activeSSE = new Map<string, EventSource>();

  /**
   * Get the base API URL from configuration
   */
  private get baseUrl(): string {
    return this.config.get('apiBaseUrl') ?? '';
  }

  /**
   * Perform a GET request
   */
  get<T>(endpoint: string, config?: RequestConfig): Observable<T> {
    const url = this.buildUrl(endpoint);
    const options = this.buildOptions(config);

    // Check cache
    if (config?.cache?.enabled) {
      const cached = this.getFromCache<T>(config.cache.key ?? url);
      if (cached) {
        return cached;
      }
    }

    let request$ = this.http.get<T>(url, options).pipe(
      catchError((error) => this.handleError(error, config))
    );

    // Cache the response
    if (config?.cache?.enabled) {
      const cacheKey = config.cache.key ?? url;
      const ttl = config.cache.ttl ?? 60000;
      request$ = request$.pipe(
        shareReplay(1),
        map((data) => {
          this.setCache(cacheKey, data, ttl);
          return data;
        })
      );
    }

    return request$;
  }

  /**
   * Perform a GET request with pagination
   */
  getPaginated<T>(
    endpoint: string,
    pagination?: PaginationParams,
    config?: RequestConfig
  ): Observable<PaginatedResponse<T>> {
    const paginationParams = this.buildPaginationParams(pagination);
    const mergedParams = config?.params
      ? { ...config.params, ...paginationParams }
      : paginationParams;
    return this.get<PaginatedResponse<T>>(endpoint, {
      ...config,
      params: mergedParams as Record<string, string | number | boolean | string[]>,
    });
  }

  /**
   * Perform a POST request
   */
  post<T>(endpoint: string, body: unknown, config?: RequestConfig): Observable<T> {
    const url = this.buildUrl(endpoint);
    const options = this.buildOptions(config);

    return this.http.post<T>(url, body, options).pipe(
      catchError((error) => this.handleError(error, config))
    );
  }

  /**
   * Perform a PUT request
   */
  put<T>(endpoint: string, body: unknown, config?: RequestConfig): Observable<T> {
    const url = this.buildUrl(endpoint);
    const options = this.buildOptions(config);

    return this.http.put<T>(url, body, options).pipe(
      catchError((error) => this.handleError(error, config))
    );
  }

  /**
   * Perform a PATCH request
   */
  patch<T>(endpoint: string, body: unknown, config?: RequestConfig): Observable<T> {
    const url = this.buildUrl(endpoint);
    const options = this.buildOptions(config);

    return this.http.patch<T>(url, body, options).pipe(
      catchError((error) => this.handleError(error, config))
    );
  }

  /**
   * Perform a DELETE request
   */
  delete<T>(endpoint: string, config?: RequestConfig): Observable<T> {
    const url = this.buildUrl(endpoint);
    const options = this.buildOptions(config);

    return this.http.delete<T>(url, options).pipe(
      catchError((error) => this.handleError(error, config))
    );
  }

  /**
   * Upload a file with progress tracking
   */
  upload<T>(
    endpoint: string,
    file: File | FormData,
    config?: RequestConfig
  ): Observable<UploadProgress | T> {
    const url = this.buildUrl(endpoint);
    const formData = file instanceof FormData ? file : this.createFormData(file);

    return this.http
      .post<T>(url, formData, {
        ...this.buildOptions(config),
        reportProgress: true,
        observe: 'events',
      })
      .pipe(
        map((event: HttpEvent<T>) => {
          switch (event.type) {
            case HttpEventType.UploadProgress:
              const progress: UploadProgress = {
                loaded: event.loaded,
                total: event.total ?? 0,
                percentage: event.total ? Math.round((event.loaded / event.total) * 100) : 0,
              };
              return progress;
            case HttpEventType.Response:
              return event.body as T;
            default:
              return { loaded: 0, total: 0, percentage: 0 } as UploadProgress;
          }
        }),
        catchError((error) => this.handleError(error, config))
      );
  }

  /**
   * Download a file
   */
  download(endpoint: string, config?: RequestConfig): Observable<Blob> {
    const url = this.buildUrl(endpoint);
    return this.http
      .get(url, {
        ...this.buildOptions(config),
        responseType: 'blob',
      })
      .pipe(catchError((error) => this.handleError(error, config)));
  }

  /**
   * Clear the response cache
   */
  clearCache(key?: string): void {
    if (key) {
      this.cache.delete(key);
    } else {
      this.cache.clear();
    }
  }

  // ============================================================
  // REACTIVE CONNECTION METHODS
  // ============================================================

  /**
   * Poll an endpoint at regular intervals
   *
   * @example
   * ```typescript
   * // Poll every 5 seconds
   * this.api.poll<Status>('/status', { interval: 5000 })
   *   .subscribe(status => console.log(status));
   *
   * // Poll with smart comparison (only emit on changes)
   * this.api.poll<Data>('/data', {
   *   interval: 10000,
   *   emitOnlyOnChange: true,
   *   compareFn: (a, b) => a.version === b.version
   * }).subscribe(...);
   * ```
   */
  poll<T>(endpoint: string, config: PollingConfig, requestConfig?: RequestConfig): Observable<T> {
    const pollId = config.id ?? `poll-${endpoint}-${Date.now()}`;

    // Stop any existing poll with this ID
    this.stopPoll(pollId);

    const stop$ = new Subject<void>();
    this.activePolls.set(pollId, stop$);

    const interval = config.interval ?? 30000;
    const immediate = config.immediate ?? true;

    return defer(() => {
      const source$ = timer(immediate ? 0 : interval, interval).pipe(
        takeUntil(stop$),
        switchMap(() => this.get<T>(endpoint, requestConfig).pipe(
          catchError((error) => {
            if (config.continueOnError) {
              console.warn(`Polling error for ${endpoint}:`, error);
              return EMPTY;
            }
            return throwError(() => error);
          })
        )),
        finalize(() => {
          this.activePolls.delete(pollId);
        })
      );

      if (config.emitOnlyOnChange) {
        const compareFn = config.compareFn ?? ((a, b) => JSON.stringify(a) === JSON.stringify(b));
        return source$.pipe(
          distinctUntilChanged((prev, curr) => compareFn(prev, curr))
        );
      }

      return source$;
    });
  }

  /**
   * Stop an active polling subscription
   */
  stopPoll(pollId: string): void {
    const stop$ = this.activePolls.get(pollId);
    if (stop$) {
      stop$.next();
      stop$.complete();
      this.activePolls.delete(pollId);
    }
  }

  /**
   * Stop all active polling subscriptions
   */
  stopAllPolls(): void {
    this.activePolls.forEach((stop$, id) => {
      stop$.next();
      stop$.complete();
    });
    this.activePolls.clear();
  }

  /**
   * Connect to a Server-Sent Events (SSE) endpoint
   *
   * @example
   * ```typescript
   * // Subscribe to SSE stream
   * this.api.sse<Notification>('/events/notifications')
   *   .subscribe(event => console.log(event.data));
   *
   * // With specific event types
   * this.api.sse<Update>('/events/updates', {
   *   eventTypes: ['update', 'delete'],
   *   withCredentials: true
   * }).subscribe(...);
   * ```
   */
  sse<T>(endpoint: string, config?: SSEConfig): Observable<SSEMessage<T>> {
    if (!isPlatformBrowser(this.platformId)) {
      return EMPTY;
    }

    const url = this.buildUrl(endpoint);
    const sseId = config?.id ?? `sse-${endpoint}-${Date.now()}`;

    return new Observable<SSEMessage<T>>((subscriber) => {
      // Close any existing SSE with same ID
      this.closeSSE(sseId);

      const eventSource = new EventSource(url, {
        withCredentials: config?.withCredentials ?? false,
      });

      this.activeSSE.set(sseId, eventSource);

      // Handle open event
      eventSource.onopen = () => {
        this.ngZone.run(() => {
          subscriber.next({
            type: 'open',
            data: null as unknown as T,
            lastEventId: '',
            origin: url,
          });
        });
      };

      // Handle error event
      eventSource.onerror = (error) => {
        this.ngZone.run(() => {
          if (eventSource.readyState === EventSource.CLOSED) {
            subscriber.complete();
          } else if (!config?.continueOnError) {
            subscriber.error(new Error('SSE connection error'));
          }
        });
      };

      // Handle message event (default)
      eventSource.onmessage = (event) => {
        this.ngZone.run(() => {
          try {
            const data = config?.parseJson !== false ? JSON.parse(event.data) : event.data;
            subscriber.next({
              type: 'message',
              data: data as T,
              lastEventId: event.lastEventId,
              origin: event.origin,
            });
          } catch (e) {
            subscriber.next({
              type: 'message',
              data: event.data as T,
              lastEventId: event.lastEventId,
              origin: event.origin,
            });
          }
        });
      };

      // Handle specific event types
      if (config?.eventTypes) {
        config.eventTypes.forEach((eventType) => {
          eventSource.addEventListener(eventType, (event: MessageEvent) => {
            this.ngZone.run(() => {
              try {
                const data = config?.parseJson !== false ? JSON.parse(event.data) : event.data;
                subscriber.next({
                  type: eventType,
                  data: data as T,
                  lastEventId: event.lastEventId,
                  origin: event.origin,
                });
              } catch (e) {
                subscriber.next({
                  type: eventType,
                  data: event.data as T,
                  lastEventId: event.lastEventId,
                  origin: event.origin,
                });
              }
            });
          });
        });
      }

      // Cleanup on unsubscribe
      return () => {
        eventSource.close();
        this.activeSSE.delete(sseId);
      };
    });
  }

  /**
   * Close an active SSE connection
   */
  closeSSE(sseId: string): void {
    const eventSource = this.activeSSE.get(sseId);
    if (eventSource) {
      eventSource.close();
      this.activeSSE.delete(sseId);
    }
  }

  /**
   * Close all active SSE connections
   */
  closeAllSSE(): void {
    this.activeSSE.forEach((eventSource) => eventSource.close());
    this.activeSSE.clear();
  }

  /**
   * Perform a request with automatic retry and exponential backoff
   *
   * @example
   * ```typescript
   * // With default retry config
   * this.api.withRetry(() => this.api.get('/unstable-endpoint'))
   *   .subscribe(...);
   *
   * // With custom retry config
   * this.api.withRetry(
   *   () => this.api.post('/flaky-service', data),
   *   { maxRetries: 5, retryDelay: 2000, exponentialBackoff: true }
   * ).subscribe(...);
   * ```
   */
  withRetry<T>(
    requestFn: () => Observable<T>,
    config?: Partial<RetryConfig>
  ): Observable<T> {
    const retryConfig = { ...DEFAULT_RETRY_CONFIG, ...config };

    return requestFn().pipe(
      retryWhen((errors) =>
        errors.pipe(
          scan((retryCount: number, error: unknown) => {
            if (retryCount >= retryConfig.maxRetries) {
              throw error;
            }

            // Check if error is retryable
            if (error instanceof HttpErrorResponse) {
              if (!retryConfig.retryStatuses.includes(error.status)) {
                throw error;
              }
            }

            return retryCount + 1;
          }, 0),
          switchMap((retryCount: number) => {
            const baseDelay = retryConfig.retryDelay;
            const delayMs = retryConfig.exponentialBackoff
              ? Math.min(baseDelay * Math.pow(2, retryCount), 30000)
              : baseDelay;
            return timer(delayMs);
          })
        )
      )
    );
  }

  /**
   * Create a reactive data stream that automatically refreshes
   *
   * @example
   * ```typescript
   * // Create a reactive stream with manual refresh trigger
   * const [users$, refresh] = this.api.createReactiveStream<User[]>('/users');
   *
   * users$.subscribe(users => this.users = users);
   *
   * // Trigger refresh manually
   * refresh();
   * ```
   */
  createReactiveStream<T>(
    endpoint: string,
    config?: ReactiveRequestConfig
  ): [Observable<T>, () => void] {
    const refresh$ = new BehaviorSubject<void>(undefined);
    const stop$ = new Subject<void>();

    const data$ = refresh$.pipe(
      takeUntil(stop$),
      switchMap(() => {
        const request$ = this.get<T>(endpoint, config?.requestConfig);

        if (config?.retry) {
          return this.withRetry(() => request$, config.retry);
        }

        return request$.pipe(
          catchError((error) => {
            if (config?.emitErrorAsValue) {
              return of(error as unknown as T);
            }
            return throwError(() => error);
          })
        );
      }),
      config?.shareReplay !== false ? shareReplay(1) : tap(),
      finalize(() => {
        refresh$.complete();
        stop$.complete();
      })
    );

    const refresh = () => refresh$.next();

    return [data$, refresh];
  }

  /**
   * Create a paginated reactive stream with load more functionality
   *
   * @example
   * ```typescript
   * const stream = this.api.createPaginatedStream<User>('/users', { pageSize: 20 });
   *
   * stream.data$.subscribe(users => this.users = users);
   * stream.loading$.subscribe(loading => this.loading = loading);
   * stream.hasMore$.subscribe(hasMore => this.canLoadMore = hasMore);
   *
   * // Load next page
   * stream.loadMore();
   *
   * // Reset to first page
   * stream.reset();
   * ```
   */
  createPaginatedStream<T>(endpoint: string, config?: {
    pageSize?: number;
    initialPage?: number;
    requestConfig?: RequestConfig;
  }): {
    data$: Observable<T[]>;
    loading$: Observable<boolean>;
    hasMore$: Observable<boolean>;
    error$: Observable<ApiErrorResponse | null>;
    loadMore: () => void;
    reset: () => void;
    destroy: () => void;
  } {
    const pageSize = config?.pageSize ?? 20;
    const initialPage = config?.initialPage ?? 1;

    const page$ = new BehaviorSubject<number>(initialPage);
    const data$ = new BehaviorSubject<T[]>([]);
    const loading$ = new BehaviorSubject<boolean>(false);
    const hasMore$ = new BehaviorSubject<boolean>(true);
    const error$ = new BehaviorSubject<ApiErrorResponse | null>(null);
    const stop$ = new Subject<void>();

    page$.pipe(
      takeUntil(stop$),
      tap(() => loading$.next(true)),
      switchMap((page) =>
        this.getPaginated<T>(endpoint, { page, pageSize }, config?.requestConfig).pipe(
          catchError((err) => {
            error$.next(err);
            return EMPTY;
          })
        )
      )
    ).subscribe((response) => {
      loading$.next(false);
      error$.next(null);

      const currentPage = page$.value;
      if (currentPage === initialPage) {
        data$.next(response.data);
      } else {
        data$.next([...data$.value, ...response.data]);
      }

      hasMore$.next(response.meta.hasNextPage);
    });

    return {
      data$: data$.asObservable(),
      loading$: loading$.asObservable(),
      hasMore$: hasMore$.asObservable(),
      error$: error$.asObservable(),
      loadMore: () => {
        if (!loading$.value && hasMore$.value) {
          page$.next(page$.value + 1);
        }
      },
      reset: () => {
        data$.next([]);
        hasMore$.next(true);
        page$.next(initialPage);
      },
      destroy: () => {
        stop$.next();
        stop$.complete();
        page$.complete();
        data$.complete();
        loading$.complete();
        hasMore$.complete();
        error$.complete();
      },
    };
  }

  /**
   * Perform a request with optimistic update support
   *
   * @example
   * ```typescript
   * // Optimistic update with rollback on error
   * this.api.optimisticUpdate(
   *   () => this.api.put('/users/1', updatedUser),
   *   () => this.usersStore.update(updatedUser),
   *   () => this.usersStore.update(originalUser)
   * ).subscribe(...);
   * ```
   */
  optimisticUpdate<T>(
    requestFn: () => Observable<T>,
    applyOptimistic: () => void,
    rollback: () => void
  ): Observable<T> {
    // Apply optimistic update immediately
    applyOptimistic();

    return requestFn().pipe(
      catchError((error) => {
        // Rollback on error
        rollback();
        return throwError(() => error);
      })
    );
  }

  /**
   * Batch multiple requests and execute them in parallel or sequence
   *
   * @example
   * ```typescript
   * // Parallel execution
   * this.api.batch([
   *   () => this.api.get('/users'),
   *   () => this.api.get('/roles'),
   *   () => this.api.get('/permissions')
   * ]).subscribe(([users, roles, permissions]) => ...);
   * ```
   */
  batch<T extends unknown[]>(
    requests: { [K in keyof T]: () => Observable<T[K]> },
    config?: { sequential?: boolean }
  ): Observable<T> {
    if (config?.sequential) {
      // Execute sequentially
      return requests.reduce(
        (acc$, requestFn, index) =>
          acc$.pipe(
            switchMap((results) =>
              requestFn().pipe(
                map((result) => [...results, result] as unknown as T)
              )
            )
          ),
        of([] as unknown as T)
      );
    }

    // Execute in parallel (default)
    return new Observable<T>((subscriber) => {
      const results: unknown[] = new Array(requests.length);
      let completed = 0;
      let hasError = false;

      requests.forEach((requestFn, index) => {
        requestFn().subscribe({
          next: (result) => {
            results[index] = result;
          },
          error: (error) => {
            if (!hasError) {
              hasError = true;
              subscriber.error(error);
            }
          },
          complete: () => {
            completed++;
            if (completed === requests.length && !hasError) {
              subscriber.next(results as T);
              subscriber.complete();
            }
          },
        });
      });
    });
  }

  /**
   * Clean up all reactive connections
   */
  dispose(): void {
    this.stopAllPolls();
    this.closeAllSSE();
    this.clearCache();
  }

  /**
   * Build the full URL
   */
  private buildUrl(endpoint: string): string {
    if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
      return endpoint;
    }
    const base = this.baseUrl.endsWith('/') ? this.baseUrl.slice(0, -1) : this.baseUrl;
    const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    return `${base}${path}`;
  }

  /**
   * Build HTTP options
   */
  private buildOptions(config?: RequestConfig): {
    headers?: HttpHeaders;
    params?: HttpParams;
    withCredentials?: boolean;
  } {
    let headers = new HttpHeaders();
    let params = new HttpParams();

    if (config?.headers) {
      if (config.headers instanceof HttpHeaders) {
        headers = config.headers;
      } else {
        Object.entries(config.headers).forEach(([key, value]) => {
          headers = headers.set(key, value as string);
        });
      }
    }

    if (config?.params) {
      if (config.params instanceof HttpParams) {
        params = config.params;
      } else {
        Object.entries(config.params).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            if (Array.isArray(value)) {
              value.forEach((v) => {
                params = params.append(key, String(v));
              });
            } else {
              params = params.set(key, String(value));
            }
          }
        });
      }
    }

    return {
      headers,
      params,
      withCredentials: config?.withCredentials,
    };
  }

  /**
   * Build pagination query parameters
   */
  private buildPaginationParams(pagination?: PaginationParams): QueryParams {
    if (!pagination) return {};

    return {
      page: pagination.page,
      pageSize: pagination.pageSize,
      sort: pagination.sort,
      sortDirection: pagination.sortDirection,
    };
  }

  /**
   * Create FormData from a file
   */
  private createFormData(file: File): FormData {
    const formData = new FormData();
    formData.append('file', file, file.name);
    return formData;
  }

  /**
   * Get cached response
   */
  private getFromCache<T>(key: string): Observable<T> | null {
    const cached = this.cache.get(key);
    if (cached && cached.expiry > Date.now()) {
      return new Observable((subscriber) => {
        subscriber.next(cached.data as T);
        subscriber.complete();
      });
    }
    this.cache.delete(key);
    return null;
  }

  /**
   * Set cache entry
   */
  private setCache(key: string, data: unknown, ttl: number): void {
    this.cache.set(key, {
      data,
      expiry: Date.now() + ttl,
    });
  }

  /**
   * Handle HTTP errors
   */
  private handleError(error: HttpErrorResponse, config?: RequestConfig): Observable<never> {
    if (config?.skipErrorHandler) {
      return throwError(() => error);
    }

    const apiError: ApiErrorResponse = {
      code: error.status?.toString() ?? 'UNKNOWN',
      message: error.message ?? 'An unexpected error occurred',
      timestamp: new Date().toISOString(),
      path: error.url ?? undefined,
    };

    if (error.error && typeof error.error === 'object') {
      Object.assign(apiError, error.error);
    }

    return throwError(() => apiError);
  }
}
