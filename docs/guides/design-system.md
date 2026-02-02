#  Design System Guide

This guide covers Flyfront's design system, including design tokens, UI components, and styling best practices.

## Table of Contents

- [Overview](#overview)
- [Design Tokens](#design-tokens)
- [Using Components](#using-components)
- [Styling with TailwindCSS](#styling-with-tailwindcss)
- [Theming](#theming)
- [Accessibility](#accessibility)
- [Best Practices](#best-practices)

---

## Overview

Flyfront's design system provides:

- **Design Tokens**: Consistent values for colors, typography, spacing, and more
- **UI Components**: Pre-built, accessible Angular components
- **TailwindCSS Integration**: Utility-first styling with custom configuration
- **Theming Support**: Light/dark mode and custom themes

### Philosophy

1. **Consistency**: Same visual language across all Firefly applications
2. **Accessibility**: WCAG 2.1 AA compliant components
3. **Flexibility**: Customizable via design tokens and TailwindCSS
4. **Performance**: Tree-shakeable components, optimized CSS

---

## Design Tokens

Design tokens are the foundation of our design system. They define the visual properties used throughout the application.

### Colors

#### Primary Palette

The primary color is used for primary actions, links, and focus states.

| Token | Value | Usage |
|-------|-------|-------|
| `primary-50` | `#eff6ff` | Backgrounds |
| `primary-100` | `#dbeafe` | Hover backgrounds |
| `primary-500` | `#3b82f6` | Default state |
| `primary-600` | `#2563eb` | Hover state |
| `primary-700` | `#1d4ed8` | Active state |

```html
<!-- Using primary colors -->
<button class="bg-primary-500 hover:bg-primary-600 text-white">
  Primary Button
</button>
```

#### Semantic Colors

| Category | Usage | Example Token |
|----------|-------|---------------|
| **Success** | Confirmations, positive actions | `success-500` |
| **Warning** | Cautions, attention needed | `warning-500` |
| **Error** | Errors, destructive actions | `error-500` |
| **Info** | Informational messages | `info-500` |

```html
<!-- Semantic color usage -->
<div class="bg-success-50 border border-success-200 text-success-800">
  Operation completed successfully!
</div>

<div class="bg-error-50 border border-error-200 text-error-800">
  An error occurred. Please try again.
</div>
```

#### Firefly Brand Color

The Firefly brand color (amber/orange) is used for branding and highlights.

```html
<span class="text-firefly-500">Firefly</span>
```

### Typography

#### Font Families

| Token | Font | Usage |
|-------|------|-------|
| `font-sans` | Inter | Body text, UI elements |
| `font-mono` | JetBrains Mono | Code, technical content |

#### Font Sizes

| Token | Size | Line Height | Usage |
|-------|------|-------------|-------|
| `text-xs` | 12px | 16px | Captions, labels |
| `text-sm` | 14px | 20px | Secondary text |
| `text-base` | 16px | 24px | Body text |
| `text-lg` | 18px | 28px | Large body |
| `text-xl` | 20px | 28px | Subheadings |
| `text-2xl` | 24px | 32px | Headings |
| `text-3xl` | 30px | 36px | Large headings |

```html
<h1 class="text-3xl font-bold text-gray-900">Page Title</h1>
<p class="text-base text-gray-600">Body text content.</p>
<span class="text-sm text-gray-500">Secondary information</span>
```

### Spacing

Based on a 4px base unit:

| Token | Value | Pixels |
|-------|-------|--------|
| `space-1` | 0.25rem | 4px |
| `space-2` | 0.5rem | 8px |
| `space-3` | 0.75rem | 12px |
| `space-4` | 1rem | 16px |
| `space-6` | 1.5rem | 24px |
| `space-8` | 2rem | 32px |
| `space-12` | 3rem | 48px |
| `space-16` | 4rem | 64px |

```html
<!-- Spacing examples -->
<div class="p-4 mb-6">
  <h2 class="mb-2">Title</h2>
  <p class="mb-4">Content</p>
</div>
```

### Shadows

| Token | Usage |
|-------|-------|
| `shadow-sm` | Subtle elevation |
| `shadow` | Default cards |
| `shadow-md` | Hover states |
| `shadow-lg` | Modals, dropdowns |
| `shadow-xl` | Dialogs |

```html
<div class="shadow hover:shadow-md transition-shadow">
  Card content
</div>
```

### Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `rounded-sm` | 2px | Subtle rounding |
| `rounded` | 4px | Default |
| `rounded-md` | 6px | Buttons, inputs |
| `rounded-lg` | 8px | Cards |
| `rounded-xl` | 12px | Large cards |
| `rounded-full` | 9999px | Pills, avatars |

---

## Using Components

### Importing Components

Components are imported from `@flyfront/ui`:

```typescript
import { 
  ButtonComponent, 
  InputComponent, 
  CardComponent 
} from '@flyfront/ui';

@Component({
  standalone: true,
  imports: [ButtonComponent, InputComponent, CardComponent],
  // ...
})
```

### Button Component

```html
<!-- Variants -->
<fly-button variant="primary">Primary</fly-button>
<fly-button variant="secondary">Secondary</fly-button>
<fly-button variant="outline">Outline</fly-button>
<fly-button variant="ghost">Ghost</fly-button>
<fly-button variant="danger">Danger</fly-button>

<!-- Sizes -->
<fly-button size="sm">Small</fly-button>
<fly-button size="md">Medium</fly-button>
<fly-button size="lg">Large</fly-button>

<!-- States -->
<fly-button [loading]="isLoading">Submit</fly-button>
<fly-button [disabled]="true">Disabled</fly-button>

<!-- Full width -->
<fly-button [fullWidth]="true">Full Width</fly-button>
```

### Input Component

```html
<!-- Basic input -->
<fly-input 
  label="Email" 
  type="email" 
  placeholder="you@example.com"
  [(ngModel)]="email"
/>

<!-- With validation -->
<fly-input 
  label="Password"
  type="password"
  [error]="passwordError"
  hint="Minimum 8 characters"
  required
/>

<!-- With icons -->
<fly-input 
  label="Search"
  leftIcon="search"
  placeholder="Search..."
/>
```

### Card Component

```html
<fly-card>
  <fly-card-header>
    <h3 class="text-lg font-semibold">Card Title</h3>
  </fly-card-header>
  
  <fly-card-content>
    <p>Card content goes here.</p>
  </fly-card-content>
  
  <fly-card-footer>
    <fly-button variant="ghost">Cancel</fly-button>
    <fly-button variant="primary">Save</fly-button>
  </fly-card-footer>
</fly-card>
```

### Loading Components

```html
<!-- Spinner -->
<fly-spinner size="sm" />
<fly-spinner size="md" />
<fly-spinner size="lg" />

<!-- Skeleton -->
<fly-skeleton width="100%" height="20px" />
<fly-skeleton variant="circle" size="48px" />

<!-- Loading overlay -->
<fly-loading-overlay [visible]="isLoading">
  <div>Content underneath</div>
</fly-loading-overlay>
```

### App Shell Component

```html
<fly-app-shell [sidebarOpen]="sidebarOpen()">
  <ng-container header>
    <div class="flex items-center gap-4">
      <button (click)="toggleSidebar()"></button>
      <h1>My Application</h1>
    </div>
  </ng-container>
  
  <ng-container sidebar>
    <nav class="p-4">
      <a routerLink="/dashboard" class="block p-2">Dashboard</a>
      <a routerLink="/settings" class="block p-2">Settings</a>
    </nav>
  </ng-container>
  
  <ng-container content>
    <router-outlet />
  </ng-container>
</fly-app-shell>
```

---

## Styling with TailwindCSS

### Basic Usage

TailwindCSS utilities can be used directly in templates:

```html
<div class="flex items-center justify-between p-4 bg-white rounded-lg shadow">
  <h2 class="text-xl font-semibold text-gray-900">Title</h2>
  <fly-button variant="primary">Action</fly-button>
</div>
```

### Responsive Design

Use responsive prefixes:

```html
<!-- Stack on mobile, row on desktop -->
<div class="flex flex-col md:flex-row gap-4">
  <div class="w-full md:w-1/2">Column 1</div>
  <div class="w-full md:w-1/2">Column 2</div>
</div>
```

### Dark Mode

Dark mode classes are available with the `dark:` prefix:

```html
<div class="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
  Content that adapts to dark mode
</div>
```

### Custom Classes

For complex, reusable styles, use `@apply` in SCSS:

```scss
// In component styles
.custom-card {
  @apply bg-white rounded-lg shadow-md p-6;
  @apply hover:shadow-lg transition-shadow;
  @apply dark:bg-gray-800;
}
```

---

## Theming

### Customizing Design Tokens

Modify `tailwind.config.js` to customize tokens:

```javascript
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#your-color',
          // ... other shades
          500: '#your-brand-color',
        },
      },
    },
  },
};
```

### Dark Mode Configuration

Dark mode is enabled via the `class` strategy:

```javascript
// tailwind.config.js
module.exports = {
  darkMode: 'class',
  // ...
};
```

Toggle dark mode by adding/removing the `dark` class on `<html>`:

```typescript
@Component({...})
export class ThemeToggleComponent {
  toggleDarkMode() {
    document.documentElement.classList.toggle('dark');
  }
}
```

---

## Accessibility

### Component Accessibility

All Flyfront components are built with accessibility in mind:

- **Keyboard Navigation**: Full keyboard support
- **ARIA Attributes**: Proper roles and labels
- **Focus Management**: Visible focus indicators
- **Screen Reader Support**: Meaningful announcements

### Guidelines

1. **Always provide labels** for form inputs:

```html
<!--  Good -->
<fly-input label="Email Address" />

<!--  Bad -->
<fly-input placeholder="Email" />
```

2. **Use semantic HTML**:

```html
<!--  Good -->
<button type="button">Click me</button>

<!--  Bad -->
<div onclick="...">Click me</div>
```

3. **Ensure sufficient color contrast**:

- Normal text: 4.5:1 minimum ratio
- Large text: 3:1 minimum ratio

4. **Don't rely on color alone**:

```html
<!--  Good: Icon + color -->
<div class="text-error-600">
   Error message
</div>

<!--  Bad: Color only -->
<div class="text-error-600">
  Error message
</div>
```

---

## Best Practices

### 1. Use Design Tokens

Always use design tokens instead of arbitrary values:

```html
<!--  Good: Using tokens -->
<div class="p-4 text-gray-600">

<!--  Bad: Arbitrary values -->
<div style="padding: 15px; color: #666;">
```

### 2. Prefer Components

Use library components for common patterns:

```html
<!--  Good: Using component -->
<fly-button variant="primary">Submit</fly-button>

<!--  Bad: Custom button -->
<button class="bg-blue-500 text-white px-4 py-2 rounded">Submit</button>
```

### 3. Keep Styles Colocated

Keep component-specific styles with the component:

```typescript
@Component({
  styles: [`
    .feature-card {
      @apply bg-white rounded-lg shadow-md;
    }
  `],
})
```

### 4. Mobile-First Design

Start with mobile styles, then add responsive overrides:

```html
<!-- Mobile first -->
<div class="p-4 md:p-6 lg:p-8">
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    <!-- Cards -->
  </div>
</div>
```

### 5. Consistent Spacing

Use consistent spacing throughout:

```html
<!-- Page layout -->
<main class="p-6">
  <section class="mb-8">
    <h2 class="mb-4">Section Title</h2>
    <p class="mb-2">Content</p>
  </section>
</main>
```

---

## Component Reference

For complete component documentation, see the [UI Library Reference](../architecture/libraries.md#flyfrontui).
