/**
 * @flyfront/core - Authentication Guard
 * @license Apache-2.0
 */

import { inject } from '@angular/core';
import {
  CanActivateFn,
  CanActivateChildFn,
  CanMatchFn,
  Router,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  UrlTree,
  Route,
  UrlSegment,
} from '@angular/router';
import { Observable, of, map, catchError, switchMap } from 'rxjs';
import { LoggerService } from '../services/logger.service';

/**
 * Authentication service interface
 * This should be implemented by the auth library
 */
export interface AuthServiceInterface {
  isAuthenticated(): Observable<boolean> | boolean;
  isAuthenticated$: Observable<boolean>;
  login(returnUrl?: string): void;
}

/**
 * Injection token for the auth service
 */
import { InjectionToken } from '@angular/core';

export const AUTH_SERVICE = new InjectionToken<AuthServiceInterface>('AUTH_SERVICE');

/**
 * Guard options
 */
export interface AuthGuardOptions {
  /** URL to redirect to when not authenticated */
  redirectUrl?: string;
  /** Whether to pass return URL to login */
  passReturnUrl?: boolean;
  /** Custom unauthorized handler */
  onUnauthorized?: (route: ActivatedRouteSnapshot | Route, state?: RouterStateSnapshot) => void;
}

/**
 * Default guard options
 */
const DEFAULT_OPTIONS: AuthGuardOptions = {
  redirectUrl: '/login',
  passReturnUrl: true,
};

/**
 * Create an authentication guard function
 *
 * @example
 * ```typescript
 * // In your routes
 * export const routes: Routes = [
 *   {
 *     path: 'dashboard',
 *     component: DashboardComponent,
 *     canActivate: [authGuard()],
 *   },
 * ];
 * ```
 */
export function authGuard(options: AuthGuardOptions = {}): CanActivateFn {
  const mergedOptions = { ...DEFAULT_OPTIONS, ...options };

  return (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
    const authService = inject(AUTH_SERVICE, { optional: true });
    const router = inject(Router);
    const logger = inject(LoggerService);

    if (!authService) {
      logger.error('Auth service not provided. Make sure to provide AUTH_SERVICE token.');
      return router.createUrlTree([mergedOptions.redirectUrl]);
    }

    const isAuth = authService.isAuthenticated();

    if (typeof isAuth === 'boolean') {
      return handleAuthResult(isAuth, route, state, router, logger, authService, mergedOptions);
    }

    return isAuth.pipe(
      map((authenticated) =>
        handleAuthResult(authenticated, route, state, router, logger, authService, mergedOptions)
      ),
      catchError((error) => {
        logger.error('Error checking authentication', error);
        return of(router.createUrlTree([mergedOptions.redirectUrl]));
      })
    );
  };
}

/**
 * Create an authentication guard for child routes
 */
export function authGuardChild(options: AuthGuardOptions = {}): CanActivateChildFn {
  return authGuard(options);
}

/**
 * Create an authentication guard for route matching
 */
export function authGuardMatch(options: AuthGuardOptions = {}): CanMatchFn {
  const mergedOptions = { ...DEFAULT_OPTIONS, ...options };

  return (route: Route, segments: UrlSegment[]) => {
    const authService = inject(AUTH_SERVICE, { optional: true });
    const router = inject(Router);
    const logger = inject(LoggerService);

    if (!authService) {
      logger.error('Auth service not provided.');
      return router.createUrlTree([mergedOptions.redirectUrl]);
    }

    const isAuth = authService.isAuthenticated();

    if (typeof isAuth === 'boolean') {
      if (!isAuth) {
        logger.debug('User not authenticated, redirecting');
        if (mergedOptions.onUnauthorized) {
          mergedOptions.onUnauthorized(route);
        }
        return router.createUrlTree([mergedOptions.redirectUrl]);
      }
      return true;
    }

    return isAuth.pipe(
      map((authenticated) => {
        if (!authenticated) {
          logger.debug('User not authenticated, redirecting');
          if (mergedOptions.onUnauthorized) {
            mergedOptions.onUnauthorized(route);
          }
          return router.createUrlTree([mergedOptions.redirectUrl]);
        }
        return true;
      }),
      catchError(() => of(router.createUrlTree([mergedOptions.redirectUrl])))
    );
  };
}

/**
 * Handle authentication result
 */
