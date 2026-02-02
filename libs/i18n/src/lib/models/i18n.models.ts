/**
 * @flyfront/i18n - Models and Types
 * @license Apache-2.0
 */

/**
 * Supported locales
 */
export type Locale = string;

/**
 * Translation value (string or nested object)
 */
export type TranslationValue = string | { [key: string]: TranslationValue };

/**
 * Translation dictionary
 */
export type TranslationDictionary = Record<string, TranslationValue>;

/**
 * I18n configuration
 */
export interface I18nConfig {
  /** Default language */
  defaultLang: string;
  /** Available languages */
  availableLangs: string[];
  /** Fallback language when translation is missing */
  fallbackLang?: string;
  /** Production mode (disables missing translation warnings) */
  prodMode?: boolean;
  /** Reload translations on language change */
  reRenderOnLangChange?: boolean;
  /** Custom translations loader URL */
  loaderUrl?: string;
}

/**
 * Language definition
 */
export interface Language {
  code: string;
  name: string;
  nativeName: string;
  direction: 'ltr' | 'rtl';
}

/**
 * Common languages
 */
export const LANGUAGES: Record<string, Language> = {
  en: { code: 'en', name: 'English', nativeName: 'English', direction: 'ltr' },
  es: { code: 'es', name: 'Spanish', nativeName: 'Español', direction: 'ltr' },
  fr: { code: 'fr', name: 'French', nativeName: 'Français', direction: 'ltr' },
  de: { code: 'de', name: 'German', nativeName: 'Deutsch', direction: 'ltr' },
  it: { code: 'it', name: 'Italian', nativeName: 'Italiano', direction: 'ltr' },
  pt: { code: 'pt', name: 'Portuguese', nativeName: 'Português', direction: 'ltr' },
  nl: { code: 'nl', name: 'Dutch', nativeName: 'Nederlands', direction: 'ltr' },
  pl: { code: 'pl', name: 'Polish', nativeName: 'Polski', direction: 'ltr' },
  ru: { code: 'ru', name: 'Russian', nativeName: 'Русский', direction: 'ltr' },
  zh: { code: 'zh', name: 'Chinese', nativeName: '中文', direction: 'ltr' },
  ja: { code: 'ja', name: 'Japanese', nativeName: '日本語', direction: 'ltr' },
  ko: { code: 'ko', name: 'Korean', nativeName: '한국어', direction: 'ltr' },
  ar: { code: 'ar', name: 'Arabic', nativeName: 'العربية', direction: 'rtl' },
  he: { code: 'he', name: 'Hebrew', nativeName: 'עברית', direction: 'rtl' },
};

/**
 * Date format options
 */
export interface DateFormatOptions {
  dateStyle?: 'full' | 'long' | 'medium' | 'short';
  timeStyle?: 'full' | 'long' | 'medium' | 'short';
  weekday?: 'long' | 'short' | 'narrow';
  year?: 'numeric' | '2-digit';
  month?: 'numeric' | '2-digit' | 'long' | 'short' | 'narrow';
  day?: 'numeric' | '2-digit';
  hour?: 'numeric' | '2-digit';
  minute?: 'numeric' | '2-digit';
  second?: 'numeric' | '2-digit';
  timeZone?: string;
}

/**
 * Number format options
 */
export interface NumberFormatOptions {
  style?: 'decimal' | 'currency' | 'percent' | 'unit';
  currency?: string;
  currencyDisplay?: 'symbol' | 'narrowSymbol' | 'code' | 'name';
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
  minimumIntegerDigits?: number;
  useGrouping?: boolean;
}

/**
 * Plural rules category
 */
export type PluralCategory = 'zero' | 'one' | 'two' | 'few' | 'many' | 'other';

/**
 * Translation parameters
 */
export type TranslationParams = Record<string, string | number | boolean>;
