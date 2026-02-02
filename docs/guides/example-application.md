# Building a Complete Feature: User Management

This guide walks you through building a complete User Management feature using all Flyfront libraries. By the end, you'll understand how to integrate authentication, API calls, state management, internationalization, and UI components into a cohesive feature.

## What We're Building

A User Management module with:
- User list with pagination and search
- User detail view
- Create/Edit user forms
- Role-based access control
- Full internationalization
- Comprehensive tests

## Prerequisites

- Completed the [Getting Started](getting-started.md) guide
- Basic understanding of Angular and RxJS
- Familiarity with NgRx concepts (helpful but not required)

---

## Step 1: Project Setup

### 1.1 Generate the Feature Library

```bash
# Create a new feature library for user management
npx nx g @nx/angular:library --name=feature-users --directory=libs/features/users --standalone --buildable
```

### 1.2 Configure Library Dependencies

Update `libs/features/users/project.json` to include implicit dependencies:

```json
{
  "name": "feature-users",
  "implicitDependencies": ["core", "ui", "auth", "data-access", "state", "i18n"]
}
```

### 1.3 Configure Path Mapping

Verify `tsconfig.base.json` includes:

```json
{
  "paths": {
    "@flyfront/feature-users": ["libs/features/users/src/index.ts"]
  }
}
```

---

## Step 2: Define Data Models

### 2.1 Create User Model

Create `libs/features/users/src/lib/models/user.model.ts`:

```typescript
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  displayName: string;
  avatar?: string;
  roles: UserRole[];
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, unknown>;
}

export type UserRole = 'admin' | 'manager' | 'editor' | 'viewer';

export type UserStatus = 'active' | 'inactive' | 'pending' | 'suspended';

export interface CreateUserDto {
  email: string;
  firstName: string;
  lastName: string;
  roles: UserRole[];
  sendInvite?: boolean;
}

export interface UpdateUserDto {
  firstName?: string;
  lastName?: string;
  roles?: UserRole[];
  status?: UserStatus;
}

export interface UserFilters {
  search?: string;
  role?: UserRole;
  status?: UserStatus;
}
```

### 2.2 Export from Public API

Update `libs/features/users/src/index.ts`:

```typescript
// Models
export * from './lib/models/user.model';
```

---

## Step 3: Set Up State Management

### 3.1 Create User State

Create `libs/features/users/src/lib/state/users.state.ts`:

```typescript
import { createFeature, createReducer, createSelector, on } from '@ngrx/store';
import { EntityState, EntityAdapter, createEntityAdapter } from '@ngrx/entity';
import { User, UserFilters } from '../models/user.model';
import { usersActions } from './users.actions';

// Entity adapter for normalized state
export const usersAdapter: EntityAdapter<User> = createEntityAdapter<User>({
  selectId: (user) => user.id,
  sortComparer: (a, b) => a.displayName.localeCompare(b.displayName),
});

// State interface
export interface UsersState extends EntityState<User> {
  selectedUserId: string | null;
  filters: UserFilters;
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
}

// Initial state
const initialState: UsersState = usersAdapter.getInitialState({
  selectedUserId: null,
  filters: {},
  loading: false,
  error: null,
  pagination: {
    page: 1,
    pageSize: 20,
    totalItems: 0,
    totalPages: 0,
  },
});

// Reducer
export const usersFeature = createFeature({
  name: 'users',
  reducer: createReducer(
    initialState,
    
    // Load users
    on(usersActions.loadUsers, (state) => ({
      ...state,
      loading: true,
      error: null,
    })),
    
    on(usersActions.loadUsersSuccess, (state, { users, pagination }) =>
      usersAdapter.setAll(users, {
        ...state,
        loading: false,
        pagination,
      })
    ),
    
    on(usersActions.loadUsersFailure, (state, { error }) => ({
      ...state,
      loading: false,
      error,
    })),
    
    // Select user
    on(usersActions.selectUser, (state, { userId }) => ({
      ...state,
      selectedUserId: userId,
    })),
    
    // Create user
    on(usersActions.createUserSuccess, (state, { user }) =>
      usersAdapter.addOne(user, state)
    ),
    
    // Update user
    on(usersActions.updateUserSuccess, (state, { user }) =>
      usersAdapter.updateOne({ id: user.id, changes: user }, state)
    ),
    
    // Delete user
    on(usersActions.deleteUserSuccess, (state, { userId }) =>
      usersAdapter.removeOne(userId, state)
    ),
    
    // Filters
    on(usersActions.setFilters, (state, { filters }) => ({
      ...state,
      filters: { ...state.filters, ...filters },
    })),
    
    on(usersActions.clearFilters, (state) => ({
      ...state,
      filters: {},
    }))
  ),
});

// Selectors
const { selectAll, selectEntities, selectIds, selectTotal } = usersAdapter.getSelectors();

export const selectUsersState = usersFeature.selectUsersState;
export const selectAllUsers = createSelector(selectUsersState, selectAll);
export const selectUserEntities = createSelector(selectUsersState, selectEntities);
export const selectUsersLoading = createSelector(selectUsersState, (state) => state.loading);
export const selectUsersError = createSelector(selectUsersState, (state) => state.error);
export const selectUsersPagination = createSelector(selectUsersState, (state) => state.pagination);
export const selectUsersFilters = createSelector(selectUsersState, (state) => state.filters);

export const selectSelectedUserId = createSelector(
  selectUsersState,
  (state) => state.selectedUserId
);

export const selectSelectedUser = createSelector(
  selectUserEntities,
  selectSelectedUserId,
  (entities, selectedId) => (selectedId ? entities[selectedId] : null)
);

export const selectUserById = (userId: string) =>
  createSelector(selectUserEntities, (entities) => entities[userId]);
```

