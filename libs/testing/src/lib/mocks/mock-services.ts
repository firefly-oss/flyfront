/**
 * @flyfront/testing - Mock Services
 * @license Apache-2.0
 */

import { Injectable, signal } from '@angular/core';
import { Observable, of, throwError, delay, BehaviorSubject } from 'rxjs';
import { User, AppConfig } from '@flyfront/core';

/**
 * Mock function interface for tracking calls
 */
export interface MockFn<TArgs extends unknown[] = unknown[], TReturn = unknown> {
  (...args: TArgs): TReturn;
  calls: TArgs[];
  mockClear(): void;
  mockReturnValue(value: TReturn): MockFn<TArgs, TReturn>;
  mockResolvedValue(value: Awaited<TReturn>): MockFn<TArgs, Promise<Awaited<TReturn>>>;
}

/**
 * Create a mock function
 */
export function createMockFn<TArgs extends unknown[] = unknown[], TReturn = unknown>(
  implementation?: (...args: TArgs) => TReturn
): MockFn<TArgs, TReturn> {
  const calls: TArgs[] = [];
  let returnValue: TReturn | undefined;
  let resolvedValue: Awaited<TReturn> | undefined;
  let impl = implementation;

  const fn = ((...args: TArgs): TReturn => {
    calls.push(args);
    if (resolvedValue !== undefined) {
      return Promise.resolve(resolvedValue) as TReturn;
    }
    if (returnValue !== undefined) {
      return returnValue;
    }
    if (impl) {
      return impl(...args);
    }
    return undefined as TReturn;
  }) as MockFn<TArgs, TReturn>;

  fn.calls = calls;
  fn.mockClear = () => { calls.length = 0; };
  fn.mockReturnValue = (value: TReturn) => { returnValue = value; return fn; };
  fn.mockResolvedValue = (value: Awaited<TReturn>) => { resolvedValue = value; return fn as unknown as MockFn<TArgs, Promise<Awaited<TReturn>>>; };

  return fn;
}

/**
 * Mock AuthService for testing
 */
@Injectable()
export class MockAuthService {
  private readonly _isAuthenticated = signal(false);
  private readonly _user = signal<User | null>(null);
  private readonly _isLoading = signal(false);
  private readonly _roles = signal<string[]>([]);
  private readonly _permissions = signal<string[]>([]);

  readonly isAuthenticated = this._isAuthenticated.asReadonly();
  readonly user = this._user.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly roles = this._roles.asReadonly();
  readonly permissions = this._permissions.asReadonly();

  // Test helpers
  setAuthenticated(authenticated: boolean): void {
    this._isAuthenticated.set(authenticated);
  }

  setUser(user: User | null): void {
    this._user.set(user);
    this._isAuthenticated.set(user !== null);
    if (user) {
      this._roles.set(user.roles);
      this._permissions.set(user.permissions);
    }
  }

  setLoading(loading: boolean): void {
    this._isLoading.set(loading);
  }

  setRoles(roles: string[]): void {
    this._roles.set(roles);
  }

  setPermissions(permissions: string[]): void {
    this._permissions.set(permissions);
  }

  // AuthService interface methods
  login = createMockFn<[], Promise<void>>(() => Promise.resolve());
  logout = createMockFn<[], Promise<void>>(() => Promise.resolve());
  hasRole = createMockFn<[string], boolean>((role: string) => this._roles().includes(role));
  hasPermission = createMockFn<[string], boolean>((permission: string) => this._permissions().includes(permission));
  hasAnyRole = createMockFn<[string[]], boolean>((roles: string[]) => roles.some((r) => this._roles().includes(r)));
  hasAllRoles = createMockFn<[string[]], boolean>((roles: string[]) => roles.every((r) => this._roles().includes(r)));
}

/**
 * Mock ApiService for testing
 */
@Injectable()
export class MockApiService {
  private responses = new Map<string, unknown>();
  private errors = new Map<string, unknown>();
  private delays = new Map<string, number>();

  // Configure mock responses
  whenGet<T>(url: string, response: T, delayMs = 0): void {
    this.responses.set(`GET:${url}`, response);
    if (delayMs > 0) this.delays.set(`GET:${url}`, delayMs);
  }

  whenPost<T>(url: string, response: T, delayMs = 0): void {
    this.responses.set(`POST:${url}`, response);
    if (delayMs > 0) this.delays.set(`POST:${url}`, delayMs);
  }

  whenPut<T>(url: string, response: T, delayMs = 0): void {
    this.responses.set(`PUT:${url}`, response);
    if (delayMs > 0) this.delays.set(`PUT:${url}`, delayMs);
  }

  whenPatch<T>(url: string, response: T, delayMs = 0): void {
    this.responses.set(`PATCH:${url}`, response);
    if (delayMs > 0) this.delays.set(`PATCH:${url}`, delayMs);
  }

  whenDelete<T>(url: string, response: T, delayMs = 0): void {
    this.responses.set(`DELETE:${url}`, response);
    if (delayMs > 0) this.delays.set(`DELETE:${url}`, delayMs);
  }

  whenError(method: string, url: string, error: unknown): void {
    this.errors.set(`${method}:${url}`, error);
  }

