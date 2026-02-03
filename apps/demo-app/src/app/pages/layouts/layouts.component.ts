/**
 * @flyfront/demo-app - Layouts Explorer
 * @license Apache-2.0
 * @copyright 2026 Firefly Software Solutions Inc.
 */

import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PageHeaderComponent, SectionComponent, ShowcaseCardComponent, ComponentGridComponent } from '../../shared/showcase.component';
import {
  AuthLayoutComponent,
  DashboardLayoutComponent,
  CenteredLayoutComponent,
  SplitLayoutComponent,
  StackLayoutComponent,
  PageLayoutComponent,
  ButtonComponent,
  DashboardNavItem,
  DashboardBreadcrumbItem,
} from '@flyfront/ui';

interface LayoutInfo {
  name: string;
  selector: string;
  description: string;
  useCases: string[];
}

@Component({
  selector: 'app-layouts',
  standalone: true,
  imports: [
    CommonModule,
    PageHeaderComponent,
    SectionComponent,
    ShowcaseCardComponent,
    ComponentGridComponent,
    AuthLayoutComponent,
    DashboardLayoutComponent,
    CenteredLayoutComponent,
    SplitLayoutComponent,
    StackLayoutComponent,
    PageLayoutComponent,
    ButtonComponent,
  ],
  template: `
    <app-page-header
      title="Layout Components"
      description="Pre-built page layouts for common application patterns"
    />

    <!-- Layout Selector -->
    <div class="mb-8 flex flex-wrap gap-2">
      @for (layout of layouts; track layout.name) {
        <button
          (click)="selectedLayout.set(layout.name)"
          class="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          [class]="selectedLayout() === layout.name
            ? 'bg-blue-600 text-white'
            : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'"
        >
          {{ layout.name }}
        </button>
      }
    </div>

    <!-- Layout Info -->
    @if (currentLayout(); as layout) {
      <app-section [title]="layout.name" [description]="layout.description">
        <div class="mb-4">
          <code class="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-sm text-blue-600 dark:text-blue-400">
            &lt;{{ layout.selector }}&gt;
          </code>
        </div>
        <div class="mb-6">
          <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Use Cases:</h4>
          <ul class="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 space-y-1">
            @for (useCase of layout.useCases; track useCase) {
              <li>{{ useCase }}</li>
            }
          </ul>
        </div>
      </app-section>
    }

    <!-- Live Preview -->
    <app-section title="Live Preview" description="Interactive preview of the selected layout">
      <div class="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden bg-gray-50 dark:bg-gray-900" style="height: 500px;">
        @switch (selectedLayout()) {
          @case ('AuthLayout') {
            <fly-auth-layout 
              class="h-full" 
              title="Welcome back"
              subtitle="Sign in to your account to continue"
              [showPattern]="true"
            >
              <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 space-y-4">
                <div class="space-y-3">
                  <input type="email" placeholder="Email" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
                  <input type="password" placeholder="Password" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
                  <fly-button variant="primary" [fullWidth]="true">Sign In</fly-button>
                </div>
                <div class="text-center text-sm text-gray-500">
                  <a href="#" class="text-primary-500 hover:underline">Forgot password?</a>
                </div>
              </div>
            </fly-auth-layout>
          }
          @case ('DashboardLayout') {
            <fly-dashboard-layout 
              class="h-full"
              appName="Flyfront"
              userName="John Doe"
              [navItems]="dashboardNavItems"
              [breadcrumbs]="dashboardBreadcrumbs"
            >
              <div class="space-y-4">
                <h1 class="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div class="p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
                    <div class="text-2xl font-bold text-gray-900">1,234</div>
                    <div class="text-sm text-gray-600">Total Users</div>
                  </div>
                  <div class="p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
                    <div class="text-2xl font-bold text-gray-900">$12.5k</div>
                    <div class="text-sm text-gray-600">Revenue</div>
                  </div>
                  <div class="p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
                    <div class="text-2xl font-bold text-gray-900">89%</div>
                    <div class="text-sm text-gray-600">Satisfaction</div>
                  </div>
                </div>
              </div>
            </fly-dashboard-layout>
          }
          @case ('CenteredLayout') {
            <fly-centered-layout class="h-full" [fullHeight]="true" maxWidth="md" padding="lg">
              <div class="text-center space-y-4 bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg">
                <div class="text-6xl">🎉</div>
                <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Success!</h1>
                <p class="text-gray-600 dark:text-gray-400">
                  Your action has been completed successfully. 
                  This centered layout is perfect for confirmation messages.
                </p>
                <fly-button variant="primary">Continue</fly-button>
              </div>
            </fly-centered-layout>
          }
          @case ('SplitLayout') {
            <fly-split-layout class="h-full" split="50-50" gap="none">
              <div left class="h-full bg-gradient-to-br from-primary-600 to-secondary-600 flex items-center justify-center p-8">
                <div class="text-center text-white">
                  <div class="text-5xl mb-4">🚀</div>
                  <h2 class="text-3xl font-bold mb-2">Get Started</h2>
                  <p class="opacity-90 max-w-xs">Join thousands of developers building amazing applications</p>
                </div>
              </div>
              <div right class="h-full flex items-center justify-center p-8 bg-white dark:bg-gray-800">
                <div class="w-full max-w-sm space-y-4">
                  <h2 class="text-2xl font-bold text-gray-900 dark:text-white">Create Account</h2>
                  <p class="text-gray-600 dark:text-gray-400">Start your journey today</p>
                  <input type="text" placeholder="Full Name" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
                  <input type="email" placeholder="Email" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
                  <input type="password" placeholder="Password" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
                  <fly-button variant="primary" [fullWidth]="true">Create Account</fly-button>
                </div>
              </div>
            </fly-split-layout>
          }
          @case ('StackLayout') {
            <fly-stack-layout class="h-full p-6" gap="md">
              <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Section 1</h2>
                <p class="text-gray-600 dark:text-gray-400 mt-1">Stack Layout arranges items vertically with consistent spacing.</p>
              </div>
              <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Section 2</h2>
                <p class="text-gray-600 dark:text-gray-400 mt-1">Each child element is stacked below the previous one.</p>
              </div>
              <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Section 3</h2>
                <p class="text-gray-600 dark:text-gray-400 mt-1">Great for forms, settings pages, and content lists.</p>
              </div>
              <div class="flex justify-end gap-2 pt-4">
                <fly-button variant="outline">Cancel</fly-button>
                <fly-button variant="primary">Save Changes</fly-button>
              </div>
            </fly-stack-layout>
          }
          @case ('PageLayout') {
            <fly-page-layout 
              class="h-full overflow-auto p-6"
              title="Product List"
              description="Manage your product catalog"
            >
              <ng-container page-actions>
                <fly-button variant="outline">Export</fly-button>
                <fly-button variant="primary">Add Product</fly-button>
              </ng-container>
              <div class="space-y-4">
                <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                  <div class="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                    <input type="search" placeholder="Search products..." class="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm" />
                  </div>
                  <div class="divide-y divide-gray-200 dark:divide-gray-700">
                    @for (product of ['Laptop Pro', 'Wireless Mouse', 'USB-C Hub', 'Monitor 27"']; track product) {
                      <div class="px-4 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700">
                        <span class="text-gray-900 dark:text-white">{{ product }}</span>
                        <span class="text-sm text-gray-500">In Stock</span>
                      </div>
                    }
                  </div>
                </div>
              </div>
            </fly-page-layout>
          }
        }
      </div>
    </app-section>

    <!-- All Layouts Overview -->
    <app-section title="All Layouts" description="Quick overview of all available layouts">
      <app-component-grid [columns]="3">
        @for (layout of layouts; track layout.name) {
          <app-showcase-card [title]="layout.name">
            <p class="text-sm text-gray-600 dark:text-gray-400 mb-3">{{ layout.description }}</p>
            <code class="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-blue-600 dark:text-blue-400">
              {{ layout.selector }}
            </code>
          </app-showcase-card>
        }
      </app-component-grid>
    </app-section>
  `,
})
export class LayoutsComponent {
  selectedLayout = signal<string>('AuthLayout');