### 3.2 Create Actions

Create `libs/features/users/src/lib/state/users.actions.ts`:

```typescript
import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { User, CreateUserDto, UpdateUserDto, UserFilters } from '../models/user.model';

export const usersActions = createActionGroup({
  source: 'Users',
  events: {
    // Load users
    'Load Users': props<{ page?: number; pageSize?: number }>(),
    'Load Users Success': props<{
      users: User[];
      pagination: { page: number; pageSize: number; totalItems: number; totalPages: number };
    }>(),
    'Load Users Failure': props<{ error: string }>(),
    
    // Load single user
    'Load User': props<{ userId: string }>(),
    'Load User Success': props<{ user: User }>(),
    'Load User Failure': props<{ error: string }>(),
    
    // Select user
    'Select User': props<{ userId: string | null }>(),
    
    // Create user
    'Create User': props<{ dto: CreateUserDto }>(),
    'Create User Success': props<{ user: User }>(),
    'Create User Failure': props<{ error: string }>(),
    
    // Update user
    'Update User': props<{ userId: string; dto: UpdateUserDto }>(),
    'Update User Success': props<{ user: User }>(),
    'Update User Failure': props<{ error: string }>(),
    
    // Delete user
    'Delete User': props<{ userId: string }>(),
    'Delete User Success': props<{ userId: string }>(),
    'Delete User Failure': props<{ error: string }>(),
    
    // Filters
    'Set Filters': props<{ filters: Partial<UserFilters> }>(),
    'Clear Filters': emptyProps(),
  },
});
```

### 3.3 Create Effects

Create `libs/features/users/src/lib/state/users.effects.ts`:

```typescript
import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { catchError, map, switchMap, withLatestFrom } from 'rxjs/operators';
import { of } from 'rxjs';
import { usersActions } from './users.actions';
import { selectUsersFilters, selectUsersPagination } from './users.state';
import { UsersApiService } from '../services/users-api.service';

@Injectable()
export class UsersEffects {
  private actions$ = inject(Actions);
  private store = inject(Store);
  private usersApi = inject(UsersApiService);

  loadUsers$ = createEffect(() =>
    this.actions$.pipe(
      ofType(usersActions.loadUsers),
      withLatestFrom(
        this.store.select(selectUsersFilters),
        this.store.select(selectUsersPagination)
      ),
      switchMap(([action, filters, currentPagination]) => {
        const page = action.page ?? currentPagination.page;
        const pageSize = action.pageSize ?? currentPagination.pageSize;

        return this.usersApi.getUsers({ ...filters, page, pageSize }).pipe(
          map((response) =>
            usersActions.loadUsersSuccess({
              users: response.data,
              pagination: response.meta,
            })
          ),
          catchError((error) =>
            of(usersActions.loadUsersFailure({ error: error.message }))
          )
        );
      })
    )
  );

  loadUser$ = createEffect(() =>
    this.actions$.pipe(
      ofType(usersActions.loadUser),
      switchMap(({ userId }) =>
        this.usersApi.getUser(userId).pipe(
          map((user) => usersActions.loadUserSuccess({ user })),
          catchError((error) =>
            of(usersActions.loadUserFailure({ error: error.message }))
          )
        )
      )
    )
  );

  createUser$ = createEffect(() =>
    this.actions$.pipe(
      ofType(usersActions.createUser),
      switchMap(({ dto }) =>
        this.usersApi.createUser(dto).pipe(
          map((user) => usersActions.createUserSuccess({ user })),
          catchError((error) =>
            of(usersActions.createUserFailure({ error: error.message }))
          )
        )
      )
    )
  );

  updateUser$ = createEffect(() =>
    this.actions$.pipe(
      ofType(usersActions.updateUser),
      switchMap(({ userId, dto }) =>
        this.usersApi.updateUser(userId, dto).pipe(
          map((user) => usersActions.updateUserSuccess({ user })),
          catchError((error) =>
            of(usersActions.updateUserFailure({ error: error.message }))
          )
        )
      )
    )
  );

  deleteUser$ = createEffect(() =>
    this.actions$.pipe(
      ofType(usersActions.deleteUser),
      switchMap(({ userId }) =>
        this.usersApi.deleteUser(userId).pipe(
          map(() => usersActions.deleteUserSuccess({ userId })),
          catchError((error) =>
            of(usersActions.deleteUserFailure({ error: error.message }))
          )
        )
      )
    )
  );

  // Reload users when filters change
  filtersChanged$ = createEffect(() =>
    this.actions$.pipe(
      ofType(usersActions.setFilters, usersActions.clearFilters),
      map(() => usersActions.loadUsers({ page: 1 }))
    )
  );
}
```

