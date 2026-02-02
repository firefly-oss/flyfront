/**
 * @flyfront/i18n - Locale Service
 * @license Apache-2.0
 */

import { Injectable, inject, signal, computed, LOCALE_ID } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import {
  Language,
  LANGUAGES,
  DateFormatOptions,
  NumberFormatOptions,
} from '../models/i18n.models';

/**
 * Service for managing locale and formatting
 *
 * @example
 * ```typescript
 * // Inject the service
 * private locale = inject(LocaleService);
 *
 * // Get current language
 * currentLang = this.locale.currentLang;
 *
 * // Change language
 * this.locale.setLanguage('es');
 *
 * // Format date
 * formattedDate = this.locale.formatDate(new Date());
 *
 * // Format number
 * formattedPrice = this.locale.formatCurrency(1234.56, 'USD');
 * ```
 */
@Injectable({ providedIn: 'root' })
export class LocaleService {
  private readonly document = inject(DOCUMENT);

  private readonly _currentLang = signal<string>('en');
  private readonly _availableLangs = signal<string[]>(['en']);

  /** Current language code */
  readonly currentLang = this._currentLang.asReadonly();

  /** Available languages */
  readonly availableLangs = this._availableLangs.asReadonly();

  /** Current language info */
  readonly currentLanguage = computed<Language | undefined>(() => LANGUAGES[this._currentLang()]);

  /** Whether current language is RTL */
  readonly isRtl = computed(() => this.currentLanguage()?.direction === 'rtl');

  /** Available languages with info */
  readonly languages = computed(() =>
    this._availableLangs()
      .map((code) => LANGUAGES[code])
      .filter((lang): lang is Language => lang !== undefined)
  );

  constructor() {
    // Initialize from browser settings
    this.initFromBrowser();
  }

  /**
   * Initialize available languages
   */
  init(langs: string[], defaultLang?: string): void {
    this._availableLangs.set(langs);
    if (defaultLang && langs.includes(defaultLang)) {
      this.setLanguage(defaultLang);
    }
  }

  /**
   * Set the current language
   */
  setLanguage(lang: string): void {
    if (!this._availableLangs().includes(lang)) {
      console.warn(`Language "${lang}" is not available`);
      return;
    }

    this._currentLang.set(lang);
    this.updateDocumentLang(lang);
    this.persistLanguage(lang);
  }

  /**
   * Get browser's preferred language
   */
  getBrowserLang(): string | undefined {
    const nav = this.document.defaultView?.navigator;
    if (!nav) return undefined;

    const browserLang = nav.language || (nav as { userLanguage?: string }).userLanguage;
    return browserLang?.split('-')[0];
  }

  /**
   * Format a date according to current locale
   */
  formatDate(date: Date | number | string, options?: DateFormatOptions): string {
    const dateObj = date instanceof Date ? date : new Date(date);
    return new Intl.DateTimeFormat(this._currentLang(), options).format(dateObj);
  }

  /**
   * Format a number according to current locale
   */
  formatNumber(value: number, options?: NumberFormatOptions): string {
    return new Intl.NumberFormat(this._currentLang(), options).format(value);
  }

  /**
   * Format currency
   */
  formatCurrency(
    value: number,
    currency: string = 'USD',
    display: 'symbol' | 'code' | 'name' = 'symbol'
  ): string {
    return new Intl.NumberFormat(this._currentLang(), {
      style: 'currency',
      currency,
      currencyDisplay: display,
    }).format(value);
  }

  /**
   * Format percentage
   */
  formatPercent(value: number, decimals: number = 0): string {
    return new Intl.NumberFormat(this._currentLang(), {
      style: 'percent',
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value);
  }

  /**
   * Format relative time (e.g., "2 days ago")
   */
  formatRelativeTime(
    value: number,
    unit: Intl.RelativeTimeFormatUnit,
    style: 'long' | 'short' | 'narrow' = 'long'
  ): string {
    return new Intl.RelativeTimeFormat(this._currentLang(), { style }).format(value, unit);
  }

  /**
   * Get plural category for a number
   */
  getPluralCategory(count: number): Intl.LDMLPluralRule {
    return new Intl.PluralRules(this._currentLang()).select(count);
  }

  /**
   * Format a list
   */
  formatList(
    items: string[],
    style: 'long' | 'short' | 'narrow' = 'long',
    type: 'conjunction' | 'disjunction' | 'unit' = 'conjunction'
  ): string {
    // Intl.ListFormat may not be available in all environments
    if (typeof (Intl as { ListFormat?: unknown }).ListFormat === 'function') {
      const ListFormatClass = (Intl as unknown as { ListFormat: new (locales?: string, options?: { style?: string; type?: string }) => { format(list: string[]): string } }).ListFormat;
      return new ListFormatClass(this._currentLang(), { style, type }).format(items);
    }
    // Fallback for environments without ListFormat
    if (type === 'disjunction') {
      return items.join(' or ');
    }
    return items.join(', ');
  }

  /**
   * Initialize from browser preferences
   */
  private initFromBrowser(): void {
    const stored = this.getStoredLanguage();
    const browserLang = this.getBrowserLang();
    const lang = stored || browserLang || 'en';

    if (this._availableLangs().includes(lang)) {
      this._currentLang.set(lang);
      this.updateDocumentLang(lang);
    }
  }

  /**
   * Update document lang attribute
   */
  private updateDocumentLang(lang: string): void {
    const html = this.document.documentElement;
    html.setAttribute('lang', lang);

    const langInfo = LANGUAGES[lang];
    if (langInfo) {
      html.setAttribute('dir', langInfo.direction);
    }
  }

  /**
   * Persist language preference
   */
  private persistLanguage(lang: string): void {
    try {
      localStorage.setItem('flyfront_lang', lang);
    } catch {
      // Ignore storage errors
    }
  }

  /**
   * Get stored language preference
   */
  private getStoredLanguage(): string | null {
    try {
      return localStorage.getItem('flyfront_lang');
    } catch {
      return null;
    }
  }
}
