/**
 * @flyfront/auth - Authentication Service
 * @license Apache-2.0
 */

import { Injectable, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, of, from, throwError } from 'rxjs';
import { map, tap, catchError, switchMap } from 'rxjs/operators';
import { TokenService } from './token.service';
import { User, AuthConfig } from '@flyfront/core';

/**
 * Authentication state
 */
export interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  error: string | null;
}

/**
 * Login options
 */
export interface LoginOptions {
  returnUrl?: string;
  prompt?: 'none' | 'login' | 'consent' | 'select_account';
  loginHint?: string;
}

/**
 * Authentication service providing OIDC/OAuth2 authentication
 *
 * @example
 * ```typescript
 * const auth = inject(AuthService);
 *
 * // Check authentication
 * if (auth.isAuthenticated()) {
 *   console.log('User:', auth.user());
 * }
 *
 * // Login
 * auth.login({ returnUrl: '/dashboard' });
 *
 * // Logout
 * auth.logout();
 * ```
 */
@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly router = inject(Router);
  private readonly tokenService = inject(TokenService);

  private readonly _state = signal<AuthState>({
    isAuthenticated: false,
    isLoading: true,
    user: null,
    error: null,
  });

  /** Authentication state */
  readonly state = this._state.asReadonly();

  /** Whether the user is authenticated */
  readonly isAuthenticated = computed(() => this._state().isAuthenticated);

  /** Whether authentication is loading */
  readonly isLoading = computed(() => this._state().isLoading);

  /** Current user */
  readonly user = computed(() => this._state().user);

  /** Authentication error */
  readonly error = computed(() => this._state().error);

  /** User roles */
  readonly roles = computed(() => this._state().user?.roles ?? []);

  /** User permissions */
  readonly permissions = computed(() => this._state().user?.permissions ?? []);

  /** Observable for authentication status */
  readonly isAuthenticated$ = new BehaviorSubject<boolean>(false);

  constructor() {
    this.initialize();
  }

  /**
   * Initialize authentication state
   */
  private async initialize(): Promise<void> {
    try {
      const token = this.tokenService.getAccessToken();

      if (token && !this.tokenService.isTokenExpired(token)) {
        const user = await this.fetchUserInfo();
        this.setAuthenticated(user);
      } else {
        this.setUnauthenticated();
      }
    } catch (error) {
      console.error('Failed to initialize auth:', error);
      this.setUnauthenticated();
    }
  }

  /**
   * Check if user is authenticated (synchronous)
   */
  checkAuthentication(): boolean {
    const token = this.tokenService.getAccessToken();
    return !!token && !this.tokenService.isTokenExpired(token);
  }

  /**
   * Login the user
   */
  login(options: LoginOptions = {}): void {
    const { returnUrl = '/' } = options;

    // Store return URL
    sessionStorage.setItem('fly_auth_return_url', returnUrl);

    // For demo purposes, simulate login
    // In production, redirect to OIDC provider
    this.simulateLogin();
  }

  /**
   * Logout the user
   */
  logout(returnUrl?: string): void {
    this.tokenService.clearTokens();
    this.setUnauthenticated();

    if (returnUrl) {
      this.router.navigate([returnUrl]);
    } else {
      this.router.navigate(['/']);
    }
  }

  /**
   * Handle OIDC callback
   */
  async handleCallback(): Promise<void> {
    this._state.update((s) => ({ ...s, isLoading: true }));

    try {
      // Parse callback URL for tokens
      const hash = window.location.hash;
      const params = new URLSearchParams(hash.substring(1));

      const accessToken = params.get('access_token');
      const idToken = params.get('id_token');
      const expiresIn = params.get('expires_in');

      if (accessToken) {
        const expirationTime = expiresIn
          ? Date.now() + parseInt(expiresIn, 10) * 1000
          : Date.now() + 3600000;

        this.tokenService.setTokens({
          accessToken,
          idToken: idToken || undefined,
          expiresAt: expirationTime,
        });

        const user = await this.fetchUserInfo();
        this.setAuthenticated(user);

        // Navigate to return URL
        const returnUrl = sessionStorage.getItem('fly_auth_return_url') || '/';
        sessionStorage.removeItem('fly_auth_return_url');
        this.router.navigate([returnUrl]);
      } else {
        throw new Error('No access token in callback');
      }
    } catch (error) {
      console.error('Callback handling failed:', error);
      this._state.update((s) => ({
        ...s,
        isLoading: false,
        error: 'Authentication failed',
      }));
    }
  }

  /**
   * Refresh the access token
   */
  async refreshToken(): Promise<boolean> {
    try {
      const refreshToken = this.tokenService.getRefreshToken();
      if (!refreshToken) {
        return false;
      }

      // In production, call token refresh endpoint
      // For demo, just return true
      return true;
    } catch (error) {
      console.error('Token refresh failed:', error);
      this.logout();
      return false;
    }
  }

  /**
   * Check if user has a specific permission
   */
  hasPermission(permission: string): boolean {
    return this.permissions().includes(permission);
  }

  /**
   * Check if user has all specified permissions
   */
  hasAllPermissions(permissions: string[]): boolean {
    const userPermissions = this.permissions();
    return permissions.every((p) => userPermissions.includes(p));
  }

  /**
   * Check if user has any of the specified permissions
   */
  hasAnyPermission(permissions: string[]): boolean {
    const userPermissions = this.permissions();
    return permissions.some((p) => userPermissions.includes(p));
  }

  /**
   * Check if user has a specific role
   */
  hasRole(role: string): boolean {
    return this.roles().includes(role);
  }

  /**
   * Check if user has any of the specified roles
   */
  hasAnyRole(roles: string[]): boolean {
    const userRoles = this.roles();
    return roles.some((r) => userRoles.includes(r));
  }

  /**
   * Get user attribute
   */
  getUserAttribute<T>(key: string): T | undefined {
    return this.user()?.attributes?.[key] as T | undefined;
  }

  /**
   * Fetch user information from token or userinfo endpoint
   */
  private async fetchUserInfo(): Promise<User> {
    const token = this.tokenService.getAccessToken();
    if (!token) {
      throw new Error('No access token');
    }

    const payload = this.tokenService.decodeToken(token);

    return {
      id: payload.sub,
      username: (payload['preferred_username'] as string) || payload.sub,
      email: (payload['email'] as string) || '',
      displayName: (payload['name'] as string) || payload.sub,
      roles: (payload['roles'] as string[]) || [],
      permissions: (payload['permissions'] as string[]) || [],
      attributes: payload,
      isActive: true,
    };
  }

  /**
   * Set authenticated state
   */
  private setAuthenticated(user: User): void {
    this._state.set({
      isAuthenticated: true,
      isLoading: false,
      user,
      error: null,
    });
    this.isAuthenticated$.next(true);
  }

  /**
   * Set unauthenticated state
   */
  private setUnauthenticated(): void {
    this._state.set({
      isAuthenticated: false,
      isLoading: false,
      user: null,
      error: null,
    });
    this.isAuthenticated$.next(false);
  }

  /**
   * Simulate login for demo purposes
   */
  private simulateLogin(): void {
    // Create demo tokens
    const now = Math.floor(Date.now() / 1000);
    const payload = {
      sub: 'demo-user-123',
      iss: 'https://auth.flyfront.dev',
      aud: 'flyfront-app',
      exp: now + 3600,
      iat: now,
      preferred_username: 'demo.user',
      email: 'demo@flyfront.dev',
      name: 'Demo User',
      roles: ['user', 'admin'],
      permissions: ['read', 'write', 'delete'],
    };

    // Create a simple JWT-like token (not a real JWT)
    const header = btoa(JSON.stringify({ alg: 'none', typ: 'JWT' }));
    const body = btoa(JSON.stringify(payload));
    const token = `${header}.${body}.`;

    this.tokenService.setTokens({
      accessToken: token,
      expiresAt: (now + 3600) * 1000,
    });

    this.fetchUserInfo().then((user) => {
      this.setAuthenticated(user);
      const returnUrl = sessionStorage.getItem('fly_auth_return_url') || '/';
      sessionStorage.removeItem('fly_auth_return_url');
      this.router.navigate([returnUrl]);
    });
  }
}