---

## Step 4: Create API Service

### 4.1 Users API Service

Create `libs/features/users/src/lib/services/users-api.service.ts`:

```typescript
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService, PaginatedResponse } from '@flyfront/data-access';
import { User, CreateUserDto, UpdateUserDto, UserFilters } from '../models/user.model';

export interface GetUsersParams extends UserFilters {
  page?: number;
  pageSize?: number;
}

@Injectable({ providedIn: 'root' })
export class UsersApiService {
  private api = inject(ApiService);
  private readonly basePath = '/users';

  /**
   * Get paginated list of users
   */
  getUsers(params: GetUsersParams = {}): Observable<PaginatedResponse<User>> {
    return this.api.get<PaginatedResponse<User>>(this.basePath, { params });
  }

  /**
   * Get single user by ID
   */
  getUser(id: string): Observable<User> {
    return this.api.get<User>(`${this.basePath}/${id}`);
  }

  /**
   * Create new user
   */
  createUser(dto: CreateUserDto): Observable<User> {
    return this.api.post<User>(this.basePath, dto);
  }

  /**
   * Update existing user
   */
  updateUser(id: string, dto: UpdateUserDto): Observable<User> {
    return this.api.patch<User>(`${this.basePath}/${id}`, dto);
  }

  /**
   * Delete user
   */
  deleteUser(id: string): Observable<void> {
    return this.api.delete<void>(`${this.basePath}/${id}`);
  }

  /**
   * Real-time user updates via polling
   * Useful for admin dashboards showing live user activity
   */
  pollUsers(params: GetUsersParams = {}, intervalMs = 30000): Observable<PaginatedResponse<User>> {
    return this.api.poll<PaginatedResponse<User>>(this.basePath, {
      interval: intervalMs,
      emitOnlyOnChange: true,
      params,
    });
  }

  /**
   * Real-time user activity via Server-Sent Events
   */
  subscribeToUserActivity(): Observable<{ type: string; userId: string; action: string }> {
    return this.api.sse<{ type: string; userId: string; action: string }>(
      `${this.basePath}/activity`,
      { eventTypes: ['user-login', 'user-logout', 'user-update'] }
    );
  }
}
```

---

## Step 5: Add Internationalization

### 5.1 Create Translation Files

Create `apps/demo-app/src/assets/i18n/en.json`:

```json
{
  "users": {
    "title": "User Management",
    "subtitle": "Manage system users and their permissions",
    "list": {
      "title": "Users",
      "empty": "No users found",
      "loading": "Loading users...",
      "search": "Search users...",
      "filters": {
        "role": "Filter by role",
        "status": "Filter by status",
        "clear": "Clear filters"
      }
    },
    "detail": {
      "title": "User Details",
      "tabs": {
        "profile": "Profile",
        "permissions": "Permissions",
        "activity": "Activity"
      }
    },
    "form": {
      "create": {
        "title": "Create User",
        "submit": "Create User",
        "success": "User created successfully"
      },
      "edit": {
        "title": "Edit User",
        "submit": "Save Changes",
        "success": "User updated successfully"
      },
      "fields": {
        "email": "Email Address",
        "firstName": "First Name",
        "lastName": "Last Name",
        "roles": "Roles",
        "status": "Status",
        "sendInvite": "Send invitation email"
      },
      "validation": {
        "emailRequired": "Email is required",
        "emailInvalid": "Please enter a valid email",
        "firstNameRequired": "First name is required",
        "lastNameRequired": "Last name is required",
        "rolesRequired": "At least one role is required"
      }
    },
    "actions": {
      "create": "Create User",
      "edit": "Edit",
      "delete": "Delete",
      "activate": "Activate",
      "suspend": "Suspend"
    },
    "roles": {
      "admin": "Administrator",
      "manager": "Manager",
      "editor": "Editor",
      "viewer": "Viewer"
    },
    "status": {
      "active": "Active",
      "inactive": "Inactive",
      "pending": "Pending",
      "suspended": "Suspended"
    },
    "confirm": {
      "delete": {
        "title": "Delete User",
        "message": "Are you sure you want to delete {{name}}? This action cannot be undone.",
        "confirm": "Delete",
        "cancel": "Cancel"
      }
    }
  }
}
```

