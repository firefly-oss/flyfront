/**
 * @flyfront/i18n - Transloco HTTP Loader
 * @license Apache-2.0
 */

import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Translation, TranslocoLoader } from '@jsverse/transloco';
import { Observable } from 'rxjs';

/**
 * HTTP loader for Transloco translations
 *
 * Loads translation files from assets/i18n/{lang}.json
 */
@Injectable({ providedIn: 'root' })
export class TranslocoHttpLoader implements TranslocoLoader {
  private readonly http = inject(HttpClient);

  getTranslation(lang: string): Observable<Translation> {
    return this.http.get<Translation>(`/assets/i18n/${lang}.json`);
  }
}

/**
 * Create a custom loader with a different base path
 */
export function createTranslocoLoader(basePath: string = '/assets/i18n') {
  @Injectable()
  class CustomTranslocoLoader implements TranslocoLoader {
    readonly http = inject(HttpClient);

    getTranslation(lang: string): Observable<Translation> {
      const path = basePath.endsWith('/') ? basePath : `${basePath}/`;
      return this.http.get<Translation>(`${path}${lang}.json`);
    }
  }
  return CustomTranslocoLoader;
}
