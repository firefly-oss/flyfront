# API Reference

Complete API documentation for all Flyfront libraries.

## Libraries

### Foundation Layer

| Library | Description | Documentation |
|---------|-------------|---------------|
| **@flyfront/core** | Core utilities, services, guards, and interceptors | [View API](../architecture/libraries.md#flyfrontcore) |
| **@flyfront/ui** | Design system and UI components | [View API](../architecture/libraries.md#flyfrontui) |
| **@flyfront/testing** | Testing utilities and mocks | [View API](../architecture/libraries.md#flyfronttesting) |

### Feature Layer

| Library | Description | Documentation |
|---------|-------------|---------------|
| **@flyfront/auth** | Authentication and authorization | [View API](../architecture/libraries.md#flyfrontauth) |
| **@flyfront/data-access** | HTTP client and API utilities | [View API](../architecture/libraries.md#flyfrontdata-access) |
| **@flyfront/state** | State management utilities | [View API](../architecture/libraries.md#flyfrontstate) |
| **@flyfront/i18n** | Internationalization | [View API](../architecture/libraries.md#flyfronti18n) |

---

## Quick Reference

### @flyfront/core

```typescript
// Services
import { ConfigService, LoggerService, StorageService } from '@flyfront/core';

// Guards
import { authGuard, permissionGuard } from '@flyfront/core';

// Interceptors
import { httpErrorInterceptor } from '@flyfront/core';

// Utilities
import { isString, isNumber, isObject, isDefined } from '@flyfront/core';

// Provider functions
import { provideConfig } from '@flyfront/core';
```

### @flyfront/ui

```typescript
// Components
import {
  ButtonComponent,
  InputComponent,
  SelectComponent,
  TextareaComponent,
  CheckboxComponent,
  RadioComponent,
  SwitchComponent,
  CardComponent,
  CardHeaderComponent,
  CardContentComponent,
  CardFooterComponent,
  DialogComponent,
  ToastComponent,
  AlertComponent,
  ProgressComponent,
  DataTableComponent,
  PaginationComponent,
  BadgeComponent,
  AvatarComponent,
  TooltipComponent,
  TabsComponent,
  BreadcrumbComponent,
  StepperComponent,
  MenuComponent,
  LoadingComponent,
  AppShellComponent,
} from '@flyfront/ui';

// Design tokens
import { designTokens, colors, typography, spacing } from '@flyfront/ui';
```

### @flyfront/auth

```typescript
// Services
import { AuthService, TokenService } from '@flyfront/auth';
```

### @flyfront/data-access

```typescript
// Services
import { ApiService, WebSocketService } from '@flyfront/data-access';

// Types
import { 
  PaginatedResponse, 
  PaginationParams,
  PollingConfig,
  SSEConfig,
  SSEMessage,
  RetryConfig,
  ReactiveRequestConfig,
  PaginatedStreamState,
} from '@flyfront/data-access';
```

### @flyfront/state

```typescript
// Entity Feature
import { createEntityFeature } from '@flyfront/state';

// Signal Store
import { createSignalStore, withAsync, withPagination, withList, withEntities } from '@flyfront/state';

// Providers
import { provideAppState, provideFeatureState, provideFeatureEffects } from '@flyfront/state';
```

### @flyfront/i18n

```typescript
// Services
import { LocaleService, TranslocoService } from '@flyfront/i18n';

// Pipes
import { TranslocoPipe } from '@flyfront/i18n';

// Provider functions
import { provideI18n } from '@flyfront/i18n';
```

### @flyfront/testing

```typescript
// Mock services
import {
  MockAuthService,
  MockApiService,
  MockConfigService,
  MockStorageService,
  MockRouter,
  MockActivatedRoute,
} from '@flyfront/testing';

// Test utilities
import {
  renderComponent,
  createSpyObj,
  waitFor,
  waitForStable,
  getEmittedValue,
  createMockSignal,
  flushMicrotasks,
  createMockFn,
} from '@flyfront/testing';
```

---

## Detailed Documentation

For detailed API documentation including all properties, methods, and examples, see the [Libraries Reference](../architecture/libraries.md).
