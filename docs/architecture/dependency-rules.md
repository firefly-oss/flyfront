# Dependency Rules

This document defines the dependency constraints between libraries in the Flyfront monorepo. These rules ensure a clean, maintainable architecture and prevent circular dependencies.

## Table of Contents

- [Overview](#overview)
- [Library Layers](#library-layers)
- [Dependency Matrix](#dependency-matrix)
- [Enforcement Mechanisms](#enforcement-mechanisms)
- [Common Violations](#common-violations)
- [Refactoring Guidance](#refactoring-guidance)

---

## Overview

Flyfront's dependency rules follow a layered architecture pattern. Dependencies flow in one direction: from higher layers to lower layers. This ensures:

1. **Testability**: Lower-level libraries can be tested in isolation
2. **Reusability**: Foundation libraries can be used without pulling in feature-specific code
3. **Maintainability**: Changes to higher-level code don't affect lower-level code
4. **Build Performance**: Nx can parallelize builds and cache effectively

### The Golden Rule

> A library should never depend on a library that depends on it (no circular dependencies).

---

## Library Layers

Libraries are organized into three tiers:

### Tier 1: Foundation Layer

These libraries have no domain-specific knowledge. They provide utilities, infrastructure, and UI primitives.

| Library | Description | Dependencies |
|---------|-------------|--------------|
| `@flyfront/core` | Configuration, logging, utilities, type guards | None |
| `@flyfront/ui` | Design tokens, UI components | `@flyfront/core` |
| `@flyfront/testing` | Test utilities, mocks | `@flyfront/core`, `@flyfront/ui` |

**Characteristics:**
- Stable APIs that change infrequently
- No business logic
- Highly reusable across any application

### Tier 2: Feature Layer

These libraries provide domain-specific functionality that can be composed into applications.

| Library | Description | Dependencies |
|---------|-------------|--------------|
| `@flyfront/auth` | Authentication, authorization | `@flyfront/core` |
| `@flyfront/data-access` | HTTP, WebSocket, caching | `@flyfront/core`, `@flyfront/auth` |
| `@flyfront/state` | State management utilities | `@flyfront/core` |
| `@flyfront/i18n` | Internationalization | `@flyfront/core` |

**Characteristics:**
- Domain-specific but reusable across applications
- Can depend on foundation and other feature libraries (carefully)
- Encapsulates implementation details

### Tier 3: Application Layer

Applications compose libraries to create deployable products.

**Characteristics:**
- Can depend on any library
- Contains minimal code (routing, configuration, composition)
- Application-specific logic that doesn't belong in libraries

---

## Dependency Matrix

### What Can Depend on What?

```
┌──────────────────────────────────────────────────────────────────────┐
│                           ALLOWED DEPENDENCIES                         │
├───────────────┬──────┬────┬─────────┬──────┬─────────────┬───────┬────┤
│ LIBRARY       │ core │ ui │ testing │ auth │ data-access │ state │i18n│
├───────────────┼──────┼────┼─────────┼──────┼─────────────┼───────┼────┤
│ core          │  -   │ ✗  │    ✗    │  ✗   │      ✗      │   ✗   │ ✗  │
│ ui            │  ✓   │ -  │    ✗    │  ✗   │      ✗      │   ✗   │ ✗  │
│ testing       │  ✓   │ ✓  │    -    │  ✗   │      ✗      │   ✗   │ ✗  │
│ auth          │  ✓   │ ✗  │    ✗    │  -   │      ✗      │   ✗   │ ✗  │
│ data-access   │  ✓   │ ✗  │    ✗    │  ✓   │      -      │   ✗   │ ✗  │
│ state         │  ✓   │ ✗  │    ✗    │  ✗   │      ✗      │   -   │ ✗  │
│ i18n          │  ✓   │ ✗  │    ✗    │  ✗   │      ✗      │   ✗   │ -  │
│ Applications  │  ✓   │ ✓  │    ✓    │  ✓   │      ✓      │   ✓   │ ✓  │
└───────────────┴──────┴────┴─────────┴──────┴─────────────┴───────┴────┘

✓ = Allowed    ✗ = Not Allowed    - = Self (N/A)
```

### Visual Dependency Flow

```
                    ┌─────────────────────────┐
                    │      APPLICATIONS       │
                    │    (demo-app, etc.)     │
                    └───────────┬─────────────┘
                                │
           ┌────────────────────┼────────────────────┐
           │                    │                    │
           ▼                    ▼                    ▼
    ┌─────────────┐      ┌─────────────┐     ┌─────────────┐
    │    auth     │      │ data-access │     │    i18n     │
    └──────┬──────┘      └──────┬──────┘     └──────┬──────┘
           │                    │                   │
           │                    ▼                   │
           │             ┌──────┴──────┐            │
           │             │    auth     │            │
           │             └──────┬──────┘            │
           │                    │                   │
           └────────────────────┼───────────────────┘
                                │
                                ▼
    ┌─────────────┐      ┌─────────────┐     ┌─────────────┐
    │   testing   │ ───► │     ui      │     │    state    │
    └──────┬──────┘      └──────┬──────┘     └──────┬──────┘
           │                    │                   │
           └────────────────────┼───────────────────┘
                                │
                                ▼
                         ┌─────────────┐
                         │    core     │
                         └─────────────┘
```

---

## Enforcement Mechanisms

### 1. Nx Module Boundaries

Dependency rules are enforced at build time via ESLint. The configuration in `eslint.config.mjs`:

```javascript
// eslint.config.mjs
import { nxModuleBoundaryRules } from '@nx/eslint-plugin';

export default [
  {
    rules: {
      '@nx/enforce-module-boundaries': [
        'error',
        {
          enforceBuildableLibDependency: true,
          allow: [],
          depConstraints: [
            // Foundation libraries have no external dependencies
            {
              sourceTag: 'layer:foundation',
              onlyDependOnLibsWithTags: ['layer:foundation'],
            },
            // Feature libraries can depend on foundation
            {
              sourceTag: 'layer:feature',
              onlyDependOnLibsWithTags: ['layer:foundation', 'layer:feature'],
            },
            // Applications can depend on anything
            {
              sourceTag: 'type:app',
              onlyDependOnLibsWithTags: ['layer:foundation', 'layer:feature'],
            },
          ],
        },
      ],
    },
  },
];
```

### 2. Project Tags

Each library must have appropriate tags in its `project.json`:

```json
// libs/core/project.json
{
  "tags": ["layer:foundation", "scope:shared"]
}

// libs/auth/project.json
{
  "tags": ["layer:feature", "scope:auth"]
}

// apps/demo-app/project.json
{
  "tags": ["type:app", "scope:demo"]
}
```

### 3. TypeScript Path Mappings

TypeScript path mappings in `tsconfig.base.json` ensure proper import resolution:

```json
{
  "compilerOptions": {
    "paths": {
      "@flyfront/core": ["libs/core/src/index.ts"],
      "@flyfront/ui": ["libs/ui/src/index.ts"],
      "@flyfront/auth": ["libs/auth/src/index.ts"],
      "@flyfront/data-access": ["libs/data-access/src/index.ts"],
      "@flyfront/state": ["libs/state/src/index.ts"],
      "@flyfront/i18n": ["libs/i18n/src/index.ts"],
      "@flyfront/testing": ["libs/testing/src/index.ts"]
    }
  }
}
```

### 4. CI Pipeline Validation

The CI pipeline runs dependency checks on every PR:

```yaml
# .github/workflows/ci.yml
- name: Check Module Boundaries
  run: npx nx affected -t lint --parallel=3
```

---

## Common Violations

### Violation 1: UI Component Importing Auth Service

**Problem:**
```typescript
// libs/ui/src/lib/components/user-avatar/user-avatar.component.ts
import { AuthService } from '@flyfront/auth'; // ❌ NOT ALLOWED
```

**Why it's wrong:**
- UI components should be domain-agnostic
- Creates coupling between presentation and business logic
- Makes UI components harder to test and reuse

**Solution:**
```typescript
// libs/ui/src/lib/components/user-avatar/user-avatar.component.ts
@Component({
  selector: 'fly-user-avatar',
  template: `
    <img [src]="imageUrl()" [alt]="name()" />
  `,
})
export class UserAvatarComponent {
  // Accept data as inputs instead
  imageUrl = input.required<string>();
  name = input.required<string>();
}

// In application code:
<fly-user-avatar 
  [imageUrl]="authService.user()?.avatarUrl" 
  [name]="authService.user()?.name" 
/>
```

### Violation 2: Core Library Importing Feature Library

**Problem:**
```typescript
// libs/core/src/lib/services/api-logger.ts
import { DataAccessService } from '@flyfront/data-access'; // ❌ NOT ALLOWED
```

**Why it's wrong:**
- Core is foundation layer; data-access is feature layer
- Creates circular dependency risk
- Reduces core library's reusability

**Solution:**
Use dependency inversion:
```typescript
// libs/core/src/lib/services/logger.service.ts
export interface LogTransport {
  send(log: LogEntry): Promise<void>;
}

export const LOG_TRANSPORT = new InjectionToken<LogTransport>('LogTransport');

// libs/data-access/src/lib/services/http-log-transport.ts
@Injectable()
export class HttpLogTransport implements LogTransport {
  async send(log: LogEntry): Promise<void> {
    // Send to API
  }
}

// In application
providers: [
  { provide: LOG_TRANSPORT, useClass: HttpLogTransport }
]
```

### Violation 3: Feature Library Importing Testing Library

**Problem:**
```typescript
// libs/auth/src/lib/services/auth.service.ts
import { mockUser } from '@flyfront/testing'; // ❌ NOT ALLOWED
```

**Why it's wrong:**
- Testing utilities should only be used in test files
- Increases production bundle size
- Creates inappropriate dependency

**Solution:**
- Move mock data to a shared location only used in tests
- Use proper test file imports:
```typescript
// libs/auth/src/lib/services/auth.service.spec.ts
import { mockUser } from '@flyfront/testing'; // ✓ OK in test files
```

---

## Refactoring Guidance

### When You Need Cross-Layer Communication

If you find yourself needing a higher layer to depend on a lower layer, consider these patterns:

#### 1. Dependency Inversion

Define an interface in the lower layer, implement it in the higher layer:

```typescript
// In @flyfront/core
export interface UserProvider {
  getCurrentUser(): Observable<User | null>;
}
export const USER_PROVIDER = new InjectionToken<UserProvider>('UserProvider');

// In @flyfront/auth
@Injectable()
export class AuthUserProvider implements UserProvider {
  getCurrentUser(): Observable<User | null> {
    return this.authService.user$;
  }
}

// In application
providers: [
  { provide: USER_PROVIDER, useClass: AuthUserProvider }
]
```

#### 2. Event-Based Communication

Use an event bus or message passing:

```typescript
// In @flyfront/core
export class EventBus {
  private events = new Subject<AppEvent>();
  
  emit(event: AppEvent): void {
    this.events.next(event);
  }
  
  on<T extends AppEvent>(type: string): Observable<T> {
    return this.events.pipe(filter(e => e.type === type));
  }
}

// Higher-level library emits events
// Lower-level library can subscribe to events defined in core
```

#### 3. Facade Pattern

Create a facade in the application layer that coordinates between libraries:

```typescript
// In application
@Injectable({ providedIn: 'root' })
export class UserFacade {
  private auth = inject(AuthService);
  private data = inject(DataAccessService);
  
  // Coordinates auth and data-access without them knowing about each other
  getUserWithProfile(): Observable<UserWithProfile> {
    return this.auth.user$.pipe(
      switchMap(user => this.data.get<Profile>(`/profiles/${user.id}`)),
      map(profile => ({ ...this.auth.user(), ...profile }))
    );
  }
}
```

### Moving Code Between Libraries

When refactoring code location:

1. **Identify the appropriate layer** based on the code's purpose
2. **Check dependencies** - the code can only import from same or lower layers
3. **Update imports** in all consuming code
4. **Run `nx affected -t lint`** to verify no violations
5. **Update tests** to use new import paths

---

## Related Documentation

- [Architecture Overview](README.md)
- [Libraries Documentation](libraries.md)
- [Design Patterns](patterns.md)
