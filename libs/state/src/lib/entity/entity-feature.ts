/**
 * @flyfront/state - Entity Feature Factory
 * @license Apache-2.0
 */

import { createFeature, createReducer, on, createAction, props } from '@ngrx/store';
import { createEntityAdapter, EntityAdapter, EntityState } from '@ngrx/entity';
import { EntityFeatureConfig, EntityStateWithStatus } from '../models/state.models';

/**
 * Create a complete entity feature with actions, reducer, and selectors
 *
 * @example
 * ```typescript
 * interface User {
 *   id: string;
 *   name: string;
 *   email: string;
 * }
 *
 * export const usersFeature = createEntityFeature<User>({
 *   name: 'users',
 *   selectId: (user) => user.id,
 *   sortComparer: (a, b) => a.name.localeCompare(b.name),
 * });
 *
 * // Use in component
 * users = this.store.selectSignal(usersFeature.selectAll);
 * loading = this.store.selectSignal(usersFeature.selectLoading);
 *
 * // Dispatch actions
 * this.store.dispatch(usersFeature.actions.load());
 * this.store.dispatch(usersFeature.actions.addOne({ entity: newUser }));
 * ```
 */
export function createEntityFeature<T extends { id: string }>(
  config: EntityFeatureConfig<T>
) {
  const { name, selectId, sortComparer } = config;

  // Create entity adapter
  const adapter: EntityAdapter<T> = createEntityAdapter<T>({
    selectId: selectId ?? ((entity: T) => entity.id as string),
    sortComparer,
  });

  // Initial state
  const initialState: EntityStateWithStatus<T> = adapter.getInitialState({
    loading: false,
    error: null,
    selectedId: null,
  });

  // Create actions
  const actions = {
    load: createAction(`[${name}] Load`),
    loadSuccess: createAction(`[${name}] Load Success`, props<{ entities: T[] }>()),
    loadFailure: createAction(`[${name}] Load Failure`, props<{ error: string }>()),

    loadOne: createAction(`[${name}] Load One`, props<{ id: string }>()),
    loadOneSuccess: createAction(`[${name}] Load One Success`, props<{ entity: T }>()),
    loadOneFailure: createAction(`[${name}] Load One Failure`, props<{ error: string }>()),

    addOne: createAction(`[${name}] Add One`, props<{ entity: T }>()),
    addOneSuccess: createAction(`[${name}] Add One Success`, props<{ entity: T }>()),
    addOneFailure: createAction(`[${name}] Add One Failure`, props<{ error: string }>()),

    updateOne: createAction(
      `[${name}] Update One`,
      props<{ id: string; changes: Partial<T> }>()
    ),
    updateOneSuccess: createAction(
      `[${name}] Update One Success`,
      props<{ id: string; changes: Partial<T> }>()
    ),
    updateOneFailure: createAction(`[${name}] Update One Failure`, props<{ error: string }>()),

    removeOne: createAction(`[${name}] Remove One`, props<{ id: string }>()),
    removeOneSuccess: createAction(`[${name}] Remove One Success`, props<{ id: string }>()),
    removeOneFailure: createAction(`[${name}] Remove One Failure`, props<{ error: string }>()),

    selectOne: createAction(`[${name}] Select One`, props<{ id: string | null }>()),
    clearSelection: createAction(`[${name}] Clear Selection`),

    setAll: createAction(`[${name}] Set All`, props<{ entities: T[] }>()),
    clearAll: createAction(`[${name}] Clear All`),
    clearError: createAction(`[${name}] Clear Error`),
  };

  // Create reducer
  const reducer = createReducer(
    initialState,

    // Load
    on(actions.load, (state) => ({
      ...state,
      loading: true,
      error: null,
    })),
    on(actions.loadSuccess, (state, { entities }) =>
      adapter.setAll(entities, { ...state, loading: false })
    ),
    on(actions.loadFailure, (state, { error }) => ({
      ...state,
      loading: false,
      error,
    })),

    // Load One
    on(actions.loadOne, (state) => ({
      ...state,
      loading: true,
      error: null,
    })),
    on(actions.loadOneSuccess, (state, { entity }) =>
      adapter.upsertOne(entity, { ...state, loading: false })
    ),
    on(actions.loadOneFailure, (state, { error }) => ({
      ...state,
      loading: false,
      error,
    })),

    // Add One
    on(actions.addOne, (state) => ({
      ...state,
      loading: true,
      error: null,
    })),
    on(actions.addOneSuccess, (state, { entity }) =>
      adapter.addOne(entity, { ...state, loading: false })
    ),
    on(actions.addOneFailure, (state, { error }) => ({
      ...state,
      loading: false,
      error,
    })),

    // Update One
    on(actions.updateOne, (state) => ({
      ...state,
      loading: true,
      error: null,
    })),
    on(actions.updateOneSuccess, (state, { id, changes }) =>
      adapter.updateOne({ id, changes }, { ...state, loading: false })
    ),
    on(actions.updateOneFailure, (state, { error }) => ({
      ...state,
      loading: false,
      error,
    })),

    // Remove One
    on(actions.removeOne, (state) => ({
      ...state,
      loading: true,
      error: null,
    })),
    on(actions.removeOneSuccess, (state, { id }) =>
      adapter.removeOne(id, { ...state, loading: false })
    ),
    on(actions.removeOneFailure, (state, { error }) => ({
      ...state,
      loading: false,
      error,
    })),

    // Selection
    on(actions.selectOne, (state, { id }) => ({
      ...state,
      selectedId: id,
    })),
    on(actions.clearSelection, (state) => ({
      ...state,
      selectedId: null,
    })),

    // Bulk operations
    on(actions.setAll, (state, { entities }) => adapter.setAll(entities, state)),
    on(actions.clearAll, (state) => adapter.removeAll({ ...state, selectedId: null })),
    on(actions.clearError, (state) => ({ ...state, error: null }))
  );

  // Create feature with selectors
  const feature = createFeature({
    name,
    reducer,
  });

  // Additional selectors
  const adapterSelectors = adapter.getSelectors();
  const extraSelectors = {
    selectAll: (state: EntityStateWithStatus<T>) => adapterSelectors.selectAll(state),
    selectTotal: (state: EntityStateWithStatus<T>) => adapterSelectors.selectTotal(state),
    selectById: (id: string) => (state: EntityStateWithStatus<T>) =>
      state.entities[id],
    selectSelected: (state: EntityStateWithStatus<T>) =>
      state.selectedId !== null ? state.entities[state.selectedId] : null,
    selectIsEmpty: (state: EntityStateWithStatus<T>) =>
      adapterSelectors.selectTotal(state) === 0,
    selectHasError: (state: EntityStateWithStatus<T>) => state.error !== null,
  };

  return {
    ...feature,
    ...extraSelectors,
    actions,
    adapter,
    initialState,
  };
}

/**
 * Create initial async state
 */
export function createAsyncState<T>(initialData: T | null = null) {
  return {
    data: initialData,
    status: 'idle' as const,
    error: null,
    lastUpdated: null,
  };
}
