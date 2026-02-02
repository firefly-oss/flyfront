# State Management Guide

This guide covers state management in Flyfront applications, from simple component-level state with Angular signals to complex application-wide state management patterns.

## Table of Contents

- [Overview](#overview)
- [Angular Signals Basics](#angular-signals-basics)
- [Component State](#component-state)
- [Service State](#service-state)
- [Signal Store](#signal-store)
- [Async State Management](#async-state-management)
- [Entity Collections](#entity-collections)
- [Best Practices](#best-practices)

---

## Overview

Flyfront uses a layered approach to state management:

| Scope | Tool | Use Case |
|-------|------|----------|
| Component | Angular Signals | UI state, form state, local data |
| Feature | Signal Store | Shared state within a feature |
| Application | Services + Signals | Cross-feature state |
| Server State | Async helpers | API data with loading/error states |

### When to Use What

```
┌─────────────────────────────────────────────────────────────────┐
│  State Scope                         Recommended Approach        │
├─────────────────────────────────────────────────────────────────┤
│  Component-only (UI toggles, etc.)   signal() in component      │
│  Shared between components           Signal store in service    │
│  Server/async data                   withAsync() helpers        │
│  Entity collections                  withEntities() helpers     │
│  Complex business logic              Custom services + signals  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Angular Signals Basics

Angular Signals are the foundation of state management in Flyfront. They provide a reactive way to manage data that automatically updates your UI when values change. Understanding signals is essential before moving to more complex patterns.

### What is a Signal?

A signal is a wrapper around a value that notifies interested consumers when that value changes. Think of it like a reactive variable - when you change it, anything using it automatically updates.

**Key concepts**:
- **Writable signals**: You can read and write their values
- **Computed signals**: Automatically derived from other signals
- **Effects**: Run side effects when signals change

### Creating and Using Signals

Let's start with the basics. Import signals from Angular:

```typescript
import { signal, computed, effect } from '@angular/core';

// Writable signal
const count = signal(0);

// Read the value
console.log(count()); // 0

// Set a new value
count.set(5);

// Update based on current value (useful for incrementing, toggling, etc.)
count.update(c => c + 1);
```

**When to use `set()` vs `update()`**:
- Use `set()` when you have the complete new value
- Use `update()` when the new value depends on the current value

### Computed Signals

Computed signals automatically derive values from other signals. They're like formulas in a spreadsheet - when any dependency changes, the computed value recalculates:

```typescript
const firstName = signal('John');
const lastName = signal('Doe');

// Automatically updates when dependencies change
const fullName = computed(() => `${firstName()} ${lastName()}`);

console.log(fullName()); // 'John Doe'
firstName.set('Jane');
console.log(fullName()); // 'Jane Doe'
```

**Key benefit**: Computed signals are lazy - they only recalculate when read, and they cache their value until dependencies change. This makes them very efficient.

### Effects

Effects perform side effects (like logging, analytics, or API calls) whenever their signal dependencies change. They're useful for synchronizing state with external systems:

```typescript
const user = signal<User | null>(null);

// Effect runs whenever user changes
effect(() => {
  const currentUser = user();
  if (currentUser) {
    console.log(`User logged in: ${currentUser.name}`);
    analytics.track('login', { userId: currentUser.id });
  }
});
```

---

## Component State

For state that only matters within a single component, use signals directly in the component class. This is the simplest and most common pattern.

### When to Use Component State

- Toggle states (open/closed, visible/hidden)
- Form input values
- Local loading/error states
- Selected items within a list
- Any state that doesn't need to be shared with other components

### Example: Simple UI State

Let's build a collapsible sidebar. The open/closed state only matters to this component:

```typescript
@Component({
  selector: 'app-sidebar',
  template: `
    <aside [class.collapsed]="isCollapsed()">
      <button (click)="toggle()">
        {{ isCollapsed() ? 'Expand' : 'Collapse' }}
      </button>
      
      @if (!isCollapsed()) {
        <nav>
          <!-- Navigation items -->
        </nav>
      }
    </aside>
  `,
})
export class SidebarComponent {
  isCollapsed = signal(false);
  
  toggle(): void {
    this.isCollapsed.update(v => !v);
  }
}
```

### Form State

```typescript
@Component({
  selector: 'app-search',
  template: `
    <input
      [value]="query()"
      (input)="query.set($event.target.value)"
      placeholder="Search..."
    />
    
    @if (query().length > 0) {
      <button (click)="clear()">Clear</button>
    }
    
    <p>Searching for: {{ query() }} ({{ resultCount() }} results)</p>
  `,
})
export class SearchComponent {
  query = signal('');
  results = signal<SearchResult[]>([]);
  
  resultCount = computed(() => this.results().length);
  
  clear(): void {
    this.query.set('');
    this.results.set([]);
  }
}
```

### List State with Selection

```typescript
@Component({
  selector: 'app-item-list',
  template: `
    <ul>
      @for (item of items(); track item.id) {
        <li
          [class.selected]="item.id === selectedId()"
          (click)="select(item.id)"
        >
          {{ item.name }}
        </li>
      }
    </ul>
    
    @if (selectedItem(); as item) {
      <div class="details">
        <h2>{{ item.name }}</h2>
        <p>{{ item.description }}</p>
      </div>
    }
  `,
})
export class ItemListComponent {
  items = signal<Item[]>([]);
  selectedId = signal<string | null>(null);
  
  selectedItem = computed(() =>
    this.items().find(i => i.id === this.selectedId())
  );
  
  select(id: string): void {
    this.selectedId.set(id);
  }
}
```

---

## Service State

### Stateful Service Pattern

```typescript
import { Injectable, signal, computed } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class CartService {
  // Private writable signals
  private readonly _items = signal<CartItem[]>([]);
  private readonly _discount = signal<number>(0);
  
  // Public readonly signals
  readonly items = this._items.asReadonly();
  readonly discount = this._discount.asReadonly();
  
  // Computed values
  readonly itemCount = computed(() =>
    this._items().reduce((sum, item) => sum + item.quantity, 0)
  );
  
  readonly subtotal = computed(() =>
    this._items().reduce((sum, item) => sum + item.price * item.quantity, 0)
  );
  
  readonly total = computed(() => {
    const sub = this.subtotal();
    const disc = this._discount();
    return sub - (sub * disc / 100);
  });
  
  readonly isEmpty = computed(() => this._items().length === 0);
  
  // Actions
  addItem(product: Product, quantity = 1): void {
    this._items.update(items => {
      const existing = items.find(i => i.productId === product.id);
      if (existing) {
        return items.map(i =>
          i.productId === product.id
            ? { ...i, quantity: i.quantity + quantity }
            : i
        );
      }
      return [...items, {
        id: crypto.randomUUID(),
        productId: product.id,
        name: product.name,
        price: product.price,
        quantity,
      }];
    });
  }
  
  removeItem(itemId: string): void {
    this._items.update(items => items.filter(i => i.id !== itemId));
  }
  
  updateQuantity(itemId: string, quantity: number): void {
    if (quantity <= 0) {
      this.removeItem(itemId);
      return;
    }
    this._items.update(items =>
      items.map(i => i.id === itemId ? { ...i, quantity } : i)
    );
  }
  
  applyDiscount(percent: number): void {
    this._discount.set(Math.min(100, Math.max(0, percent)));
  }
  
  clear(): void {
    this._items.set([]);
    this._discount.set(0);
  }
}
```

### Using the Service in Components

```typescript
@Component({
  selector: 'app-cart-summary',
  template: `
    <div class="cart-summary">
      <span>{{ cart.itemCount() }} items</span>
      <span>{{ cart.total() | currency }}</span>
    </div>
  `,
})
export class CartSummaryComponent {
  cart = inject(CartService);
}

@Component({
  selector: 'app-cart-page',
  template: `
    @if (cart.isEmpty()) {
      <p>Your cart is empty</p>
    } @else {
      @for (item of cart.items(); track item.id) {
        <div class="cart-item">
          <span>{{ item.name }}</span>
          <input
            type="number"
            [value]="item.quantity"
            (change)="updateQuantity(item.id, $event)"
          />
          <button (click)="cart.removeItem(item.id)">Remove</button>
        </div>
      }
      
      <div class="totals">
        <p>Subtotal: {{ cart.subtotal() | currency }}</p>
        <p>Discount: {{ cart.discount() }}%</p>
        <p>Total: {{ cart.total() | currency }}</p>
      </div>
    }
  `,
})
export class CartPageComponent {
  cart = inject(CartService);
  
  updateQuantity(itemId: string, event: Event): void {
    const quantity = parseInt((event.target as HTMLInputElement).value, 10);
    this.cart.updateQuantity(itemId, quantity);
  }
}
```

---

## Signal Store

The `@flyfront/state` library provides utilities for creating stores.

### Creating a Signal Store

```typescript
import { createSignalStore } from '@flyfront/state';

interface TodoState {
  todos: Todo[];
  filter: 'all' | 'active' | 'completed';
  sortBy: 'createdAt' | 'title';
}

// Create the store
const todoStore = createSignalStore<TodoState>({
  initialState: {
    todos: [],
    filter: 'all',
    sortBy: 'createdAt',
  },
  // Optional: persist to localStorage
  persistence: {
    key: 'flyfront-todos',
    storage: 'local',
  },
});
```

### Wrapping Store in a Service

```typescript
@Injectable({ providedIn: 'root' })
export class TodoService {
  // Selectors
  readonly todos = todoStore.select(s => s.todos);
  readonly filter = todoStore.select(s => s.filter);
  readonly sortBy = todoStore.select(s => s.sortBy);
  
  // Derived state
  readonly filteredTodos = computed(() => {
    let todos = this.todos();
    const filter = this.filter();
    
    if (filter === 'active') {
      todos = todos.filter(t => !t.completed);
    } else if (filter === 'completed') {
      todos = todos.filter(t => t.completed);
    }
    
    return this.sortTodos(todos);
  });
  
  readonly stats = computed(() => {
    const todos = this.todos();
    return {
      total: todos.length,
      completed: todos.filter(t => t.completed).length,
      active: todos.filter(t => !t.completed).length,
    };
  });
  
  // Actions
  addTodo(title: string): void {
    todoStore.update(state => ({
      ...state,
      todos: [
        ...state.todos,
        {
          id: crypto.randomUUID(),
          title,
          completed: false,
          createdAt: new Date(),
        },
      ],
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
  
  deleteTodo(id: string): void {
    todoStore.update(state => ({
      ...state,
      todos: state.todos.filter(t => t.id !== id),
    }));
  }
  
  setFilter(filter: 'all' | 'active' | 'completed'): void {
    todoStore.patch({ filter });
  }
  
  setSortBy(sortBy: 'createdAt' | 'title'): void {
    todoStore.patch({ sortBy });
  }
  
  clearCompleted(): void {
    todoStore.update(state => ({
      ...state,
      todos: state.todos.filter(t => !t.completed),
    }));
  }
  
  private sortTodos(todos: Todo[]): Todo[] {
    const sortBy = this.sortBy();
    return [...todos].sort((a, b) => {
      if (sortBy === 'title') {
        return a.title.localeCompare(b.title);
      }
      return b.createdAt.getTime() - a.createdAt.getTime();
    });
  }
}
```

---

## Async State Management

### Using withAsync Helper

```typescript
import { withAsync } from '@flyfront/state';

@Injectable({ providedIn: 'root' })
export class UserService {
  private http = inject(HttpClient);
  private config = inject(ConfigService);
  
  // Async state for user profile
  private profileAsync = withAsync<UserProfile>();
  
  // Expose state
  readonly profile = this.profileAsync.data;
  readonly isLoading = this.profileAsync.isLoading;
  readonly error = this.profileAsync.error;
  readonly status = this.profileAsync.status;
  
  // Convenience checks
  readonly isSuccess = this.profileAsync.isSuccess;
  readonly isError = this.profileAsync.isError;
  
  async loadProfile(userId: string): Promise<void> {
    this.profileAsync.setLoading();
    
    try {
      const profile = await firstValueFrom(
        this.http.get<UserProfile>(
          this.config.getApiUrl(`users/${userId}/profile`)
        )
      );
      this.profileAsync.setSuccess(profile);
    } catch (error) {
      this.profileAsync.setError(
        error instanceof Error ? error.message : 'Failed to load profile'
      );
    }
  }
  
  reset(): void {
    this.profileAsync.reset();
  }
}
```

### Using in Components

```typescript
@Component({
  selector: 'app-user-profile',
  template: `
    @switch (userService.status()) {
      @case ('idle') {
        <fly-button (clicked)="load()">Load Profile</fly-button>
      }
      @case ('loading') {
        <fly-spinner />
        <p>Loading profile...</p>
      }
      @case ('error') {
        <fly-alert variant="error">
          {{ userService.error() }}
        </fly-alert>
        <fly-button (clicked)="load()">Retry</fly-button>
      }
      @case ('success') {
        @if (userService.profile(); as profile) {
          <h2>{{ profile.name }}</h2>
          <p>{{ profile.bio }}</p>
        }
      }
    }
  `,
})
export class UserProfileComponent {
  userService = inject(UserService);
  userId = input.required<string>();
  
  ngOnInit(): void {
    this.load();
  }
  
  load(): void {
    this.userService.loadProfile(this.userId());
  }
}
```

---

## Entity Collections

### Using withEntities Helper

```typescript
import { withEntities, withAsync, withList } from '@flyfront/state';

interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
}

@Injectable({ providedIn: 'root' })
export class ProductService {
  private http = inject(HttpClient);
  
  // Entity collection
  private entities = withEntities<Product>();
  
  // Async loading state
  private async = withAsync<Product[]>();
  
  // List state (pagination, filtering, sorting)
  private list = withList<{ category: string; minPrice: number }>(
    { category: '', minPrice: 0 },
    10 // page size
  );
  
  // Expose entity state
  readonly products = this.entities.all;
  readonly selectedProduct = this.entities.selected;
  readonly productCount = this.entities.total;
  readonly isEmpty = this.entities.isEmpty;
  
  // Expose async state
  readonly isLoading = this.async.isLoading;
  readonly error = this.async.error;
  
  // Expose list state
  readonly page = this.list.page;
  readonly pageSize = this.list.pageSize;
  readonly totalPages = this.list.totalPages;
  readonly filters = this.list.filters;
  readonly sortBy = this.list.sortBy;
  readonly sortDirection = this.list.sortDirection;
  readonly hasNextPage = this.list.hasNextPage;
  readonly hasPreviousPage = this.list.hasPreviousPage;
  
  // Filtered and sorted products
  readonly filteredProducts = computed(() => {
    let products = this.products();
    const filters = this.filters();
    const search = this.list.searchQuery();
    
    if (filters.category) {
      products = products.filter(p => p.category === filters.category);
    }
    if (filters.minPrice > 0) {
      products = products.filter(p => p.price >= filters.minPrice);
    }
    if (search) {
      const q = search.toLowerCase();
      products = products.filter(p =>
        p.name.toLowerCase().includes(q)
      );
    }
    
    return this.applySorting(products);
  });
  
  // Paginated products
  readonly paginatedProducts = computed(() => {
    const products = this.filteredProducts();
    const page = this.page();
    const size = this.pageSize();
    const start = (page - 1) * size;
    return products.slice(start, start + size);
  });
  
  // Actions
  async loadProducts(): Promise<void> {
    this.async.setLoading();
    try {
      const products = await firstValueFrom(
        this.http.get<Product[]>('/api/products')
      );
      this.entities.setAll(products);
      this.list.setTotals(products.length, Math.ceil(products.length / this.pageSize()));
      this.async.setSuccess(products);
    } catch (error) {
      this.async.setError('Failed to load products');
    }
  }
  
  selectProduct(id: string): void {
    this.entities.select(id);
  }
  
  setFilter(filter: Partial<{ category: string; minPrice: number }>): void {
    this.list.setFilters(filter);
  }
  
  setSearch(query: string): void {
    this.list.setSearchQuery(query);
  }
  
  setSort(field: string, direction: 'asc' | 'desc' = 'asc'): void {
    this.list.setSort(field, direction);
  }
  
  nextPage(): void {
    this.list.nextPage();
  }
  
  previousPage(): void {
    this.list.previousPage();
  }
  
  private applySorting(products: Product[]): Product[] {
    const sortBy = this.sortBy();
    const direction = this.sortDirection();
    
    if (!sortBy) return products;
    
    return [...products].sort((a, b) => {
      const aVal = a[sortBy as keyof Product];
      const bVal = b[sortBy as keyof Product];
      const cmp = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      return direction === 'asc' ? cmp : -cmp;
    });
  }
}
```

---

## Best Practices

### 1. Keep State Close to Where It's Used

```typescript
// Good: Local state in component
@Component({...})
export class DropdownComponent {
  isOpen = signal(false); // Only this component needs this
}

// Bad: Global state for component-specific data
@Injectable({ providedIn: 'root' })
export class DropdownStateService {
  isOpen = signal(false); // Don't do this
}
```

### 2. Use Computed for Derived State

```typescript
// Good: Derived state as computed
readonly activeUsers = computed(() =>
  this.users().filter(u => u.isActive)
);

// Bad: Storing derived state
updateActiveUsers(): void {
  this._activeUsers.set(this._users().filter(u => u.isActive));
}
```

### 3. Keep Effects Minimal

```typescript
// Good: Focused effect
effect(() => {
  if (this.user()) {
    analytics.identify(this.user()!.id);
  }
});

// Bad: Too much in one effect
effect(() => {
  const user = this.user();
  if (user) {
    analytics.identify(user.id);
    localStorage.setItem('user', JSON.stringify(user));
    this.loadUserPreferences();
    this.setupNotifications();
    // etc...
  }
});
```

### 4. Immutable Updates

```typescript
// Good: Immutable update
this._items.update(items => [...items, newItem]);
this._items.update(items =>
  items.map(i => i.id === id ? { ...i, ...changes } : i)
);

// Bad: Mutating state directly
this._items().push(newItem); // Never do this!
this._items().find(i => i.id === id)!.name = 'New Name'; // Never!
```

### 5. Type Your State

```typescript
// Good: Explicit types
interface AppState {
  user: User | null;
  settings: Settings;
  notifications: Notification[];
}

const state = signal<AppState>({
  user: null,
  settings: defaultSettings,
  notifications: [],
});

// Bad: Implicit any or loose typing
const state = signal({ user: null, settings: {} });
```

---

## Related Documentation

- [Design Patterns](../architecture/patterns.md)
- [API Reference: @flyfront/state](../api/state.md)
- [Testing Guide](testing.md)
