/**
 * @flyfront/auth - Token Service
 * @license Apache-2.0
 */

import { Injectable, inject } from '@angular/core';
import { StorageService } from '@flyfront/core';
import { TokenPayload } from '@flyfront/core';

/**
 * Token storage keys
 */
const TOKEN_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  ID_TOKEN: 'id_token',
  EXPIRES_AT: 'expires_at',
} as const;

/**
 * Token data
 */
export interface TokenData {
  accessToken: string;
  refreshToken?: string;
  idToken?: string;
  expiresAt: number;
}

/**
 * Token service for managing JWT tokens
 *
 * @example
 * ```typescript
 * const tokenService = inject(TokenService);
 *
 * // Set tokens
 * tokenService.setTokens({
 *   accessToken: 'eyJ...',
 *   refreshToken: 'eyJ...',
 *   expiresAt: Date.now() + 3600000,
 * });
 *
 * // Get access token
 * const token = tokenService.getAccessToken();
 *
 * // Check expiration
 * if (tokenService.isTokenExpired(token)) {
 *   // Refresh token
 * }
 * ```
 */
@Injectable({
  providedIn: 'root',
})
export class TokenService {
  private readonly storage = inject(StorageService);

  /**
   * Set authentication tokens
   */
  setTokens(tokens: TokenData): void {
    this.storage.set(TOKEN_KEYS.ACCESS_TOKEN, tokens.accessToken, {
      storage: 'local',
    });

    if (tokens.refreshToken) {
      this.storage.set(TOKEN_KEYS.REFRESH_TOKEN, tokens.refreshToken, {
        storage: 'local',
      });
    }

    if (tokens.idToken) {
      this.storage.set(TOKEN_KEYS.ID_TOKEN, tokens.idToken, {
        storage: 'local',
      });
    }

    this.storage.set(TOKEN_KEYS.EXPIRES_AT, tokens.expiresAt, {
      storage: 'local',
    });
  }

  /**
   * Get the access token
   */
  getAccessToken(): string | undefined {
    return this.storage.get<string>(TOKEN_KEYS.ACCESS_TOKEN);
  }

  /**
   * Get the refresh token
   */
  getRefreshToken(): string | undefined {
    return this.storage.get<string>(TOKEN_KEYS.REFRESH_TOKEN);
  }

  /**
   * Get the ID token
   */
  getIdToken(): string | undefined {
    return this.storage.get<string>(TOKEN_KEYS.ID_TOKEN);
  }

  /**
   * Get token expiration time
   */
  getExpiresAt(): number | undefined {
    return this.storage.get<number>(TOKEN_KEYS.EXPIRES_AT);
  }

  /**
   * Clear all tokens
   */
  clearTokens(): void {
    this.storage.remove(TOKEN_KEYS.ACCESS_TOKEN);
    this.storage.remove(TOKEN_KEYS.REFRESH_TOKEN);
    this.storage.remove(TOKEN_KEYS.ID_TOKEN);
    this.storage.remove(TOKEN_KEYS.EXPIRES_AT);
  }

  /**
   * Check if a token is expired
   */
  isTokenExpired(token?: string): boolean {
    if (!token) {
      return true;
    }

    try {
      const payload = this.decodeToken(token);
      const expiration = payload.exp * 1000; // Convert to milliseconds
      const buffer = 60000; // 1 minute buffer

      return Date.now() >= expiration - buffer;
    } catch {
      return true;
    }
  }

  /**
   * Check if token will expire soon (within threshold)
   */
  willExpireSoon(token?: string, thresholdSeconds = 300): boolean {
    if (!token) {
      return true;
    }

    try {
      const payload = this.decodeToken(token);
      const expiration = payload.exp * 1000;
      const threshold = thresholdSeconds * 1000;

      return Date.now() >= expiration - threshold;
    } catch {
      return true;
    }
  }

  /**
   * Decode a JWT token
   */
  decodeToken(token: string): TokenPayload {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        throw new Error('Invalid token format');
      }

      const payload = parts[1];
      const decoded = this.base64UrlDecode(payload);
      return JSON.parse(decoded);
    } catch (error) {
      throw new Error(`Failed to decode token: ${error}`);
    }
  }

  /**
   * Get token claims
   */
  getTokenClaims(token?: string): Record<string, unknown> | null {
    const tokenToUse = token || this.getAccessToken();
    if (!tokenToUse) {
      return null;
    }

    try {
      return this.decodeToken(tokenToUse);
    } catch {
      return null;
    }
  }

  /**
   * Get a specific claim from the token
   */
  getClaim<T>(claim: string, token?: string): T | undefined {
    const claims = this.getTokenClaims(token);
    return claims?.[claim] as T | undefined;
  }

  /**
   * Get time until token expires in seconds
   */
  getTimeUntilExpiry(token?: string): number {
    const tokenToUse = token || this.getAccessToken();
    if (!tokenToUse) {
      return 0;
    }

    try {
      const payload = this.decodeToken(tokenToUse);
      const expiration = payload.exp * 1000;
      const remaining = expiration - Date.now();
      return Math.max(0, Math.floor(remaining / 1000));
    } catch {
      return 0;
    }
  }

  /**
   * Decode base64url string
   */
  private base64UrlDecode(str: string): string {
    // Replace URL-safe characters
    let base64 = str.replace(/-/g, '+').replace(/_/g, '/');

    // Add padding if necessary
    const padding = base64.length % 4;
    if (padding) {
      base64 += '='.repeat(4 - padding);
    }

    // Decode
    return atob(base64);
  }
}