  reset(): void {
    this.responses.clear();
    this.errors.clear();
    this.delays.clear();
  }

  // ApiService interface methods
  get<T>(url: string): Observable<T> {
    return this.mockResponse<T>('GET', url);
  }

  post<T>(url: string, _body?: unknown): Observable<T> {
    return this.mockResponse<T>('POST', url);
  }

  put<T>(url: string, _body?: unknown): Observable<T> {
    return this.mockResponse<T>('PUT', url);
  }

  patch<T>(url: string, _body?: unknown): Observable<T> {
    return this.mockResponse<T>('PATCH', url);
  }

  delete<T>(url: string): Observable<T> {
    return this.mockResponse<T>('DELETE', url);
  }

  private mockResponse<T>(method: string, url: string): Observable<T> {
    const key = `${method}:${url}`;
    const error = this.errors.get(key);

    if (error) {
      return throwError(() => error);
    }

    const response = this.responses.get(key) as T;
    const delayMs = this.delays.get(key) || 0;

    if (response !== undefined) {
      return delayMs > 0 ? of(response).pipe(delay(delayMs)) : of(response);
    }

    return throwError(() => new Error(`No mock configured for ${method} ${url}`));
  }
}

/**
 * Mock ConfigService for testing
 */
@Injectable()
export class MockConfigService {
  private config: Partial<AppConfig> = {
    appName: 'Test App',
    version: '1.0.0',
    environment: 'development',
    apiBaseUrl: 'http://localhost:3000/api',
  };

  setConfig(config: Partial<AppConfig>): void {
    this.config = { ...this.config, ...config };
  }

  get<T>(key: keyof AppConfig): T | undefined {
    return this.config[key] as T | undefined;
  }

  getAll(): Partial<AppConfig> {
    return { ...this.config };
  }
}

/**
 * Mock StorageService for testing
 */
@Injectable()
export class MockStorageService {
  private storage = new Map<string, { value: unknown; expiry?: number }>();

  get<T>(key: string): T | null {
    const entry = this.storage.get(key);
    if (!entry) return null;
    if (entry.expiry && entry.expiry < Date.now()) {
      this.storage.delete(key);
      return null;
    }
    return entry.value as T;
  }

  set<T>(key: string, value: T, options?: { ttl?: number }): void {
    this.storage.set(key, {
      value,
      expiry: options?.ttl ? Date.now() + options.ttl : undefined,
    });
  }

  remove(key: string): void {
    this.storage.delete(key);
  }

  clear(): void {
    this.storage.clear();
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  keys(): string[] {
    return Array.from(this.storage.keys());
  }
}

/**
 * Mock Router for testing
 */
@Injectable()
export class MockRouter {
  readonly url$ = new BehaviorSubject<string>('/');
  readonly events$ = new BehaviorSubject<unknown>(null);

  private _url = '/';
  private navigationHistory: string[] = ['/'];

  get url(): string {
    return this._url;
  }

  navigate = createMockFn<[unknown[], unknown?], Promise<boolean>>((commands: unknown[], _extras?: unknown) => {
    const path = Array.isArray(commands) ? commands.join('/') : String(commands);
    this._url = path.startsWith('/') ? path : `/${path}`;
    this.url$.next(this._url);
    this.navigationHistory.push(this._url);
    return Promise.resolve(true);
  });

  navigateByUrl = createMockFn<[string], Promise<boolean>>((url: string) => {
    this._url = url;
    this.url$.next(this._url);
    this.navigationHistory.push(this._url);
    return Promise.resolve(true);
  });

  getNavigationHistory(): string[] {
    return [...this.navigationHistory];
  }

  reset(): void {
    this._url = '/';
    this.navigationHistory = ['/'];
    this.url$.next('/');
    this.navigate.mockClear();
    this.navigateByUrl.mockClear();
  }
}

/**
 * Mock ActivatedRoute for testing
 */
@Injectable()
export class MockActivatedRoute {
  private _params = new BehaviorSubject<Record<string, string>>({});
  private _queryParams = new BehaviorSubject<Record<string, string>>({});
  private _data = new BehaviorSubject<Record<string, unknown>>({});
  private _fragment = new BehaviorSubject<string | null>(null);

  readonly params = this._params.asObservable();
  readonly queryParams = this._queryParams.asObservable();
  readonly data = this._data.asObservable();
  readonly fragment = this._fragment.asObservable();

  snapshot = {
    params: {} as Record<string, string>,
    queryParams: {} as Record<string, string>,
    data: {} as Record<string, unknown>,
    fragment: null as string | null,
  };

  setParams(params: Record<string, string>): void {
    this._params.next(params);
    this.snapshot.params = params;
  }

  setQueryParams(params: Record<string, string>): void {
    this._queryParams.next(params);
    this.snapshot.queryParams = params;
  }

  setData(data: Record<string, unknown>): void {
    this._data.next(data);
    this.snapshot.data = data;
  }

  setFragment(fragment: string | null): void {
    this._fragment.next(fragment);
    this.snapshot.fragment = fragment;
  }

  reset(): void {
    this._params.next({});
    this._queryParams.next({});
    this._data.next({});
    this._fragment.next(null);
    this.snapshot = { params: {}, queryParams: {}, data: {}, fragment: null };
  }
}

