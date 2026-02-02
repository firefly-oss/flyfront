/**
 * @flyfront/state - State Providers
 * @license Apache-2.0
 */

import { EnvironmentProviders, makeEnvironmentProviders, Type } from '@angular/core';
import { provideStore, provideState, ActionReducerMap } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';

/**
 * Configuration for state providers
 */
export interface StateConfig {
  /** Enable Redux DevTools */
  devTools?: boolean;
  /** Enable strict mode for immutability and serializability checks */
  strictMode?: boolean;
  /** Root reducers to register */
  reducers?: ActionReducerMap<Record<string, unknown>>;
  /** Root effects to register */
  effects?: Type<unknown>[];
}

/**
 * Provide NgRx store configuration for the application
 *
 * @example
 * ```typescript
 * // In app.config.ts
 * export const appConfig: ApplicationConfig = {
 *   providers: [
 *     provideAppState({
 *       devTools: !environment.production,
 *       strictMode: !environment.production,
 *     }),
 *   ],
 * };
 * ```
 */
export function provideAppState(config: StateConfig = {}): EnvironmentProviders {
  const { devTools = true, strictMode = true, reducers = {}, effects = [] } = config;

  return makeEnvironmentProviders([
    provideStore(reducers, {
      runtimeChecks: strictMode
        ? {
            strictStateImmutability: true,
            strictActionImmutability: true,
            strictStateSerializability: true,
            strictActionSerializability: true,
            strictActionWithinNgZone: true,
            strictActionTypeUniqueness: true,
          }
        : undefined,
    }),
    provideEffects(effects),
  ]);
}

/**
 * Provide a feature state
 *
 * @example
 * ```typescript
 * // In feature routes
 * export const routes: Routes = [
 *   {
 *     path: '',
 *     providers: [
 *       provideFeatureState(usersFeature),
 *       provideFeatureEffects(UsersEffects),
 *     ],
 *     component: UsersComponent,
 *   },
 * ];
 * ```
 */
export function provideFeatureState<T extends { name: string; reducer: unknown }>(
  feature: T
): EnvironmentProviders {
  return makeEnvironmentProviders([
    provideState({ name: feature.name, reducer: feature.reducer as never }),
  ]);
}

/**
 * Provide feature effects
 */
export function provideFeatureEffects(...effects: Type<unknown>[]): EnvironmentProviders {
  return makeEnvironmentProviders([provideEffects(effects)]);
}