Create `apps/demo-app/src/assets/i18n/es.json`:

```json
{
  "users": {
    "title": "Gestión de Usuarios",
    "subtitle": "Administrar usuarios del sistema y sus permisos",
    "list": {
      "title": "Usuarios",
      "empty": "No se encontraron usuarios",
      "loading": "Cargando usuarios...",
      "search": "Buscar usuarios...",
      "filters": {
        "role": "Filtrar por rol",
        "status": "Filtrar por estado",
        "clear": "Limpiar filtros"
      }
    },
    "actions": {
      "create": "Crear Usuario",
      "edit": "Editar",
      "delete": "Eliminar"
    },
    "roles": {
      "admin": "Administrador",
      "manager": "Gerente",
      "editor": "Editor",
      "viewer": "Visualizador"
    }
  }
}
```

---

## Step 6: Build UI Components

### 6.1 User List Component

Create `libs/features/users/src/lib/components/user-list/user-list.component.ts`:

```typescript
import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import { TranslocoPipe } from '@jsverse/transloco';
import {
  ButtonComponent,
  InputComponent,
  CardComponent,
  CardContentComponent,
  LoadingComponent,
} from '@flyfront/ui';
import { AuthService } from '@flyfront/auth';
import {
  selectAllUsers,
  selectUsersLoading,
  selectUsersError,
  selectUsersPagination,
  selectUsersFilters,
} from '../../state/users.state';
import { usersActions } from '../../state/users.actions';
import { User, UserRole, UserStatus } from '../../models/user.model';
import { UserCardComponent } from '../user-card/user-card.component';

@Component({
  selector: 'fly-user-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TranslocoPipe,
    ButtonComponent,
    InputComponent,
    CardComponent,
    CardContentComponent,
    LoadingComponent,
    UserCardComponent,
  ],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">
            {{ 'users.list.title' | transloco }}
          </h1>
          <p class="text-gray-600">
            {{ 'users.subtitle' | transloco }}
          </p>
        </div>
        
        @if (canCreate()) {
          <fly-button variant="primary" (clicked)="openCreateDialog()">
            {{ 'users.actions.create' | transloco }}
          </fly-button>
        }
      </div>
      
      <!-- Filters -->
      <fly-card>
        <fly-card-content>
          <div class="flex flex-wrap gap-4">
            <div class="flex-1 min-w-64">
              <fly-input
                [placeholder]="'users.list.search' | transloco"
                [(ngModel)]="searchQuery"
                (ngModelChange)="onSearchChange($event)"
              />
            </div>
            
            <select
              class="px-4 py-2 border rounded-lg"
              [value]="filters().role ?? ''"
              (change)="onRoleFilterChange($event)"
            >
              <option value="">{{ 'users.list.filters.role' | transloco }}</option>
              @for (role of roles; track role) {
                <option [value]="role">{{ 'users.roles.' + role | transloco }}</option>
              }
            </select>
            
            <select
              class="px-4 py-2 border rounded-lg"
              [value]="filters().status ?? ''"
              (change)="onStatusFilterChange($event)"
            >
              <option value="">{{ 'users.list.filters.status' | transloco }}</option>
              @for (status of statuses; track status) {
                <option [value]="status">{{ 'users.status.' + status | transloco }}</option>
              }
            </select>
            
            @if (hasActiveFilters()) {
              <fly-button variant="ghost" (clicked)="clearFilters()">
                {{ 'users.list.filters.clear' | transloco }}
              </fly-button>
            }
          </div>
        </fly-card-content>
      </fly-card>
      
      <!-- Loading State -->
      @if (loading()) {
        <div class="flex justify-center py-12">
          <fly-loading size="lg" />
        </div>
      }
      
      <!-- Error State -->
      @else if (error()) {
        <fly-card>
          <fly-card-content>
            <div class="text-center py-8 text-red-600">
              <p>{{ error() }}</p>
              <fly-button variant="outline" class="mt-4" (clicked)="reload()">
                Retry
              </fly-button>
            </div>
          </fly-card-content>
        </fly-card>
      }
      
      <!-- Empty State -->
      @else if (users().length === 0) {
        <fly-card>
          <fly-card-content>
            <div class="text-center py-12">
              <p class="text-gray-500">{{ 'users.list.empty' | transloco }}</p>
            </div>
          </fly-card-content>
        </fly-card>
      }
      
      <!-- User Grid -->
      @else {
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          @for (user of users(); track user.id) {
            <fly-user-card
              [user]="user"
              [canEdit]="canEdit()"
              [canDelete]="canDelete()"
              (edit)="editUser(user)"
              (delete)="deleteUser(user)"
              (view)="viewUser(user)"
            />
          }
        </div>
        
        <!-- Pagination -->
        <div class="flex items-center justify-between">
          <p class="text-sm text-gray-600">
            Showing {{ paginationInfo() }}
          </p>
          
          <div class="flex gap-2">
            <fly-button
              variant="outline"
              [disabled]="!canGoBack()"
              (clicked)="goToPage(pagination().page - 1)"
            >
              Previous
            </fly-button>
            <fly-button
              variant="outline"
              [disabled]="!canGoForward()"
              (clicked)="goToPage(pagination().page + 1)"
            >
              Next
            </fly-button>
          </div>
        </div>
      }
    </div>
  `,
})
export class UserListComponent implements OnInit {
  private store = inject(Store);
  private authService = inject(AuthService);

