# Architecture Overview

This document provides a comprehensive overview of Flyfront's architecture, design principles, and technical decisions.

## Table of Contents

- [Introduction](#introduction)
- [Architectural Principles](#architectural-principles)
- [Monorepo Structure](#monorepo-structure)
- [Library Layers](#library-layers)
- [Dependency Graph](#dependency-graph)
- [Technology Stack](#technology-stack)
- [Design Decisions](#design-decisions)

---

## Introduction

Flyfront is built as an **Nx monorepo** containing multiple Angular applications and shared libraries. This architecture provides:

- **Code Sharing**: Reusable components, services, and utilities across all applications
- **Consistent Standards**: Unified coding patterns, linting rules, and testing practices
- **Efficient Builds**: Nx's computation caching and affected commands
- **Clear Boundaries**: Well-defined library APIs with enforced dependency constraints

### Goals

1. **Reduce Duplication**: Write once, use everywhere
2. **Enforce Consistency**: Same patterns across all Firefly frontends
3. **Enable Scalability**: Easy to add new applications and features
4. **Maintain Quality**: Built-in testing, linting, and type safety
5. **Simplify Deployment**: Standardized build and deployment processes

---

## Architectural Principles

### 1. Single Responsibility

Each library has a clear, focused purpose:

| Library | Responsibility |
|---------|---------------|
| `core` | Infrastructure and utilities |
| `ui` | Visual components and design system |
| `auth` | Authentication and authorization |
| `data-access` | Backend communication |
| `state` | State management patterns |
| `i18n` | Internationalization |
| `testing` | Test utilities |

### 2. Loose Coupling

Libraries communicate through well-defined public APIs. Internal implementation details are encapsulated and not exposed.

```typescript
//  Good: Import from public API
import { ButtonComponent } from '@flyfront/ui';

//  Bad: Import from internal path
import { ButtonComponent } from '@flyfront/ui/src/lib/components/button/button.component';
```

### 3. High Cohesion

Related functionality is grouped together within libraries. For example, all authentication-related code (services, guards, interceptors) lives in `@flyfront/auth`.

### 4. Dependency Inversion

Higher-level modules don't depend on lower-level implementation details. Instead, they depend on abstractions (interfaces, tokens).

```typescript
// Define abstraction
export interface LoggingService {
  log(message: string, level: LogLevel): void;
}

// Provide implementation
export const LOGGING_SERVICE = new InjectionToken<LoggingService>('LoggingService');
```

### 5. Composition Over Inheritance

Flyfront favors composable, standalone components over complex inheritance hierarchies.

```typescript
//  Good: Composition with standalone components
@Component({
  standalone: true,
  imports: [ButtonComponent, CardComponent],
  template: `
    <fly-card>
      <fly-button>Click me</fly-button>
    </fly-card>
  `,
})
export class MyFeatureComponent {}
```

---

## Monorepo Structure

```
flyfront/
├── apps/                          # Deployable applications
│   ├── demo-app/                  # Demo/showcase application
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── app.component.ts
│   │   │   │   ├── app.config.ts
│   │   │   │   └── app.routes.ts
│   │   │   ├── assets/
│   │   │   ├── environments/
│   │   │   ├── main.ts
│   │   │   └── styles.scss
│   │   ├── project.json
│   │   └── tsconfig.app.json
│   └── [future-apps]/
│
├── libs/                          # Shared libraries
│   ├── core/                      # @flyfront/core
│   ├── ui/                        # @flyfront/ui
│   ├── auth/                      # @flyfront/auth
│   ├── data-access/               # @flyfront/data-access
│   ├── state/                     # @flyfront/state
│   ├── i18n/                      # @flyfront/i18n
│   └── testing/                   # @flyfront/testing
│
├── tools/                         # Custom tooling
│   └── generators/                # Nx custom generators
│
├── docs/                          # Documentation
│
├── docker/                        # Docker configuration
│
├── .github/                       # GitHub configuration
│   └── workflows/                 # CI/CD workflows
│
├── nx.json                        # Nx configuration
├── tsconfig.base.json            # Base TypeScript config
├── package.json                  # Dependencies
└── tailwind.config.js            # TailwindCSS config
```

### Applications (`apps/`)

Applications are deployable units that compose libraries to create user-facing products. Each application:

- Has its own `project.json` configuration
- Defines its own routing and top-level configuration
- Can have environment-specific settings
- Imports from shared libraries only

### Libraries (`libs/`)

Libraries contain reusable code organized by domain/concern. Each library:

- Has a public API defined in `src/index.ts`
- Contains only related, cohesive functionality
- Can depend on other libraries (following dependency rules)
- Is independently testable and buildable

---

## Library Layers

Flyfront organizes libraries into three conceptual layers:

```
┌─────────────────────────────────────────────────────────┐
│                    APPLICATION LAYER                    │
│                                                         │
│    ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │
│    │  Demo App   │  │  Admin App  │  │ Portal App  │    │
│    └─────────────┘  └─────────────┘  └─────────────┘    │
└───────────────────────────┬─────────────────────────────┘
                            │ imports
                            ▼
┌─────────────────────────────────────────────────────────┐
│                    FEATURE LAYER                        │
│                                                         │
│    ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │
│    │    Auth     │  │ Data Access │  │    State    │    │
│    └─────────────┘  └─────────────┘  └─────────────┘    │
│                                                         │
│    ┌─────────────┐                                      │
│    │    i18n     │                                      │
│    └─────────────┘                                      │
└───────────────────────────┬─────────────────────────────┘
                            │ imports
                            ▼
┌─────────────────────────────────────────────────────────┐
│                   FOUNDATION LAYER                      │
│                                                         │
│    ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │
│    │    Core     │  │     UI      │  │   Testing   │    │
│    └─────────────┘  └─────────────┘  └─────────────┘    │
└─────────────────────────────────────────────────────────┘
```

### Foundation Layer

The foundation layer contains domain-agnostic, reusable code:

| Library | Purpose |
|---------|---------|
| **core** | Configuration, logging, utilities, type guards, interceptors |
| **ui** | Design tokens, UI components, layout components |
| **testing** | Test utilities, mocks, custom matchers |

**Rules:**
- No dependencies on feature layer libraries
- Can depend on other foundation libraries
- Should be stable and change infrequently

### Feature Layer

The feature layer contains domain-specific functionality:

| Library | Purpose |
|---------|---------|
| **auth** | Authentication services, guards, token management |
| **data-access** | HTTP services, API utilities, caching |
| **state** | NgRx utilities, entity adapters, effects |
| **i18n** | Translation services, locale management |

**Rules:**
- Can depend on foundation layer
- Can depend on other feature libraries (carefully)
- Encapsulates domain logic

### Application Layer

Applications compose libraries to create deployable products:

**Rules:**
- Can depend on any library
- Should contain minimal code (mostly configuration and composition)
- Define application-specific routes and layouts

---

## Dependency Graph

Visualize the project dependencies:

```bash
npx nx graph
```

### Allowed Dependencies

```
Application → Feature → Foundation
     ↓           ↓
     └───────────┴──────→ Foundation
```

### Dependency Matrix

| Library      | Can Depend On |
|--------------|---------------|
| core         | (none) |
| ui           | core |
| testing      | core, ui |
| auth         | core |
| data-access  | core, auth |
| state        | core |
| i18n         | core |
| Applications | All libraries |

### Enforcing Dependencies

Dependencies are enforced via Nx's module boundary rules in `nx.json`:

```json
{
  "rules": {
    "@nx/enforce-module-boundaries": [
      "error",
      {
        "depConstraints": [
          { "sourceTag": "type:app", "onlyDependOnLibsWithTags": ["type:feature", "type:foundation"] },
          { "sourceTag": "type:feature", "onlyDependOnLibsWithTags": ["type:foundation", "type:feature"] },
          { "sourceTag": "type:foundation", "onlyDependOnLibsWithTags": ["type:foundation"] }
        ]
      }
    ]
  }
}
```

---

## Technology Stack

### Core Technologies

| Technology | Version | Purpose |
|------------|---------|---------|
| **Angular** | 21.x | Component framework |
| **TypeScript** | 5.9.x | Type-safe JavaScript |
| **Nx** | 22.x | Monorepo tooling |
| **TailwindCSS** | 4.x | Utility-first CSS |
| **RxJS** | 7.x | Reactive programming |

### State Management

| Technology | Purpose |
|------------|---------|
| **Angular Signals** | Component-level reactive state |
| **NgRx** | Application-level state management |
| **NgRx Effects** | Side effect management |
| **NgRx Entity** | Entity collection management |

### Testing

| Technology | Purpose |
|------------|---------|
| **Vitest** | Unit testing |
| **Playwright** | E2E testing |
| **Testing Library** | Component testing |

### Build & Deployment

| Technology | Purpose |
|------------|---------|
| **esbuild** | Fast TypeScript bundling |
| **Docker** | Containerization |
| **Nginx** | Static file serving |
| **GitHub Actions** | CI/CD automation |

---

## Design Decisions

### Why Angular?

1. **Enterprise Ready**: Built-in solutions for routing, forms, HTTP, i18n
2. **TypeScript First**: Full type safety out of the box
3. **Dependency Injection**: Powerful and flexible DI system
4. **Signals**: Modern reactive primitives for fine-grained reactivity
5. **Standalone Components**: Simplified module-free architecture

### Why Nx?

1. **Computation Caching**: Never rebuild what hasn't changed
2. **Affected Commands**: Only test/build what's affected by changes
3. **Dependency Graph**: Visual understanding of project structure
4. **Code Generation**: Consistent project scaffolding
5. **Module Boundaries**: Enforce architectural constraints

### Why Standalone Components?

1. **Simpler Mental Model**: No NgModules to manage
2. **Better Tree Shaking**: Only import what you use
3. **Lazy Loading**: Components can be lazy-loaded directly
4. **Future Proof**: Angular's recommended approach going forward

### Why TailwindCSS?

1. **Utility-First**: Rapid development with utility classes
2. **Design Tokens**: Easy to customize via configuration
3. **No CSS Bloat**: PurgeCSS removes unused styles
4. **Component-Friendly**: Styles stay with components

### Why Signals Over RxJS Everywhere?

1. **Simpler Syntax**: No subscription management for simple cases
2. **Better Performance**: Fine-grained updates
3. **Angular Integration**: Native to Angular 21+
4. **RxJS When Needed**: Still use RxJS for complex async flows

---

## Related Documentation

- [Libraries](libraries.md) - Detailed library documentation
- [Dependency Rules](dependency-rules.md) - Complete dependency constraints
- [Design Patterns](patterns.md) - Common patterns and best practices
