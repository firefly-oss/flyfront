/**
 * @flyfront/core - Storage Service
 * @license Apache-2.0
 */

import { Injectable } from '@angular/core';
import { StorageItem } from '../models/core.models';

/**
 * Storage type
 */
export type StorageType = 'local' | 'session' | 'memory';

/**
 * Storage service for managing browser storage with expiration support
 *
 * @example
 * ```typescript
 * const storage = inject(StorageService);
 *
 * // Store with expiration (1 hour)
 * storage.set('user', userData, { ttl: 3600000 });
 *
 * // Retrieve
 * const user = storage.get<User>('user');
 *
 * // Remove
 * storage.remove('user');
 * ```
 */
@Injectable({
  providedIn: 'root',
})
export class StorageService {
  private readonly memoryStorage = new Map<string, string>();
  private readonly prefix = 'fly_';

  /**
   * Store a value
   * @param key - Storage key
   * @param value - Value to store
   * @param options - Storage options
   */
  set<T>(key: string, value: T, options: StorageOptions = {}): void {
    const { ttl, storage = 'local', version } = options;
    const prefixedKey = this.getPrefixedKey(key);

    const item: StorageItem<T> = {
      value,
      createdAt: Date.now(),
      expiresAt: ttl ? Date.now() + ttl : undefined,
      version,
    };

    const serialized = JSON.stringify(item);
    this.getStorage(storage).setItem(prefixedKey, serialized);
  }

  /**
   * Retrieve a value
   * @param key - Storage key
   * @param options - Storage options
   * @returns The stored value or undefined
   */
  get<T>(key: string, options: StorageOptions = {}): T | undefined {
    const { storage = 'local', version } = options;
    const prefixedKey = this.getPrefixedKey(key);

    const serialized = this.getStorage(storage).getItem(prefixedKey);
    if (!serialized) {
      return undefined;
    }

    try {
      const item: StorageItem<T> = JSON.parse(serialized);

      // Check expiration
      if (item.expiresAt && Date.now() > item.expiresAt) {
        this.remove(key, { storage });
        return undefined;
      }

      // Check version
      if (version !== undefined && item.version !== version) {
        this.remove(key, { storage });
        return undefined;
      }

      return item.value;
    } catch {
      // If parsing fails, remove the corrupted item
      this.remove(key, { storage });
      return undefined;
    }
  }

  /**
   * Remove a value
   * @param key - Storage key
   * @param options - Storage options
   */
  remove(key: string, options: StorageOptions = {}): void {
    const { storage = 'local' } = options;
    const prefixedKey = this.getPrefixedKey(key);
    this.getStorage(storage).removeItem(prefixedKey);
  }

  /**
   * Check if a key exists
   * @param key - Storage key
   * @param options - Storage options
   * @returns Whether the key exists
   */
  has(key: string, options: StorageOptions = {}): boolean {
    return this.get(key, options) !== undefined;
  }

  /**
   * Clear all stored values
   * @param options - Storage options
   */
  clear(options: StorageOptions = {}): void {
    const { storage = 'local' } = options;
    const storageInstance = this.getStorage(storage);

    // Only clear items with our prefix
    const keysToRemove: string[] = [];

    if (storage === 'memory') {
      for (const key of this.memoryStorage.keys()) {
        if (key.startsWith(this.prefix)) {
          keysToRemove.push(key);
        }
      }
    } else {
      const browserStorage = storageInstance as Storage;
      for (let i = 0; i < browserStorage.length; i++) {
        const key = browserStorage.key(i);
        if (key?.startsWith(this.prefix)) {
          keysToRemove.push(key);
        }
      }
    }

    keysToRemove.forEach((key) => storageInstance.removeItem(key));
  }

  /**
   * Get all keys with the application prefix
   * @param options - Storage options
   * @returns Array of keys (without prefix)
   */
  keys(options: StorageOptions = {}): string[] {
    const { storage = 'local' } = options;
    const storageInstance = this.getStorage(storage);
    const keys: string[] = [];

    if (storage === 'memory') {
      for (const key of this.memoryStorage.keys()) {
        if (key.startsWith(this.prefix)) {
          keys.push(key.substring(this.prefix.length));
        }
      }
    } else {
      const browserStorage = storageInstance as Storage;
      for (let i = 0; i < browserStorage.length; i++) {
        const key = browserStorage.key(i);
        if (key?.startsWith(this.prefix)) {
          keys.push(key.substring(this.prefix.length));
        }
      }
    }

    return keys;
  }

  /**
   * Get or set a value (cache pattern)
   * @param key - Storage key
   * @param factory - Factory function to create value if not exists
   * @param options - Storage options
   * @returns The stored or created value
   */
  getOrSet<T>(key: string, factory: () => T, options: StorageOptions = {}): T {
    const existing = this.get<T>(key, options);
    if (existing !== undefined) {
      return existing;
    }

    const value = factory();
    this.set(key, value, options);
    return value;
  }

  /**
   * Get or set a value asynchronously
   * @param key - Storage key
   * @param factory - Async factory function
   * @param options - Storage options
   * @returns Promise resolving to the stored or created value
   */
  async getOrSetAsync<T>(
    key: string,
    factory: () => Promise<T>,
    options: StorageOptions = {}
  ): Promise<T> {
    const existing = this.get<T>(key, options);
    if (existing !== undefined) {
      return existing;
    }

    const value = await factory();
    this.set(key, value, options);
    return value;
  }

  /**
   * Get the storage instance
   */
  private getStorage(type: StorageType): StorageInterface {
    switch (type) {
      case 'session':
        return this.isStorageAvailable('sessionStorage')
          ? sessionStorage
          : this.createMemoryStorageWrapper();
      case 'memory':
        return this.createMemoryStorageWrapper();
      case 'local':
      default:
        return this.isStorageAvailable('localStorage')
          ? localStorage
          : this.createMemoryStorageWrapper();
    }
  }

  /**
   * Create a wrapper for memory storage
   */
  private createMemoryStorageWrapper(): StorageInterface {
    return {
      getItem: (key: string) => this.memoryStorage.get(key) ?? null,
      setItem: (key: string, value: string) => this.memoryStorage.set(key, value),
      removeItem: (key: string) => this.memoryStorage.delete(key),
    };
  }

  /**
   * Check if browser storage is available
   */
  private isStorageAvailable(type: 'localStorage' | 'sessionStorage'): boolean {
    try {
      const storage = window[type];
      const testKey = '__storage_test__';
      storage.setItem(testKey, testKey);
      storage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get the prefixed key
   */
  private getPrefixedKey(key: string): string {
    return `${this.prefix}${key}`;
  }
}

/**
 * Storage options
 */
export interface StorageOptions {
  /** Time to live in milliseconds */
  ttl?: number;
  /** Storage type */
  storage?: StorageType;
  /** Version for cache invalidation */
  version?: number;
}

/**
 * Storage interface for abstraction
 */
interface StorageInterface {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}
