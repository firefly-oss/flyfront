/**
 * @flyfront/core - Crypto Service
 * @license Apache-2.0
 * @copyright 2026 Firefly Software Solutions Inc.
 */

import { Injectable } from '@angular/core';
import { EncryptedPayload } from '../models/core.models';

/**
 * Algorithm configuration
 */
const ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256;
const IV_LENGTH = 12;
const SALT_LENGTH = 16;
const PBKDF2_ITERATIONS = 100000;

/**
 * Crypto service for encryption/decryption using Web Crypto API
 *
 * @example
 * ```typescript
 * const crypto = inject(CryptoService);
 *
 * // Generate a key
 * const key = await crypto.generateKey();
 *
 * // Encrypt data
 * const encrypted = await crypto.encrypt('sensitive data', key);
 *
 * // Decrypt data
 * const decrypted = await crypto.decrypt(encrypted, key);
 * ```
 */
@Injectable({
  providedIn: 'root',
})
export class CryptoService {
  private readonly subtle: SubtleCrypto | null;

  constructor() {
    this.subtle = this.getSubtleCrypto();
  }

  /**
   * Check if Web Crypto API is available
   */
  isAvailable(): boolean {
    return this.subtle !== null;
  }

  /**
   * Generate a new AES-256-GCM key
   */
  async generateKey(): Promise<CryptoKey> {
    this.ensureAvailable();

    return this.subtle!.generateKey(
      {
        name: ALGORITHM,
        length: KEY_LENGTH,
      },
      true,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Derive a key from a password using PBKDF2
   * @param password - The password to derive from
   * @param salt - The salt (will be generated if not provided)
   * @param iterations - Number of PBKDF2 iterations
   * @returns The derived key and salt used
   */
  async deriveKey(
    password: string,
    salt?: Uint8Array,
    iterations = PBKDF2_ITERATIONS
  ): Promise<{ key: CryptoKey; salt: Uint8Array }> {
    this.ensureAvailable();

    const usedSalt = salt ?? this.generateSalt();
    const encoder = new TextEncoder();
    const passwordBuffer = encoder.encode(password);

    // Import password as raw key material
    const passwordKey = await this.subtle!.importKey(
      'raw',
      passwordBuffer,
      'PBKDF2',
      false,
      ['deriveKey']
    );

    // Derive AES key from password
    const key = await this.subtle!.deriveKey(
      {
        name: 'PBKDF2',
        salt: usedSalt.buffer as ArrayBuffer,
        iterations,
        hash: 'SHA-256',
      },
      passwordKey,
      {
        name: ALGORITHM,
        length: KEY_LENGTH,
      },
      true,
      ['encrypt', 'decrypt']
    );

    return { key, salt: usedSalt };
  }

  /**
   * Encrypt data using AES-GCM
   * @param data - The data to encrypt (will be JSON stringified)
   * @param key - The encryption key
   * @param salt - Optional salt to include in payload (for key derivation reference)
   * @returns Encrypted payload with ciphertext, IV, and optional salt
   */
  async encrypt<T>(
    data: T,
    key: CryptoKey,
    salt?: Uint8Array
  ): Promise<EncryptedPayload> {
    this.ensureAvailable();

    const iv = this.generateIV();
    const encoder = new TextEncoder();
    const plaintext = encoder.encode(JSON.stringify(data));

    const ciphertext = await this.subtle!.encrypt(
      {
        name: ALGORITHM,
        iv: iv.buffer as ArrayBuffer,
      },
      key,
      plaintext
    );

    return {
      ciphertext: this.arrayBufferToBase64(ciphertext),
      iv: this.arrayBufferToBase64(iv.buffer as ArrayBuffer),
      salt: salt ? this.arrayBufferToBase64(salt.buffer as ArrayBuffer) : undefined,
      algorithm: `${ALGORITHM}-${KEY_LENGTH}`,
    };
  }

  /**
   * Decrypt data using AES-GCM
   * @param payload - The encrypted payload
   * @param key - The decryption key
   * @returns The decrypted data
   */
  async decrypt<T>(payload: EncryptedPayload, key: CryptoKey): Promise<T> {
    this.ensureAvailable();

    const ciphertext = this.base64ToArrayBuffer(payload.ciphertext);
    const iv = this.base64ToArrayBuffer(payload.iv);

    const plaintext = await this.subtle!.decrypt(
      {
        name: ALGORITHM,
        iv,
      },
      key,
      ciphertext
    );

    const decoder = new TextDecoder();
    const json = decoder.decode(plaintext);

    return JSON.parse(json) as T;
  }

  /**
   * Export a CryptoKey to raw bytes (base64 encoded)
   * @param key - The key to export
   * @returns Base64-encoded key data
   */
  async exportKey(key: CryptoKey): Promise<string> {
    this.ensureAvailable();

    const rawKey = await this.subtle!.exportKey('raw', key);
    return this.arrayBufferToBase64(rawKey);
  }

  /**
   * Import a key from raw bytes (base64 encoded)
   * @param keyData - Base64-encoded key data
   * @returns The imported CryptoKey
   */
  async importKey(keyData: string): Promise<CryptoKey> {
    this.ensureAvailable();

    const rawKey = this.base64ToArrayBuffer(keyData);

    return this.subtle!.importKey(
      'raw',
      rawKey,
      {
        name: ALGORITHM,
        length: KEY_LENGTH,
      },
      true,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Generate a cryptographic salt
   * @param length - Salt length in bytes (default: 16)
   * @returns Random salt bytes
   */
  generateSalt(length = SALT_LENGTH): Uint8Array {
    return crypto.getRandomValues(new Uint8Array(length));
  }

  /**
   * Generate a random initialization vector
   * @returns Random IV bytes
   */
  private generateIV(): Uint8Array {
    return crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  }

  /**
   * Get the SubtleCrypto instance if available
   */
  private getSubtleCrypto(): SubtleCrypto | null {
    if (typeof window !== 'undefined' && window.crypto?.subtle) {
      return window.crypto.subtle;
    }
    if (typeof globalThis !== 'undefined' && globalThis.crypto?.subtle) {
      return globalThis.crypto.subtle;
    }
    return null;
  }

  /**
   * Ensure Web Crypto API is available
   */
  private ensureAvailable(): void {
    if (!this.subtle) {
      throw new Error(
        'Web Crypto API is not available. Secure storage requires a secure context (HTTPS) or a modern browser.'
      );
    }
  }

  /**
   * Convert ArrayBuffer to base64 string
   */
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  /**
   * Convert base64 string to ArrayBuffer
   */
  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }
}