  // State from store
  users = this.store.selectSignal(selectAllUsers);
  loading = this.store.selectSignal(selectUsersLoading);
  error = this.store.selectSignal(selectUsersError);
  pagination = this.store.selectSignal(selectUsersPagination);
  filters = this.store.selectSignal(selectUsersFilters);

  // Local state
  searchQuery = '';
  roles: UserRole[] = ['admin', 'manager', 'editor', 'viewer'];
  statuses: UserStatus[] = ['active', 'inactive', 'pending', 'suspended'];

  // Computed permissions
  canCreate = computed(() => this.authService.hasPermission('users:create'));
  canEdit = computed(() => this.authService.hasPermission('users:update'));
  canDelete = computed(() => this.authService.hasPermission('users:delete'));

  // Computed helpers
  hasActiveFilters = computed(() => {
    const f = this.filters();
    return !!(f.search || f.role || f.status);
  });

  canGoBack = computed(() => this.pagination().page > 1);
  canGoForward = computed(() => this.pagination().page < this.pagination().totalPages);

  paginationInfo = computed(() => {
    const p = this.pagination();
    const start = (p.page - 1) * p.pageSize + 1;
    const end = Math.min(p.page * p.pageSize, p.totalItems);
    return `${start}-${end} of ${p.totalItems}`;
  });

  ngOnInit(): void {
    this.store.dispatch(usersActions.loadUsers({}));
  }

  onSearchChange(query: string): void {
    this.store.dispatch(usersActions.setFilters({ filters: { search: query } }));
  }

  onRoleFilterChange(event: Event): void {
    const role = (event.target as HTMLSelectElement).value as UserRole | '';
    this.store.dispatch(usersActions.setFilters({ filters: { role: role || undefined } }));
  }

  onStatusFilterChange(event: Event): void {
    const status = (event.target as HTMLSelectElement).value as UserStatus | '';
    this.store.dispatch(usersActions.setFilters({ filters: { status: status || undefined } }));
  }

  clearFilters(): void {
    this.searchQuery = '';
    this.store.dispatch(usersActions.clearFilters());
  }

  goToPage(page: number): void {
    this.store.dispatch(usersActions.loadUsers({ page }));
  }

  reload(): void {
    this.store.dispatch(usersActions.loadUsers({}));
  }

  openCreateDialog(): void {
    // Navigate to create page or open dialog
  }

  viewUser(user: User): void {
    // Navigate to user detail
  }

  editUser(user: User): void {
    // Navigate to edit page or open dialog
  }

  deleteUser(user: User): void {
    if (confirm(`Delete ${user.displayName}?`)) {
      this.store.dispatch(usersActions.deleteUser({ userId: user.id }));
    }
  }
}
```

### 6.2 User Card Component

Create `libs/features/users/src/lib/components/user-card/user-card.component.ts`:

```typescript
import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslocoPipe } from '@jsverse/transloco';
import {
  CardComponent,
  CardContentComponent,
  ButtonComponent,
} from '@flyfront/ui';
import { User } from '../../models/user.model';

