/**
 * @flyfront/state - Models and Types
 * @license Apache-2.0
 */

import { EntityState, EntityAdapter } from '@ngrx/entity';

/**
 * Base state interface with loading and error
 */
export interface BaseState {
  loading: boolean;
  error: string | null;
}

/**
 * Entity state with loading and error
 */
export interface EntityStateWithStatus<T> extends EntityState<T>, BaseState {
  selectedId: string | null;
}

/**
 * Async operation status
 */
export type AsyncStatus = 'idle' | 'loading' | 'success' | 'error';

/**
 * Async state wrapper
 */
export interface AsyncState<T> {
  data: T | null;
  status: AsyncStatus;
  error: string | null;
  lastUpdated: number | null;
}

/**
 * Pagination state
 */
export interface PaginationState {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

/**
 * Filter state
 */
export interface FilterState<T = Record<string, unknown>> {
  filters: T;
  searchQuery: string;
}

/**
 * Sort state
 */
export interface SortState {
  sortBy: string | null;
  sortDirection: 'asc' | 'desc';
}

/**
 * Combined list state
 */
export interface ListState<TFilter = Record<string, unknown>>
  extends PaginationState,
    FilterState<TFilter>,
    SortState {}

/**
 * Entity feature configuration
 */
export interface EntityFeatureConfig<T> {
  name: string;
  selectId?: (entity: T) => string;
  sortComparer?: (a: T, b: T) => number;
}

/**
 * Action payload types
 */
export interface LoadPayload {
  page?: number;
  pageSize?: number;
  filters?: Record<string, unknown>;
}

export interface LoadSuccessPayload<T> {
  entities: T[];
  totalItems?: number;
  totalPages?: number;
}

export interface LoadFailurePayload {
  error: string;
}

export interface AddPayload<T> {
  entity: T;
}

export interface UpdatePayload<T> {
  id: string;
  changes: Partial<T>;
}

export interface RemovePayload {
  id: string;
}

/**
 * Signal store configuration
 */
export interface SignalStoreConfig<T> {
  initialState: T;
  persistence?: {
    key: string;
    storage?: 'local' | 'session';
  };
}

/**
 * Store selector type
 */
export type Selector<TState, TResult> = (state: TState) => TResult;

/**
 * Store action type
 */
export type Action<TPayload = void> = TPayload extends void
  ? { type: string }
  : { type: string; payload: TPayload };

/**
 * Effect configuration
 */
export interface EffectConfig {
  dispatch?: boolean;
  useEffectsErrorHandler?: boolean;
}
