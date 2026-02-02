# Design Patterns

This document describes the common design patterns used throughout Flyfront. Following these patterns ensures consistency, maintainability, and testability across the codebase.

## Table of Contents

- [Component Patterns](#component-patterns)
- [Service Patterns](#service-patterns)
- [State Management Patterns](#state-management-patterns)
- [Data Access Patterns](#data-access-patterns)
- [Error Handling Patterns](#error-handling-patterns)
- [Testing Patterns](#testing-patterns)

---

## Component Patterns

### Smart vs. Presentational Components

Flyfront distinguishes between two types of components:

#### Presentational Components (Dumb)

Located in `@flyfront/ui`, these components:
- Receive data via `input()` signals
- Emit events via `output()` signals
- Have no knowledge of services or state management
- Are highly reusable and testable

```typescript
// Presentational component - knows nothing about where data comes from
@Component({
  selector: 'fly-user-card',
  standalone: true,
  template: `
    <fly-card [interactive]="true" (click)="selected.emit(user())">
      <fly-card-header>
        <fly-avatar [src]="user().avatarUrl" [name]="user().name" />
        <div>
          <h3 class="font-semibold">{{ user().name }}</h3>
          <p class="text-sm text-gray-500">{{ user().email }}</p>
        </div>
      </fly-card-header>
    </fly-card>
  `,
})
export class UserCardComponent {
  user = input.required<User>();
  selected = output<User>();
}
```

#### Smart Components (Container)

Located in applications, these components:
- Inject services and manage state
- Pass data down to presentational components
- Handle events from child components
- Coordinate between multiple services

```typescript
// Smart component - coordinates data and services
@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [UserCardComponent, ButtonComponent],
  template: `
    @if (isLoading()) {
      <fly-spinner />
    } @else {
      @for (user of users(); track user.id) {
        <fly-user-card [user]="user" (selected)="onUserSelected($event)" />
      }
    }
    
    <fly-button (clicked)="loadMore()" [loading]="isLoadingMore()">
      Load More
    </fly-button>
  `,
})
export class UserListComponent {
  private userService = inject(UserService);
  
  users = this.userService.users;
  isLoading = this.userService.isLoading;
  isLoadingMore = signal(false);
  
  onUserSelected(user: User): void {
    this.router.navigate(['/users', user.id]);
  }
  
  async loadMore(): Promise<void> {
    this.isLoadingMore.set(true);
    await this.userService.loadNextPage();
    this.isLoadingMore.set(false);
  }
}
```

### Component Input/Output Patterns

#### Required vs Optional Inputs

```typescript
@Component({...})
export class ExampleComponent {
  // Required - component won't work without this
  title = input.required<string>();
  
  // Optional with default value
  variant = input<'primary' | 'secondary'>('primary');
  
  // Optional, undefined if not provided
  subtitle = input<string>();
}
```

#### Transforming Inputs

```typescript
@Component({...})
export class ExampleComponent {
  // Transform string to number
  count = input(0, { transform: numberAttribute });
  
  // Transform string to boolean
  disabled = input(false, { transform: booleanAttribute });
  
  // Custom transformation
  date = input.required({
    transform: (value: string | Date) => 
      typeof value === 'string' ? new Date(value) : value
  });
}
```

#### Output Naming Conventions

```typescript
@Component({...})
export class ExampleComponent {
  // Use past tense for events that have occurred
  clicked = output<MouseEvent>();
  valueChanged = output<string>();
  itemSelected = output<Item>();
  formSubmitted = output<FormData>();
  
  // Use present tense for events that are about to occur (cancelable)
  closing = output<{ cancel: () => void }>();
}
```

### Content Projection Patterns

#### Simple Content Projection

```typescript
@Component({
  selector: 'fly-panel',
  template: `
    <div class="panel">
      <ng-content />
    </div>
  `,
})
export class PanelComponent {}

// Usage:
<fly-panel>
  <p>Any content here</p>
</fly-panel>
```

#### Named Slots

```typescript
@Component({
  selector: 'fly-dialog',
  template: `
    <div class="dialog">
      <header class="dialog-header">
        <ng-content select="[dialog-title]" />
      </header>
      <div class="dialog-body">
        <ng-content />
      </div>
      <footer class="dialog-footer">
        <ng-content select="[dialog-actions]" />
      </footer>
    </div>
  `,
})
export class DialogComponent {}

// Usage:
<fly-dialog>
  <h2 dialog-title>Confirm Action</h2>
  <p>Are you sure you want to proceed?</p>
  <div dialog-actions>
    <fly-button variant="ghost">Cancel</fly-button>
    <fly-button variant="primary">Confirm</fly-button>
  </div>
</fly-dialog>
```

---

## Service Patterns

### Service Structure

Services follow a consistent structure:

```typescript
@Injectable({
  providedIn: 'root', // Singleton by default
})
export class UserService {
  // 1. Dependencies (private, readonly)
  private readonly http = inject(HttpClient);
  private readonly config = inject(ConfigService);
  
  // 2. Private state
  private readonly _users = signal<User[]>([]);
  private readonly _selectedId = signal<string | null>(null);
  private readonly _status = signal<'idle' | 'loading' | 'error'>('idle');
  
  // 3. Public readonly signals (computed or readonly)
  readonly users = this._users.asReadonly();
  readonly status = this._status.asReadonly();
  readonly selectedUser = computed(() => 
    this._users().find(u => u.id === this._selectedId())
  );
  readonly isLoading = computed(() => this._status() === 'loading');
  
  // 4. Public methods
  async loadUsers(): Promise<void> {
    this._status.set('loading');
    try {
      const users = await firstValueFrom(
        this.http.get<User[]>(this.config.getApiUrl('users'))
      );
      this._users.set(users);
      this._status.set('idle');
    } catch (error) {
      this._status.set('error');
      throw error;
    }
  }
  
  selectUser(id: string): void {
    this._selectedId.set(id);
  }
}
```

### Dependency Injection Patterns

#### Using InjectionToken for Configuration

```typescript
// Define the token and interface
export interface FeatureConfig {
  apiEndpoint: string;
  maxRetries: number;
  timeout: number;
}

export const FEATURE_CONFIG = new InjectionToken<FeatureConfig>('FeatureConfig');

// Provide default or custom configuration
export function provideFeature(config: Partial<FeatureConfig> = {}) {
  const defaultConfig: FeatureConfig = {
    apiEndpoint: '/api/feature',
    maxRetries: 3,
    timeout: 30000,
  };
  
  return [
    { provide: FEATURE_CONFIG, useValue: { ...defaultConfig, ...config } },
    FeatureService,
  ];
}

// Use in service
@Injectable()
export class FeatureService {
  private config = inject(FEATURE_CONFIG);
  
  // Use this.config.apiEndpoint, etc.
}
```

#### Optional Dependencies

```typescript
@Injectable()
export class LoggingService {
  // Optional dependency with fallback
  private analytics = inject(AnalyticsService, { optional: true });
  
  log(message: string): void {
    console.log(message);
    
    // Only call if analytics is available
    this.analytics?.trackEvent('log', { message });
  }
}
```

### Caching Pattern

```typescript
@Injectable({ providedIn: 'root' })
export class CachedDataService {
  private cache = new Map<string, { data: unknown; timestamp: number }>();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  
  async get<T>(key: string, fetchFn: () => Promise<T>): Promise<T> {
    const cached = this.cache.get(key);
    
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data as T;
    }
    
    const data = await fetchFn();
    this.cache.set(key, { data, timestamp: Date.now() });
    return data;
  }
  
  invalidate(key: string): void {
    this.cache.delete(key);
  }
  
  invalidateAll(): void {
    this.cache.clear();
  }
}
```

---

## State Management Patterns

### Local Component State

For simple, component-scoped state:

```typescript
@Component({...})
export class CounterComponent {
  // Simple signal-based state
  count = signal(0);
  
  // Derived state
  doubleCount = computed(() => this.count() * 2);
  isEven = computed(() => this.count() % 2 === 0);
  
  increment(): void {
    this.count.update(c => c + 1);
  }
  
  decrement(): void {
    this.count.update(c => c - 1);
  }
  
  reset(): void {
    this.count.set(0);
  }
}
```

### Shared State with Signal Store

For state shared across components:

```typescript
// Define the store
interface TodoState {
  todos: Todo[];
  filter: 'all' | 'active' | 'completed';
}

const todoStore = createSignalStore<TodoState>({
  initialState: {
    todos: [],
    filter: 'all',
  },
  persistence: {
    key: 'todos',
    storage: 'local',
  },
});

// Create service wrapping the store
@Injectable({ providedIn: 'root' })
export class TodoService {
  // Expose readonly state
  readonly todos = todoStore.select(s => s.todos);
  readonly filter = todoStore.select(s => s.filter);
  
  // Computed derived state
  readonly filteredTodos = computed(() => {
    const todos = this.todos();
    const filter = this.filter();
    
    switch (filter) {
      case 'active': return todos.filter(t => !t.completed);
      case 'completed': return todos.filter(t => t.completed);
      default: return todos;
    }
  });
  
  readonly stats = computed(() => ({
    total: this.todos().length,
    completed: this.todos().filter(t => t.completed).length,
    active: this.todos().filter(t => !t.completed).length,
  }));
  
  // Actions
  addTodo(title: string): void {
    todoStore.update(state => ({
      ...state,
      todos: [...state.todos, { id: crypto.randomUUID(), title, completed: false }],
    }));
  }
  
  toggleTodo(id: string): void {
    todoStore.update(state => ({
      ...state,
      todos: state.todos.map(t => 
        t.id === id ? { ...t, completed: !t.completed } : t
      ),
    }));
  }
  
  setFilter(filter: 'all' | 'active' | 'completed'): void {
    todoStore.patch({ filter });
  }
}
```

### Entity Collection Pattern

For managing collections of entities:

```typescript
@Injectable({ providedIn: 'root' })
export class ProductService {
  // Entity collection helpers
  private entities = withEntities<Product>();
  private async = withAsync<Product[]>();
  private list = withList<{ category: string; priceRange: [number, number] }>(
    { category: '', priceRange: [0, 1000] }
  );
  
  // Expose state
  readonly products = this.entities.all;
  readonly selectedProduct = this.entities.selected;
  readonly isLoading = this.async.isLoading;
  readonly error = this.async.error;
  readonly pagination = this.list.state;
  
  // Filtered and sorted products
  readonly filteredProducts = computed(() => {
    let products = this.products();
    const filters = this.list.filters();
    const searchQuery = this.list.searchQuery();
    const sortBy = this.list.sortBy();
    const sortDirection = this.list.sortDirection();
    
    // Apply filters
    if (filters.category) {
      products = products.filter(p => p.category === filters.category);
    }
    if (filters.priceRange) {
      products = products.filter(p => 
        p.price >= filters.priceRange[0] && p.price <= filters.priceRange[1]
      );
    }
    
    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      products = products.filter(p => 
        p.name.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query)
      );
    }
    
    // Apply sorting
    if (sortBy) {
      products = [...products].sort((a, b) => {
        const aVal = a[sortBy as keyof Product];
        const bVal = b[sortBy as keyof Product];
        const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
        return sortDirection === 'asc' ? comparison : -comparison;
      });
    }
    
    return products;
  });
  
  async loadProducts(): Promise<void> {
    this.async.setLoading();
    try {
      const products = await this.api.getProducts();
      this.entities.setAll(products);
      this.async.setSuccess(products);
    } catch (error) {
      this.async.setError(error.message);
    }
  }
}
```

---

## Data Access Patterns

### API Service Pattern

```typescript
@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);
  private config = inject(ConfigService);
  
  private getUrl(path: string): string {
    return this.config.getApiUrl(path);
  }
  
  get<T>(path: string, params?: Record<string, string>): Observable<T> {
    return this.http.get<T>(this.getUrl(path), { params });
  }
  
  post<T>(path: string, body: unknown): Observable<T> {
    return this.http.post<T>(this.getUrl(path), body);
  }
  
  put<T>(path: string, body: unknown): Observable<T> {
    return this.http.put<T>(this.getUrl(path), body);
  }
  
  patch<T>(path: string, body: unknown): Observable<T> {
    return this.http.patch<T>(this.getUrl(path), body);
  }
  
  delete<T>(path: string): Observable<T> {
    return this.http.delete<T>(this.getUrl(path));
  }
}
```

### Resource Pattern

```typescript
// Generic resource interface
interface Resource<T> {
  data: Signal<T | null>;
  isLoading: Signal<boolean>;
  error: Signal<string | null>;
  reload: () => Promise<void>;
}

// Resource factory
function createResource<T>(
  fetchFn: () => Promise<T>,
  options?: { immediate?: boolean }
): Resource<T> {
  const data = signal<T | null>(null);
  const isLoading = signal(false);
  const error = signal<string | null>(null);
  
  const load = async () => {
    isLoading.set(true);
    error.set(null);
    try {
      data.set(await fetchFn());
    } catch (e) {
      error.set(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      isLoading.set(false);
    }
  };
  
  if (options?.immediate !== false) {
    load();
  }
  
  return {
    data: data.asReadonly(),
    isLoading: isLoading.asReadonly(),
    error: error.asReadonly(),
    reload: load,
  };
}

// Usage in component
@Component({...})
export class UserProfileComponent {
  private userId = input.required<string>();
  private userService = inject(UserService);
  
  // Creates a resource that auto-loads
  user = createResource(() => this.userService.getUser(this.userId()));
  
  // In template:
  // @if (user.isLoading()) { <fly-spinner /> }
  // @else if (user.error()) { <fly-alert variant="error">{{ user.error() }}</fly-alert> }
  // @else { <user-details [user]="user.data()!" /> }
}
```

---

## Error Handling Patterns

### Global Error Interceptor

```typescript
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const errorHandler = inject(ErrorHandlerService);
  
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Don't handle authentication errors here - let auth interceptor handle
      if (error.status === 401) {
        return throwError(() => error);
      }
      
      // Handle different error types
      if (error.status === 0) {
        errorHandler.handleNetworkError();
      } else if (error.status >= 500) {
        errorHandler.handleServerError(error);
      } else if (error.status === 403) {
        errorHandler.handleForbiddenError();
      } else if (error.status === 404) {
        errorHandler.handleNotFoundError(req.url);
      } else {
        errorHandler.handleUnknownError(error);
      }
      
      return throwError(() => error);
    })
  );
};
```

### Component Error Boundary

```typescript
@Component({
  selector: 'app-error-boundary',
  template: `
    @if (hasError()) {
      <div class="p-8 text-center">
        <h2 class="text-xl font-semibold text-red-600">Something went wrong</h2>
        <p class="mt-2 text-gray-600">{{ errorMessage() }}</p>
        <fly-button (clicked)="retry()" class="mt-4">Try Again</fly-button>
      </div>
    } @else {
      <ng-content />
    }
  `,
})
export class ErrorBoundaryComponent {
  hasError = signal(false);
  errorMessage = signal('');
  
  private retryFn: (() => void) | null = null;
  
  setError(message: string, retryFn?: () => void): void {
    this.hasError.set(true);
    this.errorMessage.set(message);
    this.retryFn = retryFn ?? null;
  }
  
  clearError(): void {
    this.hasError.set(false);
    this.errorMessage.set('');
  }
  
  retry(): void {
    this.clearError();
    this.retryFn?.();
  }
}
```

### Form Validation Pattern

```typescript
@Component({...})
export class UserFormComponent {
  private fb = inject(FormBuilder);
  
  form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });
  
  // Computed error messages
  nameError = computed(() => {
    const control = this.form.controls.name;
    if (control.pristine) return null;
    if (control.hasError('required')) return 'Name is required';
    if (control.hasError('minlength')) return 'Name must be at least 2 characters';
    return null;
  });
  
  emailError = computed(() => {
    const control = this.form.controls.email;
    if (control.pristine) return null;
    if (control.hasError('required')) return 'Email is required';
    if (control.hasError('email')) return 'Please enter a valid email';
    return null;
  });
  
  async onSubmit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    
    // Handle submission
  }
}
```

---

## Testing Patterns

### Component Testing

```typescript
describe('ButtonComponent', () => {
  it('should emit clicked event when clicked', async () => {
    const clickedSpy = vi.fn();
    
    const { getByRole } = await render(ButtonComponent, {
      inputs: { variant: 'primary' },
      on: { clicked: clickedSpy },
    });
    
    await userEvent.click(getByRole('button'));
    
    expect(clickedSpy).toHaveBeenCalledTimes(1);
  });
  
  it('should not emit when disabled', async () => {
    const clickedSpy = vi.fn();
    
    const { getByRole } = await render(ButtonComponent, {
      inputs: { disabled: true },
      on: { clicked: clickedSpy },
    });
    
    await userEvent.click(getByRole('button'));
    
    expect(clickedSpy).not.toHaveBeenCalled();
  });
  
  it('should show loading spinner when loading', async () => {
    const { getByRole } = await render(ButtonComponent, {
      inputs: { loading: true },
    });
    
    expect(getByRole('button')).toHaveAttribute('aria-busy', 'true');
  });
});
```

### Service Testing with Mocks

```typescript
describe('UserService', () => {
  let service: UserService;
  let httpMock: HttpTestingController;
  
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        UserService,
        { provide: ConfigService, useValue: { getApiUrl: (p: string) => `/api/${p}` } },
      ],
    });
    
    service = TestBed.inject(UserService);
    httpMock = TestBed.inject(HttpTestingController);
  });
  
  afterEach(() => {
    httpMock.verify();
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
  });
});
```

### Testing with Signal Assertions

```typescript
describe('SignalStore', () => {
  it('should update state', () => {
    const store = createSignalStore<{ count: number }>({
      initialState: { count: 0 },
    });
    
    store.update(s => ({ count: s.count + 1 }));
    
    expect(store.state().count).toBe(1);
  });
  
  it('should compute derived state', () => {
    const store = createSignalStore<{ items: number[] }>({
      initialState: { items: [1, 2, 3] },
    });
    
    const sum = store.select(s => s.items.reduce((a, b) => a + b, 0));
    
    expect(sum()).toBe(6);
    
    store.update(s => ({ items: [...s.items, 4] }));
    
    expect(sum()).toBe(10);
  });
});
```

---

## Related Documentation

- [Architecture Overview](README.md)
- [Libraries Documentation](libraries.md)
- [Dependency Rules](dependency-rules.md)
- [Testing Guide](../guides/testing.md)
