<div align="center">

```
  _____.__           _____                      __   
_/ ____\  | ___.__._/ ____\______  ____   _____/  |_ 
\   __\|  |<   |  |\   __\\_  __ \/  _ \ /    \   __\
 |  |  |  |_\___  | |  |   |  | \(  <_> )   |  \  |  
 |__|  |____/ ____| |__|   |__|   \____/|___|  /__|  
            \/                               \/      
```

### The Official Angular Frontend Architecture for Firefly

**A modern, scalable, and enterprise-ready frontend framework built with Angular 21, Nx, and TailwindCSS**

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE)
[![Angular](https://img.shields.io/badge/Angular-21-dd0031.svg)](https://angular.io/)
[![Nx](https://img.shields.io/badge/Nx-22-143055.svg)](https://nx.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178c6.svg)](https://www.typescriptlang.org/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4-38bdf8.svg)](https://tailwindcss.com/)

[Getting Started](#-getting-started) •
[Documentation](docs/README.md) •
[Architecture](docs/architecture/README.md) •
[Contributing](CONTRIBUTING.md)

</div>

---

## Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [Architecture](#-architecture)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Quick Start](#quick-start)
- [Project Structure](#-project-structure)
- [Libraries](#-libraries)
  - [@flyfront/core](#flyfrontcore)
  - [@flyfront/ui](#flyfrontui)
  - [@flyfront/auth](#flyfrontauth)
  - [@flyfront/data-access](#flyfrontdata-access)
  - [@flyfront/state](#flyfrontstate)
  - [@flyfront/i18n](#flyfronti18n)
  - [@flyfront/testing](#flyfronttesting)
- [Design System](#-design-system)
- [Usage Examples](#-usage-examples)
- [Development](#-development)
- [Testing](#-testing)
- [Deployment](#-deployment)
- [Documentation](#-documentation)
- [Contributing](#-contributing)
- [License](#-license)

---

##  Overview

**Flyfront** is the centralized Angular frontend architecture designed specifically for the Firefly ecosystem. It provides a comprehensive, battle-tested foundation for building enterprise-grade web applications with a focus on:

- **Consistency**: Unified patterns, conventions, and design language across all Firefly frontend applications
- **Scalability**: Monorepo architecture that grows with your team and codebase
- **Maintainability**: Clear separation of concerns with well-defined library boundaries
- **Developer Experience**: Modern tooling, hot reload, and intelligent caching
- **Production Readiness**: Built-in CI/CD, Docker support, and performance optimizations

### Why Flyfront?

Building modern web applications requires more than just choosing a framework. Teams need:

1. **Shared Component Libraries** - Stop rebuilding the same buttons and forms
2. **Standardized Patterns** - Authentication, API calls, and state management done consistently
3. **Design System** - Cohesive visual language with design tokens
4. **Quality Gates** - Testing, linting, and type safety built into the workflow
5. **Deployment Pipeline** - From code to production with confidence

Flyfront provides all of this out of the box, letting you focus on building features instead of infrastructure.

---

##  Key Features

###  Modern Architecture
- **Angular 21** with standalone components, signals, and control flow
- **Nx 22** monorepo for efficient builds, caching, and code sharing
- **TypeScript 5.9** with strict mode for maximum type safety

###  Design System
- **TailwindCSS 4** for utility-first styling
- **Design Tokens** for colors, typography, spacing, and more
- **Accessible Components** following WCAG guidelines
- **Dark Mode Support** built into the theming system

###  Authentication & Security
- **OIDC/OAuth2** integration (Keycloak, Auth0, Azure AD)
- **JWT Token Management** with automatic refresh
- **Role-Based Access Control (RBAC)** with guards and directives
- **Permission-Based UI** rendering

###  Data Management
- **Type-Safe HTTP Client** with interceptors
- **Reactive State Management** with NgRx and Signals
- **Caching Strategies** for optimal performance
- **WebSocket Support** for real-time features

###  Internationalization
- **Multi-Language Support** with lazy-loaded translations
- **Locale-Aware Formatting** for dates, numbers, and currencies
- **RTL Support** for right-to-left languages

###  Testing & Quality
- **Unit Testing** with Vitest/Jest
- **E2E Testing** with Playwright
- **Component Testing** with Storybook
- **Code Coverage** reporting

###  DevOps Ready
- **Docker** multi-stage builds
- **GitHub Actions** CI/CD pipelines
- **Environment Configuration** at runtime
- **Health Checks** and monitoring endpoints

---

##  Architecture

Flyfront follows a **layered monorepo architecture** that promotes code reuse while maintaining clear boundaries between different concerns:

```
┌───────────────────────────────────────────────────────┐
│                     APPLICATIONS                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐   │
│  │  Demo App   │  │  Admin App  │  │ Customer App│   │
│  └─────────────┘  └─────────────┘  └─────────────┘   │
└───────────────────────────────────────────────────────┘
                            │
                            ▼
┌───────────────────────────────────────────────────────┐
│                    FEATURE LIBRARIES                     │
│  ┌───────────┐  ┌────────────┐  ┌───────────────┐    │
│  │   Auth    │  │ Data Access│  │     State     │    │
│  └───────────┘  └────────────┘  └───────────────┘    │
└───────────────────────────────────────────────────────┘
                            │
                            ▼
┌───────────────────────────────────────────────────────┐
│                   FOUNDATION LIBRARIES                   │
│  ┌───────────┐  ┌────────────┐  ┌───────────────┐    │
│  │   Core    │  │     UI     │  │    Testing    │    │
│  └───────────┘  └────────────┘  └───────────────┘    │
└───────────────────────────────────────────────────────┘
```

### Layer Descriptions

| Layer | Purpose | Examples |
|-------|---------|----------|
| **Applications** | Deployable frontend applications | Demo app, Admin portal, Customer portal |
| **Feature Libraries** | Domain-specific functionality | Authentication, API integration, State management |
| **Foundation Libraries** | Shared, domain-agnostic code | UI components, Core utilities, Testing helpers |

>  For detailed architecture documentation, see [docs/architecture/README.md](docs/architecture/README.md)

---

##  Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:

| Tool | Version | Purpose |
|------|---------|--------|
| **Node.js** | 20.x or higher | JavaScript runtime |
| **npm** | 10.x or higher | Package manager |
| **Git** | 2.x or higher | Version control |

Optional but recommended:

| Tool | Purpose |
|------|--------|
| **VS Code** | Recommended IDE with Nx Console extension |
| **Docker** | Container-based deployment |
| **Nx Console** | VS Code extension for Nx commands |

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/firefly-oss/flyfront.git
   cd flyfront
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

   >  This will install all dependencies for all projects in the monorepo.

3. **Verify installation**

   ```bash
   npx nx --version
   ```

### Quick Start

**Start the development server:**

```bash
npm start
# or
npx nx serve demo-app
```

Open your browser at `http://localhost:4200` to see the application.

**Run tests:**

```bash
npx nx test core
```

**Build for production:**

```bash
npx nx build demo-app --configuration=production
```

---

##  Project Structure

```
flyfront/
├──  apps/                      # Application projects
│   ├── demo-app/                 # Main demo/showcase application
│   │   ├── src/
│   │   │   ├── app/              # Application components and routes
│   │   │   ├── assets/           # Static assets (images, fonts)
│   │   │   ├── environments/     # Environment configurations
│   │   │   └── styles.scss       # Global styles
│   │   └── project.json          # Nx project configuration
│   └── e2e/                      # End-to-end tests
│
├──  libs/                      # Shared libraries
│   ├── core/                     # @flyfront/core
│   │   ├── src/lib/
│   │   │   ├── guards/           # Route guards
│   │   │   ├── interceptors/     # HTTP interceptors
│   │   │   ├── models/           # TypeScript interfaces
│   │   │   ├── services/         # Core services
│   │   │   └── utils/            # Utility functions
│   │   └── src/index.ts          # Public API
│   │
│   ├── ui/                       # @flyfront/ui
│   │   ├── src/lib/
│   │   │   ├── components/       # UI components
│   │   │   └── tokens/           # Design tokens
│   │   └── src/index.ts          # Public API
│   │
│   ├── auth/                     # @flyfront/auth
│   ├── data-access/              # @flyfront/data-access
│   ├── state/                    # @flyfront/state
│   ├── i18n/                     # @flyfront/i18n
│   └── testing/                  # @flyfront/testing
│
├──  docs/                      # Documentation
│   ├── architecture/             # Architecture documentation
│   ├── guides/                   # How-to guides
│   ├── api/                      # API reference
│   └── contributing/             # Contribution guidelines
│
├──  docker/                    # Docker configuration
│   ├── nginx.conf                # Nginx configuration
│   └── env.sh                    # Runtime env injection
│
├──  tools/                     # Custom tooling
│   └── generators/               # Nx generators
│
├──  nx.json                    # Nx workspace configuration
├──  package.json               # Root dependencies
├──  tailwind.config.js         # TailwindCSS configuration
├──  tsconfig.base.json         # Base TypeScript config
└──  Dockerfile                 # Docker build configuration
```

---

##  Libraries

### @flyfront/core

**Core utilities, services, and infrastructure**

The core library provides foundational functionality used across all applications:

```typescript
import { 
  ConfigService, 
  LoggerService, 
  StorageService,
  authGuard,
  httpErrorInterceptor 
} from '@flyfront/core';
```

| Feature | Description |
|---------|-------------|
| `ConfigService` | Application configuration management with environment support |
| `LoggerService` | Structured logging with levels (debug, info, warn, error) |
| `StorageService` | Abstraction over localStorage/sessionStorage with TTL support |
| `authGuard` | Route guard for authentication |
| `permissionGuard` | Route guard for role/permission-based access |
| `httpErrorInterceptor` | HTTP interceptor with retry logic and error handling |

### @flyfront/ui

**Design system and UI component library**

A comprehensive set of accessible, themeable UI components:

```typescript
import { 
  ButtonComponent, 
  InputComponent, 
  CardComponent,
  AppShellComponent,
  SpinnerComponent 
} from '@flyfront/ui';
```

| Component | Description |
|-----------|-------------|
| `fly-button` | Button with variants (primary, secondary, outline, ghost, danger) |
| `fly-input` | Form input with validation, icons, and password toggle |
| `fly-card` | Content container with header, content, and footer sections |
| `fly-app-shell` | Application layout with header, sidebar, and content areas |
| `fly-spinner` | Loading spinner with configurable size and color |
| `fly-skeleton` | Loading placeholder for content |

### @flyfront/auth

**Authentication and authorization**

Complete authentication solution with OIDC/OAuth2 support:

```typescript
import { AuthService, TokenService } from '@flyfront/auth';
```

| Feature | Description |
|---------|-------------|
| `AuthService` | Authentication state management with signals |
| `TokenService` | JWT token storage, decoding, and refresh |
| OIDC Support | Integration with Keycloak, Auth0, Azure AD |
| RBAC | Role-based access control utilities |

### @flyfront/data-access

**HTTP client and API utilities**

Standardized HTTP communication with the backend:

```typescript
import { ApiService, WebSocketService } from '@flyfront/data-access';
```

### @flyfront/state

**State management utilities**

NgRx-based state management patterns:

```typescript
import { createEntityAdapter, BaseEffects } from '@flyfront/state';
```

### @flyfront/i18n

**Internationalization**

Multi-language support with Transloco:

```typescript
import { LocaleService, TranslocoLoader } from '@flyfront/i18n';
```

### @flyfront/testing

**Testing utilities**

Helpers for unit and integration testing:

```typescript
import { MockAuthService, renderComponent } from '@flyfront/testing';
```

---

##  Design System

Flyfront includes a comprehensive design system built on design tokens:

### Color Palette

| Category | Colors | Usage |
|----------|--------|-------|
| **Primary** | Blue scale (50-900) | Primary actions, links, focus states |
| **Secondary** | Pink scale (50-900) | Secondary actions, accents |
| **Firefly** | Amber/Orange scale | Brand color, highlights |
| **Success** | Green scale | Success states, confirmations |
| **Warning** | Orange scale | Warning states, cautions |
| **Error** | Red scale | Error states, destructive actions |
| **Neutral** | Gray scale | Backgrounds, borders, text |

### Typography

- **Font Family**: Inter (sans-serif), JetBrains Mono (monospace)
- **Scale**: xs (12px) to 5xl (48px)
- **Weights**: Light (300), Regular (400), Medium (500), Semibold (600), Bold (700)

### Spacing

Based on a **4px base unit**:

| Token | Value | Pixels |
|-------|-------|--------|
| `spacing-1` | 0.25rem | 4px |
| `spacing-2` | 0.5rem | 8px |
| `spacing-4` | 1rem | 16px |
| `spacing-6` | 1.5rem | 24px |
| `spacing-8` | 2rem | 32px |

>  See [docs/guides/design-system.md](docs/guides/design-system.md) for complete design system documentation.

---

##  Usage Examples

### Basic Component Usage

```typescript
import { Component } from '@angular/core';
import { 
  ButtonComponent, 
  InputComponent, 
  CardComponent,
  CardHeaderComponent,
  CardContentComponent,
  CardFooterComponent 
} from '@flyfront/ui';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-login-form',
  standalone: true,
  imports: [
    FormsModule,
    ButtonComponent, 
    InputComponent, 
    CardComponent,
    CardHeaderComponent,
    CardContentComponent,
    CardFooterComponent
  ],
  template: `
    <fly-card>
      <fly-card-header>
        <h2>Login to Your Account</h2>
      </fly-card-header>
      
      <fly-card-content>
        <fly-input
          label="Email Address"
          type="email"
          placeholder="you@example.com"
          [(ngModel)]="email"
          [error]="emailError"
          required
        />
        
        <fly-input
          label="Password"
          type="password"
          placeholder="Enter your password"
          [(ngModel)]="password"
          required
        />
      </fly-card-content>
      
      <fly-card-footer>
        <fly-button variant="ghost">Forgot Password?</fly-button>
        <fly-button 
          variant="primary" 
          [loading]="isLoading"
          (clicked)="login()"
        >
          Sign In
        </fly-button>
      </fly-card-footer>
    </fly-card>
  `,
})
export class LoginFormComponent {
  email = '';
  password = '';
  emailError = '';
  isLoading = false;

  login() {
    this.isLoading = true;
    // Handle login...
  }
}
```

### Authentication Integration

```typescript
import { Component, inject, effect } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '@flyfront/auth';

@Component({
  selector: 'app-profile',
  template: `
    @if (auth.isLoading()) {
      <fly-spinner size="lg" />
    } @else if (auth.isAuthenticated()) {
      <div class="profile">
        <h1>Welcome, {{ auth.user()?.displayName }}</h1>
        <p>Email: {{ auth.user()?.email }}</p>
        <p>Roles: {{ auth.roles().join(', ') }}</p>
        
        <fly-button variant="outline" (clicked)="logout()">
          Sign Out
        </fly-button>
      </div>
    } @else {
      <fly-button variant="primary" (clicked)="login()">
        Sign In
      </fly-button>
    }
  `,
})
export class ProfileComponent {
  readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  constructor() {
    // React to auth state changes
    effect(() => {
      if (!this.auth.isAuthenticated() && !this.auth.isLoading()) {
        this.router.navigate(['/login']);
      }
    });
  }

  login() {
    this.auth.login({ returnUrl: '/profile' });
  }

  logout() {
    this.auth.logout('/');
  }
}
```

### Application Configuration

```typescript
// app.config.ts
import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideConfig, httpErrorInterceptor } from '@flyfront/core';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(
      withInterceptors([httpErrorInterceptor])
    ),
    provideConfig({
      appName: 'My Firefly App',
      version: '1.0.0',
      environment: 'production',
      apiBaseUrl: 'https://api.example.com',
      auth: {
        provider: 'oidc',
        issuerUrl: 'https://auth.example.com/realms/myapp',
        clientId: 'my-client-id',
        redirectUri: 'https://myapp.com/callback',
      },
      logging: {
        level: 'info',
        console: true,
      },
    }),
  ],
};
```

### Protected Routes

```typescript
// app.routes.ts
import { Routes } from '@angular/router';
import { authGuard, permissionGuard } from '@flyfront/core';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./home/home.component'),
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./dashboard/dashboard.component'),
    canActivate: [authGuard()],
  },
  {
    path: 'admin',
    loadComponent: () => import('./admin/admin.component'),
    canActivate: [
      authGuard(),
      permissionGuard({ 
        roles: ['admin'],
        forbiddenUrl: '/forbidden' 
      })
    ],
  },
  {
    path: 'forbidden',
    loadComponent: () => import('./forbidden/forbidden.component'),
  },
];
```

---

##  Development

### Common Commands

```bash
# Start development server
npm start

# Serve a specific app
npx nx serve demo-app

# Generate a new library
npx nx g @nx/angular:library --name=my-lib --directory=libs/my-lib

# Generate a new component
npx nx g @nx/angular:component --name=my-component --project=ui

# View project dependency graph
npx nx graph

# Run affected commands (based on git changes)
npx nx affected -t lint
npx nx affected -t test
npx nx affected -t build
```

### Code Quality

```bash
# Lint all projects
npx nx run-many -t lint

# Lint specific project
npx nx lint core

# Format code with Prettier
npm run format

# Type check
npx nx run-many -t typecheck
```

---

##  Testing

### Unit Tests

```bash
# Run all tests
npx nx run-many -t test

# Run tests for specific library
npx nx test core

# Run tests in watch mode
npx nx test core --watch

# Run tests with coverage
npx nx test core --coverage
```

### End-to-End Tests

```bash
# Run E2E tests
npx nx e2e e2e

# Run E2E tests with UI
npx nx e2e e2e --ui
```

---

##  Deployment

### Building for Production

```bash
# Build single application
npx nx build demo-app --configuration=production

# Build all affected projects
npx nx affected -t build --configuration=production
```

### Docker Deployment

```bash
# Build Docker image
docker build -t flyfront:latest .

# Build with specific app
docker build --build-arg APP_NAME=demo-app -t flyfront:demo .

# Run container
docker run -p 80:80 \
  -e API_URL=https://api.example.com \
  -e AUTH_URL=https://auth.example.com \
  flyfront:latest
```

### Environment Variables

| Variable | Description | Default |
|----------|-------------|--------|
| `API_URL` | Backend API base URL | `/api` |
| `AUTH_URL` | Authentication server URL | - |
| `AUTH_CLIENT_ID` | OIDC client ID | - |
| `ENVIRONMENT` | Environment name | `production` |

---

##  Documentation

Comprehensive documentation is available in the `/docs` directory:

| Document | Description |
|----------|-------------|
| [Architecture Overview](docs/architecture/README.md) | System architecture and design decisions |
| [Getting Started Guide](docs/guides/getting-started.md) | Step-by-step setup instructions |
| [Design System](docs/guides/design-system.md) | Design tokens and component guidelines |
| [Authentication Guide](docs/guides/authentication.md) | Setting up authentication |
| [API Reference](docs/api/README.md) | Complete API documentation |
| [Contributing Guide](CONTRIBUTING.md) | How to contribute to Flyfront |

---

##  Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Quick Steps

1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/amazing-feature`
3. **Make** your changes
4. **Test** your changes: `npx nx affected -t test`
5. **Commit** with conventional commits: `git commit -m 'feat: add amazing feature'`
6. **Push** to your fork: `git push origin feature/amazing-feature`
7. **Open** a Pull Request

### Commit Convention

We use [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` New features
- `fix:` Bug fixes
- `docs:` Documentation changes
- `style:` Code style changes (formatting)
- `refactor:` Code refactoring
- `test:` Adding or updating tests
- `chore:` Maintenance tasks

---

##  License

This project is licensed under the **Apache License 2.0** - see the [LICENSE](LICENSE) file for details.

```
Copyright 2026 Firefly

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
```

---

<div align="center">

**Built with <3 by the Firefly Software Solutions Inc**

[ Star us on GitHub](https://github.com/firefly-oss/flyfront) •
[ Report Bug](https://github.com/firefly-oss/flyfront/issues) •
[ Request Feature](https://github.com/firefly-oss/flyfront/issues)

</div>
