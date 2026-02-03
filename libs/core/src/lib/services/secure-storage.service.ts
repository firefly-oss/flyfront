/**
 * @flyfront/core - Secure Storage Service
 * @license Apache-2.0
 * @copyright 2026 Firefly Software Solutions Inc.
 */

import { Injectable, inject } from '@angular/core';
import {
  EncryptedPayload,
  SecureStorageOptions,
} from '../models/core.models';
import { CryptoService } from './crypto.service';

/**
 * Storage type
 */
type StorageType = 'local' | 'session' | 'memory';

/**
 * Internal storage interface
 */
interface StorageInterface {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

/**
 * Stored encrypted item structure
 */
interface StoredEncryptedItem {
  encrypted: true;
  payload: EncryptedPayload;
  createdAt: number;
  expiresAt?: number;
  version?: number;
}

/**
 * Stored plain item structure
 */
interface StoredPlainItem<T> {
  encrypted: false;
  value: T;
  createdAt: number;
  expiresAt?: number;
  version?: number;
}

type StoredItem<T> = StoredEncryptedItem | StoredPlainItem<T>;

/**
 * Key initialization mode
 */
export type KeyMode = 'session' | 'password' | 'provided';

/**
 * Secure storage configuration
 */
export interface SecureStorageConfig {
  /** Key initialization mode */
  keyMode: KeyMode;
  /** Password for key derivation (required if keyMode is 'password') */
  password?: string;
  /** Pre-generated key (required if keyMode is 'provided') */
  key?: CryptoKey;
}

/**
 * Secure storage service for encrypted browser storage
 *
 * @example
 * ```typescript
 * const secureStorage = inject(SecureStorageService);
 *
 * // Initialize with session-based key (generated per session)
 * await secureStorage.initialize({ keyMode: 'session' });
 *
 * // Or initialize with password-derived key
 * await secureStorage.initialize({ keyMode: 'password', password: 'user-secret' });
 *
 * // Store encrypted data
 * await secureStorage.set('sensitive', { ssn: '123-45-6789' });
 *
 * // Retrieve decrypted data
 * const data = await secureStorage.get<{ ssn: string }>('sensitive');
 *
 * // Store without encryption (opt-out)
 * await secureStorage.set('public', { name: 'John' }, { encrypt: false });
 * ```
 */
@Injectable({
  providedIn: 'root',
})
export class SecureStorageService {
  private readonly crypto = inject(CryptoService);
  private readonly memoryStorage = new Map<string, string>();
  private readonly prefix = 'fly_secure_';

  private encryptionKey: CryptoKey | null = null;
  private keySalt: Uint8Array | null = null;
  private initialized = false;

  /**
   * Initialize the secure storage with encryption key
   * Must be called before using encrypted storage operations
   */
  async initialize(config: SecureStorageConfig): Promise<void> {
    if (!this.crypto.isAvailable()) {
      console.warn(
        'SecureStorageService: Web Crypto API not available. Encryption disabled.'
      );
      this.initialized = true;
      return;
    }

    switch (config.keyMode) {
      case 'session':
        // Generate a new key for this session (stored in memory only)
        this.encryptionKey = await this.crypto.generateKey();
        break;

      case 'password': {
        if (!config.password) {
          throw new Error('Password is required for password-based key derivation');
        }
        // Try to load existing salt from storage, or generate new one
        const existingSalt = this.loadSalt();
        const { key, salt } = await this.crypto.deriveKey(
          config.password,
          existingSalt
        );
        this.encryptionKey = key;
        this.keySalt = salt;
        // Persist salt for future sessions
        if (!existingSalt) {
          this.saveSalt(salt);
        }
        break;
      }

      case 'provided':
        if (!config.key) {
          throw new Error('Key is required when using provided key mode');
        }
        this.encryptionKey = config.key;
        break;
    }

    this.initialized = true;
  }

  /**
   * Check if the service is initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Check if encryption is available
   */
  isEncryptionAvailable(): boolean {
    return this.crypto.isAvailable() && this.encryptionKey !== null;
  }