@Component({
  selector: 'fly-user-card',
  standalone: true,
  imports: [
    CommonModule,
    TranslocoPipe,
    CardComponent,
    CardContentComponent,
    ButtonComponent,
  ],
  template: `
  <fly-card [interactive]="true" (click)="view.emit(user())">
      <fly-card-content>
        <div class="flex items-start gap-4">
          <!-- Avatar -->
          <div class="flex-shrink-0">
            @if (user().avatar) {
              <img
                [src]="user().avatar"
                [alt]="user().displayName"
                class="w-12 h-12 rounded-full object-cover"
              />
            } @else {
              <div class="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center">
                <span class="text-primary-600 font-semibold text-lg">
                  {{ user().firstName[0] }}{{ user().lastName[0] }}
                </span>
              </div>
            }
          </div>
          
          <!-- Info -->
          <div class="flex-1 min-w-0">
            <h3 class="font-semibold text-gray-900 truncate">
              {{ user().displayName }}
            </h3>
            <p class="text-sm text-gray-500 truncate">
              {{ user().email }}
            </p>
            
            <!-- Roles -->
            <div class="flex flex-wrap gap-1 mt-2">
              @for (role of user().roles; track role) {
                <span class="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-700">
                  {{ 'users.roles.' + role | transloco }}
                </span>
              }
            </div>
          </div>
          
          <!-- Status Badge -->
          <span
            class="px-2 py-1 text-xs rounded-full"
            [class]="getStatusClasses(user().status)"
          >
            {{ 'users.status.' + user().status | transloco }}
          </span>
        </div>
        
        <!-- Actions -->
        @if (canEdit() || canDelete()) {
          <div class="flex gap-2 mt-4 pt-4 border-t">
            @if (canEdit()) {
              <fly-button
                variant="outline"
                size="sm"
                (clicked)="onEdit($event)"
              >
                {{ 'users.actions.edit' | transloco }}
              </fly-button>
            }
            @if (canDelete()) {
              <fly-button
                variant="ghost"
                size="sm"
                class="text-red-600"
                (clicked)="onDelete($event)"
              >
                {{ 'users.actions.delete' | transloco }}
              </fly-button>
            }
          </div>
        }
      </fly-card-content>
    </fly-card>
  `,
})
export class UserCardComponent {
  user = input.required<User>();
  canEdit = input(false);
  canDelete = input(false);

  view = output<User>();
  edit = output<User>();
  delete = output<User>();

  getStatusClasses(status: string): string {
    const classes: Record<string, string> = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      pending: 'bg-yellow-100 text-yellow-800',
      suspended: 'bg-red-100 text-red-800',
    };
    return classes[status] ?? 'bg-gray-100 text-gray-800';
  }

  onEdit(event: Event): void {
    event.stopPropagation();
    this.edit.emit(this.user());
  }

  onDelete(event: Event): void {
    event.stopPropagation();
    this.delete.emit(this.user());
  }
}
```

---

## Step 7: Configure Routing

### 7.1 Feature Routes

Create `libs/features/users/src/lib/users.routes.ts`:

```typescript
import { Routes } from '@angular/router';
import { provideState } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';
import { authGuard, permissionGuard } from '@flyfront/core';
import { usersFeature } from './state/users.state';
import { UsersEffects } from './state/users.effects';

export const USERS_ROUTES: Routes = [
  {
    path: '',
    canActivate: [
      authGuard(),
      permissionGuard({ permissions: ['users:read'] }),
    ],
    providers: [
      provideState(usersFeature),
      provideEffects([UsersEffects]),
    ],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./components/user-list/user-list.component').then(
            (m) => m.UserListComponent
          ),
      },
      {
        path: 'create',
        canActivate: [permissionGuard({ permissions: ['users:create'] })],
        loadComponent: () =>
          import('./components/user-form/user-form.component').then(
            (m) => m.UserFormComponent
          ),
      },
      {
        path: ':id',
        loadComponent: () =>
          import('./components/user-detail/user-detail.component').then(
            (m) => m.UserDetailComponent
          ),
      },
      {
        path: ':id/edit',
        canActivate: [permissionGuard({ permissions: ['users:update'] })],
        loadComponent: () =>
          import('./components/user-form/user-form.component').then(
            (m) => m.UserFormComponent
          ),
      },
    ],
  },
];
```

### 7.2 Add to Application Routes

Update your main `app.routes.ts`:

```typescript
import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./home/home.component').then((m) => m.HomeComponent),
  },
  {
    path: 'users',
    loadChildren: () =>
      import('@flyfront/feature-users').then((m) => m.USERS_ROUTES),
  },
  // ... other routes
];
```

---

## Step 8: Testing

### 8.1 Component Tests

Create `libs/features/users/src/lib/components/user-list/user-list.component.spec.ts`:

```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideMockStore, MockStore } from '@ngrx/store/testing';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { MockAuthService } from '@flyfront/testing';
import { AuthService } from '@flyfront/auth';
import { UserListComponent } from './user-list.component';
import { usersActions } from '../../state/users.actions';
import { User } from '../../models/user.model';

