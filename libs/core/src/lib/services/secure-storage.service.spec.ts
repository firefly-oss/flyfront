/**
 * @flyfront/core - Secure Storage Service Tests
 * @license Apache-2.0
 * @copyright 2026 Firefly Software Solutions Inc.
 */

import { TestBed } from '@angular/core/testing';
import { SecureStorageService } from './secure-storage.service';
import { CryptoService } from './crypto.service';

/**
 * Mock Storage implementation for testing
 */
class MockStorage implements Storage {
  private store: Map<string, string> = new Map();

  get length(): number {
    return this.store.size;
  }

  clear(): void {
    this.store.clear();
  }

  getItem(key: string): string | null {
    return this.store.get(key) ?? null;
  }

  key(index: number): string | null {
    const keys = Array.from(this.store.keys());
    return keys[index] ?? null;
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  setItem(key: string, value: string): void {
    this.store.set(key, value);
  }
}

describe('SecureStorageService', () => {
  let service: SecureStorageService;
  let cryptoService: CryptoService;
  let mockLocalStorage: MockStorage;
  let mockSessionStorage: MockStorage;

  beforeEach(() => {
    mockLocalStorage = new MockStorage();
    mockSessionStorage = new MockStorage();

    // Mock localStorage and sessionStorage
    Object.defineProperty(window, 'localStorage', {
      value: mockLocalStorage,
      writable: true,
    });
    Object.defineProperty(window, 'sessionStorage', {
      value: mockSessionStorage,
      writable: true,
    });

    TestBed.configureTestingModule({
      providers: [SecureStorageService, CryptoService],
    });
    service = TestBed.inject(SecureStorageService);
    cryptoService = TestBed.inject(CryptoService);
  });

  afterEach(() => {
    service.destroy();
    mockLocalStorage.clear();
    mockSessionStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('initialization', () => {
    it('should not be initialized before calling initialize', () => {
      expect(service.isInitialized()).toBe(false);
    });

    it('should initialize with session key mode', async () => {
      await service.initialize({ keyMode: 'session' });

      expect(service.isInitialized()).toBe(true);
      expect(service.isEncryptionAvailable()).toBe(true);
    });

    it('should initialize with password key mode', async () => {
      await service.initialize({ keyMode: 'password', password: 'test-password' });

      expect(service.isInitialized()).toBe(true);
      expect(service.isEncryptionAvailable()).toBe(true);
    });

    it('should initialize with provided key mode', async () => {
      const key = await cryptoService.generateKey();
      await service.initialize({ keyMode: 'provided', key });

      expect(service.isInitialized()).toBe(true);
      expect(service.isEncryptionAvailable()).toBe(true);
    });

    it('should throw error for password mode without password', async () => {
      await expect(service.initialize({ keyMode: 'password' })).rejects.toThrow(
        'Password is required'
      );
    });

    it('should throw error for provided mode without key', async () => {
      await expect(service.initialize({ keyMode: 'provided' })).rejects.toThrow(
        'Key is required'
      );
    });
  });

  describe('set and get', () => {
    beforeEach(async () => {
      await service.initialize({ keyMode: 'session' });
    });

    it('should store and retrieve string data with encryption', async () => {
      const key = 'test-key';
      const value = 'test-value';

      await service.set(key, value);
      const retrieved = await service.get<string>(key);

      expect(retrieved).toBe(value);
    });

    it('should store and retrieve object data with encryption', async () => {
      const key = 'user';
      const value = { name: 'John', email: 'john@example.com' };

      await service.set(key, value);
      const retrieved = await service.get<typeof value>(key);

      expect(retrieved).toEqual(value);
    });

    it('should store data without encryption when encrypt: false', async () => {
      const key = 'public-key';
      const value = 'public-value';

      await service.set(key, value, { encrypt: false });
      const retrieved = await service.get<string>(key);

      expect(retrieved).toBe(value);

      // Verify data is stored in plain text
      const storedRaw = mockLocalStorage.getItem('fly_secure_public-key');
      expect(storedRaw).toBeTruthy();
      const parsed = JSON.parse(storedRaw as string);
      expect(parsed.encrypted).toBe(false);
      expect(parsed.value).toBe(value);
    });

    it('should store encrypted data when encrypt: true (default)', async () => {
      const key = 'secret-key';
      const value = 'secret-value';

      await service.set(key, value);

      // Verify data is encrypted
      const storedRaw = mockLocalStorage.getItem('fly_secure_secret-key');
      expect(storedRaw).toBeTruthy();
      const parsed = JSON.parse(storedRaw as string);
      expect(parsed.encrypted).toBe(true);
      expect(parsed.payload).toBeTruthy();
      expect(parsed.payload.ciphertext).toBeTruthy();
    });

    it('should return undefined for non-existent key', async () => {
      const retrieved = await service.get('non-existent');

      expect(retrieved).toBeUndefined();
    });

    it('should support session storage', async () => {
      const key = 'session-key';
      const value = 'session-value';

      await service.set(key, value, { storage: 'session' });
      const retrieved = await service.get<string>(key, { storage: 'session' });

      expect(retrieved).toBe(value);
      expect(mockSessionStorage.getItem('fly_secure_session-key')).toBeTruthy();
    });

    it('should support memory storage', async () => {
      const key = 'memory-key';
      const value = 'memory-value';

      await service.set(key, value, { storage: 'memory' });
      const retrieved = await service.get<string>(key, { storage: 'memory' });

      expect(retrieved).toBe(value);
      // Should not be in localStorage
      expect(mockLocalStorage.getItem('fly_secure_memory-key')).toBeNull();
    });
  });

  describe('TTL expiration', () => {
    beforeEach(async () => {
      await service.initialize({ keyMode: 'session' });
    });

    it('should return undefined for expired item', async () => {
      const key = 'expiring-key';
      const value = 'expiring-value';

      // Set with very short TTL
      await service.set(key, value, { ttl: 1 });

      // Wait for expiration
      await new Promise((resolve) => setTimeout(resolve, 10));

      const retrieved = await service.get<string>(key);
      expect(retrieved).toBeUndefined();
    });

    it('should return value for non-expired item', async () => {
      const key = 'valid-key';
      const value = 'valid-value';

      await service.set(key, value, { ttl: 60000 }); // 1 minute

      const retrieved = await service.get<string>(key);
      expect(retrieved).toBe(value);
    });
  });

  describe('version invalidation', () => {
    beforeEach(async () => {
      await service.initialize({ keyMode: 'session' });
    });

    it('should return undefined for version mismatch', async () => {
      const key = 'versioned-key';
      const value = 'versioned-value';

      await service.set(key, value, { version: 1 });
      const retrieved = await service.get<string>(key, { version: 2 });

      expect(retrieved).toBeUndefined();
    });

    it('should return value for matching version', async () => {
      const key = 'versioned-key';
      const value = 'versioned-value';

      await service.set(key, value, { version: 1 });
      const retrieved = await service.get<string>(key, { version: 1 });

      expect(retrieved).toBe(value);
    });
  });

  describe('remove', () => {
    beforeEach(async () => {
      await service.initialize({ keyMode: 'session' });
    });

    it('should remove stored item', async () => {
      const key = 'remove-key';
      const value = 'remove-value';

      await service.set(key, value);
      service.remove(key);

      const retrieved = await service.get<string>(key);
      expect(retrieved).toBeUndefined();
    });
  });

  describe('has', () => {
    beforeEach(async () => {
      await service.initialize({ keyMode: 'session' });
    });

    it('should return true for existing key', async () => {
      await service.set('exists', 'value');

      expect(await service.has('exists')).toBe(true);
    });

    it('should return false for non-existing key', async () => {
      expect(await service.has('not-exists')).toBe(false);
    });
  });

  describe('clear', () => {
    beforeEach(async () => {
      await service.initialize({ keyMode: 'session' });
    });

    it('should clear all secure storage items', async () => {
      await service.set('key1', 'value1');
      await service.set('key2', 'value2');

      service.clear();

      expect(await service.get('key1')).toBeUndefined();
      expect(await service.get('key2')).toBeUndefined();
    });

    it('should not clear items without secure prefix', async () => {
      mockLocalStorage.setItem('other_key', 'other_value');
      await service.set('secure_key', 'secure_value');

      service.clear();

      expect(mockLocalStorage.getItem('other_key')).toBe('other_value');
    });
  });

  describe('keys', () => {
    beforeEach(async () => {
      await service.initialize({ keyMode: 'session' });
    });

    it('should return all secure storage keys', async () => {
      await service.set('key1', 'value1');
      await service.set('key2', 'value2');
      await service.set('key3', 'value3');

      const keys = service.keys();

      expect(keys).toContain('key1');
      expect(keys).toContain('key2');
      expect(keys).toContain('key3');
      expect(keys.length).toBe(3);
    });
  });

  describe('destroy', () => {
    it('should clear encryption key and reset state', async () => {
      await service.initialize({ keyMode: 'session' });

      expect(service.isInitialized()).toBe(true);
      expect(service.isEncryptionAvailable()).toBe(true);

      service.destroy();

      expect(service.isInitialized()).toBe(false);
      expect(service.isEncryptionAvailable()).toBe(false);
    });
  });

  describe('password-based key derivation persistence', () => {
    it('should persist and reuse salt for password-based keys', async () => {
      // First initialization
      await service.initialize({ keyMode: 'password', password: 'my-password' });
      await service.set('test', 'value');

      // Destroy and reinitialize
      service.destroy();
      await service.initialize({ keyMode: 'password', password: 'my-password' });

      // Should be able to decrypt with same password
      const retrieved = await service.get<string>('test');
      expect(retrieved).toBe('value');
    });
  });
});