  /**
   * Store a value with optional encryption
   * @param key - Storage key
   * @param value - Value to store
   * @param options - Storage options
   */
  async set<T>(
    key: string,
    value: T,
    options: SecureStorageOptions = {}
  ): Promise<void> {
    const { ttl, storage = 'local', version, encrypt = true } = options;
    const prefixedKey = this.getPrefixedKey(key);

    const shouldEncrypt = encrypt && this.isEncryptionAvailable();

    let item: StoredItem<T>;

    if (shouldEncrypt) {
      const payload = await this.crypto.encrypt(value, this.encryptionKey!);
      item = {
        encrypted: true,
        payload,
        createdAt: Date.now(),
        expiresAt: ttl ? Date.now() + ttl : undefined,
        version,
      };
    } else {
      item = {
        encrypted: false,
        value,
        createdAt: Date.now(),
        expiresAt: ttl ? Date.now() + ttl : undefined,
        version,
      };
    }

    const serialized = JSON.stringify(item);
    this.getStorage(storage).setItem(prefixedKey, serialized);
  }

  /**
   * Retrieve a value with automatic decryption
   * @param key - Storage key
   * @param options - Storage options
   * @returns The stored value or undefined
   */
  async get<T>(
    key: string,
    options: SecureStorageOptions = {}
  ): Promise<T | undefined> {
    const { storage = 'local', version } = options;
    const prefixedKey = this.getPrefixedKey(key);

    const serialized = this.getStorage(storage).getItem(prefixedKey);
    if (!serialized) {
      return undefined;
    }

    try {
      const item: StoredItem<T> = JSON.parse(serialized);

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

      if (item.encrypted) {
        if (!this.isEncryptionAvailable()) {
          console.error(
            'SecureStorageService: Cannot decrypt - encryption not available'
          );
          return undefined;
        }
        return await this.crypto.decrypt<T>(item.payload, this.encryptionKey!);
      } else {
        return item.value;
      }
    } catch (error) {
      // If parsing or decryption fails, remove the corrupted item
      console.error('SecureStorageService: Failed to retrieve item', error);
      this.remove(key, { storage });
      return undefined;
    }
  }

  /**
   * Remove a value
   * @param key - Storage key
   * @param options - Storage options
   */
  remove(key: string, options: SecureStorageOptions = {}): void {
    const { storage = 'local' } = options;
    const prefixedKey = this.getPrefixedKey(key);
    this.getStorage(storage).removeItem(prefixedKey);
  }

  /**
   * Check if a key exists and is valid
   * @param key - Storage key
   * @param options - Storage options
   * @returns Whether the key exists
   */
  async has(key: string, options: SecureStorageOptions = {}): Promise<boolean> {
    return (await this.get(key, options)) !== undefined;
  }

  /**
   * Clear all secure storage values
   * @param options - Storage options
   */
  clear(options: SecureStorageOptions = {}): void {
    const { storage = 'local' } = options;
    const storageInstance = this.getStorage(storage);

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
   * Get all keys with the secure storage prefix
   * @param options - Storage options
   * @returns Array of keys (without prefix)
   */
  keys(options: SecureStorageOptions = {}): string[] {
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
   * Re-encrypt all stored items with a new key
   * Useful when changing passwords or rotating keys
   * @param newConfig - New key configuration
   * @param storageType - Storage type to re-encrypt
   */
  async rotateKey(
    newConfig: SecureStorageConfig,
    storageType: StorageType = 'local'
  ): Promise<void> {
    if (!this.isEncryptionAvailable()) {
      throw new Error('Cannot rotate key - encryption not available');
    }

    // Get all current keys and values
    const currentKeys = this.keys({ storage: storageType });
    const items: Array<{ key: string; value: unknown; options: SecureStorageOptions }> = [];

    for (const key of currentKeys) {
      const value = await this.get(key, { storage: storageType });
      if (value !== undefined) {
        items.push({ key, value, options: { storage: storageType } });
      }
    }

    // Re-initialize with new key
    await this.initialize(newConfig);

    // Re-encrypt all items
    for (const { key, value, options } of items) {
      await this.set(key, value, options);
    }
  }

  /**
   * Destroy the encryption key (logout/cleanup)
   */
  destroy(): void {
    this.encryptionKey = null;
    this.keySalt = null;
    this.initialized = false;
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

  /**
   * Load salt from storage for password-based key derivation
   */
  private loadSalt(): Uint8Array | undefined {
    try {
      const saltStr = localStorage.getItem(`${this.prefix}_salt`);
      if (!saltStr) {
        return undefined;
      }
      const saltArray = JSON.parse(saltStr) as number[];
      return new Uint8Array(saltArray);
    } catch {
      return undefined;
    }
  }

  /**
   * Save salt to storage for password-based key derivation
   */
  private saveSalt(salt: Uint8Array): void {
    try {
      const saltArray = Array.from(salt);
      localStorage.setItem(`${this.prefix}_salt`, JSON.stringify(saltArray));
    } catch {
      // Ignore storage errors
    }
  }
}
