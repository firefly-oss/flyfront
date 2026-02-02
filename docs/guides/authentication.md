# Authentication Guide

This guide covers implementing authentication in Flyfront applications using the `@flyfront/auth` library, which provides OIDC/OAuth2 authentication support.

## Table of Contents

- [Overview](#overview)
- [Setup](#setup)
- [Basic Usage](#basic-usage)
- [Protecting Routes](#protecting-routes)
- [User Information](#user-information)
- [Role-Based Access Control](#role-based-access-control)
- [Token Management](#token-management)
- [Logout](#logout)
- [Advanced Topics](#advanced-topics)

---

## Overview

The `@flyfront/auth` library provides:

- **OIDC/OAuth2 Support**: Standards-compliant authentication
- **Token Management**: Automatic storage and refresh
- **Route Protection**: Guards for protected routes
- **Role-Based Access**: Permission and role checking
- **Signal-Based State**: Reactive authentication state

### Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Application                            │
│  ┌─────────────────────────────────────────────────┐    │
│  │                  AuthService                      │    │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐       │    │
│  │  │  State   │  │  Tokens  │  │  User    │       │    │
│  │  │ Signals  │  │ Storage  │  │  Info    │       │    │
│  │  └──────────┘  └──────────┘  └──────────┘       │    │
│  └────────────────────┬────────────────────────────┘    │
│                       │                                   │
│  ┌────────────────────▼────────────────────────────┐    │
│  │               TokenService                        │    │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐       │    │
│  │  │  Store   │  │  Decode  │  │  Refresh │       │    │
│  │  │  Tokens  │  │  JWT     │  │  Logic   │       │    │
│  │  └──────────┘  └──────────┘  └──────────┘       │    │
│  └─────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
              ┌────────────────────────┐
              │    OIDC Provider       │
              │  (Keycloak, Auth0,     │
              │   Azure AD, etc.)      │
              └────────────────────────┘
```

---

## Setup

Setting up authentication requires four steps: configuring the auth provider, setting up environment variables, adding a callback route, and creating a callback component. Each step is essential for the authentication flow to work correctly.

### Step 1: Configure the Auth Provider

The auth provider tells Flyfront how to connect to your identity provider (IdP). This configuration goes in your application's `app.config.ts` file, which is where Angular bootstraps all application-wide services.

**Why this matters**: The auth provider initializes the authentication library when your app starts. Without it, `AuthService` won't know where to redirect users for login or how to validate tokens.

Open `apps/your-app/src/app/app.config.ts` and add the auth provider:

```typescript
import { ApplicationConfig } from '@angular/core';
import { provideAuth } from '@flyfront/auth';
import { environment } from '../environments/environment';

export const appConfig: ApplicationConfig = {
  providers: [
    // ... other providers
    
    provideAuth({
      issuer: environment.authIssuer,
      clientId: environment.authClientId,
      redirectUri: window.location.origin + '/callback',
      scope: 'openid profile email',
      responseType: 'code',
      silentRefresh: true,
      useRefreshToken: true,
    }),
  ],
};
```

**Configuration options explained**:

| Option | Description | Example |
|--------|-------------|----------|
| `issuer` | The URL of your OIDC provider | `https://auth.example.com/realms/myapp` |
| `clientId` | Your application's client ID from the IdP | `my-app-client` |
| `redirectUri` | Where users return after login | `https://myapp.com/callback` |
| `scope` | What user data to request | `openid profile email` |
| `responseType` | OAuth flow type (use `code` for security) | `code` |
| `silentRefresh` | Auto-refresh tokens in background | `true` |
| `useRefreshToken` | Use refresh tokens for longer sessions | `true` |

### Step 2: Set Up Environment Variables

Never hardcode authentication URLs or client IDs directly in your code. Instead, use environment files that Angular swaps out during builds.

**Why this matters**: You'll typically have different identity providers for development, staging, and production. Environment files let you deploy the same code with different configurations.

Create or update these two files:

**Development environment** (`apps/your-app/src/environments/environment.ts`):
```typescript
export const environment = {
  production: false,
  authIssuer: 'https://auth.dev.example.com/realms/flyfront',
  authClientId: 'flyfront-dev',
};
```

**Production environment** (`apps/your-app/src/environments/environment.prod.ts`):
```typescript
export const environment = {
  production: true,
  authIssuer: 'https://auth.example.com/realms/flyfront',
  authClientId: 'flyfront-prod',
};
```

> **Important**: Get these values from your identity provider (Keycloak, Auth0, Azure AD, etc.). The `authIssuer` is the base URL of your OIDC provider, and `authClientId` is the client ID you created when registering your application.

### Step 3: Add the Callback Route

When a user logs in with your identity provider, they're redirected back to your application with an authorization code in the URL. The callback route handles this redirect.

**Why this matters**: Without a callback route, users would see a 404 error after logging in because Angular wouldn't know what to do with the `/callback` URL.

Open `apps/your-app/src/app/app.routes.ts` and add the callback route:

```typescript
// app.routes.ts
import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'callback',
    loadComponent: () =>
      import('./pages/callback/callback.component').then(
        (m) => m.CallbackComponent
      ),
  },
  // ... other routes
];
```

> **Note**: The path `callback` must match the redirect URI you configured in Step 1 and in your identity provider's settings.

### Step 4: Create the Callback Component

The callback component processes the authorization code from the URL, exchanges it for tokens, and redirects the user to their intended destination.

**Why this matters**: This component shows a loading spinner while the token exchange happens (usually under a second). Without it, users would see a blank page or error during the brief authentication handshake.

First, create the component directory:
```bash
mkdir -p apps/your-app/src/app/pages/callback
```

Then create `apps/your-app/src/app/pages/callback/callback.component.ts`:

```typescript
import { Component, OnInit, inject } from '@angular/core';
import { AuthService } from '@flyfront/auth';
import { SpinnerComponent } from '@flyfront/ui';

@Component({
  selector: 'app-callback',
  standalone: true,
  imports: [SpinnerComponent],
  template: `
    <div class="flex items-center justify-center min-h-screen">
      <div class="text-center">
        <fly-spinner size="lg" />
        <p class="mt-4 text-gray-600">Completing sign in...</p>
      </div>
    </div>
  `,
})
export class CallbackComponent implements OnInit {
  private auth = inject(AuthService);

  ngOnInit(): void {
    this.auth.handleCallback();
  }
}
```

---

## Basic Usage

### Injecting AuthService

```typescript
import { Component, inject } from '@angular/core';
import { AuthService } from '@flyfront/auth';

@Component({...})
export class MyComponent {
  private auth = inject(AuthService);
  
  // Reactive state via signals
  isAuthenticated = this.auth.isAuthenticated;
  isLoading = this.auth.isLoading;
  user = this.auth.user;
  error = this.auth.error;
}
```

### Login

```typescript
import { Component, inject } from '@angular/core';
import { AuthService } from '@flyfront/auth';
import { ButtonComponent } from '@flyfront/ui';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ButtonComponent],
  template: `
    <div class="flex flex-col items-center justify-center min-h-screen">
      <h1 class="text-2xl font-bold mb-8">Welcome to Flyfront</h1>
      
      <fly-button 
        variant="primary" 
        size="lg"
        (clicked)="login()"
      >
        Sign In
      </fly-button>
    </div>
  `,
})
export class LoginComponent {
  private auth = inject(AuthService);

  login(): void {
    // Optional: specify where to redirect after login
    this.auth.login({ returnUrl: '/dashboard' });
  }
}
```

### Conditional Display Based on Auth State

```typescript
@Component({
  selector: 'app-header',
  standalone: true,
  imports: [ButtonComponent, AvatarComponent],
  template: `
    <header class="flex items-center justify-between p-4">
      <h1>My App</h1>
      
      @if (auth.isLoading()) {
        <fly-spinner size="sm" />
      } @else if (auth.isAuthenticated()) {
        <div class="flex items-center gap-4">
          <fly-avatar 
            [src]="auth.user()?.avatarUrl" 
            [name]="auth.user()?.displayName"
            size="sm"
          />
          <span>{{ auth.user()?.displayName }}</span>
          <fly-button variant="ghost" (clicked)="logout()">
            Sign Out
          </fly-button>
        </div>
      } @else {
        <fly-button variant="primary" (clicked)="login()">
          Sign In
        </fly-button>
      }
    </header>
  `,
})
export class HeaderComponent {
  auth = inject(AuthService);

  login(): void {
    this.auth.login();
  }

  logout(): void {
    this.auth.logout();
  }
}
```

---

## Protecting Routes

### Using the Auth Guard

The `authGuard` protects routes from unauthenticated access:

```typescript
// app.routes.ts
import { Routes } from '@angular/router';
import { authGuard } from '@flyfront/auth';

export const routes: Routes = [
  // Public routes
  {
    path: '',
    loadComponent: () => import('./pages/home/home.component').then(m => m.HomeComponent),
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent),
  },
  
  // Protected routes
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent),
  },
  {
    path: 'settings',
    canActivate: [authGuard],
    loadChildren: () => import('./features/settings/settings.routes').then(m => m.settingsRoutes),
  },
];
```

### Role-Based Route Protection

Create a custom guard for role-based access:

```typescript
// guards/role.guard.ts
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '@flyfront/auth';

export function hasRole(roles: string[]): CanActivateFn {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);

    if (!auth.isAuthenticated()) {
      return router.createUrlTree(['/login']);
    }

    if (!auth.hasAnyRole(roles)) {
      return router.createUrlTree(['/forbidden']);
    }

    return true;
  };
}

export function hasPermission(permissions: string[]): CanActivateFn {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);

    if (!auth.isAuthenticated()) {
      return router.createUrlTree(['/login']);
    }

    if (!auth.hasAllPermissions(permissions)) {
      return router.createUrlTree(['/forbidden']);
    }

    return true;
  };
}
```

Usage:

```typescript
// app.routes.ts
export const routes: Routes = [
  {
    path: 'admin',
    canActivate: [authGuard, hasRole(['admin'])],
    loadChildren: () => import('./features/admin/admin.routes').then(m => m.adminRoutes),
  },
  {
    path: 'reports',
    canActivate: [authGuard, hasPermission(['read:reports'])],
    loadComponent: () => import('./pages/reports/reports.component').then(m => m.ReportsComponent),
  },
];
```

---

## User Information

### Accessing User Data

```typescript
@Component({...})
export class ProfileComponent {
  private auth = inject(AuthService);
  
  // User data as signals
  user = this.auth.user;
  roles = this.auth.roles;
  permissions = this.auth.permissions;
  
  // Computed values
  isAdmin = computed(() => this.auth.hasRole('admin'));
  canEdit = computed(() => this.auth.hasPermission('write'));
  
  // Get custom attributes
  department = computed(() => 
    this.auth.getUserAttribute<string>('department')
  );
}
```

### User Interface

The `User` interface provides:

```typescript
interface User {
  id: string;
  username: string;
  email: string;
  displayName: string;
  roles: string[];
  permissions: string[];
  attributes: Record<string, unknown>;
  isActive: boolean;
}
```

### Displaying User Profile

```typescript
@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CardComponent, AvatarComponent],
  template: `
    @if (user(); as u) {
      <fly-card>
        <fly-card-header>
          <fly-avatar [name]="u.displayName" size="lg" />
          <div>
            <h2 class="text-xl font-semibold">{{ u.displayName }}</h2>
            <p class="text-gray-500">{{ u.email }}</p>
          </div>
        </fly-card-header>
        
        <fly-card-content>
          <dl class="space-y-2">
            <div>
              <dt class="text-sm text-gray-500">Username</dt>
              <dd>{{ u.username }}</dd>
            </div>
            <div>
              <dt class="text-sm text-gray-500">Roles</dt>
              <dd>{{ u.roles.join(', ') }}</dd>
            </div>
          </dl>
        </fly-card-content>
      </fly-card>
    }
  `,
})
export class ProfileComponent {
  user = inject(AuthService).user;
}
```

---

## Role-Based Access Control

### Checking Roles

```typescript
@Component({...})
export class AdminPanelComponent {
  private auth = inject(AuthService);
  
  // Check single role
  isAdmin = this.auth.hasRole('admin');
  
  // Check any of multiple roles
  canManage = this.auth.hasAnyRole(['admin', 'manager']);
}
```

### Checking Permissions

```typescript
@Component({...})
export class DocumentComponent {
  private auth = inject(AuthService);
  
  // Check single permission
  canRead = this.auth.hasPermission('documents:read');
  
  // Check all required permissions
  canEdit = this.auth.hasAllPermissions(['documents:read', 'documents:write']);
  
  // Check any of multiple permissions
  canView = this.auth.hasAnyPermission(['documents:read', 'documents:admin']);
}
```

### Conditional UI Based on Permissions

```typescript
@Component({
  selector: 'app-document-actions',
  standalone: true,
  imports: [ButtonComponent],
  template: `
    <div class="flex gap-2">
      <fly-button variant="ghost" (clicked)="view()">
        View
      </fly-button>
      
      @if (canEdit()) {
        <fly-button variant="primary" (clicked)="edit()">
          Edit
        </fly-button>
      }
      
      @if (canDelete()) {
        <fly-button variant="danger" (clicked)="delete()">
          Delete
        </fly-button>
      }
    </div>
  `,
})
export class DocumentActionsComponent {
  private auth = inject(AuthService);
  
  canEdit = computed(() => this.auth.hasPermission('documents:write'));
  canDelete = computed(() => this.auth.hasPermission('documents:delete'));
  
  // ... action methods
}
```

---

## Token Management

### How Tokens are Stored

By default, tokens are stored in localStorage. The `TokenService` handles:

- **Access Token**: Used for API requests
- **Refresh Token**: Used to obtain new access tokens
- **ID Token**: Contains user identity information

### Checking Token Expiration

```typescript
@Component({...})
export class TokenInfoComponent {
  private tokenService = inject(TokenService);
  
  isExpired = computed(() => {
    const token = this.tokenService.getAccessToken();
    return token ? this.tokenService.isTokenExpired(token) : true;
  });
  
  expiresAt = computed(() => {
    const token = this.tokenService.getAccessToken();
    if (!token) return null;
    
    const payload = this.tokenService.decodeToken(token);
    return new Date(payload.exp * 1000);
  });
}
```

### Manual Token Refresh

```typescript
@Component({...})
export class SessionComponent {
  private auth = inject(AuthService);
  
  async refreshSession(): Promise<void> {
    const success = await this.auth.refreshToken();
    if (!success) {
      // Refresh failed, redirect to login
      this.auth.login();
    }
  }
}
```

### HTTP Interceptor for Auth Headers

The auth interceptor automatically attaches tokens to API requests:

```typescript
// app.config.ts
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { authInterceptor } from '@flyfront/core';

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(
      withInterceptors([authInterceptor])
    ),
  ],
};
```

---

## Logout

### Basic Logout

```typescript
@Component({...})
export class HeaderComponent {
  private auth = inject(AuthService);
  
  logout(): void {
    this.auth.logout();
    // User will be redirected to home page
  }
  
  logoutWithRedirect(): void {
    this.auth.logout('/login');
    // User will be redirected to /login
  }
}
```

### Logout with Confirmation

```typescript
@Component({
  selector: 'app-user-menu',
  standalone: true,
  imports: [ButtonComponent, DialogComponent],
  template: `
    <fly-button variant="ghost" (clicked)="showLogoutConfirm.set(true)">
      Sign Out
    </fly-button>
    
    @if (showLogoutConfirm()) {
      <fly-dialog 
        title="Sign Out"
        (closed)="showLogoutConfirm.set(false)"
      >
        <p>Are you sure you want to sign out?</p>
        
        <div dialog-actions>
          <fly-button variant="ghost" (clicked)="showLogoutConfirm.set(false)">
            Cancel
          </fly-button>
          <fly-button variant="danger" (clicked)="confirmLogout()">
            Sign Out
          </fly-button>
        </div>
      </fly-dialog>
    }
  `,
})
export class UserMenuComponent {
  private auth = inject(AuthService);
  
  showLogoutConfirm = signal(false);
  
  confirmLogout(): void {
    this.auth.logout();
    this.showLogoutConfirm.set(false);
  }
}
```

---

## Advanced Topics

### Custom Auth Configuration

```typescript
provideAuth({
  issuer: environment.authIssuer,
  clientId: environment.authClientId,
  
  // Customize redirect URIs
  redirectUri: window.location.origin + '/callback',
  postLogoutRedirectUri: window.location.origin,
  
  // Token configuration
  scope: 'openid profile email roles',
  responseType: 'code',
  
  // Automatic token refresh
  silentRefresh: true,
  silentRefreshTimeout: 30000,
  useRefreshToken: true,
  
  // Storage configuration
  tokenStorage: 'localStorage', // or 'sessionStorage'
  
  // Additional security
  usePkce: true,
  requireHttps: environment.production,
});
```

### Handling Auth Errors

```typescript
@Component({...})
export class AuthErrorHandler {
  private auth = inject(AuthService);
  
  error = this.auth.error;
  
  handleError = effect(() => {
    const err = this.error();
    if (err) {
      console.error('Authentication error:', err);
      // Show error notification
      // Log to analytics
      // etc.
    }
  });
}
```

### Multi-Tenant Authentication

```typescript
// For multi-tenant applications, configure per-tenant
function getTenantAuthConfig(tenantId: string) {
  return {
    issuer: `https://auth.example.com/realms/${tenantId}`,
    clientId: `flyfront-${tenantId}`,
    // ... other config
  };
}

// In app.config.ts
const tenant = getTenantFromUrl();
provideAuth(getTenantAuthConfig(tenant));
```

---

## Related Documentation

- [State Management Guide](state-management.md)
- [API Reference: @flyfront/auth](../api/auth.md)
- [Architecture Overview](../architecture/README.md)
