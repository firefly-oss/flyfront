# Internationalization Guide

This guide covers adding multi-language support to Flyfront applications using the `@flyfront/i18n` library, which is built on Transloco.

## Table of Contents

- [Overview](#overview)
- [Setup](#setup)
- [Basic Usage](#basic-usage)
- [Translation Files](#translation-files)
- [Dynamic Content](#dynamic-content)
- [Pluralization](#pluralization)
- [Date and Number Formatting](#date-and-number-formatting)
- [Language Switching](#language-switching)
- [Best Practices](#best-practices)

---

## Overview

The `@flyfront/i18n` library provides:

- **Transloco Integration**: Powerful translation library for Angular
- **Lazy Loading**: Load translations on demand
- **Type Safety**: TypeScript support for translation keys
- **Locale Management**: Handle locale-specific formatting
- **HTTP Loading**: Load translations from server or files

### Supported Features

| Feature | Description |
|---------|-------------|
| Static translations | Simple key-value translations |
| Interpolation | Variables in translations |
| Pluralization | Singular/plural forms |
| Nested keys | Organized translation structure |
| Lazy loading | Load per-route translations |
| Locale pipes | Format dates, numbers, currencies |

---

## Setup

Setting up internationalization involves three main steps: configuring the provider, creating translation files, and ensuring they're included in your build.

### Step 1: Configure the i18n Provider

First, add the i18n provider to your application configuration. This tells Angular where to find translations and how to handle them.

Open your `app.config.ts` and add the provider:

```typescript
import { ApplicationConfig } from '@angular/core';
import { provideI18n } from '@flyfront/i18n';

export const appConfig: ApplicationConfig = {
  providers: [
    // ... other providers
    
    provideI18n({
      defaultLang: 'en',
      availableLangs: ['en', 'es', 'fr', 'de'],
      reRenderOnLangChange: true,
      prodMode: environment.production,
      fallbackLang: 'en',
      missingHandler: {
        logMissingKey: !environment.production,
      },
    }),
  ],
};
```

**Configuration options explained:**
- `defaultLang`: The language used when the app loads
- `availableLangs`: List of supported languages (must have translation files)
- `reRenderOnLangChange`: Automatically update UI when language changes
- `fallbackLang`: Language to use when a translation is missing
- `missingHandler.logMissingKey`: Logs missing translations in development

### Step 2: Create Translation Files

Create a folder at `src/assets/i18n/` and add a JSON file for each supported language:

```
src/assets/i18n/
├── en.json
├── es.json
├── fr.json
└── de.json
```

Each file contains key-value pairs where keys are identifiers and values are the translated text. We'll create the content in the next section.

### Step 3: Configure Assets for Build

Ensure the translation files are copied to the output folder during build. Add the `i18n` folder to your assets in `project.json`:

```json
// project.json
{
  "targets": {
    "build": {
      "options": {
        "assets": [
          {
            "glob": "**/*",
            "input": "apps/my-app/src/assets",
            "output": "/assets"
          }
        ]
      }
    }
  }
}
```

---

**Verification**: After setting up, run a build and check that your `i18n` folder appears in `dist/apps/my-app/browser/assets/`.

---

## Basic Usage

There are three ways to translate text in your templates: directives, pipes, and the service. Each has its use case.

### Method 1: Transloco Directive (Recommended for multiple translations)

The structural directive creates a translation function (`t`) that you use throughout the template. This is the most efficient approach when a component has multiple translations:

```typescript
import { Component } from '@angular/core';
import { TranslocoDirective } from '@flyfront/i18n';

@Component({
  selector: 'app-welcome',
  standalone: true,
  imports: [TranslocoDirective],
  template: `
    <div *transloco="let t">
      <h1>{{ t('welcome.title') }}</h1>
      <p>{{ t('welcome.subtitle') }}</p>
      
      <button>{{ t('common.buttons.continue') }}</button>
    </div>
  `,
})
export class WelcomeComponent {}
```

**Why use the directive?** It sets up a single subscription to the translation service, making it more efficient than multiple pipes.

### Method 2: Transloco Pipe (Good for single translations)

For components with only one or two translations, the pipe is simpler:

```typescript
import { Component } from '@angular/core';
import { TranslocoPipe } from '@flyfront/i18n';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [TranslocoPipe],
  template: `
    <header>
      <h1>{{ 'app.title' | transloco }}</h1>
      <nav>
        <a href="/">{{ 'nav.home' | transloco }}</a>
        <a href="/about">{{ 'nav.about' | transloco }}</a>
      </nav>
    </header>
  `,
})
export class HeaderComponent {}
```

### Method 3: Translation Service (For TypeScript code)

When you need translations in your component logic (not the template), inject the `TranslocoService`:

```typescript
import { Component, inject } from '@angular/core';
import { TranslocoService, translate } from '@flyfront/i18n';

@Component({...})
export class NotificationComponent {
  private transloco = inject(TranslocoService);
  
  showSuccess(): void {
    // Using the service
    const message = this.transloco.translate('notifications.success');
    this.notificationService.show(message);
  }
  
  showError(error: string): void {
    // Using the function (requires active language)
    const message = translate('notifications.error', { error });
    this.notificationService.show(message);
  }
}
```

---

## Translation Files

### Basic Structure

```json
// en.json
{
  "app": {
    "title": "My Application",
    "description": "Welcome to our application"
  },
  "nav": {
    "home": "Home",
    "about": "About",
    "contact": "Contact",
    "settings": "Settings"
  },
  "common": {
    "buttons": {
      "save": "Save",
      "cancel": "Cancel",
      "delete": "Delete",
      "edit": "Edit",
      "submit": "Submit"
    },
    "labels": {
      "name": "Name",
      "email": "Email",
      "password": "Password"
    },
    "messages": {
      "loading": "Loading...",
      "error": "An error occurred",
      "success": "Operation successful"
    }
  },
  "auth": {
    "login": {
      "title": "Sign In",
      "subtitle": "Enter your credentials",
      "button": "Sign In",
      "forgotPassword": "Forgot password?"
    },
    "logout": "Sign Out"
  }
}
```

### Spanish Translation

```json
// es.json
{
  "app": {
    "title": "Mi Aplicación",
    "description": "Bienvenido a nuestra aplicación"
  },
  "nav": {
    "home": "Inicio",
    "about": "Acerca de",
    "contact": "Contacto",
    "settings": "Configuración"
  },
  "common": {
    "buttons": {
      "save": "Guardar",
      "cancel": "Cancelar",
      "delete": "Eliminar",
      "edit": "Editar",
      "submit": "Enviar"
    },
    "labels": {
      "name": "Nombre",
      "email": "Correo electrónico",
      "password": "Contraseña"
    },
    "messages": {
      "loading": "Cargando...",
      "error": "Ocurrió un error",
      "success": "Operación exitosa"
    }
  },
  "auth": {
    "login": {
      "title": "Iniciar Sesión",
      "subtitle": "Ingrese sus credenciales",
      "button": "Iniciar Sesión",
      "forgotPassword": "¿Olvidó su contraseña?"
    },
    "logout": "Cerrar Sesión"
  }
}
```

---

## Dynamic Content

### Interpolation

Pass variables to translations:

```json
// en.json
{
  "greeting": "Hello, {{ name }}!",
  "items": "You have {{ count }} items in your cart",
  "welcome": "Welcome back, {{ user.firstName }} {{ user.lastName }}"
}
```

```typescript
@Component({
  template: `
    <div *transloco="let t">
      <p>{{ t('greeting', { name: userName() }) }}</p>
      <p>{{ t('items', { count: itemCount() }) }}</p>
      <p>{{ t('welcome', { user: currentUser() }) }}</p>
    </div>
  `,
})
export class GreetingComponent {
  userName = signal('Alice');
  itemCount = signal(5);
  currentUser = signal({ firstName: 'John', lastName: 'Doe' });
}
```

### HTML Content

For translations with HTML:

```json
// en.json
{
  "terms": "By continuing, you agree to our <a href='/terms'>Terms of Service</a>",
  "highlight": "This is <strong>important</strong> information"
}
```

```typescript
@Component({
  template: `
    <p [innerHTML]="'terms' | transloco"></p>
    <p [innerHTML]="'highlight' | transloco"></p>
  `,
})
export class TermsComponent {}
```

---

## Pluralization

### ICU Message Format

Use ICU message format for pluralization:

```json
// en.json
{
  "items": "{count, plural, =0 {No items} one {1 item} other {# items}}",
  "messages": "{count, plural, =0 {No new messages} one {1 new message} other {# new messages}}",
  "days": "{count, plural, =0 {Today} one {1 day ago} other {# days ago}}"
}
```

```typescript
@Component({
  template: `
    <div *transloco="let t">
      <p>{{ t('items', { count: 0 }) }}</p>  <!-- "No items" -->
      <p>{{ t('items', { count: 1 }) }}</p>  <!-- "1 item" -->
      <p>{{ t('items', { count: 5 }) }}</p>  <!-- "5 items" -->
    </div>
  `,
})
export class ItemCountComponent {}
```

### Select Format

For gender or other selections:

```json
// en.json
{
  "invitation": "{gender, select, male {He invited you} female {She invited you} other {They invited you}}"
}
```

---

## Date and Number Formatting

### Using Locale Pipes

The `@flyfront/i18n` library provides locale-aware pipes:

```typescript
import { Component } from '@angular/core';
import { LocaleDatePipe, LocaleNumberPipe, LocaleCurrencyPipe } from '@flyfront/i18n';

@Component({
  selector: 'app-formatted-data',
  standalone: true,
  imports: [LocaleDatePipe, LocaleNumberPipe, LocaleCurrencyPipe],
  template: `
    <p>Date: {{ today | localeDate:'long' }}</p>
    <p>Number: {{ largeNumber | localeNumber }}</p>
    <p>Currency: {{ price | localeCurrency:'USD' }}</p>
  `,
})
export class FormattedDataComponent {
  today = new Date();
  largeNumber = 1234567.89;
  price = 99.99;
}
```

### Locale-Specific Formatting

Different locales format differently:

| Locale | Date | Number | Currency |
|--------|------|--------|----------|
| en-US | Dec 25, 2024 | 1,234.56 | $99.99 |
| de-DE | 25. Dez. 2024 | 1.234,56 | 99,99 € |
| fr-FR | 25 déc. 2024 | 1 234,56 | 99,99 € |
| es-ES | 25 dic 2024 | 1.234,56 | 99,99 € |

---

## Language Switching

### Language Switcher Component

```typescript
import { Component, inject } from '@angular/core';
import { TranslocoService } from '@flyfront/i18n';
import { SelectComponent } from '@flyfront/ui';

interface Language {
  code: string;
  name: string;
  flag: string;
}

@Component({
  selector: 'app-language-switcher',
  standalone: true,
  imports: [SelectComponent],
  template: `
    <fly-select
      [value]="currentLang()"
      [options]="languages"
      labelKey="name"
      valueKey="code"
      (valueChange)="switchLanguage($event)"
    />
  `,
})
export class LanguageSwitcherComponent {
  private transloco = inject(TranslocoService);
  
  languages: Language[] = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  ];
  
  currentLang = signal(this.transloco.getActiveLang());
  
  switchLanguage(langCode: string): void {
    this.transloco.setActiveLang(langCode);
    this.currentLang.set(langCode);
    
    // Optionally persist preference
    localStorage.setItem('preferredLanguage', langCode);
  }
}
```

### Persisting Language Preference

```typescript
// In app.config.ts or a service
function getInitialLanguage(): string {
  // Check URL parameter
  const urlLang = new URLSearchParams(window.location.search).get('lang');
  if (urlLang && ['en', 'es', 'fr', 'de'].includes(urlLang)) {
    return urlLang;
  }
  
  // Check localStorage
  const savedLang = localStorage.getItem('preferredLanguage');
  if (savedLang) {
    return savedLang;
  }
  
  // Check browser language
  const browserLang = navigator.language.split('-')[0];
  if (['en', 'es', 'fr', 'de'].includes(browserLang)) {
    return browserLang;
  }
  
  return 'en';
}

// Use in provider
provideI18n({
  defaultLang: getInitialLanguage(),
  // ...
});
```

---

## Best Practices

### 1. Organize Translation Keys

```json
// Good: Organized by feature
{
  "dashboard": {
    "title": "Dashboard",
    "widgets": { ... }
  },
  "users": {
    "list": { ... },
    "form": { ... }
  },
  "common": {
    "buttons": { ... },
    "validation": { ... }
  }
}

// Bad: Flat structure
{
  "dashboardTitle": "Dashboard",
  "userListTitle": "Users",
  "saveButton": "Save"
}
```

### 2. Use Meaningful Key Names

```json
// Good: Descriptive keys
{
  "auth.login.emailLabel": "Email Address",
  "auth.login.passwordLabel": "Password",
  "auth.login.submitButton": "Sign In"
}

// Bad: Generic keys
{
  "label1": "Email Address",
  "label2": "Password",
  "btn1": "Sign In"
}
```

### 3. Keep Translations Synchronized

Create a script to check for missing keys:

```typescript
// tools/check-translations.ts
import en from '../src/assets/i18n/en.json';
import es from '../src/assets/i18n/es.json';

function getKeys(obj: object, prefix = ''): string[] {
  return Object.entries(obj).flatMap(([key, value]) => {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    return typeof value === 'object' && value !== null
      ? getKeys(value, fullKey)
      : [fullKey];
  });
}

const enKeys = new Set(getKeys(en));
const esKeys = new Set(getKeys(es));

const missingInEs = [...enKeys].filter(k => !esKeys.has(k));
const extraInEs = [...esKeys].filter(k => !enKeys.has(k));

if (missingInEs.length > 0) {
  console.log('Missing in es.json:', missingInEs);
}
if (extraInEs.length > 0) {
  console.log('Extra in es.json:', extraInEs);
}
```

### 4. Avoid String Concatenation

```typescript
// Good: Complete sentence in translation
// en.json: { "greeting": "Hello, {{ name }}! Welcome back." }
{{ t('greeting', { name: userName }) }}

// Bad: Concatenating translations
{{ t('hello') }}, {{ userName }}! {{ t('welcomeBack') }}
```

### 5. Handle Missing Translations

```typescript
provideI18n({
  missingHandler: {
    useFallbackTranslation: true,
    logMissingKey: true,
  },
  fallbackLang: 'en',
});
```

---

## Related Documentation

- [Getting Started Guide](getting-started.md)
- [API Reference: @flyfront/i18n](../api/i18n.md)
- [Design System Guide](design-system.md)
