/**
 * @flyfront/core - Core Models and Types
 * @license Apache-2.0
 */

/**
 * Application configuration interface
 */
export interface AppConfig {
  /** Application name */
  appName: string;
  /** Application version */
  version: string;
  /** Environment (development, staging, production) */
  environment: Environment;
  /** API base URL */
  apiBaseUrl: string;
  /** Authentication configuration */
  auth: AuthConfig;
  /** Feature flags */
  features: Record<string, boolean>;
  /** Logging configuration */
  logging: LoggingConfig;
  /** Custom configuration */
  custom?: Record<string, unknown>;
}

/**
 * Environment types
 */
export type Environment = 'development' | 'staging' | 'production';

/**
 * Authentication configuration
 */
export interface AuthConfig {
  /** Auth provider type */
  provider: 'oidc' | 'oauth2' | 'basic' | 'custom';
  /** Auth provider URL (e.g., Keycloak, Auth0) */
  issuerUrl?: string;
  /** Client ID */
  clientId?: string;
  /** Redirect URI after login */
  redirectUri?: string;
  /** Post logout redirect URI */
  postLogoutRedirectUri?: string;
  /** Scopes to request */
  scopes?: string[];
  /** Token storage type */
  tokenStorage?: 'localStorage' | 'sessionStorage' | 'memory';
  /** Auto refresh token */
  autoRefresh?: boolean;
  /** Token refresh threshold in seconds */
  refreshThreshold?: number;
}

/**
 * Logging configuration
 */
export interface LoggingConfig {
  /** Log level */
  level: LogLevel;
  /** Enable console logging */
  console: boolean;
  /** Enable remote logging */
  remote?: boolean;
  /** Remote logging endpoint */
  remoteEndpoint?: string;
  /** Include timestamps */
  timestamps?: boolean;
  /** Include stack traces for errors */
  stackTraces?: boolean;
}

/**
 * Log levels
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'off';

/**
 * Log entry interface
 */
export interface LogEntry {
  /** Log level */
  level: LogLevel;
  /** Log message */
  message: string;
  /** Timestamp */
  timestamp: Date;
  /** Additional context */
  context?: Record<string, unknown>;
  /** Error object if applicable */
  error?: Error;
  /** Stack trace */
  stackTrace?: string;
}

/**
 * API Response wrapper
 */
export interface ApiResponse<T> {
  /** Response data */
  data: T;
  /** Success indicator */
  success: boolean;
  /** Response message */
  message?: string;
  /** Error details */
  errors?: ApiError[];
  /** Response metadata */
  meta?: ResponseMeta;
}

/**
 * API Error details
 */
export interface ApiError {
  /** Error code */
  code: string;
  /** Error message */
  message: string;
  /** Field that caused the error */
  field?: string;
  /** Additional error details */
  details?: Record<string, unknown>;
}

/**
 * Response metadata
 */
export interface ResponseMeta {
  /** Request ID for tracing */
  requestId?: string;
  /** Response timestamp */
  timestamp?: string;
  /** API version */
  apiVersion?: string;
}

/**
 * Pagination request parameters
 */
export interface PaginationParams {
  /** Page number (0-indexed) */
  page: number;
  /** Number of items per page */
  pageSize: number;
  /** Sort field */
  sortBy?: string;
  /** Sort direction */
  sortDirection?: 'asc' | 'desc';
}

/**
 * Paginated response
 */
export interface PaginatedResponse<T> {
  /** Items in the current page */
  items: T[];
  /** Total number of items */
  totalItems: number;
  /** Total number of pages */
  totalPages: number;
  /** Current page number */
  currentPage: number;
  /** Number of items per page */
  pageSize: number;
  /** Whether there's a next page */
  hasNextPage: boolean;
  /** Whether there's a previous page */
  hasPreviousPage: boolean;
}

/**
 * User information
 */
export interface User {
  /** User ID */
  id: string;
  /** Username */
  username: string;
  /** Email address */
  email: string;
  /** Display name */
  displayName?: string;
  /** User roles */
  roles: string[];
  /** User permissions */
  permissions: string[];
  /** Additional user attributes */
  attributes?: Record<string, unknown>;
  /** Profile picture URL */
  avatarUrl?: string;
  /** Whether the user is active */
  isActive: boolean;
  /** Last login timestamp */
  lastLogin?: Date;
}

/**
 * Token payload
 */
export interface TokenPayload {
  /** Subject (user ID) */
  sub: string;
  /** Token issuer */
  iss: string;
  /** Token audience */
  aud: string | string[];
  /** Expiration time */
  exp: number;
  /** Issued at time */
  iat: number;
  /** Not before time */
  nbf?: number;
  /** JWT ID */
  jti?: string;
  /** User roles */
  roles?: string[];
  /** User permissions */
  permissions?: string[];
  /** Additional claims */
  [key: string]: unknown;
}

/**
 * HTTP error response
 */
export interface HttpErrorResponse {
  /** HTTP status code */
  status: number;
  /** Status text */
  statusText: string;
  /** Error message */
  message: string;
  /** Error URL */
  url: string;
  /** Error body */
  error?: unknown;
}

/**
 * Storage item with metadata
 */
export interface StorageItem<T> {
  /** Stored value */
  value: T;
  /** Expiration timestamp */
  expiresAt?: number;
  /** Creation timestamp */
  createdAt: number;
  /** Version for cache invalidation */
  version?: number;
}

/**
 * Notification types
 */
export type NotificationType = 'success' | 'error' | 'warning' | 'info';

/**
 * Notification message
 */
export interface Notification {
  /** Notification ID */
  id: string;
  /** Notification type */
  type: NotificationType;
  /** Notification title */
  title: string;
  /** Notification message */
  message: string;
  /** Auto dismiss duration in ms (0 = manual dismiss) */
  duration?: number;
  /** Whether the notification is dismissible */
  dismissible?: boolean;
  /** Action to perform on click */
  action?: {
    label: string;
    callback: () => void;
  };
}

/**
 * Loading state
 */
export interface LoadingState {
  /** Whether loading is in progress */
  isLoading: boolean;
  /** Loading message */
  message?: string;
  /** Progress percentage (0-100) */
  progress?: number;
}

/**
 * Form field state
 */
export interface FormFieldState {
  /** Field value */
  value: unknown;
  /** Whether the field has been touched */
  touched: boolean;
  /** Whether the field is dirty (modified) */
  dirty: boolean;
  /** Validation errors */
  errors: string[];
  /** Whether the field is valid */
  valid: boolean;
}

/**
 * Breadcrumb item
 */
export interface BreadcrumbItem {
  /** Display label */
  label: string;
  /** Route path */
  path?: string;
  /** Icon name */
  icon?: string;
  /** Whether this is the active item */
  active?: boolean;
}

/**
 * Menu item
 */
export interface MenuItem {
  /** Unique ID */
  id: string;
  /** Display label */
  label: string;
  /** Icon name */
  icon?: string;
  /** Route path */
  path?: string;
  /** External URL */
  url?: string;
  /** Click handler */
  action?: () => void;
  /** Sub-menu items */
  children?: MenuItem[];
  /** Required permissions to see this item */
  permissions?: string[];
  /** Whether the item is disabled */
  disabled?: boolean;
  /** Badge content */
  badge?: string | number;
  /** Divider after this item */
  divider?: boolean;
}
