/**
 * @flyfront/demo-app - Overview Page
 * @license Apache-2.0
 * @copyright 2026 Firefly Software Solutions Inc.
 */

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PageHeaderComponent, ShowcaseCardComponent, ComponentGridComponent } from '../../shared/showcase.component';
import { BadgeComponent } from '@flyfront/ui';

@Component({
  selector: 'app-overview',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    PageHeaderComponent,
    ShowcaseCardComponent,
    ComponentGridComponent,
    BadgeComponent,
  ],
  template: `
    <app-page-header
      title="Flyfront UI"
      description="A comprehensive Angular component library for building modern web applications"
    />

    <!-- Hero Stats -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
      @for (stat of stats; track stat.label) {
        <div class="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div class="flex items-center gap-3 mb-2">
            <div class="w-10 h-10 rounded-lg flex items-center justify-center" [class]="stat.bgColor">
              <span class="w-5 h-5" [class]="stat.iconColor" [innerHTML]="stat.icon"></span>
            </div>
            <div class="text-3xl font-bold text-gray-900 dark:text-white">{{ stat.value }}</div>
          </div>
          <div class="text-sm text-gray-500 dark:text-gray-400">{{ stat.label }}</div>
        </div>
      }
    </div>

    <!-- Quick Start -->
    <app-showcase-card title="Quick Start" subtitle="Install and start using Flyfront UI in your Angular project">
      <div class="space-y-4">
        <div class="bg-gray-900 dark:bg-gray-950 rounded-lg p-4">
          <code class="text-sm text-green-400">npm install &#64;flyfront/ui</code>
        </div>
        <div class="bg-gray-900 dark:bg-gray-950 rounded-lg p-4">
          <pre class="text-sm text-gray-300"><span class="text-purple-400">import</span> {{ '{' }} ButtonComponent {{ '}' }} <span class="text-purple-400">from</span> <span class="text-green-400">'&#64;flyfront/ui'</span>;

<span class="text-gray-500">// In your component</span>
&#64;Component({{ '{' }}
  imports: [ButtonComponent],
  template: <span class="text-green-400">\`&lt;fly-button variant="primary"&gt;Click me&lt;/fly-button&gt;\`</span>
{{ '}' }})</pre>
        </div>
      </div>
    </app-showcase-card>

    <!-- Component Categories -->
    <h2 class="text-xl font-semibold text-gray-900 dark:text-white mt-10 mb-6">Component Categories</h2>
    <app-component-grid [columns]="3">
      @for (category of categories; track category.title) {
        <a
          [routerLink]="category.path"
          class="group bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-lg transition-all"
        >
          <div class="w-12 h-12 rounded-lg bg-gradient-to-br mb-4 flex items-center justify-center" [class]="category.gradient">
            <span class="w-6 h-6 text-white" [innerHTML]="category.icon"></span>
          </div>
          <h3 class="font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            {{ category.title }}
          </h3>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">{{ category.description }}</p>
          <div class="flex flex-wrap gap-1 mt-3">
            @for (component of category.components; track component) {
              <fly-badge color="secondary" variant="subtle" size="sm">{{ component }}</fly-badge>
            }
          </div>
        </a>
      }
    </app-component-grid>

    <!-- Features -->
    <h2 class="text-xl font-semibold text-gray-900 dark:text-white mt-10 mb-6">Key Features</h2>
    <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      @for (feature of features; track feature.title) {
        <div class="flex gap-4">
          <div class="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
            <span class="w-5 h-5 text-blue-600 dark:text-blue-400" [innerHTML]="feature.icon"></span>
          </div>
          <div>
            <h3 class="font-medium text-gray-900 dark:text-white">{{ feature.title }}</h3>
            <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">{{ feature.description }}</p>
          </div>
        </div>
      }
    </div>
  `,
})
export class OverviewComponent {
  readonly stats = [
    { 
      value: '30+', 
      label: 'Components',
      icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" /></svg>',
      bgColor: 'bg-blue-100 dark:bg-blue-900/30',
      iconColor: 'text-blue-600 dark:text-blue-400',
    },
    { 
      value: '6', 
      label: 'Layout Types',
      icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" /></svg>',
      bgColor: 'bg-purple-100 dark:bg-purple-900/30',
      iconColor: 'text-purple-600 dark:text-purple-400',
    },
    { 
      value: '100%', 
      label: 'Standalone',
      icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clip-rule="evenodd" /></svg>',
      bgColor: 'bg-green-100 dark:bg-green-900/30',
      iconColor: 'text-green-600 dark:text-green-400',
    },
    { 
      value: 'A11y', 
      label: 'Accessible',
      icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" /></svg>',
      bgColor: 'bg-amber-100 dark:bg-amber-900/30',
      iconColor: 'text-amber-600 dark:text-amber-400',
    },
  ];

  readonly categories = [
    {
      title: 'Form Components',
      description: 'Input controls for building forms',
      path: '/forms',
      gradient: 'from-blue-500 to-indigo-600',
      icon: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>',
      components: ['Button', 'Input', 'Select', 'Checkbox', 'Switch', 'Radio'],
    },
    {
      title: 'Feedback',
      description: 'User feedback and notifications',
      path: '/feedback',
      gradient: 'from-amber-500 to-orange-600',
      icon: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>',
      components: ['Alert', 'Toast', 'Dialog', 'Progress'],
    },
    {
      title: 'Data Display',
      description: 'Display structured data and content',
      path: '/data-display',
      gradient: 'from-emerald-500 to-teal-600',
      icon: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>',
      components: ['Card', 'Badge', 'Avatar', 'Table', 'Tooltip'],
    },
    {
      title: 'Navigation',
      description: 'Navigation and wayfinding',
      path: '/navigation',
      gradient: 'from-purple-500 to-pink-600',
      icon: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h7" /></svg>',
      components: ['Tabs', 'Breadcrumb', 'Menu', 'Stepper'],
    },
    {
      title: 'Layout',
      description: 'Page structure and layout patterns',
      path: '/layouts',
      gradient: 'from-rose-500 to-red-600',
      icon: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" /></svg>',
      components: ['AuthLayout', 'DashboardLayout', 'PageLayout', 'SplitLayout'],
    },
  ];

  readonly features = [
    {
      title: 'Angular 19+ Standalone',
      description: 'Built with modern Angular patterns and standalone components.',
      icon: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>',
    },
    {
      title: 'Dark Mode Ready',
      description: 'All components support light and dark themes out of the box.',
      icon: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>',
    },
    {
      title: 'Fully Accessible',
      description: 'WCAG 2.1 AA compliant with proper ARIA attributes.',
      icon: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>',
    },
    {
      title: 'TailwindCSS 4',
      description: 'Styled with TailwindCSS for easy customization.',
      icon: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" /></svg>',
    },
    {
      title: 'Signal-Based',
      description: 'Modern reactive patterns with Angular Signals.',
      icon: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>',
    },
    {
      title: 'Tree Shakeable',
      description: 'Import only what you need for optimal bundle size.',
      icon: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" /></svg>',
    },
  ];
}
