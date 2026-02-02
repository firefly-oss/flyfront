/**
 * @flyfront/i18n - Internationalization Library
 * @license Apache-2.0
 */

// Models
export * from './lib/models/i18n.models';

// Services
export * from './lib/services/locale.service';

// Providers
export * from './lib/providers/i18n.providers';

// Loaders
export * from './lib/loaders/transloco-http.loader';

// Pipes
export * from './lib/pipes/locale.pipes';

// Re-export Transloco essentials
export {
  TranslocoModule,
  TranslocoDirective,
  TranslocoPipe,
  TranslocoService,
  translate,
  translateObject,
} from '@jsverse/transloco';
