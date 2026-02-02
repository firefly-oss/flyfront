/**
 * @flyfront/i18n - Locale Pipes
 * @license Apache-2.0
 */

import { Pipe, PipeTransform, inject } from '@angular/core';
import { LocaleService } from '../services/locale.service';
import { DateFormatOptions, NumberFormatOptions } from '../models/i18n.models';

/**
 * Format a date according to current locale
 *
 * @example
 * ```html
 * {{ dateValue | localeDate }}
 * {{ dateValue | localeDate:'short' }}
 * {{ dateValue | localeDate:'long':'short' }}
 * ```
 */
@Pipe({
  name: 'localeDate',
  standalone: true,
  pure: false, // Needs to update when locale changes
})
export class LocaleDatePipe implements PipeTransform {
  private readonly locale = inject(LocaleService);

  transform(
    value: Date | number | string | null | undefined,
    dateStyle?: 'full' | 'long' | 'medium' | 'short',
    timeStyle?: 'full' | 'long' | 'medium' | 'short'
  ): string {
    if (value === null || value === undefined) {
      return '';
    }

    const options: DateFormatOptions = {};
    if (dateStyle) options.dateStyle = dateStyle;
    if (timeStyle) options.timeStyle = timeStyle;

    return this.locale.formatDate(value, options);
  }
}

/**
 * Format a number according to current locale
 *
 * @example
 * ```html
 * {{ numberValue | localeNumber }}
 * {{ numberValue | localeNumber:2:4 }}
 * ```
 */
@Pipe({
  name: 'localeNumber',
  standalone: true,
  pure: false,
})
export class LocaleNumberPipe implements PipeTransform {
  private readonly locale = inject(LocaleService);

  transform(
    value: number | null | undefined,
    minFractionDigits?: number,
    maxFractionDigits?: number
  ): string {
    if (value === null || value === undefined) {
      return '';
    }

    const options: NumberFormatOptions = {};
    if (minFractionDigits !== undefined) options.minimumFractionDigits = minFractionDigits;
    if (maxFractionDigits !== undefined) options.maximumFractionDigits = maxFractionDigits;

    return this.locale.formatNumber(value, options);
  }
}

/**
 * Format currency according to current locale
 *
 * @example
 * ```html
 * {{ price | localeCurrency }}
 * {{ price | localeCurrency:'EUR' }}
 * {{ price | localeCurrency:'USD':'code' }}
 * ```
 */
@Pipe({
  name: 'localeCurrency',
  standalone: true,
  pure: false,
})
export class LocaleCurrencyPipe implements PipeTransform {
  private readonly locale = inject(LocaleService);

  transform(
    value: number | null | undefined,
    currency: string = 'USD',
    display: 'symbol' | 'code' | 'name' = 'symbol'
  ): string {
    if (value === null || value === undefined) {
      return '';
    }

    return this.locale.formatCurrency(value, currency, display);
  }
}

/**
 * Format percentage according to current locale
 *
 * @example
 * ```html
 * {{ ratio | localePercent }}
 * {{ ratio | localePercent:2 }}
 * ```
 */
@Pipe({
  name: 'localePercent',
  standalone: true,
  pure: false,
})
export class LocalePercentPipe implements PipeTransform {
  private readonly locale = inject(LocaleService);

  transform(value: number | null | undefined, decimals: number = 0): string {
    if (value === null || value === undefined) {
      return '';
    }

    return this.locale.formatPercent(value, decimals);
  }
}

/**
 * Format relative time
 *
 * @example
 * ```html
 * {{ -2 | relativeTime:'day' }}
 * {{ 1 | relativeTime:'hour':'short' }}
 * ```
 */
@Pipe({
  name: 'relativeTime',
  standalone: true,
  pure: false,
})
export class RelativeTimePipe implements PipeTransform {
  private readonly locale = inject(LocaleService);

  transform(
    value: number | null | undefined,
    unit: Intl.RelativeTimeFormatUnit,
    style: 'long' | 'short' | 'narrow' = 'long'
  ): string {
    if (value === null || value === undefined) {
      return '';
    }

    return this.locale.formatRelativeTime(value, unit, style);
  }
}

/**
 * All locale pipes for easy import
 */
export const LOCALE_PIPES = [
  LocaleDatePipe,
  LocaleNumberPipe,
  LocaleCurrencyPipe,
  LocalePercentPipe,
  RelativeTimePipe,
] as const;