  readonly layouts: LayoutInfo[] = [
    {
      name: 'AuthLayout',
      selector: 'fly-auth-layout',
      description: 'Two-column layout optimized for authentication pages',
      useCases: ['Login pages', 'Registration forms', 'Password reset', 'Two-factor authentication'],
    },
    {
      name: 'DashboardLayout',
      selector: 'fly-dashboard-layout',
      description: 'Full application layout with header, sidebar, and content area',
      useCases: ['Admin dashboards', 'Analytics platforms', 'CMS interfaces', 'SaaS applications'],
    },
    {
      name: 'CenteredLayout',
      selector: 'fly-centered-layout',
      description: 'Centers content both horizontally and vertically',
      useCases: ['Confirmation pages', 'Loading states', 'Error pages', 'Empty states'],
    },
    {
      name: 'SplitLayout',
      selector: 'fly-split-layout',
      description: 'Two-panel layout with customizable split ratio',
      useCases: ['Onboarding flows', 'Marketing pages', 'Comparison views', 'Master-detail interfaces'],
    },
    {
      name: 'StackLayout',
      selector: 'fly-stack-layout',
      description: 'Vertical stack with fixed header/footer and scrollable content',
      useCases: ['Modal dialogs', 'Slide-over panels', 'Form wizards', 'Detail views'],
    },
    {
      name: 'PageLayout',
      selector: 'fly-page-layout',
      description: 'Standard content page with breadcrumbs, title, and actions',
      useCases: ['List pages', 'Detail pages', 'Settings pages', 'Content management'],
    },
  ];

  readonly dashboardNavItems: DashboardNavItem[] = [
    { id: 'dashboard', label: 'Dashboard', active: true },
    { id: 'analytics', label: 'Analytics' },
    { id: 'reports', label: 'Reports', badge: '3' },
    { id: 'settings', label: 'Settings' },
  ];

  readonly dashboardBreadcrumbs: DashboardBreadcrumbItem[] = [
    { label: 'Home', link: '#' },
    { label: 'Dashboard' },
  ];

  currentLayout() {
    return this.layouts.find(l => l.name === this.selectedLayout());
  }
}
