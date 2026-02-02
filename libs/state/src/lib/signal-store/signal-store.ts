/**
 * @flyfront/state - Signal Store Utilities
 * @license Apache-2.0
 */

import { computed, signal, Signal, WritableSignal } from '@angular/core';
import { SignalStoreConfig, AsyncState, PaginationState, ListState } from '../models/state.models';

/**
 * Create a simple signal-based store
 *
 * @example
 * ```typescript
 * interface CounterState {
 *   count: number;
 *   lastUpdated: Date | null;
 * }
 *
 * const counterStore = createSignalStore<CounterState>({
 *   initialState: { count: 0, lastUpdated: null },
 *   persistence: { key: 'counter', storage: 'local' }
 * });
 *
 * // Use in component
 * count = counterStore.select(s => s.count);
 * counterStore.update(s => ({ ...s, count: s.count + 1 }));
 * ```
 */
export function createSignalStore<T extends object>(config: SignalStoreConfig<T>) {
  const { initialState, persistence } = config;

  // Load persisted state if configured
  let state = initialState;
  if (persistence) {
    const stored = loadFromStorage<T>(persistence.key, persistence.storage);
    if (stored) {
      state = { ...initialState, ...stored };
    }
  }

  const _state: WritableSignal<T> = signal(state);

  // Persist on change if configured
  const update = (updater: (current: T) => T) => {
    _state.update(updater);
    if (persistence) {
      saveToStorage(persistence.key, _state(), persistence.storage);
    }
  };

  const set = (newState: T) => {
    _state.set(newState);
    if (persistence) {
      saveToStorage(persistence.key, newState, persistence.storage);
    }
  };

  const patch = (partial: Partial<T>) => {
    update((current) => ({ ...current, ...partial }));
  };

  const reset = () => {
    set(initialState);
  };

  const select = <R>(selector: (state: T) => R): Signal<R> => {
    return computed(() => selector(_state()));
  };

  return {
    state: _state.asReadonly(),
    update,
    set,
    patch,
    reset,
    select,
  };
}

/**
 * Create async state helpers
 */
export function withAsync<T>() {
  const _state = signal<AsyncState<T>>({
    data: null,
    status: 'idle',
    error: null,
    lastUpdated: null,
  });

  return {
    state: _state.asReadonly(),
    data: computed(() => _state().data),
    status: computed(() => _state().status),
    error: computed(() => _state().error),
    isLoading: computed(() => _state().status === 'loading'),
    isSuccess: computed(() => _state().status === 'success'),
    isError: computed(() => _state().status === 'error'),
    isIdle: computed(() => _state().status === 'idle'),

    setLoading: () => {
      _state.update((s) => ({ ...s, status: 'loading', error: null }));
    },

    setSuccess: (data: T) => {
      _state.set({
        data,
        status: 'success',
        error: null,
        lastUpdated: Date.now(),
      });
    },

    setError: (error: string) => {
      _state.update((s) => ({ ...s, status: 'error', error }));
    },

    reset: () => {
      _state.set({
        data: null,
        status: 'idle',
        error: null,
        lastUpdated: null,
      });
    },
  };
}

/**
 * Create pagination state helpers
 */
export function withPagination(initialPageSize = 10) {
  const _state = signal<PaginationState>({
    page: 1,
    pageSize: initialPageSize,
    totalItems: 0,
    totalPages: 0,
  });

  return {
    state: _state.asReadonly(),
    page: computed(() => _state().page),
    pageSize: computed(() => _state().pageSize),
    totalItems: computed(() => _state().totalItems),
    totalPages: computed(() => _state().totalPages),
    hasNextPage: computed(() => _state().page < _state().totalPages),
    hasPreviousPage: computed(() => _state().page > 1),

    setPage: (page: number) => {
      _state.update((s) => ({ ...s, page }));
    },

    setPageSize: (pageSize: number) => {
      _state.update((s) => ({ ...s, pageSize, page: 1 }));
    },

    setTotals: (totalItems: number, totalPages: number) => {
      _state.update((s) => ({ ...s, totalItems, totalPages }));
    },

    nextPage: () => {
      _state.update((s) => ({
        ...s,
        page: Math.min(s.page + 1, s.totalPages),
      }));
    },

    previousPage: () => {
      _state.update((s) => ({
        ...s,
        page: Math.max(s.page - 1, 1),
      }));
    },

    reset: () => {
      _state.set({
        page: 1,
        pageSize: initialPageSize,
        totalItems: 0,
        totalPages: 0,
      });
    },
  };
}

/**
 * Create list state with filtering, sorting, and pagination
 */
