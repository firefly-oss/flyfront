/**
 * @flyfront/demo-app - Shell Component
 * @license Apache-2.0
 * @copyright 2026 Firefly Software Solutions Inc.
 */

import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterLink, RouterLinkActive } from '@angular/router';
import { ThemeService, Theme } from '../services/theme.service';

interface NavGroup {
  title: string;
  items: NavItem[];
}

interface NavItem {
  label: string;
  path: string;
  icon: string;
}

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [CommonModule, RouterModule, RouterLink, RouterLinkActive],
  template: `
    <div class="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <!-- Mobile menu button -->
      <button
        class="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700"
        (click)="sidebarOpen.set(!sidebarOpen())"
      >
        <svg class="w-6 h-6 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          @if (sidebarOpen()) {
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          } @else {
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
          }
        </svg>
      </button>

      <!-- Sidebar -->
      <aside
        class="fixed inset-y-0 left-0 z-40 w-72 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transform transition-transform duration-200 lg:translate-x-0"
        [class.-translate-x-full]="!sidebarOpen()"
        [class.translate-x-0]="sidebarOpen()"
      >
        <!-- Logo -->
        <div class="h-16 flex items-center px-6 border-b border-gray-200 dark:border-gray-700">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
              <span class="text-white font-bold text-sm">F</span>
            </div>
            <div>
              <h1 class="font-bold text-gray-900 dark:text-white">Flyfront UI</h1>
              <p class="text-xs text-gray-500 dark:text-gray-400">Component Library</p>
            </div>
          </div>
        </div>

        <!-- Navigation -->
        <nav class="p-4 space-y-6 overflow-y-auto h-[calc(100vh-8rem)]">
          @for (group of navGroups; track group.title) {
            <div>
              <h3 class="px-3 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">
                {{ group.title }}
              </h3>
              <div class="space-y-1">
                @for (item of group.items; track item.path) {
                  <a
                    [routerLink]="item.path"
                    routerLinkActive="bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800"
                    [routerLinkActiveOptions]="{ exact: item.path === '/' }"
                    class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors border border-transparent"
                    (click)="closeMobileMenu()"
                  >
                    <span class="w-5 h-5 flex items-center justify-center" [innerHTML]="item.icon"></span>
                    {{ item.label }}
                  </a>
                }
              </div>
            </div>
          }
        </nav>

        <!-- Theme Switcher -->
        <div class="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <div class="flex items-center justify-between">
            <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Theme</span>
            <div class="flex items-center gap-1 p-1 bg-gray-100 dark:bg-gray-700 rounded-lg">
              @for (option of themeOptions; track option.value) {
                <button
                  class="p-2 rounded-md transition-colors"
                  [class.bg-white]="theme.theme() === option.value && !theme.isDark()"
                  [class.dark:bg-gray-600]="theme.theme() === option.value && theme.isDark()"
                  [class.shadow-sm]="theme.theme() === option.value"
                  [class.text-gray-400]="theme.theme() !== option.value"
                  [class.text-gray-700]="theme.theme() === option.value && !theme.isDark()"
                  [class.dark:text-gray-200]="theme.theme() === option.value && theme.isDark()"
                  [title]="option.label"
                  (click)="theme.setTheme(option.value)"
                >
                  <span class="w-4 h-4 block" [innerHTML]="option.icon"></span>
                </button>
              }
            </div>
          </div>
        </div>
      </aside>

      <!-- Mobile overlay -->
      @if (sidebarOpen()) {
        <div
          class="lg:hidden fixed inset-0 z-30 bg-black/50"
          (click)="sidebarOpen.set(false)"
        ></div>
      }

      <!-- Main content -->
      <main class="lg:pl-72 min-h-screen">
        <div class="p-6 lg:p-8">
          <router-outlet />
        </div>
      </main>
    </div>
  `,
})
export class ShellComponent {
  readonly theme = inject(ThemeService);
  readonly sidebarOpen = signal(false);

  readonly themeOptions: { value: Theme; label: string; icon: string }[] = [
    {
      value: 'light',
      label: 'Light',
      icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clip-rule="evenodd" /></svg>',
    },
    {
      value: 'dark',
      label: 'Dark',
      icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" /></svg>',
    },
    {
      value: 'system',
      label: 'System',
      icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M3 5a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2h-2.22l.123.489.804.321A1 1 0 0113.32 17H6.68a1 1 0 01-.386-1.923l.804-.32.122-.49H5a2 2 0 01-2-2V5zm2 0h10v8H5V5z" clip-rule="evenodd" /></svg>',
    },
  ];

  readonly navGroups: NavGroup[] = [
    {
      title: 'Getting Started',
      items: [
        {
          label: 'Overview',
          path: '/',
          icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" /></svg>',
        },
      ],
    },
    {
      title: 'Components',
      items: [
        {
          label: 'Buttons',
          path: '/buttons',
          icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V4a2 2 0 00-2-2H6zm4 14a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd" /></svg>',
        },
        {
          label: 'Forms',
          path: '/forms',
          icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clip-rule="evenodd" /></svg>',
        },
        {
          label: 'Feedback',
          path: '/feedback',
          icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" /></svg>',
        },
        {
          label: 'Data Display',
          path: '/data-display',
          icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" /><path fill-rule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clip-rule="evenodd" /></svg>',
        },
        {
          label: 'Navigation',
          path: '/navigation',
          icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h6a1 1 0 110 2H4a1 1 0 01-1-1z" clip-rule="evenodd" /></svg>',
        },
        {
          label: 'Layouts',
          path: '/layouts',
          icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" /></svg>',
        },
      ],
    },
  ];

  closeMobileMenu(): void {
    if (window.innerWidth < 1024) {
      this.sidebarOpen.set(false);
    }
  }
}