describe('UserListComponent', () => {
  let component: UserListComponent;
  let fixture: ComponentFixture<UserListComponent>;
  let store: MockStore;

  const mockUsers: User[] = [
    {
      id: '1',
      email: 'john@example.com',
      firstName: 'John',
      lastName: 'Doe',
      displayName: 'John Doe',
      roles: ['admin'],
      status: 'active',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    },
    {
      id: '2',
      email: 'jane@example.com',
      firstName: 'Jane',
      lastName: 'Smith',
      displayName: 'Jane Smith',
      roles: ['editor'],
      status: 'active',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    },
  ];

  const initialState = {
    users: {
      ids: ['1', '2'],
      entities: {
        '1': mockUsers[0],
        '2': mockUsers[1],
      },
      selectedUserId: null,
      filters: {},
      loading: false,
      error: null,
      pagination: {
        page: 1,
        pageSize: 20,
        totalItems: 2,
        totalPages: 1,
      },
    },
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        UserListComponent,
        TranslocoTestingModule.forRoot({
          langs: { en: {} },
          translocoConfig: { defaultLang: 'en' },
        }),
      ],
      providers: [
        provideMockStore({ initialState }),
        { provide: AuthService, useClass: MockAuthService },
      ],
    }).compileComponents();

    store = TestBed.inject(MockStore);
    fixture = TestBed.createComponent(UserListComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should dispatch loadUsers on init', () => {
    const dispatchSpy = spyOn(store, 'dispatch');
    
    fixture.detectChanges();
    
    expect(dispatchSpy).toHaveBeenCalledWith(usersActions.loadUsers({}));
  });

  it('should display users', () => {
    fixture.detectChanges();
    
    const userCards = fixture.nativeElement.querySelectorAll('fly-user-card');
    expect(userCards.length).toBe(2);
  });

  it('should show loading state', () => {
    store.setState({
      users: { ...initialState.users, loading: true },
    });
    
    fixture.detectChanges();
    
    const skeletons = fixture.nativeElement.querySelectorAll('fly-skeleton');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('should show empty state when no users', () => {
    store.setState({
      users: {
        ...initialState.users,
        ids: [],
        entities: {},
        pagination: { ...initialState.users.pagination, totalItems: 0 },
      },
    });
    
    fixture.detectChanges();
    
    expect(fixture.nativeElement.textContent).toContain('No users found');
  });

  it('should dispatch filter action on search', () => {
    const dispatchSpy = spyOn(store, 'dispatch');
    
    fixture.detectChanges();
    component.onSearchChange('test query');
    
    expect(dispatchSpy).toHaveBeenCalledWith(
      usersActions.setFilters({ filters: { search: 'test query' } })
    );
  });
});
```

### 8.2 Effect Tests

Create `libs/features/users/src/lib/state/users.effects.spec.ts`:

```typescript
import { TestBed } from '@angular/core/testing';
import { provideMockActions } from '@ngrx/effects/testing';
import { provideMockStore, MockStore } from '@ngrx/store/testing';
import { Observable, of, throwError } from 'rxjs';
import { UsersEffects } from './users.effects';
import { usersActions } from './users.actions';
import { UsersApiService } from '../services/users-api.service';

