# Creating Applications

This guide walks you through creating new applications in the Flyfront monorepo. Applications are deployable units that compose libraries to create user-facing products.

## Table of Contents

- [Overview](#overview)
- [Using the Generator](#using-the-generator)
- [Manual Setup](#manual-setup)
- [Application Structure](#application-structure)
- [Configuration](#configuration)
- [Adding Features](#adding-features)
- [Best Practices](#best-practices)

---

## Overview

Applications in Flyfront:

- Live in the `apps/` directory
- Import shared libraries from `@flyfront/*`
- Contain minimal code (routing, configuration, composition)
- Are independently buildable and deployable

### When to Create a New Application

Create a new application when you need:

- A separate deployable unit (different domain, different users)
- Different authentication requirements
- Different build/deployment pipelines
- Complete separation of concerns

### When NOT to Create a New Application

Don't create a new app when:

- You just need a new feature (add it to an existing app)
- You need shared components (add them to a library)
- The functionality is reusable (create a feature library)

---

## Using the Generator

The easiest way to create a new application is using Nx generators. Generators automate the creation of boilerplate code and ensure your application follows Flyfront's conventions.

### Step 1: Run the Generator

Open your terminal in the Flyfront root directory and run one of the following commands:

**Basic application** (simplest approach):
```bash
npx nx g @nx/angular:application my-app
```

This creates a minimal application with default settings. Nx will prompt you for additional options interactively.

**Recommended: With all options specified** (skip prompts):
```bash
npx nx g @nx/angular:application my-app \
  --routing=true \
  --style=scss \
  --standalone=true \
  --prefix=app \
  --tags="type:app,scope:my-domain"
```

Let's break down what each option does:

- `my-app`: The name of your application (use kebab-case)
- `--routing=true`: Adds Angular Router, essential for multi-page apps
- `--style=scss`: Uses SCSS for styling, which works with our Tailwind setup
- `--standalone=true`: Uses modern standalone components (no NgModules)
- `--prefix=app`: Component selectors will start with `app-` (e.g., `app-header`)
- `--tags`: Metadata used by Nx to enforce dependency rules and organize projects

### Step 2: Verify the Generated Files

After running the generator, you should see output like:

```
CREATE apps/my-app/project.json
CREATE apps/my-app/src/app/app.component.ts
CREATE apps/my-app/src/app/app.config.ts
CREATE apps/my-app/src/app/app.routes.ts
...
```

Verify the application was created:
```bash
# List all projects
npx nx show projects

# Should include "my-app" in the output
```

### Step 3: Start the Development Server

Test that your new application works:
```bash
npx nx serve my-app
```

Open http://localhost:4200 in your browser. You should see the default Angular welcome page.

### Generator Options Reference

| Option | Description | Recommended Value |
|--------|-------------|-------------------|
| `--routing` | Add routing | `true` |
| `--style` | Stylesheet format | `scss` |
| `--standalone` | Standalone components | `true` |
| `--prefix` | Component selector prefix | `app` |
| `--tags` | Nx project tags | `type:app,scope:<domain>` |
| `--inlineStyle` | Inline styles | `false` |
| `--inlineTemplate` | Inline templates | `false` |

### Post-Generation Steps

After generating, you need to configure the application:

1. **Update `project.json`** with proper tags
2. **Configure providers** in `app.config.ts`
3. **Set up routing** in `app.routes.ts`
4. **Add environment files** if needed
5. **Configure CI/CD** for the new app

---

## Manual Setup

If you prefer manual setup or need more control:

### 1. Create Directory Structure

```
apps/my-app/
├── src/
│   ├── app/
│   │   ├── app.component.ts
│   │   ├── app.config.ts
│   │   └── app.routes.ts
│   ├── assets/
│   │   └── .gitkeep
│   ├── environments/
│   │   ├── environment.ts
│   │   └── environment.prod.ts
│   ├── index.html
│   ├── main.ts
│   └── styles.scss
├── project.json
├── tsconfig.app.json
├── tsconfig.json
└── tsconfig.spec.json
```

### 2. Create `project.json`

```json
{
  "name": "my-app",
  "$schema": "../../node_modules/nx/schemas/project-schema.json",
  "projectType": "application",
  "prefix": "app",
  "sourceRoot": "apps/my-app/src",
  "tags": ["type:app", "scope:my-domain"],
  "targets": {
    "build": {
      "executor": "@angular-devkit/build-angular:application",
      "outputs": ["{options.outputPath}"],
      "options": {
        "outputPath": "dist/apps/my-app",
        "index": "apps/my-app/src/index.html",
        "browser": "apps/my-app/src/main.ts",
        "polyfills": ["zone.js"],
        "tsConfig": "apps/my-app/tsconfig.app.json",
        "inlineStyleLanguage": "scss",
        "assets": [
          {
            "glob": "**/*",
            "input": "apps/my-app/src/assets",
            "output": "/assets"
          }
        ],
        "styles": ["apps/my-app/src/styles.scss"],
        "scripts": []
      },
      "configurations": {
        "production": {
          "budgets": [
            {
              "type": "initial",
              "maximumWarning": "500kb",
              "maximumError": "1mb"
            },
            {
              "type": "anyComponentStyle",
              "maximumWarning": "2kb",
              "maximumError": "4kb"
            }
          ],
          "outputHashing": "all",
          "fileReplacements": [
            {
              "replace": "apps/my-app/src/environments/environment.ts",
              "with": "apps/my-app/src/environments/environment.prod.ts"
            }
          ]
        },
        "development": {
          "optimization": false,
          "extractLicenses": false,
          "sourceMap": true
        }
      },
      "defaultConfiguration": "production"
    },
    "serve": {
      "executor": "@angular-devkit/build-angular:dev-server",
      "configurations": {
        "production": {
          "buildTarget": "my-app:build:production"
        },
        "development": {
          "buildTarget": "my-app:build:development"
        }
      },
      "defaultConfiguration": "development"
    },
    "test": {
      "executor": "@nx/vite:test",
      "options": {
        "passWithNoTests": true,
        "reportsDirectory": "../../coverage/apps/my-app"
      }
    },
    "lint": {
      "executor": "@nx/eslint:lint"
    }
  }
}
```

### 3. Create Core Files

**`src/main.ts`**:
```typescript
import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';

bootstrapApplication(AppComponent, appConfig).catch((err) =>
  console.error(err)
);
```

**`src/app/app.component.ts`**:
```typescript
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `<router-outlet />`,
})
export class AppComponent {}
```

**`src/app/app.config.ts`**:
```typescript
import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';

import { provideConfig } from '@flyfront/core';
import { provideAuth } from '@flyfront/auth';
import { provideI18n } from '@flyfront/i18n';

import { routes } from './app.routes';
import { environment } from '../environments/environment';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(withInterceptors([])),
    
    // Flyfront libraries
    provideConfig({
      appName: 'My Application',
      apiBaseUrl: environment.apiUrl,
      environment: environment.production ? 'production' : 'development',
    }),
    provideAuth({
      issuer: environment.authIssuer,
      clientId: environment.authClientId,
    }),
    provideI18n({
      defaultLang: 'en',
      availableLangs: ['en', 'es', 'fr'],
    }),
  ],
};
```

**`src/app/app.routes.ts`**:
```typescript
import { Routes } from '@angular/router';
import { authGuard } from '@flyfront/auth';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/home/home.component').then((m) => m.HomeComponent),
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/dashboard/dashboard.component').then(
        (m) => m.DashboardComponent
      ),
  },
  {
    path: '**',
    redirectTo: '',
  },
];
```

---

## Application Structure

### Recommended Structure

```
apps/my-app/src/
├── app/
│   ├── core/                    # App-specific services, guards
│   │   ├── services/
│   │   └── guards/
│   ├── features/               # Feature modules (lazy-loaded)
│   │   ├── dashboard/
│   │   │   ├── components/
│   │   │   ├── pages/
│   │   │   └── dashboard.routes.ts
│   │   └── settings/
│   │       ├── components/
│   │       ├── pages/
│   │       └── settings.routes.ts
│   ├── layout/                 # Layout components
│   │   ├── header/
│   │   ├── sidebar/
│   │   └── footer/
│   ├── pages/                  # Top-level pages
│   │   ├── home/
│   │   ├── login/
│   │   └── not-found/
│   ├── shared/                 # App-specific shared components
│   │   ├── components/
│   │   └── pipes/
│   ├── app.component.ts
│   ├── app.config.ts
│   └── app.routes.ts
├── assets/
│   ├── i18n/                   # Translation files
│   │   ├── en.json
│   │   └── es.json
│   ├── icons/
│   └── images/
├── environments/
│   ├── environment.ts
│   └── environment.prod.ts
├── index.html
├── main.ts
└── styles.scss
```

### File Responsibilities

| Directory | Purpose |
|-----------|---------|
| `core/` | App-specific services, guards, interceptors |
| `features/` | Lazy-loaded feature modules |
| `layout/` | App shell components (header, sidebar, footer) |
| `pages/` | Top-level route components |
| `shared/` | App-specific shared components (not for `@flyfront/ui`) |
| `assets/` | Static files, translations, images |
| `environments/` | Environment-specific configuration |

---

## Configuration

### Environment Files

**`src/environments/environment.ts`** (development):
```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api',
  authIssuer: 'https://auth.dev.flyfront.dev',
  authClientId: 'my-app-dev',
  features: {
    darkMode: true,
    analytics: false,
  },
};
```

**`src/environments/environment.prod.ts`** (production):
```typescript
export const environment = {
  production: true,
  apiUrl: 'https://api.flyfront.dev',
  authIssuer: 'https://auth.flyfront.dev',
  authClientId: 'my-app-prod',
  features: {
    darkMode: true,
    analytics: true,
  },
};
```

### Global Styles

**`src/styles.scss`**:
```scss
@tailwind base;
@tailwind components;
@tailwind utilities;

// App-specific global styles
:root {
  --app-header-height: 64px;
  --app-sidebar-width: 256px;
}

// Reset and base styles
html,
body {
  @apply h-full;
}

body {
  @apply bg-gray-50 text-gray-900 antialiased;
  @apply dark:bg-gray-900 dark:text-gray-100;
}
```

### Index HTML

**`src/index.html`**:
```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>My Application</title>
    <base href="/" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <link rel="icon" type="image/x-icon" href="favicon.ico" />
    
    <!-- Preload fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
      rel="stylesheet"
    />
  </head>
  <body>
    <app-root></app-root>
  </body>
</html>
```

---

## Adding Features

### Adding a New Feature Module

1. **Create the feature directory**:
```bash
mkdir -p apps/my-app/src/app/features/users
```

2. **Create the feature routes**:
```typescript
// apps/my-app/src/app/features/users/users.routes.ts
import { Routes } from '@angular/router';

export const usersRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/user-list/user-list.component').then(
        (m) => m.UserListComponent
      ),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./pages/user-detail/user-detail.component').then(
        (m) => m.UserDetailComponent
      ),
  },
];
```

3. **Add to app routes**:
```typescript
// apps/my-app/src/app/app.routes.ts
export const routes: Routes = [
  // ... existing routes
  {
    path: 'users',
    canActivate: [authGuard],
    loadChildren: () =>
      import('./features/users/users.routes').then((m) => m.usersRoutes),
  },
];
```

### Using Flyfront Libraries

```typescript
// In a feature component
import { Component, inject } from '@angular/core';
import { ButtonComponent, CardComponent, InputComponent } from '@flyfront/ui';
import { AuthService } from '@flyfront/auth';
import { ApiService } from '@flyfront/data-access';
import { TranslocoDirective } from '@flyfront/i18n';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [
    ButtonComponent,
    CardComponent,
    InputComponent,
    TranslocoDirective,
  ],
  template: `
    <div *transloco="let t">
      <h1>{{ t('users.title') }}</h1>
      
      <fly-input
        [label]="t('users.search')"
        (valueChange)="onSearch($event)"
      />
      
      @for (user of users(); track user.id) {
        <fly-card>
          <h3>{{ user.name }}</h3>
          <fly-button (clicked)="viewUser(user)">
            {{ t('common.view') }}
          </fly-button>
        </fly-card>
      }
    </div>
  `,
})
export class UserListComponent {
  private auth = inject(AuthService);
  private api = inject(ApiService);
  
  users = signal<User[]>([]);
  
  // Component logic...
}
```

---

## Best Practices

### 1. Keep Applications Thin

Applications should primarily be composition and configuration. Business logic belongs in libraries.

```typescript
// Good: Application composes libraries
@Component({...})
export class DashboardComponent {
  private userService = inject(UserService);     // From @flyfront/data-access
  private authService = inject(AuthService);      // From @flyfront/auth
  
  users = this.userService.users;
  currentUser = this.authService.user;
}

// Bad: Application contains business logic
@Component({...})
export class DashboardComponent {
  // Don't put business logic here - move to a service/library
  calculateUserStats(users: User[]): Stats { ... }
  transformUserData(user: User): TransformedUser { ... }
}
```

### 2. Use Lazy Loading

Always lazy-load feature modules:

```typescript
// Good: Lazy loaded
{
  path: 'admin',
  loadChildren: () => import('./features/admin/admin.routes').then(m => m.adminRoutes),
}

// Bad: Eager loaded
import { AdminModule } from './features/admin/admin.module';
{
  path: 'admin',
  children: AdminModule.routes,
}
```

### 3. Centralize Configuration

Use environment files and ConfigService:

```typescript
// Good: Centralized configuration
const apiUrl = inject(ConfigService).get('apiBaseUrl');

// Bad: Hardcoded values
const apiUrl = 'https://api.example.com';
```

### 4. Follow Naming Conventions

| Type | Naming | Example |
|------|--------|---------|
| Application | `kebab-case` | `admin-portal` |
| Component files | `kebab-case.component.ts` | `user-list.component.ts` |
| Service files | `kebab-case.service.ts` | `user.service.ts` |
| Route files | `kebab-case.routes.ts` | `admin.routes.ts` |

---

## Related Documentation

- [Getting Started](getting-started.md)
- [Architecture Overview](../architecture/README.md)
- [Dependency Rules](../architecture/dependency-rules.md)
