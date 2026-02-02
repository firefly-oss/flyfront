/**
 * @flyfront/core - Logger Service
 * @license Apache-2.0
 */

import { Injectable, inject } from '@angular/core';
import { ConfigService } from './config.service';
import { LogLevel, LogEntry, LoggingConfig } from '../models/core.models';

/**
 * Log level priority (higher = more severe)
 */
const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  off: 4,
};

/**
 * Console styling for different log levels
 */
const LOG_STYLES: Record<LogLevel, string> = {
  debug: 'color: #9e9e9e; font-weight: normal;',
  info: 'color: #2196f3; font-weight: normal;',
  warn: 'color: #ff9800; font-weight: bold;',
  error: 'color: #f44336; font-weight: bold;',
  off: '',
};

/**
 * Logger service for structured, configurable logging
 *
 * @example
 * ```typescript
 * const logger = inject(LoggerService);
 *
 * logger.debug('Debug message', { data: 'value' });
 * logger.info('User logged in', { userId: '123' });
 * logger.warn('Deprecated API used');
 * logger.error('Failed to fetch data', error);
 * ```
 */
@Injectable({
  providedIn: 'root',
})
export class LoggerService {
  private readonly config = inject(ConfigService);
  private readonly logBuffer: LogEntry[] = [];
  private readonly maxBufferSize = 100;

  /**
   * Log a debug message
   * @param message - Log message
   * @param context - Additional context
   */
  debug(message: string, context?: Record<string, unknown>): void {
    this.log('debug', message, context);
  }

  /**
   * Log an info message
   * @param message - Log message
   * @param context - Additional context
   */
  info(message: string, context?: Record<string, unknown>): void {
    this.log('info', message, context);
  }

  /**
   * Log a warning message
   * @param message - Log message
   * @param context - Additional context
   */
  warn(message: string, context?: Record<string, unknown>): void {
    this.log('warn', message, context);
  }

  /**
   * Log an error message
   * @param message - Log message
   * @param error - Error object
   * @param context - Additional context
   */
  error(message: string, error?: Error | unknown, context?: Record<string, unknown>): void {
    const errorObj = error instanceof Error ? error : undefined;
    const stackTrace = errorObj?.stack;

    this.log('error', message, {
      ...context,
      error: errorObj
        ? {
            name: errorObj.name,
            message: errorObj.message,
          }
        : error,
      stackTrace,
    });
  }

  /**
   * Create a child logger with a prefix
   * @param prefix - Prefix for all log messages
   * @returns Child logger function object
   */
  createChild(prefix: string): ChildLogger {
    return {
      debug: (message: string, context?: Record<string, unknown>) =>
        this.debug(`[${prefix}] ${message}`, context),
      info: (message: string, context?: Record<string, unknown>) =>
        this.info(`[${prefix}] ${message}`, context),
      warn: (message: string, context?: Record<string, unknown>) =>
        this.warn(`[${prefix}] ${message}`, context),
      error: (message: string, error?: Error | unknown, context?: Record<string, unknown>) =>
        this.error(`[${prefix}] ${message}`, error, context),
    };
  }

  /**
   * Get recent log entries from the buffer
   * @param count - Number of entries to retrieve
   * @returns Array of log entries
   */
  getRecentLogs(count?: number): LogEntry[] {
    const entries = [...this.logBuffer];
    return count ? entries.slice(-count) : entries;
  }

  /**
   * Clear the log buffer
   */
  clearBuffer(): void {
    this.logBuffer.length = 0;
  }

  /**
   * Check if a log level is enabled
   * @param level - Log level to check
   * @returns Whether the level is enabled
   */
  isLevelEnabled(level: LogLevel): boolean {
    const loggingConfig = this.config.get('logging');
    return LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[loggingConfig.level];
  }

  /**
   * Core logging method
   */
  private log(level: LogLevel, message: string, context?: Record<string, unknown>): void {
    const loggingConfig = this.config.get('logging');

    if (!this.isLevelEnabled(level)) {
      return;
    }

    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date(),
      context,
      error: context?.['error'] as Error | undefined,
      stackTrace: context?.['stackTrace'] as string | undefined,
    };

    // Add to buffer
    this.addToBuffer(entry);

    // Console logging
    if (loggingConfig.console) {
      this.logToConsole(entry, loggingConfig);
    }

    // Remote logging
    if (loggingConfig.remote && loggingConfig.remoteEndpoint) {
      this.logToRemote(entry, loggingConfig.remoteEndpoint);
    }
  }

  /**
   * Add entry to the log buffer
   */
  private addToBuffer(entry: LogEntry): void {
    this.logBuffer.push(entry);

    // Trim buffer if it exceeds max size
    if (this.logBuffer.length > this.maxBufferSize) {
      this.logBuffer.shift();
    }
  }

  /**
   * Log to the browser console
   */
  private logToConsole(entry: LogEntry, config: LoggingConfig): void {
    const timestamp = config.timestamps ? `[${entry.timestamp.toISOString()}] ` : '';
    const prefix = `%c[${entry.level.toUpperCase()}]${timestamp}`;
    const style = LOG_STYLES[entry.level];

    const consoleMethod = entry.level === 'error' ? 'error' : entry.level === 'warn' ? 'warn' : 'log';

    if (entry.context && Object.keys(entry.context).length > 0) {
      console[consoleMethod](prefix, style, entry.message, entry.context);
    } else {
      console[consoleMethod](prefix, style, entry.message);
    }

    if (entry.stackTrace && config.stackTraces) {
      console[consoleMethod]('%cStack trace:', 'color: #9e9e9e;', entry.stackTrace);
    }
  }

  /**
   * Log to a remote endpoint
   */
  private async logToRemote(entry: LogEntry, endpoint: string): Promise<void> {
    try {
      await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...entry,
          timestamp: entry.timestamp.toISOString(),
          appName: this.config.get('appName'),
          version: this.config.get('version'),
          environment: this.config.get('environment'),
        }),
      });
    } catch {
      // Silently fail for remote logging errors to avoid infinite loops
      console.warn('Failed to send log to remote endpoint');
    }
  }
}

/**
 * Child logger interface
 */
export interface ChildLogger {
  debug: (message: string, context?: Record<string, unknown>) => void;
  info: (message: string, context?: Record<string, unknown>) => void;
  warn: (message: string, context?: Record<string, unknown>) => void;
  error: (message: string, error?: Error | unknown, context?: Record<string, unknown>) => void;
}