describe('UsersEffects', () => {
  let effects: UsersEffects;
  let actions$: Observable<any>;
  let usersApiService: jasmine.SpyObj<UsersApiService>;

  const mockUser = {
    id: '1',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    displayName: 'Test User',
    roles: ['editor' as const],
    status: 'active' as const,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  };

  beforeEach(() => {
    const apiSpy = jasmine.createSpyObj('UsersApiService', [
      'getUsers',
      'getUser',
      'createUser',
      'updateUser',
      'deleteUser',
    ]);

    TestBed.configureTestingModule({
      providers: [
        UsersEffects,
        provideMockActions(() => actions$),
        provideMockStore({
          initialState: {
            users: {
              filters: {},
              pagination: { page: 1, pageSize: 20, totalItems: 0, totalPages: 0 },
            },
          },
        }),
        { provide: UsersApiService, useValue: apiSpy },
      ],
    });

    effects = TestBed.inject(UsersEffects);
    usersApiService = TestBed.inject(UsersApiService) as jasmine.SpyObj<UsersApiService>;
  });

  describe('loadUsers$', () => {
    it('should return loadUsersSuccess on success', (done) => {
      const response = {
        data: [mockUser],
        meta: { page: 1, pageSize: 20, totalItems: 1, totalPages: 1 },
      };
      usersApiService.getUsers.and.returnValue(of(response));

      actions$ = of(usersActions.loadUsers({}));

      effects.loadUsers$.subscribe((action) => {
        expect(action).toEqual(
          usersActions.loadUsersSuccess({
            users: response.data,
            pagination: response.meta,
          })
        );
        done();
      });
    });

    it('should return loadUsersFailure on error', (done) => {
      usersApiService.getUsers.and.returnValue(
        throwError(() => new Error('API Error'))
      );

      actions$ = of(usersActions.loadUsers({}));

      effects.loadUsers$.subscribe((action) => {
        expect(action).toEqual(
          usersActions.loadUsersFailure({ error: 'API Error' })
        );
        done();
      });
    });
  });
});
```

---

## Step 9: Wire Everything Together

### 9.1 Application Configuration

Update `apps/demo-app/src/app/app.config.ts`:

```typescript
import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideStore } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';
import { provideStoreDevtools } from '@ngrx/store-devtools';
import { provideConfig, httpErrorInterceptor, authTokenInterceptor } from '@flyfront/core';
import { provideI18n } from '@flyfront/i18n';
import { provideAppState } from '@flyfront/state';
import { routes } from './app.routes';
import { environment } from '../environments/environment';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(
      withInterceptors([authTokenInterceptor(), httpErrorInterceptor])
    ),
    
    // NgRx Store
    provideAppState({
      devTools: !environment.production,
      strictMode: true,
    }),
    
    // Flyfront Configuration
    provideConfig({
      appName: 'Demo App',
      version: '1.0.0',
      environment: environment.production ? 'production' : 'development',
      apiBaseUrl: environment.apiUrl,
      auth: {
        provider: 'oidc',
        clientId: environment.auth.clientId,
      },
      features: {},
      logging: {
        level: environment.production ? 'warn' : 'debug',
        console: true,
      },
    }),
    
    // Internationalization
    provideI18n({
      defaultLang: 'en',
      availableLangs: ['en', 'es', 'de'],
      fallbackLang: 'en',
      prodMode: environment.production,
    }),
  ],
};
```

### 9.2 Public API Exports

Update `libs/features/users/src/index.ts`:

```typescript
// Models
export * from './lib/models/user.model';

// State
export { usersFeature } from './lib/state/users.state';
export * from './lib/state/users.state';
export { usersActions } from './lib/state/users.actions';
export { UsersEffects } from './lib/state/users.effects';

// Services
export { UsersApiService } from './lib/services/users-api.service';

// Components
export { UserListComponent } from './lib/components/user-list/user-list.component';
export { UserCardComponent } from './lib/components/user-card/user-card.component';

// Routes
export { USERS_ROUTES } from './lib/users.routes';
```

---

## Summary

You've built a complete User Management feature using all Flyfront libraries:

| Library | Usage |
|---------|-------|
| **@flyfront/core** | Configuration, logging, guards |
| **@flyfront/ui** | UI components (Button, Card, Input, etc.) |
| **@flyfront/auth** | Permission checks, route protection |
| **@flyfront/data-access** | API service with reactive connections |
| **@flyfront/state** | NgRx state management |
| **@flyfront/i18n** | Multi-language support |
| **@flyfront/testing** | Mock services and test utilities |

### Key Patterns

1. **Feature-first organization**: Each feature is a self-contained library
2. **Lazy loading**: Routes and state are loaded on demand
3. **Signal-based reactivity**: Using Angular signals for local state
4. **Centralized state**: NgRx for complex shared state
5. **Permission-based UI**: Components adapt based on user permissions
6. **Full i18n**: All user-facing text is translatable

### Next Steps

- [Add more validation](./forms-validation.md) to the user form
- [Implement real-time updates](./real-time-data.md) with SSE
- [Add optimistic updates](./optimistic-updates.md) for better UX
- [Create end-to-end tests](./e2e-testing.md) with Cypress