export function withList<TFilter extends Record<string, unknown> = Record<string, unknown>>(
  initialFilters: TFilter = {} as TFilter,
  initialPageSize = 10
) {
  const _state = signal<ListState<TFilter>>({
    page: 1,
    pageSize: initialPageSize,
    totalItems: 0,
    totalPages: 0,
    filters: initialFilters,
    searchQuery: '',
    sortBy: null,
    sortDirection: 'asc',
  });

  return {
    state: _state.asReadonly(),

    // Pagination
    page: computed(() => _state().page),
    pageSize: computed(() => _state().pageSize),
    totalItems: computed(() => _state().totalItems),
    totalPages: computed(() => _state().totalPages),
    hasNextPage: computed(() => _state().page < _state().totalPages),
    hasPreviousPage: computed(() => _state().page > 1),

    // Filtering
    filters: computed(() => _state().filters),
    searchQuery: computed(() => _state().searchQuery),

    // Sorting
    sortBy: computed(() => _state().sortBy),
    sortDirection: computed(() => _state().sortDirection),

    // Actions
    setPage: (page: number) => _state.update((s) => ({ ...s, page })),
    setPageSize: (pageSize: number) => _state.update((s) => ({ ...s, pageSize, page: 1 })),
    setTotals: (totalItems: number, totalPages: number) =>
      _state.update((s) => ({ ...s, totalItems, totalPages })),
    nextPage: () =>
      _state.update((s) => ({ ...s, page: Math.min(s.page + 1, s.totalPages) })),
    previousPage: () =>
      _state.update((s) => ({ ...s, page: Math.max(s.page - 1, 1) })),

    setFilters: (filters: Partial<TFilter>) =>
      _state.update((s) => ({ ...s, filters: { ...s.filters, ...filters }, page: 1 })),
    clearFilters: () => _state.update((s) => ({ ...s, filters: initialFilters, page: 1 })),
    setSearchQuery: (searchQuery: string) =>
      _state.update((s) => ({ ...s, searchQuery, page: 1 })),

    setSort: (sortBy: string, sortDirection: 'asc' | 'desc' = 'asc') =>
      _state.update((s) => ({ ...s, sortBy, sortDirection })),
    toggleSortDirection: () =>
      _state.update((s) => ({
        ...s,
        sortDirection: s.sortDirection === 'asc' ? 'desc' : 'asc',
      })),
    clearSort: () => _state.update((s) => ({ ...s, sortBy: null, sortDirection: 'asc' })),

    reset: () =>
      _state.set({
        page: 1,
        pageSize: initialPageSize,
        totalItems: 0,
        totalPages: 0,
        filters: initialFilters,
        searchQuery: '',
        sortBy: null,
        sortDirection: 'asc',
      }),
  };
}

/**
 * Create entity collection state
 */
export function withEntities<T extends { id: string | number }>() {
  const _entities = signal<Record<string | number, T>>({});
  const _ids = signal<(string | number)[]>([]);
  const _selectedId = signal<string | number | null>(null);

  return {
    entities: _entities.asReadonly(),
    ids: _ids.asReadonly(),
    selectedId: _selectedId.asReadonly(),

    all: computed(() => _ids().map((id) => _entities()[id])),
    total: computed(() => _ids().length),
    selected: computed(() => {
      const id = _selectedId();
      return id !== null ? _entities()[id] ?? null : null;
    }),
    isEmpty: computed(() => _ids().length === 0),

    byId: (id: string | number) => computed(() => _entities()[id] ?? null),

    setAll: (entities: T[]) => {
      const entityMap: Record<string | number, T> = {};
      const idList: (string | number)[] = [];
      entities.forEach((entity) => {
        entityMap[entity.id] = entity;
        idList.push(entity.id);
      });
      _entities.set(entityMap);
      _ids.set(idList);
    },

    addOne: (entity: T) => {
      _entities.update((e) => ({ ...e, [entity.id]: entity }));
      _ids.update((ids) => (ids.includes(entity.id) ? ids : [...ids, entity.id]));
    },

    addMany: (entities: T[]) => {
      _entities.update((e) => {
        const updated = { ...e };
        entities.forEach((entity) => {
          updated[entity.id] = entity;
        });
        return updated;
      });
      _ids.update((ids) => {
        const newIds = entities.map((e) => e.id).filter((id) => !ids.includes(id));
        return [...ids, ...newIds];
      });
    },

    updateOne: (id: string | number, changes: Partial<T>) => {
      _entities.update((e) => {
        if (!e[id]) return e;
        return { ...e, [id]: { ...e[id], ...changes } };
      });
    },

    removeOne: (id: string | number) => {
      _entities.update((e) => {
        const { [id]: _, ...rest } = e;
        return rest;
      });
      _ids.update((ids) => ids.filter((i) => i !== id));
      if (_selectedId() === id) {
        _selectedId.set(null);
      }
    },

    removeMany: (ids: (string | number)[]) => {
      _entities.update((e) => {
        const updated = { ...e };
        ids.forEach((id) => delete updated[id]);
        return updated;
      });
      _ids.update((currentIds) => currentIds.filter((id) => !ids.includes(id)));
      if (ids.includes(_selectedId() as string | number)) {
        _selectedId.set(null);
      }
    },

    clear: () => {
      _entities.set({});
      _ids.set([]);
      _selectedId.set(null);
    },

    select: (id: string | number | null) => {
      _selectedId.set(id);
    },

    clearSelection: () => {
      _selectedId.set(null);
    },
  };
}

// Storage helpers
function loadFromStorage<T>(key: string, storage: 'local' | 'session' = 'local'): T | null {
  try {
    const storageObj = storage === 'local' ? localStorage : sessionStorage;
    const item = storageObj.getItem(key);
    return item ? JSON.parse(item) : null;
  } catch {
    return null;
  }
}

function saveToStorage<T>(key: string, data: T, storage: 'local' | 'session' = 'local'): void {
  try {
    const storageObj = storage === 'local' ? localStorage : sessionStorage;
    storageObj.setItem(key, JSON.stringify(data));
  } catch {
    // Ignore storage errors
  }
}
