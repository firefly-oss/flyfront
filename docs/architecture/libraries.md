# Libraries Reference

This document provides detailed documentation for each library in the Flyfront monorepo. All APIs documented here match the actual implementation in the codebase.

## Table of Contents

- [@flyfront/core](#flyfrontcore)
- [@flyfront/ui](#flyfrontui)
- [@flyfront/auth](#flyfrontauth)
- [@flyfront/data-access](#flyfrontdata-access)
- [@flyfront/state](#flyfrontstate)
- [@flyfront/i18n](#flyfronti18n)
- [@flyfront/testing](#flyfronttesting)

---

## @flyfront/core

**Purpose**: Core utilities, services, guards, interceptors, and shared types that form the foundation of every Flyfront application.

**Path**: `libs/core`

**Layer**: Foundation

### Public API Exports

```typescript
// Models
export * from './lib/models/core.models';

// Services
export * from './lib/services/config.service';
export * from './lib/services/logger.service';
export * from './lib/services/storage.service';

// Interceptors
export * from './lib/interceptors/error.interceptor';
export * from './lib/interceptors/auth.interceptor';

// Guards
export * from './lib/guards/auth.guard';

// Utils
export * from './lib/utils/type-guards';
```

### Core Models

The library exports numerous TypeScript interfaces used throughout the application:

```typescript
// Application configuration
interface AppConfig {
  appName: string;
  version: string;
  environment: Environment;  // 'development' | 'staging' | 'production'
  apiBaseUrl: string;
  auth: AuthConfig;
  features: Record<string, boolean>;
  logging: LoggingConfig;
  custom?: Record<string, unknown>;
}

// Authentication configuration
interface AuthConfig {
  provider: 'oidc' | 'oauth2' | 'basic' | 'custom';
  issuerUrl?: string;
  clientId?: string;
  redirectUri?: string;
  postLogoutRedirectUri?: string;
  scopes?: string[];
  tokenStorage?: 'localStorage' | 'sessionStorage' | 'memory';
  autoRefresh?: boolean;
  refreshThreshold?: number;
}

// Logging configuration
interface LoggingConfig {
  level: LogLevel;  // 'debug' | 'info' | 'warn' | 'error' | 'off'
  console: boolean;
  remote?: boolean;
  remoteEndpoint?: string;
  timestamps?: boolean;
  stackTraces?: boolean;
}

// User model
interface User {
  id: string;
  username: string;
  email: string;
  displayName?: string;
  roles: string[];
  permissions: string[];
  attributes?: Record<string, unknown>;
  avatarUrl?: string;
  isActive: boolean;
  lastLogin?: Date;
}

// Paginated response
interface PaginatedResponse<T> {
  items: T[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

// API response wrapper
interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  errors?: ApiError[];
  meta?: ResponseMeta;
}
```

### ConfigService

The ConfigService manages application-wide configuration with reactive updates. It uses Angular's dependency injection system and provides both synchronous and observable access to configuration values.

**Key Features:**
- Reactive configuration updates via RxJS
- Environment-aware settings
- Feature flag management
- API URL building
- Custom configuration storage

```typescript
import { ConfigService, provideConfig, APP_CONFIG } from '@flyfront/core';

// Provider function for app configuration
export const appConfig: ApplicationConfig = {
  providers: [
    provideConfig({
      appName: 'My App',
      version: '1.0.0',
      environment: 'production',
      apiBaseUrl: 'https://api.example.com',
      auth: {
        provider: 'oidc',
        clientId: 'my-client',
      },
      features: { darkMode: true },
      logging: { level: 'info', console: true },
    }),
  ],
};

// Usage in components or services
@Injectable()
export class MyService {
  private config = inject(ConfigService);

  doSomething() {
    // Get specific config value by key
    const apiUrl = this.config.get('apiBaseUrl');
    
    // Get full config snapshot (synchronous)
    const snapshot = this.config.snapshot;
    
    // Subscribe to config changes (observable)
    this.config.config.subscribe(config => console.log(config));
    
    // Environment checks
    if (this.config.isDevelopment) { /* development-only code */ }
    if (this.config.isProduction) { /* production-only code */ }
    
    // Feature flags
    if (this.config.isFeatureEnabled('darkMode')) { /* ... */ }
    this.config.enableFeature('newFeature');
    this.config.disableFeature('oldFeature');
    
    // Build API URL from path
    const url = this.config.getApiUrl('users'); // https://api.example.com/users
    
    // Custom configuration values
    this.config.setCustom('myKey', { value: 123 });
    const custom = this.config.getCustom<{ value: number }>('myKey');
  }
}
```

### LoggerService

The LoggerService provides structured logging with configurable levels, console output styling, and optional remote logging support. Log entries are buffered for debugging purposes.

**Key Features:**
- Four log levels: debug, info, warn, error
- Colored console output
- Context attachment to log messages
- Log buffer for recent entries
- Child logger creation with prefixes
- Remote logging support

```typescript
import { LoggerService, ChildLogger } from '@flyfront/core';

@Injectable()
export class MyService {
  private logger = inject(LoggerService);

  doSomething() {
    // Log at different levels with optional context
    this.logger.debug('Debug message', { data: 'value' });
    this.logger.info('User logged in', { userId: '123' });
    this.logger.warn('Deprecated API used');
    this.logger.error('Failed to fetch data', error, { endpoint: '/api/users' });
    
    // Create a child logger with prefix
    const childLogger: ChildLogger = this.logger.createChild('MyService');
    childLogger.info('Message'); // Outputs: [MyService] Message
    
    // Check if level is enabled (based on config)
    if (this.logger.isLevelEnabled('debug')) { /* ... */ }
    
    // Get recent log entries from buffer
    const recentLogs = this.logger.getRecentLogs(10);
    
    // Clear the log buffer
    this.logger.clearBuffer();
  }
}
```

### StorageService

The StorageService provides a unified interface for browser storage (localStorage, sessionStorage) and in-memory storage, with support for TTL (time-to-live) expiration and versioned cache invalidation.

**Key Features:**
- Automatic storage type selection based on availability
- TTL-based expiration
- Version-based cache invalidation
- Prefixed keys to avoid collisions
- Get-or-set pattern for caching

```typescript
import { StorageService, StorageOptions, StorageType } from '@flyfront/core';

@Injectable()
export class MyService {
  private storage = inject(StorageService);

  doSomething() {
    // Store with TTL (expires after 1 hour)
    this.storage.set('user', userData, { ttl: 3600000 });
    
    // Store in session storage instead of local storage
    this.storage.set('temp', data, { storage: 'session' });
    
    // Store with version for cache invalidation
    this.storage.set('config', config, { version: 2 });
    
    // Retrieve value (returns undefined if expired or version mismatch)
    const user = this.storage.get<User>('user');
    
    // Check existence (accounts for expiration)
    if (this.storage.has('user')) { /* ... */ }
    
    // Remove specific key
    this.storage.remove('user');
    
    // Clear all Flyfront-prefixed storage
    this.storage.clear();
    
    // Get all keys
    const keys = this.storage.keys();
    
    // Cache pattern - get existing or create new
    const data = this.storage.getOrSet('key', () => computeValue(), { ttl: 60000 });
    
    // Async cache pattern
    const asyncData = await this.storage.getOrSetAsync('key', async () => fetchData());
  }
}
```

### Guards

#### authGuard

The authGuard protects routes requiring authentication. It injects the AUTH_SERVICE token to check authentication status and handles redirects appropriately.

```typescript
import { authGuard, authGuardChild, authGuardMatch, AuthGuardOptions, AUTH_SERVICE } from '@flyfront/core';

// Basic usage
export const routes: Routes = [
  {
    path: 'dashboard',
    loadComponent: () => import('./dashboard.component'),
    canActivate: [authGuard()],
  },
];

// With options
export const routes: Routes = [
  {
    path: 'profile',
    loadComponent: () => import('./profile.component'),
    canActivate: [authGuard({
      redirectUrl: '/login',           // Where to redirect if not authenticated
      passReturnUrl: true,             // Pass original URL as returnUrl query param
      onUnauthorized: (route, state) => {
        console.log('Unauthorized access to:', state.url);
      },
    })],
  },
];

// Guard variants
canActivate: [authGuard()]          // Route activation
canActivateChild: [authGuardChild()] // Child route activation
canMatch: [authGuardMatch()]         // Route matching
```

#### permissionGuard

The permissionGuard extends authentication checking with role and permission verification. It uses the PERMISSION_SERVICE token.

```typescript
import { permissionGuard, PermissionGuardOptions, PERMISSION_SERVICE } from '@flyfront/core';

export const routes: Routes = [
  {
    path: 'admin',
    loadComponent: () => import('./admin.component'),
    canActivate: [permissionGuard({
      permissions: ['admin:read', 'admin:write'], // All required
      roles: ['admin', 'superuser'],              // Any one required
      forbiddenUrl: '/forbidden',                 // Redirect when lacking permission
      redirectUrl: '/login',                      // Redirect when not authenticated
    })],
  },
];
```

### Interceptors

#### httpErrorInterceptor

A functional HTTP interceptor providing centralized error handling with automatic retry logic using exponential backoff.

**Key Features:**
- Retries on transient errors (408, 429, 500, 502, 503, 504)
- Exponential backoff (1s, 2s, 4s with max 3 retries)
- Error logging via LoggerService
- Consistent error response transformation

```typescript
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { httpErrorInterceptor, HttpErrorInterceptor, provideHttpErrorInterceptor } from '@flyfront/core';

// Functional interceptor (recommended)
export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(
      withInterceptors([httpErrorInterceptor])
    ),
  ],
};

// Class-based interceptor (deprecated)
export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpErrorInterceptor(),
  ],
};
```

#### authTokenInterceptor

A configurable functional interceptor that adds authentication tokens to outgoing HTTP requests.

```typescript
import { authTokenInterceptor, simpleAuthInterceptor, TOKEN_PROVIDER, TokenProvider } from '@flyfront/core';

// Full configuration
export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(
      withInterceptors([
        authTokenInterceptor({
          headerName: 'Authorization',        // Default
          tokenPrefix: 'Bearer',              // Default
          excludeUrls: ['/api/auth/login', '/api/public'],
          refreshOnUnauthorized: true,
        })
      ])
    ),
    { provide: TOKEN_PROVIDER, useExisting: TokenService },
  ],
};

// Simple interceptor (just adds Bearer token)
withInterceptors([simpleAuthInterceptor])
```

### Type Guards

The library provides runtime type checking utilities for safer type narrowing.

```typescript
import {
  // Basic type guards
  isDefined, isNullOrUndefined, isString, isNonEmptyString,
  isNumber, isBoolean, isObject, isArray, isNonEmptyArray,
  isFunction, isDate, isISODateString, isPromise, isError,
  
  // Domain-specific type guards
  isApiResponse, isApiError, isUser, isTokenPayload, isPaginatedResponse,
  
  // Property checks
  hasProperty, hasProperties,
  
  // Assertions (throw on failure)
  assert, assertDefined, assertString, assertNumber,
  
  // Narrowing helpers
  narrow, narrowOrThrow
} from '@flyfront/core';

// Type checking examples
if (isString(value)) {
  // TypeScript now knows value is string
}

if (isObject(value) && hasProperty(value, 'id')) {
  // value has an 'id' property
}

if (isPaginatedResponse(response)) {
  // response has pagination fields
  console.log(response.totalItems);
}

// Assertions throw Error on failure
assertDefined(value, 'Value must be defined');
assert(count > 0, 'Count must be positive');

// Narrowing returns undefined if guard fails
const user = narrow(data, isUser); // User | undefined

// Narrowing throws if guard fails
const user = narrowOrThrow(data, isUser, 'Invalid user data'); // User
```

---

## @flyfront/ui

**Purpose**: Design system and reusable UI components built with Angular standalone components.

**Path**: `libs/ui`

**Layer**: Foundation

### Public API Exports

The library exports design tokens and a comprehensive set of UI components:

```typescript
// Design Tokens
export * from './lib/tokens/design-tokens';

// Form Components
export * from './lib/components/button/button.component';
export * from './lib/components/input/input.component';
export * from './lib/components/select/select.component';
export * from './lib/components/textarea/textarea.component';
export * from './lib/components/checkbox/checkbox.component';
export * from './lib/components/radio/radio.component';
export * from './lib/components/switch/switch.component';

// Feedback Components
export * from './lib/components/dialog/dialog.component';
export * from './lib/components/toast/toast.component';
export * from './lib/components/alert/alert.component';
export * from './lib/components/progress/progress.component';

// Data Display Components
export * from './lib/components/card/card.component';
export * from './lib/components/data-table/data-table.component';
export * from './lib/components/pagination/pagination.component';
export * from './lib/components/badge/badge.component';
export * from './lib/components/avatar/avatar.component';
export * from './lib/components/tooltip/tooltip.component';

// Navigation Components
export * from './lib/components/tabs/tabs.component';
export * from './lib/components/breadcrumb/breadcrumb.component';
export * from './lib/components/stepper/stepper.component';
export * from './lib/components/menu/menu.component';

// Layout Components
export * from './lib/components/loading/loading.component';
export * from './lib/components/app-shell/app-shell.component';
```

### Design Tokens

Design tokens define the visual language of the design system. They can be accessed programmatically:

```typescript
import { designTokens, colors, typography, spacing, borderRadius, shadows, zIndex, transitions, breakpoints, components } from '@flyfront/ui';

// Color access
console.log(colors.primary[500]);        // '#2196f3'
console.log(colors.firefly[500]);        // '#f9a825' (brand color)
console.log(colors.success[500]);        // '#4caf50'

// Typography
console.log(typography.fontSize.base);   // '1rem'
console.log(typography.fontWeight.bold); // 700
console.log(typography.fontFamily.sans); // Inter font stack

// Spacing (based on 4px scale)
console.log(spacing[4]);                 // '1rem' (16px)

// Component-specific tokens
console.log(components.button.height.md); // '2.5rem'
console.log(components.input.height.md);  // '2.5rem'
```

### ButtonComponent

A versatile button component with multiple variants, sizes, and states.

```html
<fly-button variant="primary" size="md">Click me</fly-button>
<fly-button variant="outline" [loading]="true">Loading...</fly-button>
<fly-button variant="danger" [disabled]="true">Disabled</fly-button>
<fly-button variant="ghost" fullWidth>Full Width</fly-button>
<fly-button variant="success" iconOnly [icon]="iconHtml">
  <span class="sr-only">Save</span>
</fly-button>
```

**Inputs:**

| Input | Type | Default | Description |
|-------|------|---------|-------------|
| variant | `'primary' \| 'secondary' \| 'outline' \| 'ghost' \| 'danger' \| 'success'` | `'primary'` | Visual style |
| size | `'xs' \| 'sm' \| 'md' \| 'lg' \| 'xl'` | `'md'` | Button size |
| type | `'button' \| 'submit' \| 'reset'` | `'button'` | HTML button type |
| disabled | `boolean` | `false` | Disabled state |
| loading | `boolean` | `false` | Shows spinner, disables button |
| fullWidth | `boolean` | `false` | Expands to container width |
| iconOnly | `boolean` | `false` | Square button for icon-only |
| icon | `string` | - | HTML content for icon |
| iconPosition | `'left' \| 'right'` | `'left'` | Icon placement |

**Outputs:**

| Output | Type | Description |
|--------|------|-------------|
| clicked | `EventEmitter<MouseEvent>` | Emitted on click when not disabled/loading |

### InputComponent

A form input component with ControlValueAccessor support for use with ngModel or reactive forms.

```html
<fly-input
  label="Email"
  type="email"
  placeholder="Enter your email"
  [(ngModel)]="email"
  [error]="emailError"
  hint="We'll never share your email"
  required
  clearable
/>

<fly-input
  label="Password"
  type="password"
  [formControl]="passwordControl"
/>
```

**Inputs:**

| Input | Type | Default | Description |
|-------|------|---------|-------------|
| type | `'text' \| 'password' \| 'email' \| 'number' \| 'tel' \| 'url' \| 'search'` | `'text'` | Input type |
| size | `'sm' \| 'md' \| 'lg'` | `'md'` | Input height |
| label | `string` | - | Label text above input |
| placeholder | `string` | `''` | Placeholder text |
| hint | `string` | - | Helper text below input |
| error | `string` | - | Error message (shows in red) |
| prefixIcon | `string` | - | HTML content for left icon |
| suffixIcon | `string` | - | HTML content for right icon |
| disabled | `boolean` | `false` | Disabled state |
| readonly | `boolean` | `false` | Read-only state |
| required | `boolean` | `false` | Shows required indicator |
| clearable | `boolean` | `false` | Shows clear button when has value |

**Outputs:**

| Output | Type | Description |
|--------|------|-------------|
| valueChange | `EventEmitter<string>` | Emitted when value changes |
| inputFocus | `EventEmitter<void>` | Emitted on focus |
| inputBlur | `EventEmitter<void>` | Emitted on blur |

### CardComponent

A content container with optional header, content, and footer sections.

```html
<fly-card padding="md" elevated interactive>
  <fly-card-header>
    <h3>Card Title</h3>
  </fly-card-header>
  <fly-card-content>
    Card content goes here.
  </fly-card-content>
  <fly-card-footer>
    <fly-button variant="primary">Action</fly-button>
  </fly-card-footer>
</fly-card>
```

**CardComponent Inputs:**

| Input | Type | Default | Description |
|-------|------|---------|-------------|
| padding | `'none' \| 'sm' \| 'md' \| 'lg'` | `'md'` | Content padding |
| elevated | `boolean` | `false` | Adds shadow, removes border |
| outlined | `boolean` | `true` | Shows border |
| interactive | `boolean` | `false` | Adds hover effects |

---

## @flyfront/auth

**Purpose**: Authentication and authorization functionality with OIDC/OAuth2 support.

**Path**: `libs/auth`

**Layer**: Feature

### Public API Exports

```typescript
// Services
export * from './lib/services/auth.service';
export * from './lib/services/token.service';
```

### AuthService

A signal-based authentication service managing user authentication state, permissions, and roles.

**Key Features:**
- Signal-based reactive state
- OIDC callback handling
- Role and permission checking
- Token refresh support
- Observable for RxJS interop

```typescript
import { AuthService, AuthState, LoginOptions } from '@flyfront/auth';

@Component({...})
export class MyComponent {
  private auth = inject(AuthService);

  // Reactive signals (use in templates with signal syntax)
  isAuthenticated = this.auth.isAuthenticated;  // Signal<boolean>
  isLoading = this.auth.isLoading;              // Signal<boolean>
  user = this.auth.user;                        // Signal<User | null>
  roles = this.auth.roles;                      // Signal<string[]>
  permissions = this.auth.permissions;          // Signal<string[]>
  error = this.auth.error;                      // Signal<string | null>

  // Observable for RxJS subscriptions
  isAuthenticated$ = this.auth.isAuthenticated$; // BehaviorSubject<boolean>

  login() {
    this.auth.login({
      returnUrl: '/dashboard',
      prompt: 'login',  // 'none' | 'login' | 'consent' | 'select_account'
      loginHint: 'user@example.com',
    });
  }

  logout() {
    this.auth.logout('/login');
  }

  // Check authentication synchronously
  checkAuth() {
    return this.auth.checkAuthentication();
  }

  // Permission checks (return boolean)
  canEdit = this.auth.hasPermission('users:edit');
  canAdmin = this.auth.hasAllPermissions(['users:edit', 'users:delete']);
  hasAnyAccess = this.auth.hasAnyPermission(['read', 'write']);
  
  // Role checks (return boolean)
  isAdmin = this.auth.hasRole('admin');
  isStaff = this.auth.hasAnyRole(['admin', 'manager']);

  // Get user attribute
  department = this.auth.getUserAttribute<string>('department');
}
```

### TokenService

JWT token management service for storing, retrieving, and validating tokens.

```typescript
import { TokenService, TokenData } from '@flyfront/auth';

@Injectable()
export class MyService {
  private tokenService = inject(TokenService);

  manageTokens() {
    // Set tokens after authentication
    this.tokenService.setTokens({
      accessToken: 'eyJ...',
      refreshToken: 'eyJ...',   // optional
      idToken: 'eyJ...',        // optional
      expiresAt: Date.now() + 3600000,
    });

    // Get individual tokens
    const accessToken = this.tokenService.getAccessToken();   // string | undefined
    const refreshToken = this.tokenService.getRefreshToken(); // string | undefined
    const idToken = this.tokenService.getIdToken();           // string | undefined
    const expiresAt = this.tokenService.getExpiresAt();       // number | undefined

    // Check expiration (includes 1 minute buffer)
    if (this.tokenService.isTokenExpired(accessToken)) {
      // Token is expired or will expire within 1 minute
    }
    
    // Check if token will expire soon (within 5 minutes)
    if (this.tokenService.willExpireSoon(accessToken, 300)) {
      // Should refresh token
    }

    // Decode token payload
    const payload = this.tokenService.decodeToken(accessToken);
    console.log(payload.sub, payload.exp);
    
    // Get all claims
    const claims = this.tokenService.getTokenClaims();
    
    // Get specific claim
    const userId = this.tokenService.getClaim<string>('sub');
    const roles = this.tokenService.getClaim<string[]>('roles');
    
    // Get time until expiry in seconds
    const secondsRemaining = this.tokenService.getTimeUntilExpiry();

    // Clear all tokens (on logout)
    this.tokenService.clearTokens();
  }
}
```

---

## @flyfront/data-access

**Purpose**: HTTP client utilities, API communication, and reactive data patterns including polling, SSE, and caching.

**Path**: `libs/data-access`

**Layer**: Feature

### Public API Exports

```typescript
// Models
export * from './lib/models/data-access.models';

// Services
export * from './lib/services/api.service';
export * from './lib/services/websocket.service';
export * from './lib/services/cache.service';
```

### Key Types

```typescript
// Pagination
interface PaginationParams {
  page?: number;
  pageSize?: number;
  sort?: string;
  sortDirection?: 'asc' | 'desc';
}

interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

// Request configuration
interface RequestConfig {
  headers?: HttpHeaders | Record<string, string | string[]>;
  params?: HttpParams | Record<string, string | number | boolean | string[]>;
  withCredentials?: boolean;
  reportProgress?: boolean;
  responseType?: 'json' | 'text' | 'blob' | 'arraybuffer';
  skipAuth?: boolean;
  skipErrorHandler?: boolean;
  cache?: CacheConfig;
}

interface CacheConfig {
  enabled: boolean;
  ttl?: number;     // Time to live in milliseconds
  key?: string;     // Custom cache key
}

// Polling configuration
interface PollingConfig {
  interval?: number;          // default: 30000ms
  immediate?: boolean;        // default: true
  emitOnlyOnChange?: boolean; // default: false
  compareFn?: <T>(prev: T, curr: T) => boolean;
  continueOnError?: boolean;  // default: false
  id?: string;                // For stopping specific polls
}

// SSE configuration
interface SSEConfig {
  id?: string;
  withCredentials?: boolean;
  continueOnError?: boolean;
  parseJson?: boolean;        // default: true
  eventTypes?: string[];
}

interface SSEMessage<T> {
  type: string;
  data: T;
  lastEventId: string;
  origin: string;
}

// Retry configuration
interface RetryConfig {
  maxRetries: number;
  retryDelay: number;
  retryStatuses: number[];
  exponentialBackoff?: boolean;
}
```

### ApiService

The ApiService provides a type-safe HTTP client wrapper with support for standard REST operations and reactive data patterns.

#### Basic CRUD Operations

```typescript
import { ApiService, RequestConfig, PaginationParams, PaginatedResponse } from '@flyfront/data-access';

@Injectable()
export class UserService {
  private api = inject(ApiService);

  // GET request
  getUser(id: string) {
    return this.api.get<User>(`/users/${id}`);
  }

  // GET with caching
  getUsers() {
    return this.api.get<User[]>('/users', {
      cache: { enabled: true, ttl: 60000 }
    });
  }

  // GET paginated
  getUsersPaginated(params: PaginationParams) {
    return this.api.getPaginated<User>('/users', params);
  }

  // POST
  createUser(data: CreateUserDto) {
    return this.api.post<User>('/users', data);
  }

  // PUT (full replacement)
  replaceUser(id: string, data: User) {
    return this.api.put<User>(`/users/${id}`, data);
  }

  // PATCH (partial update)
  updateUser(id: string, data: Partial<User>) {
    return this.api.patch<User>(`/users/${id}`, data);
  }

  // DELETE
  deleteUser(id: string) {
    return this.api.delete<void>(`/users/${id}`);
  }

  // File upload with progress
  uploadAvatar(file: File) {
    return this.api.upload<{ url: string }>('/users/avatar', file);
    // Emits UploadProgress objects and finally the response
  }

  // File download
  downloadReport() {
    return this.api.download('/reports/latest');
    // Returns Observable<Blob>
  }
}
```

#### Polling

Poll an endpoint at regular intervals with optional change detection:

```typescript
// Basic polling every 30 seconds
const status$ = this.api.poll<Status>('/status', {
  interval: 30000,
});

// Poll with options
const data$ = this.api.poll<Data>('/data', {
  interval: 10000,
  immediate: true,           // Emit immediately, then poll
  emitOnlyOnChange: true,    // Only emit when data changes
  continueOnError: true,     // Keep polling after errors
  id: 'data-poll',           // Identifier for stopping
  compareFn: (prev, curr) => prev.version === curr.version,
});

// Stop specific poll
this.api.stopPoll('data-poll');

// Stop all polls
this.api.stopAllPolls();
```

#### Server-Sent Events (SSE)

Connect to SSE endpoints for real-time updates:

```typescript
const events$ = this.api.sse<Notification>('/events', {
  id: 'notifications',
  eventTypes: ['create', 'update', 'delete'],
  withCredentials: true,
  parseJson: true,
  continueOnError: true,
});

events$.subscribe(event => {
  console.log(event.type);   // 'create', 'update', etc.
  console.log(event.data);   // Parsed notification object
});

// Close specific connection
this.api.closeSSE('notifications');

// Close all SSE connections
this.api.closeAllSSE();
```

#### Retry with Exponential Backoff

Execute requests with automatic retry on failure:

```typescript
this.api.withRetry(
  () => this.api.get('/unstable-endpoint'),
  {
    maxRetries: 5,
    retryDelay: 1000,
    retryStatuses: [500, 502, 503, 504],
    exponentialBackoff: true,  // 1s, 2s, 4s, 8s...
  }
).subscribe(data => console.log(data));
```

#### Reactive Streams

Create auto-refreshing data streams with manual refresh capability:

```typescript
const [users$, refresh] = this.api.createReactiveStream<User[]>('/users', {
  retry: { maxRetries: 2, retryDelay: 1000 },
  shareReplay: true,
  emitErrorAsValue: false,
});

users$.subscribe(users => this.users = users);

// Trigger manual refresh
refresh();
```

#### Paginated Streams (Infinite Scroll)

Create paginated streams with load-more functionality:

```typescript
const stream = this.api.createPaginatedStream<User>('/users', {
  pageSize: 20,
  initialPage: 1,
});

// Subscribe to state
stream.data$.subscribe(users => this.users = users);
stream.loading$.subscribe(loading => this.loading = loading);
stream.hasMore$.subscribe(hasMore => this.canLoadMore = hasMore);
stream.error$.subscribe(error => this.error = error);

// Load next page
stream.loadMore();

// Reset to first page
stream.reset();

// Cleanup when done
stream.destroy();
```

#### Optimistic Updates

Apply updates immediately and rollback on failure:

```typescript
this.api.optimisticUpdate(
  () => this.api.put('/users/1', updatedUser),  // Actual request
  () => this.store.update(updatedUser),          // Apply optimistically
  () => this.store.update(originalUser)          // Rollback on error
).subscribe({
  next: () => console.log('Update confirmed'),
  error: () => console.log('Rolled back'),
});
```

#### Request Batching

Execute multiple requests in parallel or sequence:

```typescript
// Parallel execution (default)
this.api.batch([
  () => this.api.get<User[]>('/users'),
  () => this.api.get<Role[]>('/roles'),
  () => this.api.get<Permission[]>('/permissions'),
]).subscribe(([users, roles, permissions]) => {
  // All completed
});

// Sequential execution
this.api.batch([...], { sequential: true }).subscribe(results => {
  // Executed one after another
});
```

#### Cleanup

```typescript
// Clean up all connections and cache
this.api.dispose();

// Clear cache only
this.api.clearCache();
this.api.clearCache('specific-key');
```

---

## @flyfront/state

**Purpose**: State management utilities for both NgRx store and signal-based local state.

**Path**: `libs/state`

**Layer**: Feature

### Public API Exports

```typescript
// Models
export * from './lib/models/state.models';

// Entity Feature
export * from './lib/entity/entity-feature';

// Signal Store
export * from './lib/signal-store/signal-store';

// Providers
export * from './lib/providers/state.providers';
```

### createEntityFeature

Creates a complete NgRx entity feature with actions, reducer, and selectors. Entities must have a string `id` property.

```typescript
import { createEntityFeature, EntityFeatureConfig } from '@flyfront/state';

interface User {
  id: string;  // Required: must be string
  name: string;
  email: string;
}

export const usersFeature = createEntityFeature<User>({
  name: 'users',
  selectId: (user) => user.id,
  sortComparer: (a, b) => a.name.localeCompare(b.name),
});
```

**Generated Actions:**

```typescript
// Load operations
usersFeature.actions.load()
usersFeature.actions.loadSuccess({ entities: User[] })
usersFeature.actions.loadFailure({ error: string })

// Load single entity
usersFeature.actions.loadOne({ id: string })
usersFeature.actions.loadOneSuccess({ entity: User })
usersFeature.actions.loadOneFailure({ error: string })

// Create
usersFeature.actions.addOne({ entity: User })
usersFeature.actions.addOneSuccess({ entity: User })
usersFeature.actions.addOneFailure({ error: string })

// Update
usersFeature.actions.updateOne({ id: string, changes: Partial<User> })
usersFeature.actions.updateOneSuccess({ id: string, changes: Partial<User> })
usersFeature.actions.updateOneFailure({ error: string })

// Delete
usersFeature.actions.removeOne({ id: string })
usersFeature.actions.removeOneSuccess({ id: string })
usersFeature.actions.removeOneFailure({ error: string })

// Selection
usersFeature.actions.selectOne({ id: string | null })
usersFeature.actions.clearSelection()

// Bulk
usersFeature.actions.setAll({ entities: User[] })
usersFeature.actions.clearAll()
usersFeature.actions.clearError()
```

**Generated Selectors:**

```typescript
// From NgRx feature
usersFeature.selectUsersState
usersFeature.selectLoading
usersFeature.selectError
usersFeature.selectSelectedId

// Additional selectors
usersFeature.selectAll(state)
usersFeature.selectTotal(state)
usersFeature.selectById(id)(state)
usersFeature.selectSelected(state)
usersFeature.selectIsEmpty(state)
usersFeature.selectHasError(state)
```

**Usage in Component:**

```typescript
@Component({...})
export class UsersComponent {
  private store = inject(Store);
  
  users = this.store.selectSignal(usersFeature.selectAll);
  loading = this.store.selectSignal(usersFeature.selectLoading);
  error = this.store.selectSignal(usersFeature.selectError);
  
  loadUsers() {
    this.store.dispatch(usersFeature.actions.load());
  }
  
  addUser(user: User) {
    this.store.dispatch(usersFeature.actions.addOne({ entity: user }));
  }
}
```

### Signal Store Utilities

#### createSignalStore

Create a simple signal-based store with optional persistence:

```typescript
import { createSignalStore, SignalStoreConfig } from '@flyfront/state';

interface CounterState {
  count: number;
  lastUpdated: Date | null;
}

const counterStore = createSignalStore<CounterState>({
  initialState: { count: 0, lastUpdated: null },
  persistence: {
    key: 'counter',
    storage: 'local',  // 'local' | 'session'
  },
});

// Read state
const state = counterStore.state();        // Full state signal
const count = counterStore.select(s => s.count);  // Derived signal

// Update state
counterStore.update(s => ({ ...s, count: s.count + 1 }));
counterStore.patch({ lastUpdated: new Date() });
counterStore.set({ count: 0, lastUpdated: null });
counterStore.reset();
```

#### withAsync

Helper for managing async operation state:

```typescript
import { withAsync } from '@flyfront/state';

const userAsync = withAsync<User>();

// Signals
userAsync.data        // Signal<User | null>
userAsync.status      // Signal<'idle' | 'loading' | 'success' | 'error'>
userAsync.error       // Signal<string | null>
userAsync.isLoading   // Signal<boolean>
userAsync.isSuccess   // Signal<boolean>
userAsync.isError     // Signal<boolean>
userAsync.isIdle      // Signal<boolean>

// Actions
userAsync.setLoading();
userAsync.setSuccess(user);
userAsync.setError('Failed to load user');
userAsync.reset();
```

#### withPagination

Helper for pagination state:

```typescript
import { withPagination } from '@flyfront/state';

const pagination = withPagination(20);  // Initial page size

// Signals
pagination.page            // Signal<number>
pagination.pageSize        // Signal<number>
pagination.totalItems      // Signal<number>
pagination.totalPages      // Signal<number>
pagination.hasNextPage     // Signal<boolean>
pagination.hasPreviousPage // Signal<boolean>

// Actions
pagination.setPage(2);
pagination.setPageSize(50);
pagination.setTotals(100, 5);
pagination.nextPage();
pagination.previousPage();
pagination.reset();
```

#### withList

Combined list state with filtering, sorting, and pagination:

```typescript
import { withList } from '@flyfront/state';

interface UserFilters {
  role?: string;
  status?: string;
}

const listState = withList<UserFilters>({ role: 'all' }, 20);

// Pagination (same as withPagination)
listState.page, listState.pageSize, listState.hasNextPage, ...

// Filtering
listState.filters        // Signal<UserFilters>
listState.searchQuery    // Signal<string>
listState.setFilters({ role: 'admin' });
listState.clearFilters();
listState.setSearchQuery('john');

// Sorting
listState.sortBy         // Signal<string | null>
listState.sortDirection  // Signal<'asc' | 'desc'>
listState.setSort('name', 'asc');
listState.toggleSortDirection();
listState.clearSort();

listState.reset();
```

#### withEntities

Entity collection management with signals:

```typescript
import { withEntities } from '@flyfront/state';

interface User {
  id: string | number;  // Can be string or number
  name: string;
}

const entities = withEntities<User>();

// Signals
entities.all          // Signal<User[]>
entities.total        // Signal<number>
entities.selected     // Signal<User | null>
entities.isEmpty      // Signal<boolean>
entities.byId('1')    // Signal<User | null>

// Actions
entities.setAll(users);
entities.addOne(user);
entities.addMany(users);
entities.updateOne('1', { name: 'New Name' });
entities.removeOne('1');
entities.removeMany(['1', '2']);
entities.clear();
entities.select('1');
entities.clearSelection();
```

### Providers

```typescript
import { provideAppState, provideFeatureState, provideFeatureEffects, StateConfig } from '@flyfront/state';

// Root configuration in app.config.ts
export const appConfig: ApplicationConfig = {
  providers: [
    provideAppState({
      devTools: true,
      strictMode: true,
      reducers: {},          // Optional root reducers
      effects: [AppEffects], // Optional root effects
    }),
  ],
};

// Feature configuration (typically in lazy-loaded routes)
export const routes: Routes = [{
  path: 'users',
  providers: [
    provideFeatureState(usersFeature),
    provideFeatureEffects(UsersEffects),
  ],
  component: UsersComponent,
}];
```

---

## @flyfront/i18n

**Purpose**: Internationalization and localization using Transloco.

**Path**: `libs/i18n`

**Layer**: Feature

### Public API Exports

```typescript
// Models
export * from './lib/models/i18n.models';

// Services
export * from './lib/services/locale.service';

// Providers
export * from './lib/providers/i18n.providers';

// Loaders
export * from './lib/loaders/transloco-http.loader';

// Pipes
export * from './lib/pipes/locale.pipes';

// Re-exports from Transloco
export {
  TranslocoModule,
  TranslocoDirective,
  TranslocoPipe,
  TranslocoService,
  translate,
  translateObject,
} from '@jsverse/transloco';
```

### Key Types

```typescript
// Language definition
interface Language {
  code: string;
  name: string;
  nativeName: string;
  direction: 'ltr' | 'rtl';
}

// Available in LANGUAGES constant
const LANGUAGES: Record<string, Language>;
// Includes: en, es, fr, de, it, pt, nl, pl, ru, zh, ja, ko, ar, he

// I18n configuration
interface I18nConfig {
  defaultLang: string;
  availableLangs: string[];
  fallbackLang?: string;
  prodMode?: boolean;
  reRenderOnLangChange?: boolean;
  loaderUrl?: string;
}

// Formatting options
interface DateFormatOptions {
  dateStyle?: 'full' | 'long' | 'medium' | 'short';
  timeStyle?: 'full' | 'long' | 'medium' | 'short';
  weekday?: 'long' | 'short' | 'narrow';
  // ... other Intl.DateTimeFormat options
}

interface NumberFormatOptions {
  style?: 'decimal' | 'currency' | 'percent' | 'unit';
  currency?: string;
  // ... other Intl.NumberFormat options
}
```

### Configuration

```typescript
import { provideI18n, I18nConfig } from '@flyfront/i18n';

export const appConfig: ApplicationConfig = {
  providers: [
    provideI18n({
      defaultLang: 'en',
      availableLangs: ['en', 'es', 'de', 'fr'],
      fallbackLang: 'en',
      prodMode: environment.production,
      reRenderOnLangChange: true,
    }),
  ],
};
```

### LocaleService

Manages locale settings and provides formatting utilities:

```typescript
import { LocaleService, LANGUAGES, Language } from '@flyfront/i18n';

@Component({...})
export class MyComponent {
  private locale = inject(LocaleService);

  // Signals
  currentLang = this.locale.currentLang;           // Signal<string>
  availableLangs = this.locale.availableLangs;     // Signal<string[]>
  currentLanguage = this.locale.currentLanguage;   // Signal<Language | undefined>
  isRtl = this.locale.isRtl;                       // Signal<boolean>
  languages = this.locale.languages;               // Signal<Language[]>

  // Initialize with available languages
  ngOnInit() {
    this.locale.init(['en', 'es', 'de'], 'en');
  }

  changeLanguage(lang: string) {
    this.locale.setLanguage(lang);
  }

  // Get browser's preferred language
  browserLang = this.locale.getBrowserLang();

  // Formatting methods
  formatDate() {
    return this.locale.formatDate(new Date(), { dateStyle: 'long' });
  }

  formatNumber() {
    return this.locale.formatNumber(1234.56, { minimumFractionDigits: 2 });
  }

  formatCurrency() {
    return this.locale.formatCurrency(99.99, 'EUR', 'symbol');
  }

  formatPercent() {
    return this.locale.formatPercent(0.85, 2);  // "85.00%"
  }

  formatRelative() {
    return this.locale.formatRelativeTime(-2, 'day', 'long');  // "2 days ago"
  }

  getPluralCategory() {
    return this.locale.getPluralCategory(5);  // 'other'
  }

  formatList() {
    return this.locale.formatList(['a', 'b', 'c'], 'long', 'conjunction');
  }
}
```

### Locale Pipes

Standalone pipes for template-based formatting:

```typescript
import {
  LocaleDatePipe,
  LocaleNumberPipe,
  LocaleCurrencyPipe,
  LocalePercentPipe,
  RelativeTimePipe,
  LOCALE_PIPES,  // Array of all pipes
} from '@flyfront/i18n';
```

```html
<!-- Date formatting -->
{{ dateValue | localeDate }}
{{ dateValue | localeDate:'short' }}
{{ dateValue | localeDate:'long':'short' }}

<!-- Number formatting -->
{{ numberValue | localeNumber }}
{{ numberValue | localeNumber:2:4 }}

<!-- Currency formatting -->
{{ price | localeCurrency }}
{{ price | localeCurrency:'EUR' }}
{{ price | localeCurrency:'USD':'code' }}

<!-- Percentage -->
{{ ratio | localePercent }}
{{ ratio | localePercent:2 }}

<!-- Relative time -->
{{ -2 | relativeTime:'day' }}
{{ 1 | relativeTime:'hour':'short' }}
```

### Translation Usage

Using Transloco for translations:

```typescript
import { TranslocoPipe, TranslocoService, translate } from '@flyfront/i18n';

@Component({
  imports: [TranslocoPipe],
  template: `
    <h1>{{ 'home.title' | transloco }}</h1>
    <p>{{ 'home.greeting' | transloco:{ name: userName } }}</p>
  `,
})
export class HomeComponent {
  private transloco = inject(TranslocoService);
  
  changeLanguage(lang: string) {
    this.transloco.setActiveLang(lang);
  }
  
  // Programmatic translation
  getMessage() {
    return this.transloco.translate('home.title');
  }
}
```

---

## @flyfront/testing

**Purpose**: Testing utilities, mock services, and helpers for unit and integration tests.

**Path**: `libs/testing`

**Layer**: Foundation

### Public API Exports

```typescript
// Mock Services
export * from './lib/mocks/mock-services';

// Test Utilities
export * from './lib/utils/test-utils';
```

### Mock Function Utility

The library provides a Jest-like mock function implementation:

```typescript
import { createMockFn, MockFn } from '@flyfront/testing';

// Create a mock function
const mockFn = createMockFn<[string, number], string>((s, n) => `${s}-${n}`);

// Call it
mockFn('test', 42);  // Returns 'test-42'

// Check calls
console.log(mockFn.calls);  // [['test', 42]]

// Mock return value
mockFn.mockReturnValue('fixed');
mockFn('any', 0);  // Returns 'fixed'

// Mock resolved value (for async)
mockFn.mockResolvedValue('async-result');
await mockFn('x', 1);  // Returns Promise resolving to 'async-result'

// Clear call history
mockFn.mockClear();
```

### Mock Services

#### MockAuthService

```typescript
import { MockAuthService } from '@flyfront/testing';
import { AuthService } from '@flyfront/auth';

beforeEach(() => {
  TestBed.configureTestingModule({
    providers: [
      { provide: AuthService, useClass: MockAuthService },
    ],
  });
  
  const mockAuth = TestBed.inject(AuthService) as MockAuthService;
  
  // Configure state
  mockAuth.setAuthenticated(true);
  mockAuth.setUser({ id: '1', username: 'test', email: 'test@example.com', ... });
  mockAuth.setRoles(['admin', 'user']);
  mockAuth.setPermissions(['users:read', 'users:write']);
  mockAuth.setLoading(false);
  
  // Access signals
  mockAuth.isAuthenticated();  // true
  mockAuth.user();             // User object
  mockAuth.roles();            // ['admin', 'user']
  
  // Mock methods are available
  mockAuth.login.calls;        // Check call history
  mockAuth.hasRole('admin');   // true
});
```

#### MockApiService

```typescript
import { MockApiService } from '@flyfront/testing';
import { ApiService } from '@flyfront/data-access';

const mockApi = new MockApiService();

// Configure responses
mockApi.whenGet('/users', [{ id: '1', name: 'John' }]);
mockApi.whenPost('/users', { id: '2', name: 'Jane' });
mockApi.whenPut('/users/1', { id: '1', name: 'Updated' });
mockApi.whenPatch('/users/1', { id: '1', name: 'Patched' });
mockApi.whenDelete('/users/1', { success: true });

// With delay (milliseconds)
mockApi.whenGet('/slow', data, 500);

// Configure errors
mockApi.whenError('GET', '/error', new Error('Not found'));

// Use in tests
mockApi.get('/users').subscribe(users => ...);

// Reset all mocks
mockApi.reset();
```

#### MockConfigService

```typescript
import { MockConfigService } from '@flyfront/testing';
import { ConfigService } from '@flyfront/core';

const mockConfig = new MockConfigService();

// Set config
mockConfig.setConfig({
  apiBaseUrl: 'http://test.com',
  environment: 'development',
});

// Get config
mockConfig.get('apiBaseUrl');  // 'http://test.com'
mockConfig.getAll();           // Full config object
```

#### MockStorageService

```typescript
import { MockStorageService } from '@flyfront/testing';

const mockStorage = new MockStorageService();

mockStorage.set('key', 'value', { ttl: 1000 });
mockStorage.get('key');      // 'value'
mockStorage.has('key');      // true
mockStorage.keys();          // ['key']
mockStorage.remove('key');
mockStorage.clear();
```

#### MockRouter

```typescript
import { MockRouter } from '@flyfront/testing';
import { Router } from '@angular/router';

const mockRouter = new MockRouter();

// Navigate
await mockRouter.navigate(['/dashboard']);
await mockRouter.navigateByUrl('/profile');

// Check state
mockRouter.url;                      // '/profile'
mockRouter.url$.subscribe(...);      // Observable of URL
mockRouter.getNavigationHistory();   // ['/', '/dashboard', '/profile']

// Check calls
mockRouter.navigate.calls;           // [['/dashboard'], ...]

// Reset
mockRouter.reset();
```

#### MockActivatedRoute

```typescript
import { MockActivatedRoute } from '@flyfront/testing';
import { ActivatedRoute } from '@angular/router';

const mockRoute = new MockActivatedRoute();

// Set params
mockRoute.setParams({ id: '123' });
mockRoute.setQueryParams({ sort: 'name', order: 'asc' });
mockRoute.setData({ title: 'User Details' });
mockRoute.setFragment('section-1');

// Access via observables
mockRoute.params.subscribe(p => console.log(p.id));
mockRoute.queryParams.subscribe(q => console.log(q.sort));

// Access via snapshot
mockRoute.snapshot.params.id;        // '123'
mockRoute.snapshot.queryParams.sort; // 'name'

// Reset
mockRoute.reset();
```

### Test Utilities

#### renderComponent

Simplified component testing with query helpers:

```typescript
import { renderComponent, RenderResult, RenderConfig } from '@flyfront/testing';

describe('ButtonComponent', () => {
  it('should render and respond to clicks', async () => {
    const clickHandler = createMockFn();
    
    const result = await renderComponent(ButtonComponent, {
      inputs: { variant: 'primary', disabled: false },
      providers: [/* additional providers */],
      imports: [/* additional imports */],
      detectChanges: true,  // default
    });

    // Query methods
    const button = result.getByTestId('submit-button');
    const allButtons = result.getAllByTestId('button');
    const label = result.getByText('Click me');
    const buttons = result.getAllByRole('button');
    const element = result.query<HTMLButtonElement>('.my-class');
    const elements = result.queryAll<HTMLDivElement>('.item');

    // Interaction methods (async)
    await result.click('[data-testid="submit-button"]');
    await result.type('[data-testid="input"]', 'Hello World');
    await result.clear('[data-testid="input"]');

    // Manual change detection
    result.detectChanges();

    // Access fixture and component
    result.fixture;
    result.component;
    result.debugElement;
    result.nativeElement;
  });
});
```

#### Other Utilities

```typescript
import {
  createSpyObj,
  waitFor,
  waitForStable,
  getEmittedValue,
  createMockSignal,
  flushMicrotasks,
} from '@flyfront/testing';

// Create spy object with mock methods
const serviceSpy = createSpyObj<UserService>('UserService', [
  'getUser',
  'createUser',
  'deleteUser',
]);
serviceSpy.getUser.mockReturnValue(of(mockUser));

// Wait for condition (with timeout)
await waitFor(() => component.loaded(), { timeout: 5000, interval: 50 });

// Wait for fixture to stabilize
await waitForStable(fixture);

// Get first emitted value from Observable
const value = await getEmittedValue(service.data$);

// Create a mock signal
const loadingSignal = createMockSignal(false);
loadingSignal.set(true);

// Flush pending microtasks
await flushMicrotasks();
```

---

## Library Dependency Matrix

| Library | Can Depend On |
|---------|--------------|
| core | (none) |
| ui | core |
| testing | core, ui |
| auth | core |
| data-access | core |
| state | core |
| i18n | core |
| Applications | All libraries |
