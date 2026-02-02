/**
 * @flyfront/core - Configuration Service
 * @license Apache-2.0
 */

import { Injectable, InjectionToken, inject } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { AppConfig, Environment, LogLevel } from '../models/core.models';

/**
 * Injection token for initial application configuration
 */
export const APP_CONFIG = new InjectionToken<Partial<AppConfig>>('APP_CONFIG');

/**
 * Default application configuration
 */
const DEFAULT_CONFIG: AppConfig = {
  appName: 'Flyfront App',
  version: '1.0.0',
  environment: 'development',
  apiBaseUrl: '/api',
  auth: {
    provider: 'oidc',
    tokenStorage: 'localStorage',
    autoRefresh: true,
    refreshThreshold: 60,
    scopes: ['openid', 'profile', 'email'],
  },
  features: {},
  logging: {
    level: 'info',
    console: true,
    timestamps: true,
    stackTraces: true,
  },
};

/**
 * Configuration service for managing application-wide settings
 *
 * @example
 * ```typescript
 * // In your app.config.ts
 * export const appConfig: ApplicationConfig = {
 *   providers: [
 *     provideConfig({
 *       appName: 'My App',
 *       apiBaseUrl: 'https://api.example.com',
 *     }),
 *   ],
 * };
 *
 * // In a component or service
 * const config = inject(ConfigService);
 * console.log(config.get('apiBaseUrl'));
 * ```
 */
@Injectable({
  providedIn: 'root',
})
export class ConfigService {
  private readonly config$ = new BehaviorSubject<AppConfig>(DEFAULT_CONFIG);
  private readonly initialConfig = inject(APP_CONFIG, { optional: true });

  constructor() {
    if (this.initialConfig) {
      this.setConfig(this.initialConfig);
    }
  }

  /**
   * Get the current configuration as an observable
   */
  get config(): Observable<AppConfig> {
    return this.config$.asObservable();
  }

  /**
   * Get the current configuration snapshot
   */
  get snapshot(): AppConfig {
    return this.config$.getValue();
  }

  /**
   * Get a specific configuration value
   * @param key - Configuration key
   * @returns The configuration value
   */
  get<K extends keyof AppConfig>(key: K): AppConfig[K] {
    return this.config$.getValue()[key];
  }

  /**
   * Set configuration values (merges with existing config)
   * @param config - Partial configuration to merge
   */
  setConfig(config: Partial<AppConfig>): void {
    const current = this.config$.getValue();
    const merged = this.deepMergeConfig(current, config);
    this.config$.next(merged);
  }

  /**
   * Check if the application is in development mode
   */
  get isDevelopment(): boolean {
    return this.get('environment') === 'development';
  }

  /**
   * Check if the application is in production mode
   */
  get isProduction(): boolean {
    return this.get('environment') === 'production';
  }

  /**
   * Check if a feature flag is enabled
   * @param featureName - Name of the feature
   * @returns Whether the feature is enabled
   */
  isFeatureEnabled(featureName: string): boolean {
    const features = this.get('features');
    return features[featureName] === true;
  }

  /**
   * Enable a feature flag
   * @param featureName - Name of the feature to enable
   */
  enableFeature(featureName: string): void {
    const features = { ...this.get('features'), [featureName]: true };
    this.setConfig({ features });
  }

  /**
   * Disable a feature flag
   * @param featureName - Name of the feature to disable
   */
  disableFeature(featureName: string): void {
    const features = { ...this.get('features'), [featureName]: false };
    this.setConfig({ features });
  }

  /**
   * Get the API URL for a given path
   * @param path - API path (without leading slash)
   * @returns Full API URL
   */
  getApiUrl(path: string): string {
    const baseUrl = this.get('apiBaseUrl').replace(/\/$/, '');
    const cleanPath = path.replace(/^\//, '');
    return `${baseUrl}/${cleanPath}`;
  }

  /**
   * Get a custom configuration value
   * @param key - Custom configuration key
   * @returns The custom configuration value
   */
  getCustom<T>(key: string): T | undefined {
    const custom = this.get('custom');
    return custom?.[key] as T | undefined;
  }

  /**
   * Set a custom configuration value
   * @param key - Custom configuration key
   * @param value - Value to set
   */
  setCustom<T>(key: string, value: T): void {
    const custom = { ...this.get('custom'), [key]: value };
    this.setConfig({ custom });
  }

  /**
   * Deep merge configuration objects
   */
  private deepMergeConfig(target: AppConfig, source: Partial<AppConfig>): AppConfig {
    const result = { ...target };

    for (const key of Object.keys(source) as Array<keyof AppConfig>) {
      const sourceValue = source[key];
      const targetValue = result[key];

      if (
        sourceValue !== null &&
        sourceValue !== undefined &&
        typeof sourceValue === 'object' &&
        !Array.isArray(sourceValue) &&
        targetValue !== null &&
        targetValue !== undefined &&
        typeof targetValue === 'object' &&
        !Array.isArray(targetValue)
      ) {
        // Deep merge nested objects
        (result as Record<string, unknown>)[key] = {
          ...(targetValue as Record<string, unknown>),
          ...(sourceValue as Record<string, unknown>),
        };
      } else if (sourceValue !== undefined) {
        (result as Record<string, unknown>)[key] = sourceValue;
      }
    }

    return result;
  }
}

/**
 * Provider function for application configuration
 * @param config - Application configuration
 * @returns Provider array
 */
export function provideConfig(config: Partial<AppConfig>) {
  return [
    {
      provide: APP_CONFIG,
      useValue: config,
    },
  ];
}
