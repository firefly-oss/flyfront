# Testing Guide

This guide covers testing strategies and patterns for Flyfront applications, including unit tests with Vitest and end-to-end tests with Playwright.

## Table of Contents

- [Overview](#overview)
- [Unit Testing](#unit-testing)
- [Component Testing](#component-testing)
- [Service Testing](#service-testing)
- [E2E Testing](#e2e-testing)
- [Test Utilities](#test-utilities)
- [Best Practices](#best-practices)

---

## Overview

Flyfront uses a comprehensive testing strategy:

| Test Type | Tool | Purpose |
|-----------|------|---------|
| Unit | Vitest | Test individual functions and classes |
| Component | Vitest + Testing Library | Test component behavior |
| Integration | Vitest | Test service interactions |
| E2E | Playwright | Test complete user flows |

### Running Tests

```bash
# Run all tests for a project
npx nx test ui

# Run tests with coverage
npx nx test ui --coverage

# Run affected tests
npx nx affected -t test

# Run E2E tests
npx nx e2e e2e

# Watch mode
npx nx test ui --watch
```

---

## Unit Testing

Unit tests verify that individual pieces of code work correctly in isolation. They're fast, reliable, and help you catch bugs early.

### Setting Up a Test File

Test files live alongside the code they test, with a `.spec.ts` extension:

```
src/
├── utils/
│   ├── format.utils.ts       # The code
│   └── format.utils.spec.ts  # The tests
```

### Writing Your First Unit Test

Let's walk through testing a simple utility function step by step.

**Step 1**: Create a test file with the same name as your source file, but with `.spec.ts`

**Step 2**: Import the testing utilities and the code you want to test

**Step 3**: Use `describe()` to group related tests, and `it()` for individual test cases

**Step 4**: Use `expect()` to make assertions about the expected behavior

Here's a complete example:

```typescript
// utils/format.utils.spec.ts
import { describe, it, expect } from 'vitest';
import { formatCurrency, formatDate, truncate } from './format.utils';

describe('formatCurrency', () => {
  it('should format USD currency', () => {
    expect(formatCurrency(99.99, 'USD')).toBe('$99.99');
  });

  it('should handle zero', () => {
    expect(formatCurrency(0, 'USD')).toBe('$0.00');
  });

  it('should handle negative values', () => {
    expect(formatCurrency(-50, 'USD')).toBe('-$50.00');
  });
});

describe('truncate', () => {
  it('should truncate long strings', () => {
    expect(truncate('Hello World', 5)).toBe('Hello...');
  });

  it('should not truncate short strings', () => {
    expect(truncate('Hi', 10)).toBe('Hi');
  });
});
```

### Testing Type Guards

```typescript
// utils/type-guards.spec.ts
import { describe, it, expect } from 'vitest';
import { isUser, isApiError } from './type-guards';

describe('isUser', () => {
  it('should return true for valid user object', () => {
    const user = { id: '1', name: 'Alice', email: 'alice@example.com' };
    expect(isUser(user)).toBe(true);
  });

  it('should return false for invalid object', () => {
    expect(isUser({ id: '1' })).toBe(false);
    expect(isUser(null)).toBe(false);
    expect(isUser('string')).toBe(false);
  });
});
```

---

## Component Testing

Component tests verify that Angular components render correctly and respond to user interactions. We use Angular Testing Library, which encourages testing components the way users interact with them.

### Why Testing Library?

Traditional Angular tests often access component internals directly:
```typescript
// Old approach - testing implementation details
expect(component.isLoading).toBe(true);
fixture.nativeElement.querySelector('button').click();
```

Testing Library encourages testing from the user's perspective:
```typescript
// Testing Library approach - testing behavior
expect(screen.getByText('Loading...')).toBeTruthy();
await user.click(screen.getByRole('button', { name: 'Submit' }));
```

This approach makes tests more resilient to refactoring and better reflects how users actually use your components.

### Step-by-Step Component Test

Let's write a test for a button component:

**Step 1**: Set up the test file with necessary imports

```typescript
import { describe, it, expect, vi } from 'vitest';  // Test framework
import { render, screen } from '@testing-library/angular';  // Rendering
import userEvent from '@testing-library/user-event';  // User simulation
import { ButtonComponent } from './button.component';  // Component to test
```

**Step 2**: Render the component with test inputs

```typescript
await render(ButtonComponent, {
  inputs: { variant: 'primary', disabled: false },
});
```

**Step 3**: Query the DOM using accessible queries (role, label, text)

```typescript
const button = screen.getByRole('button');
```

**Step 4**: Simulate user interactions and verify results

```typescript
await userEvent.click(button);
expect(clickedSpy).toHaveBeenCalled();
```

### Complete Component Test Example

```typescript
// button.component.spec.ts
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { ButtonComponent } from './button.component';

describe('ButtonComponent', () => {
  it('should render with text', async () => {
    await render(ButtonComponent, {
      inputs: { variant: 'primary' },
      componentProperties: {
        // For content projection
      },
    });
    
    // Using Testing Library queries
    expect(screen.getByRole('button')).toBeTruthy();
  });

  it('should emit clicked event when clicked', async () => {
    const user = userEvent.setup();
    const clickedSpy = vi.fn();
    
    const { fixture } = await render(ButtonComponent, {
      inputs: { variant: 'primary' },
    });
    
    fixture.componentInstance.clicked.subscribe(clickedSpy);
    
    await user.click(screen.getByRole('button'));
    
    expect(clickedSpy).toHaveBeenCalledTimes(1);
  });

  it('should not emit when disabled', async () => {
    const user = userEvent.setup();
    const clickedSpy = vi.fn();
    
    const { fixture } = await render(ButtonComponent, {
      inputs: { disabled: true },
    });
    
    fixture.componentInstance.clicked.subscribe(clickedSpy);
    
    await user.click(screen.getByRole('button'));
    
    expect(clickedSpy).not.toHaveBeenCalled();
  });

  it('should show loading spinner when loading', async () => {
    await render(ButtonComponent, {
      inputs: { loading: true },
    });
    
    expect(screen.getByRole('button')).toHaveAttribute('aria-busy', 'true');
  });
});
```

### Testing with Inputs and Outputs

```typescript
// input.component.spec.ts
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { InputComponent } from './input.component';

describe('InputComponent', () => {
  it('should display label', async () => {
    await render(InputComponent, {
      inputs: { label: 'Email Address' },
    });
    
    expect(screen.getByText('Email Address')).toBeTruthy();
  });

  it('should emit valueChange on input', async () => {
    const user = userEvent.setup();
    const valueChangeSpy = vi.fn();
    
    const { fixture } = await render(InputComponent, {
      inputs: { label: 'Name' },
    });
    
    fixture.componentInstance.valueChange.subscribe(valueChangeSpy);
    
    const input = screen.getByRole('textbox');
    await user.type(input, 'Alice');
    
    expect(valueChangeSpy).toHaveBeenCalled();
  });

  it('should show error message', async () => {
    await render(InputComponent, {
      inputs: {
        label: 'Email',
        error: 'Invalid email format',
      },
    });
    
    expect(screen.getByText('Invalid email format')).toBeTruthy();
  });
});
```

### Testing with Dependencies

```typescript
// user-profile.component.spec.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/angular';
import { signal } from '@angular/core';
import { UserProfileComponent } from './user-profile.component';
import { UserService } from '../services/user.service';

describe('UserProfileComponent', () => {
  const mockUserService = {
    user: signal({ id: '1', name: 'Alice', email: 'alice@example.com' }),
    isLoading: signal(false),
    loadUser: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should display user information', async () => {
    await render(UserProfileComponent, {
      providers: [
        { provide: UserService, useValue: mockUserService },
      ],
    });
    
    expect(screen.getByText('Alice')).toBeTruthy();
    expect(screen.getByText('alice@example.com')).toBeTruthy();
  });

  it('should show loading state', async () => {
    mockUserService.isLoading.set(true);
    mockUserService.user.set(null);
    
    await render(UserProfileComponent, {
      providers: [
        { provide: UserService, useValue: mockUserService },
      ],
    });
    
    expect(screen.getByText(/loading/i)).toBeTruthy();
  });
});
```

---

## Service Testing

### Testing Services with HTTP

```typescript
// user.service.spec.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { UserService } from './user.service';
import { ConfigService } from '@flyfront/core';

describe('UserService', () => {
  let service: UserService;
  let httpMock: HttpTestingController;

  const mockConfigService = {
    getApiUrl: (path: string) => `/api/${path}`,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        UserService,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    });

    service = TestBed.inject(UserService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify(); // Ensure no outstanding requests
  });

  it('should load users', async () => {
    const mockUsers = [
      { id: '1', name: 'Alice' },
      { id: '2', name: 'Bob' },
    ];

    const loadPromise = service.loadUsers();

    const req = httpMock.expectOne('/api/users');
    expect(req.request.method).toBe('GET');
    req.flush(mockUsers);

    await loadPromise;

    expect(service.users()).toEqual(mockUsers);
    expect(service.isLoading()).toBe(false);
  });

  it('should handle errors', async () => {
    const loadPromise = service.loadUsers();

    const req = httpMock.expectOne('/api/users');
    req.error(new ErrorEvent('Network error'));

    await loadPromise.catch(() => {});

    expect(service.error()).toBeTruthy();
    expect(service.isLoading()).toBe(false);
  });
});
```

### Testing Signal-Based Services

```typescript
// cart.service.spec.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { CartService } from './cart.service';

describe('CartService', () => {
  let service: CartService;

  beforeEach(() => {
    service = new CartService();
  });

  it('should start with empty cart', () => {
    expect(service.items()).toEqual([]);
    expect(service.isEmpty()).toBe(true);
    expect(service.itemCount()).toBe(0);
  });

  it('should add items to cart', () => {
    const product = { id: '1', name: 'Widget', price: 9.99 };
    
    service.addItem(product, 2);
    
    expect(service.items().length).toBe(1);
    expect(service.itemCount()).toBe(2);
    expect(service.subtotal()).toBe(19.98);
  });

  it('should increment quantity for existing items', () => {
    const product = { id: '1', name: 'Widget', price: 9.99 };
    
    service.addItem(product, 1);
    service.addItem(product, 2);
    
    expect(service.items().length).toBe(1);
    expect(service.itemCount()).toBe(3);
  });

  it('should apply discount correctly', () => {
    const product = { id: '1', name: 'Widget', price: 100 };
    
    service.addItem(product, 1);
    service.applyDiscount(10);
    
    expect(service.subtotal()).toBe(100);
    expect(service.total()).toBe(90);
  });
});
```

---

## E2E Testing

### Basic Page Test

```typescript
// e2e/home.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Home Page', () => {
  test('should display welcome message', async ({ page }) => {
    await page.goto('/');
    
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Welcome');
  });

  test('should navigate to about page', async ({ page }) => {
    await page.goto('/');
    
    await page.getByRole('link', { name: 'About' }).click();
    
    await expect(page).toHaveURL('/about');
  });
});
```

### Authentication Flow Test

```typescript
// e2e/auth.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('should redirect unauthenticated users to login', async ({ page }) => {
    await page.goto('/dashboard');
    
    await expect(page).toHaveURL(/.*login/);
  });

  test('should login successfully', async ({ page }) => {
    await page.goto('/login');
    
    await page.getByLabel('Email').fill('user@example.com');
    await page.getByLabel('Password').fill('password123');
    await page.getByRole('button', { name: 'Sign In' }).click();
    
    await expect(page).toHaveURL('/dashboard');
    await expect(page.getByText('Welcome back')).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/login');
    
    await page.getByLabel('Email').fill('invalid@example.com');
    await page.getByLabel('Password').fill('wrongpassword');
    await page.getByRole('button', { name: 'Sign In' }).click();
    
    await expect(page.getByText(/invalid credentials/i)).toBeVisible();
  });
});
```

### Form Interaction Test

```typescript
// e2e/user-form.spec.ts
import { test, expect } from '@playwright/test';

test.describe('User Form', () => {
  test.beforeEach(async ({ page }) => {
    // Setup: login and navigate
    await page.goto('/users/new');
  });

  test('should validate required fields', async ({ page }) => {
    await page.getByRole('button', { name: 'Save' }).click();
    
    await expect(page.getByText('Name is required')).toBeVisible();
    await expect(page.getByText('Email is required')).toBeVisible();
  });

  test('should create new user', async ({ page }) => {
    await page.getByLabel('Name').fill('John Doe');
    await page.getByLabel('Email').fill('john@example.com');
    await page.getByLabel('Role').selectOption('admin');
    
    await page.getByRole('button', { name: 'Save' }).click();
    
    await expect(page.getByText('User created successfully')).toBeVisible();
    await expect(page).toHaveURL(/.*users$/);
  });
});
```

---

## Test Utilities

### Mock Services from @flyfront/testing

```typescript
import {
  createMockAuthService,
  createMockHttpClient,
  createMockConfigService,
} from '@flyfront/testing';

describe('MyComponent', () => {
  it('should work with mock auth', async () => {
    const mockAuth = createMockAuthService({
      isAuthenticated: true,
      user: { id: '1', name: 'Test User' },
    });

    await render(MyComponent, {
      providers: [
        { provide: AuthService, useValue: mockAuth },
      ],
    });
  });
});
```

### Custom Test Helpers

```typescript
// test-utils.ts
import { render } from '@testing-library/angular';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';

export async function renderWithProviders(component: any, options = {}) {
  return render(component, {
    providers: [
      provideHttpClient(),
      provideRouter([]),
      ...(options.providers || []),
    ],
    ...options,
  });
}
```

---

## Best Practices

### 1. Test Behavior, Not Implementation

```typescript
// Good: Tests behavior
it('should display error when form is invalid', async () => {
  await user.click(submitButton);
  expect(screen.getByText('Name is required')).toBeTruthy();
});

// Bad: Tests implementation details
it('should set isValid to false', async () => {
  expect(component.form.invalid).toBe(true);
});
```

### 2. Use Descriptive Test Names

```typescript
// Good
describe('CartService', () => {
  it('should remove item when quantity reaches zero', () => {});
  it('should apply percentage discount to subtotal', () => {});
});

// Bad
describe('CartService', () => {
  it('test1', () => {});
  it('works correctly', () => {});
});
```

### 3. Arrange-Act-Assert Pattern

```typescript
it('should update cart total when item added', () => {
  // Arrange
  const product = { id: '1', name: 'Widget', price: 10 };
  const service = new CartService();
  
  // Act
  service.addItem(product, 2);
  
  // Assert
  expect(service.total()).toBe(20);
});
```

### 4. Keep Tests Independent

```typescript
// Good: Each test is independent
beforeEach(() => {
  service = new CartService(); // Fresh instance
});

// Bad: Tests depend on each other's state
it('adds item', () => { service.addItem(product); });
it('removes item added in previous test', () => { service.removeItem(product.id); });
```

---

## Related Documentation

- [Design Patterns](../architecture/patterns.md)
- [API Reference: @flyfront/testing](../api/testing.md)
- [Contributing Guide](../contributing/README.md)
