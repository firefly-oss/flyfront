/**
 * @flyfront/i18n - Providers
 * @license Apache-2.0
 */

import {
  EnvironmentProviders,
  makeEnvironmentProviders,
  LOCALE_ID,
  APP_INITIALIZER,
  inject,
} from '@angular/core';
import { provideTransloco, TranslocoModule } from '@jsverse/transloco';
import { I18nConfig } from '../models/i18n.models';
import { LocaleService } from '../services/locale.service';
import { TranslocoHttpLoader } from '../loaders/transloco-http.loader';

/**
 * Provide internationalization configuration
 *
 * @example
 * ```typescript
 * // In app.config.ts
 * export const appConfig: ApplicationConfig = {
 *   providers: [
 *     provideI18n({
 *       defaultLang: 'en',
 *       availableLangs: ['en', 'es', 'de', 'fr'],
 *       fallbackLang: 'en',
 *       prodMode: environment.production,
 *     }),
 *   ],
 * };
 * ```
 */
export function provideI18n(config: I18nConfig): EnvironmentProviders {
  const {
    defaultLang,
    availableLangs,
    fallbackLang = defaultLang,
    prodMode = false,
    reRenderOnLangChange = true,
  } = config;

  return makeEnvironmentProviders([
    provideTransloco({
      config: {
        availableLangs,
        defaultLang,
        fallbackLang,
        reRenderOnLangChange,
        prodMode,
        missingHandler: {
          useFallbackTranslation: true,
          logMissingKey: !prodMode,
        },
      },
      loader: TranslocoHttpLoader,
    }),
    {
      provide: APP_INITIALIZER,
      useFactory: () => {
        const localeService = inject(LocaleService);
        return () => {
          localeService.init(availableLangs, defaultLang);
        };
      },
      multi: true,
    },
    {
      provide: LOCALE_ID,
      useFactory: () => {
        const localeService = inject(LocaleService);
        return localeService.currentLang();
      },
    },
  ]);
}
