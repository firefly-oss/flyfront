/**
 * @flyfront/core - Crypto Service Tests
 * @license Apache-2.0
 * @copyright 2026 Firefly Software Solutions Inc.
 */

import { TestBed } from '@angular/core/testing';
import { CryptoService } from './crypto.service';

describe('CryptoService', () => {
  let service: CryptoService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CryptoService],
    });
    service = TestBed.inject(CryptoService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('isAvailable', () => {
    it('should return true when Web Crypto API is available', () => {
      // In modern test environments, Web Crypto should be available
      expect(service.isAvailable()).toBe(true);
    });
  });

  describe('generateKey', () => {
    it('should generate a CryptoKey', async () => {
      const key = await service.generateKey();

      expect(key).toBeTruthy();
      expect(key.type).toBe('secret');
      expect(key.algorithm.name).toBe('AES-GCM');
    });
  });

  describe('deriveKey', () => {
    it('should derive a key from password', async () => {
      const password = 'test-password';
      const { key, salt } = await service.deriveKey(password);

      expect(key).toBeTruthy();
      expect(key.type).toBe('secret');
      expect(salt).toBeTruthy();
      expect(salt.length).toBe(16);
    });

    it('should derive the same key with the same password and salt', async () => {
      const password = 'test-password';
      const { key: key1, salt } = await service.deriveKey(password);
      const { key: key2 } = await service.deriveKey(password, salt);

      // Export both keys to compare
      const exported1 = await service.exportKey(key1);
      const exported2 = await service.exportKey(key2);

      expect(exported1).toBe(exported2);
    });

    it('should derive different keys with different passwords', async () => {
      const salt = service.generateSalt();
      const { key: key1 } = await service.deriveKey('password1', salt);
      const { key: key2 } = await service.deriveKey('password2', salt);

      const exported1 = await service.exportKey(key1);
      const exported2 = await service.exportKey(key2);

      expect(exported1).not.toBe(exported2);
    });
  });

  describe('encrypt and decrypt', () => {
    it('should encrypt and decrypt string data', async () => {
      const key = await service.generateKey();
      const originalData = 'Hello, World!';

      const encrypted = await service.encrypt(originalData, key);
      const decrypted = await service.decrypt<string>(encrypted, key);

      expect(decrypted).toBe(originalData);
    });

    it('should encrypt and decrypt object data', async () => {
      const key = await service.generateKey();
      const originalData = { name: 'John', age: 30, active: true };

      const encrypted = await service.encrypt(originalData, key);
      const decrypted = await service.decrypt<typeof originalData>(encrypted, key);

      expect(decrypted).toEqual(originalData);
    });

    it('should encrypt and decrypt array data', async () => {
      const key = await service.generateKey();
      const originalData = [1, 2, 3, 'four', { five: 5 }];

      const encrypted = await service.encrypt(originalData, key);
      const decrypted = await service.decrypt<typeof originalData>(encrypted, key);

      expect(decrypted).toEqual(originalData);
    });

    it('should produce different ciphertext for same data (due to random IV)', async () => {
      const key = await service.generateKey();
      const data = 'same data';

      const encrypted1 = await service.encrypt(data, key);
      const encrypted2 = await service.encrypt(data, key);

      expect(encrypted1.ciphertext).not.toBe(encrypted2.ciphertext);
      expect(encrypted1.iv).not.toBe(encrypted2.iv);
    });

    it('should fail to decrypt with wrong key', async () => {
      const key1 = await service.generateKey();
      const key2 = await service.generateKey();
      const data = 'secret data';

      const encrypted = await service.encrypt(data, key1);

      await expect(service.decrypt(encrypted, key2)).rejects.toThrow();
    });

    it('should include salt in payload when provided', async () => {
      const key = await service.generateKey();
      const salt = service.generateSalt();
      const data = 'data with salt';

      const encrypted = await service.encrypt(data, key, salt);

      expect(encrypted.salt).toBeTruthy();
    });
  });

  describe('exportKey and importKey', () => {
    it('should export and import a key', async () => {
      const originalKey = await service.generateKey();
      const exported = await service.exportKey(originalKey);
      const importedKey = await service.importKey(exported);

      // Verify by encrypting with original and decrypting with imported
      const data = 'test data';
      const encrypted = await service.encrypt(data, originalKey);
      const decrypted = await service.decrypt<string>(encrypted, importedKey);

      expect(decrypted).toBe(data);
    });
  });

  describe('generateSalt', () => {
    it('should generate salt with default length', () => {
      const salt = service.generateSalt();

      expect(salt).toBeInstanceOf(Uint8Array);
      expect(salt.length).toBe(16);
    });

    it('should generate salt with custom length', () => {
      const salt = service.generateSalt(32);

      expect(salt.length).toBe(32);
    });

    it('should generate unique salts', () => {
      const salt1 = service.generateSalt();
      const salt2 = service.generateSalt();

      expect(Array.from(salt1)).not.toEqual(Array.from(salt2));
    });
  });
});
