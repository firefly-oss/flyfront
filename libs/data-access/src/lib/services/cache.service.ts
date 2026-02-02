/**
 * @flyfront/data-access - Cache Service
 * @license Apache-2.0
 */

import { Injectable, signal, computed } from '@angular/core';
import { Observable, of, Subject } from 'rxjs';
import { tap, shareReplay } from 'rxjs/operators';

interface CacheEntry<T> {
  data: T;
  expiry: number;
  createdAt: number;
}

interface CacheStats {
  hits: number;
  misses: number;
  size: number;
}

/**
 * Service for caching API responses and computed values
 *
 * @example
 * ```typescript
 * // Inject the service
 * private cache = inject(CacheService);
 *
 * // Cache a value
 * this.cache.set('user-123', userData, 60000); // 1 minute TTL
 *
 * // Get a cached value
 * const user = this.cache.get<User>('user-123');
 *
 * // Cache an Observable
 * getUser(id: string): Observable<User> {
 *   return this.cache.wrap(
 *     `user-${id}`,
 *     () => this.api.get<User>(`/users/${id}`),
 *     60000
 *   );
 * }
 * ```
 */
@Injectable({ providedIn: 'root' })
export class CacheService {
  private readonly cache = new Map<string, CacheEntry<unknown>>();
  private readonly observables = new Map<string, Observable<unknown>>();
  private readonly invalidated$ = new Subject<string>();

  private readonly _stats = signal<CacheStats>({ hits: 0, misses: 0, size: 0 });

  /** Cache statistics */
  readonly stats = this._stats.asReadonly();

  /** Cache hit rate */
  readonly hitRate = computed(() => {
    const s = this._stats();
    const total = s.hits + s.misses;
    return total > 0 ? (s.hits / total) * 100 : 0;
  });

  /** Observable of invalidated cache keys */
  readonly invalidated = this.invalidated$.asObservable();

  /**
   * Get a cached value
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;

    if (!entry) {
      this.recordMiss();
      return null;
    }

    if (this.isExpired(entry)) {
      this.delete(key);
      this.recordMiss();
      return null;
    }

    this.recordHit();
    return entry.data;
  }

  /**
   * Set a cached value
   */
  set<T>(key: string, data: T, ttl: number = 60000): void {
    const entry: CacheEntry<T> = {
      data,
      expiry: Date.now() + ttl,
      createdAt: Date.now(),
    };

    this.cache.set(key, entry);
    this.updateSize();
  }

  /**
   * Check if a key exists and is not expired
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    if (this.isExpired(entry)) {
      this.delete(key);
      return false;
    }
    return true;
  }

  /**
   * Delete a cached value
   */
  delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    this.observables.delete(key);
    if (deleted) {
      this.invalidated$.next(key);
      this.updateSize();
    }
    return deleted;
  }

  /**
   * Clear all cached values
   */
  clear(): void {
    const keys = Array.from(this.cache.keys());
    this.cache.clear();
    this.observables.clear();
    keys.forEach((key) => this.invalidated$.next(key));
    this._stats.set({ hits: 0, misses: 0, size: 0 });
  }

  /**
   * Clear expired entries
   */
  clearExpired(): number {
    let cleared = 0;
    for (const [key, entry] of this.cache.entries()) {
      if (this.isExpired(entry)) {
        this.delete(key);
        cleared++;
      }
    }
    return cleared;
  }

  /**
   * Invalidate cache entries by pattern
   */
  invalidatePattern(pattern: string | RegExp): number {
    const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
    let invalidated = 0;

    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.delete(key);
        invalidated++;
      }
    }

    return invalidated;
  }

  /**
   * Wrap an Observable with caching
   */
  wrap<T>(key: string, factory: () => Observable<T>, ttl: number = 60000): Observable<T> {
    // Check memory cache first
    const cached = this.get<T>(key);
    if (cached !== null) {
      return of(cached);
    }

    // Check if there's already a pending request
    const pending = this.observables.get(key) as Observable<T> | undefined;
    if (pending) {
      return pending;
    }

    // Create new request and cache it
    const observable$ = factory().pipe(
      tap((data) => {
        this.set(key, data, ttl);
        this.observables.delete(key);
      }),
      shareReplay(1)
    );

    this.observables.set(key, observable$);
    return observable$;
  }

  /**
   * Get or set a value (cache-aside pattern)
   */
  async getOrSet<T>(key: string, factory: () => T | Promise<T>, ttl: number = 60000): Promise<T> {
    const cached = this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const data = await factory();
    this.set(key, data, ttl);
    return data;
  }

  /**
   * Get all cache keys
   */
  keys(): string[] {
    return Array.from(this.cache.keys());
  }

  /**
   * Get cache entries info (without data)
   */
  entries(): Array<{ key: string; expiry: number; createdAt: number; ttl: number }> {
    return Array.from(this.cache.entries()).map(([key, entry]) => ({
      key,
      expiry: entry.expiry,
      createdAt: entry.createdAt,
      ttl: entry.expiry - Date.now(),
    }));
  }

  /**
   * Check if an entry is expired
   */
  private isExpired(entry: CacheEntry<unknown>): boolean {
    return Date.now() > entry.expiry;
  }

  /**
   * Record a cache hit
   */
  private recordHit(): void {
    this._stats.update((s) => ({ ...s, hits: s.hits + 1 }));
  }

  /**
   * Record a cache miss
   */
  private recordMiss(): void {
    this._stats.update((s) => ({ ...s, misses: s.misses + 1 }));
  }

  /**
   * Update cache size stat
   */
  private updateSize(): void {
    this._stats.update((s) => ({ ...s, size: this.cache.size }));
  }
}