function handleAuthResult(
  authenticated: boolean,
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot,
  router: Router,
  logger: LoggerService,
  authService: AuthServiceInterface,
  options: AuthGuardOptions
): boolean | UrlTree {
  if (authenticated) {
    logger.debug('User authenticated, allowing access', { url: state.url });
    return true;
  }

  logger.debug('User not authenticated, redirecting', { url: state.url });

  if (options.onUnauthorized) {
    options.onUnauthorized(route, state);
  }

  if (options.passReturnUrl) {
    // Store the attempted URL for redirecting after login
    const returnUrl = state.url;
    return router.createUrlTree([options.redirectUrl], {
      queryParams: { returnUrl },
    });
  }

  return router.createUrlTree([options.redirectUrl]);
}

/**
 * Permission guard options
 */
export interface PermissionGuardOptions extends AuthGuardOptions {
  /** Required permissions (all must be present) */
  permissions?: string[];
  /** Required roles (any one must be present) */
  roles?: string[];
  /** Redirect URL when permission denied */
  forbiddenUrl?: string;
}

/**
 * Permission service interface
 */
export interface PermissionServiceInterface extends AuthServiceInterface {
  hasPermission(permission: string): Observable<boolean> | boolean;
  hasAnyRole(roles: string[]): Observable<boolean> | boolean;
  hasAllPermissions(permissions: string[]): Observable<boolean> | boolean;
}

export const PERMISSION_SERVICE = new InjectionToken<PermissionServiceInterface>('PERMISSION_SERVICE');

/**
 * Create a permission guard
 *
 * @example
 * ```typescript
 * // In your routes
 * export const routes: Routes = [
 *   {
 *     path: 'admin',
 *     component: AdminComponent,
 *     canActivate: [permissionGuard({ permissions: ['admin:read'] })],
 *   },
 * ];
 * ```
 */
export function permissionGuard(options: PermissionGuardOptions): CanActivateFn {
  const mergedOptions = {
    ...DEFAULT_OPTIONS,
    forbiddenUrl: '/forbidden',
    ...options,
  };

  return (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
    const permService = inject(PERMISSION_SERVICE, { optional: true });
    const router = inject(Router);
    const logger = inject(LoggerService);

    if (!permService) {
      logger.error('Permission service not provided.');
      return router.createUrlTree([mergedOptions.redirectUrl]);
    }

    // First check authentication
    const isAuth = permService.isAuthenticated();

    const checkPermissions = (authenticated: boolean): boolean | UrlTree | Observable<boolean | UrlTree> => {
      if (!authenticated) {
        logger.debug('User not authenticated');
        return router.createUrlTree([mergedOptions.redirectUrl], {
          queryParams: mergedOptions.passReturnUrl ? { returnUrl: state.url } : {},
        });
      }

      // Check roles if specified
      if (mergedOptions.roles && mergedOptions.roles.length > 0) {
        const hasRole = permService.hasAnyRole(mergedOptions.roles);

        if (typeof hasRole === 'boolean') {
          if (!hasRole) {
            logger.debug('User lacks required role', { roles: mergedOptions.roles });
            return router.createUrlTree([mergedOptions.forbiddenUrl]);
          }
        } else {
          return hasRole.pipe(
            map((result) => {
              if (!result) {
                logger.debug('User lacks required role', { roles: mergedOptions.roles });
                return router.createUrlTree([mergedOptions.forbiddenUrl]);
              }
              return true;
            })
          );
        }
      }

      // Check permissions if specified
      if (mergedOptions.permissions && mergedOptions.permissions.length > 0) {
        const hasPerms = permService.hasAllPermissions(mergedOptions.permissions);

        if (typeof hasPerms === 'boolean') {
          if (!hasPerms) {
            logger.debug('User lacks required permissions', { permissions: mergedOptions.permissions });
            return router.createUrlTree([mergedOptions.forbiddenUrl]);
          }
          return true;
        }

        return hasPerms.pipe(
          map((result) => {
            if (!result) {
              logger.debug('User lacks required permissions', { permissions: mergedOptions.permissions });
              return router.createUrlTree([mergedOptions.forbiddenUrl]);
            }
            return true;
          })
        );
      }

      return true;
    };

    if (typeof isAuth === 'boolean') {
      return checkPermissions(isAuth);
    }

    return isAuth.pipe(
      switchMap((authenticated) => {
        const result = checkPermissions(authenticated);
        if (result instanceof Observable) {
          return result;
        }
        return of(result);
      }),
      catchError((error) => {
        logger.error('Error checking permissions', error);
        return of(router.createUrlTree([mergedOptions.redirectUrl]));
      })
    );
  };
}
