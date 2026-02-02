/**
 * @flyfront/core - Type Guards
 * @license Apache-2.0
 */

import { ApiResponse, ApiError, User, TokenPayload, PaginatedResponse } from '../models/core.models';

/**
 * Check if a value is defined (not null or undefined)
 */
export function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

/**
 * Check if a value is null or undefined
 */
export function isNullOrUndefined(value: unknown): value is null | undefined {
  return value === null || value === undefined;
}

/**
 * Check if a value is a string
 */
export function isString(value: unknown): value is string {
  return typeof value === 'string';
}

/**
 * Check if a value is a non-empty string
 */
export function isNonEmptyString(value: unknown): value is string {
  return isString(value) && value.trim().length > 0;
}

/**
 * Check if a value is a number
 */
export function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !Number.isNaN(value);
}

/**
 * Check if a value is a boolean
 */
export function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean';
}

/**
 * Check if a value is an object (not null, not array)
 */
export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Check if a value is an array
 */
export function isArray<T = unknown>(value: unknown): value is T[] {
  return Array.isArray(value);
}

/**
 * Check if a value is a non-empty array
 */
export function isNonEmptyArray<T = unknown>(value: unknown): value is T[] {
  return isArray(value) && value.length > 0;
}

/**
 * Check if a value is a function
 */
export function isFunction(value: unknown): value is (...args: unknown[]) => unknown {
  return typeof value === 'function';
}

/**
 * Check if a value is a Date
 */
export function isDate(value: unknown): value is Date {
  return value instanceof Date && !Number.isNaN(value.getTime());
}

/**
 * Check if a value is a valid ISO date string
 */
export function isISODateString(value: unknown): value is string {
  if (!isString(value)) return false;
  const date = new Date(value);
  return !Number.isNaN(date.getTime()) && value === date.toISOString();
}

/**
 * Check if a value is a Promise
 */
export function isPromise<T = unknown>(value: unknown): value is Promise<T> {
  return value instanceof Promise || (isObject(value) && isFunction((value as { then?: unknown }).then));
}

/**
 * Check if a value is an Error
 */
export function isError(value: unknown): value is Error {
  return value instanceof Error;
}

/**
 * Check if a value is an API response
 */
export function isApiResponse<T>(value: unknown): value is ApiResponse<T> {
  if (!isObject(value)) return false;
  const obj = value as Record<string, unknown>;
  return 'data' in obj && 'success' in obj && isBoolean(obj['success']);
}

/**
 * Check if a value is an API error
 */
export function isApiError(value: unknown): value is ApiError {
  if (!isObject(value)) return false;
  const obj = value as Record<string, unknown>;
  return 'code' in obj && 'message' in obj && isString(obj['code']) && isString(obj['message']);
}

/**
 * Check if a value is a User
 */
export function isUser(value: unknown): value is User {
  if (!isObject(value)) return false;
  const obj = value as Record<string, unknown>;
  return (
    'id' in obj &&
    'username' in obj &&
    'email' in obj &&
    'roles' in obj &&
    isString(obj['id']) &&
    isString(obj['username']) &&
    isString(obj['email']) &&
    isArray(obj['roles'])
  );
}

/**
 * Check if a value is a TokenPayload
 */
export function isTokenPayload(value: unknown): value is TokenPayload {
  return (
    isObject(value) &&
    'sub' in value &&
    'iss' in value &&
    'exp' in value &&
    'iat' in value &&
    isString((value as TokenPayload).sub) &&
    isString((value as TokenPayload).iss) &&
    isNumber((value as TokenPayload).exp) &&
    isNumber((value as TokenPayload).iat)
  );
}

/**
 * Check if a value is a PaginatedResponse
 */
export function isPaginatedResponse<T>(value: unknown): value is PaginatedResponse<T> {
  if (!isObject(value)) return false;
  const obj = value as Record<string, unknown>;
  return (
    'items' in obj &&
    'totalItems' in obj &&
    'totalPages' in obj &&
    'currentPage' in obj &&
    'pageSize' in obj &&
    isArray(obj['items']) &&
    isNumber(obj['totalItems']) &&
    isNumber(obj['totalPages']) &&
    isNumber(obj['currentPage']) &&
    isNumber(obj['pageSize'])
  );
}

/**
 * Check if a value has a specific property
 */
export function hasProperty<K extends string>(
  value: unknown,
  key: K
): value is Record<K, unknown> {
  return isObject(value) && key in value;
}

/**
 * Check if a value has all specified properties
 */
export function hasProperties<K extends string>(
  value: unknown,
  keys: K[]
): value is Record<K, unknown> {
  return isObject(value) && keys.every((key) => key in value);
}

/**
 * Assert a condition and throw if false
 */
export function assert(condition: boolean, message: string): asserts condition {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

/**
 * Assert a value is defined
 */
export function assertDefined<T>(
  value: T | null | undefined,
  message = 'Value is not defined'
): asserts value is T {
  assert(isDefined(value), message);
}

/**
 * Assert a value is a string
 */
export function assertString(value: unknown, message = 'Value is not a string'): asserts value is string {
  assert(isString(value), message);
}

/**
 * Assert a value is a number
 */
export function assertNumber(value: unknown, message = 'Value is not a number'): asserts value is number {
  assert(isNumber(value), message);
}

/**
 * Narrow unknown to specific type using type guard
 */
export function narrow<T>(value: unknown, guard: (v: unknown) => v is T): T | undefined {
  return guard(value) ? value : undefined;
}

/**
 * Narrow unknown to specific type or throw
 */
export function narrowOrThrow<T>(
  value: unknown,
  guard: (v: unknown) => v is T,
  errorMessage = 'Type guard failed'
): T {
  if (!guard(value)) {
    throw new Error(errorMessage);
  }
  return value;
}
