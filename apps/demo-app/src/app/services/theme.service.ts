/**
 * @flyfront/demo-app - Theme Service
 * @license Apache-2.0
 * @copyright 2026 Firefly Software Solutions Inc.
 */

import { Injectable, signal, effect } from '@angular/core';

export type Theme = 'light' | 'dark' | 'system';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private readonly STORAGE_KEY = 'flyfront-theme';

  readonly theme = signal<Theme>(this.getStoredTheme());
  readonly isDark = signal<boolean>(false);

  constructor() {
    // Apply theme on changes
    effect(() => {
      const theme = this.theme();
      this.applyTheme(theme);
      localStorage.setItem(this.STORAGE_KEY, theme);
    });

    // Listen for system theme changes
    window
      .matchMedia('(prefers-color-scheme: dark)')
      .addEventListener('change', (e) => {
        if (this.theme() === 'system') {
          this.isDark.set(e.matches);
          this.updateDocumentClass(e.matches);
        }
      });
  }

  setTheme(theme: Theme): void {
    this.theme.set(theme);
  }

  toggleTheme(): void {
    const current = this.theme();
    if (current === 'light') {
      this.setTheme('dark');
    } else if (current === 'dark') {
      this.setTheme('light');
    } else {
      // If system, toggle based on current actual state
      this.setTheme(this.isDark() ? 'light' : 'dark');
    }
  }

  private getStoredTheme(): Theme {
    const stored = localStorage.getItem(this.STORAGE_KEY) as Theme | null;
    return stored || 'system';
  }

  private applyTheme(theme: Theme): void {
    let dark: boolean;

    if (theme === 'system') {
      dark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    } else {
      dark = theme === 'dark';
    }

    this.isDark.set(dark);
    this.updateDocumentClass(dark);
  }

  private updateDocumentClass(dark: boolean): void {
    if (dark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }
}
