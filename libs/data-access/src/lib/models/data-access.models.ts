/**
 * @flyfront/data-access - Models and Types
 * @license Apache-2.0
 */

import { HttpHeaders, HttpParams } from '@angular/common/http';

/**
 * Pagination parameters for API requests
 */
export interface PaginationParams {
  page?: number;
  pageSize?: number;
  sort?: string;
  sortDirection?: 'asc' | 'desc';
}

/**
 * Paginated response wrapper
 */
export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

/**
 * API error response
 */
export interface ApiErrorResponse {
  code: string;
  message: string;
  details?: Record<string, string[]>;
  timestamp: string;
  path?: string;
  traceId?: string;
}

/**
 * Request configuration options
 */
export interface RequestConfig {
  headers?: HttpHeaders | Record<string, string | string[]>;
  params?: HttpParams | Record<string, string | number | boolean | string[]>;
  withCredentials?: boolean;
  reportProgress?: boolean;
  responseType?: 'json' | 'text' | 'blob' | 'arraybuffer';
  skipAuth?: boolean;
  skipErrorHandler?: boolean;
  cache?: CacheConfig;
}

/**
 * Cache configuration
 */
export interface CacheConfig {
  enabled: boolean;
  ttl?: number; // Time to live in milliseconds
  key?: string; // Custom cache key
}

/**
 * WebSocket message
 */
export interface WebSocketMessage<T = unknown> {
  type: string;
  payload: T;
  timestamp?: number;
  id?: string;
}

/**
 * WebSocket connection state
 */
export type WebSocketState = 'connecting' | 'connected' | 'disconnected' | 'reconnecting' | 'error';

/**
 * WebSocket configuration
 */
export interface WebSocketConfig {
  url: string;
  protocols?: string | string[];
  reconnect?: boolean;
  reconnectInterval?: number;
  reconnectAttempts?: number;
  heartbeatInterval?: number;
}

/**
 * File upload progress
 */
export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

/**
 * File upload response
 */
export interface UploadResponse<T = unknown> {
  data: T;
  filename: string;
  size: number;
  mimeType: string;
}

/**
 * Query parameters builder type
 */
export type QueryParams = Record<string, string | number | boolean | string[] | undefined | null>;

/**
 * HTTP method type
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';

/**
 * Retry configuration
 */
export interface RetryConfig {
  maxRetries: number;
  retryDelay: number;
  retryStatuses: number[];
  exponentialBackoff?: boolean;
}

/**
 * Data access configuration
 */
export interface DataAccessConfig {
  baseUrl: string;
  defaultHeaders?: Record<string, string>;
  timeout?: number;
  retry?: RetryConfig;
  cache?: {
    enabled: boolean;
    defaultTtl: number;
  };
}

// ============================================================
// REACTIVE CONNECTION TYPES
// ============================================================

/**
 * Polling configuration
 */
export interface PollingConfig {
  /** Polling interval in milliseconds (default: 30000) */
  interval?: number;
  /** Whether to emit immediately on subscribe (default: true) */
  immediate?: boolean;
  /** Only emit when data changes (default: false) */
  emitOnlyOnChange?: boolean;
  /** Custom comparison function for change detection */
  compareFn?: <T>(prev: T, curr: T) => boolean;
  /** Continue polling even if an error occurs (default: false) */
  continueOnError?: boolean;
  /** Unique identifier for this poll (for stopping) */
  id?: string;
}

/**
 * Server-Sent Events configuration
 */
export interface SSEConfig {
  /** Unique identifier for this SSE connection */
  id?: string;
  /** Include credentials in the request */
  withCredentials?: boolean;
  /** Continue on error instead of completing */
  continueOnError?: boolean;
  /** Automatically parse JSON data (default: true) */
  parseJson?: boolean;
  /** Specific event types to listen for */
  eventTypes?: string[];
}

/**
 * Server-Sent Events message
 */
export interface SSEMessage<T = unknown> {
  /** Event type */
  type: string;
  /** Event data */
  data: T;
  /** Last event ID */
  lastEventId: string;
  /** Event origin */
  origin: string;
}

/**
 * Reactive request configuration
 */
export interface ReactiveRequestConfig {
  /** Base request configuration */
  requestConfig?: RequestConfig;
  /** Retry configuration */
  retry?: Partial<RetryConfig>;
  /** Whether to share and replay the last value (default: true) */
  shareReplay?: boolean;
  /** Emit errors as values instead of erroring (default: false) */
  emitErrorAsValue?: boolean;
}

/**
 * Paginated stream state
 */
export interface PaginatedStreamState<T> {
  data: T[];
  loading: boolean;
  hasMore: boolean;
  error: ApiErrorResponse | null;
  page: number;
  pageSize: number;
}
