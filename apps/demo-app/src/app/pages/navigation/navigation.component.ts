/**
 * @flyfront/demo-app - Navigation Components Showcase
 * @license Apache-2.0
 * @copyright 2026 Firefly Software Solutions Inc.
 */

import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PageHeaderComponent, SectionComponent, ShowcaseCardComponent, ComponentGridComponent } from '../../shared/showcase.component';
import {
  BreadcrumbComponent,
  StepperComponent,
  MenuComponent,
  PaginationComponent,
  ButtonComponent,
  Step,
  MenuItem,
  PageEvent,
} from '@flyfront/ui';

@Component({
  selector: 'app-navigation',
  standalone: true,
  imports: [
    CommonModule,
    PageHeaderComponent,
    SectionComponent,
    ShowcaseCardComponent,
    ComponentGridComponent,
    BreadcrumbComponent,
    StepperComponent,
    MenuComponent,
    PaginationComponent,
    ButtonComponent,
  ],
  template: `
    <app-page-header
      title="Navigation Components"
      description="Components for navigating and orienting users within your application"
    />

    <!-- Breadcrumb -->
    <app-section title="Breadcrumb" description="Show the user's current location in a hierarchy">
      <app-component-grid [columns]="1">
        <app-showcase-card title="Basic Breadcrumb">
          <fly-breadcrumb [items]="basicBreadcrumbs" />
        </app-showcase-card>
        <app-showcase-card title="Deep Navigation">
          <fly-breadcrumb [items]="deepBreadcrumbs" />
        </app-showcase-card>
      </app-component-grid>
    </app-section>

    <!-- Stepper -->
    <app-section title="Stepper" description="Guide users through multi-step processes">
      <app-showcase-card>
        <fly-stepper [steps]="steps" [initialStep]="currentStep()" [showControls]="false" (stepChange)="currentStep.set($event)" />
        <div class="mt-6 flex gap-2">
          <fly-button 
            variant="outline" 
            [disabled]="currentStep() === 0"
            (click)="previousStep()"
          >
            Previous
          </fly-button>
          <fly-button 
            variant="primary" 
            [disabled]="currentStep() === steps.length - 1"
            (click)="nextStep()"
          >
            Next
          </fly-button>
        </div>
      </app-showcase-card>
    </app-section>

    <!-- Stepper Variants -->
    <app-section title="Stepper States" description="Different step states">
      <app-component-grid [columns]="1">
        <app-showcase-card title="Completed Steps">
          <fly-stepper [steps]="completedSteps" [initialStep]="2" [showControls]="false" />
        </app-showcase-card>
        <app-showcase-card title="With Errors">
          <fly-stepper [steps]="errorSteps" [initialStep]="1" [showControls]="false" />
        </app-showcase-card>
      </app-component-grid>
    </app-section>

    <!-- Menu -->
    <app-section title="Menu" description="Dropdown menus for actions and navigation">
      <app-showcase-card>
        <div class="flex gap-4">
          <fly-menu [items]="menuItems" (itemClick)="onMenuItemClick($event)">
            <fly-button variant="outline">Actions ▾</fly-button>
          </fly-menu>
          
          <fly-menu [items]="userMenuItems" (itemClick)="onMenuItemClick($event)">
            <fly-button variant="ghost">
              <span class="flex items-center gap-2">
                <span class="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs">J</span>
                John Doe ▾
              </span>
            </fly-button>
          </fly-menu>
        </div>
      </app-showcase-card>
    </app-section>

    <!-- Pagination -->
    <app-section title="Pagination" description="Navigate through pages of content">
      <app-component-grid [columns]="1">
        <app-showcase-card title="Basic Pagination">
          <fly-pagination 
            [totalItems]="100" 
            [pageSize]="10" 
            [currentPage]="currentPage()"
            (pageChange)="onPageChange($event)"
          />
        </app-showcase-card>
        <app-showcase-card title="With Info">
          <div class="flex items-center justify-between">
            <span class="text-sm text-gray-600 dark:text-gray-400">
              Showing {{ (currentPage() - 1) * 10 + 1 }} to {{ Math.min(currentPage() * 10, 100) }} of 100 results
            </span>
            <fly-pagination 
              [totalItems]="100" 
              [pageSize]="10" 
              [currentPage]="currentPage()"
              (pageChange)="onPageChange($event)"
            />
          </div>
        </app-showcase-card>
      </app-component-grid>
    </app-section>

    <!-- Navigation Patterns -->
    <app-section title="Navigation Patterns" description="Common navigation UI patterns">
      <app-showcase-card title="Sidebar Navigation">
        <div class="w-64 bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <nav class="space-y-1">
            @for (item of sidebarItems; track item.label) {
              <a 
                href="javascript:void(0)"
                class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors"
                [class]="item.active 
                  ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'"
              >
                <span>{{ item.icon }}</span>
                <span>{{ item.label }}</span>
                @if (item.badge) {
                  <span class="ml-auto px-2 py-0.5 text-xs rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400">
                    {{ item.badge }}
                  </span>
                }
              </a>
            }
          </nav>
        </div>
      </app-showcase-card>
    </app-section>
  `,
})
export class NavigationComponent {
  Math = Math;
  currentStep = signal(1);
  currentPage = signal(1);

  readonly basicBreadcrumbs = [
    { label: 'Home', url: '/' },
    { label: 'Products', url: '/products' },
    { label: 'Electronics' },
  ];

  readonly deepBreadcrumbs = [
    { label: 'Home', url: '/' },
    { label: 'Settings', url: '/settings' },
    { label: 'Account', url: '/settings/account' },
    { label: 'Security', url: '/settings/account/security' },
    { label: 'Two-Factor Auth' },
  ];

  readonly steps: Step[] = [
    { id: 'account', label: 'Account', description: 'Create your account' },
    { id: 'profile', label: 'Profile', description: 'Set up your profile' },
    { id: 'preferences', label: 'Preferences', description: 'Configure settings' },
    { id: 'complete', label: 'Complete', description: 'All done!' },
  ];

  readonly completedSteps: Step[] = [
    { id: 'account', label: 'Account', description: 'Completed', completed: true },
    { id: 'profile', label: 'Profile', description: 'Completed', completed: true },
    { id: 'preferences', label: 'Preferences', description: 'In progress' },
    { id: 'complete', label: 'Complete', description: 'Pending' },
  ];

  readonly errorSteps: Step[] = [
    { id: 'account', label: 'Account', description: 'Completed', completed: true },
    { id: 'payment', label: 'Payment', description: 'Card declined', error: true },
    { id: 'shipping', label: 'Shipping', description: 'Pending' },
    { id: 'complete', label: 'Complete', description: 'Pending' },
  ];

  readonly menuItems: MenuItem[] = [
    { id: 'edit', label: 'Edit' },
    { id: 'duplicate', label: 'Duplicate' },
    { id: 'archive', label: 'Archive' },
    { id: 'divider', label: '', divider: true },
    { id: 'delete', label: 'Delete' },
  ];

  readonly userMenuItems: MenuItem[] = [
    { id: 'profile', label: 'Your Profile' },
    { id: 'settings', label: 'Settings' },
    { id: 'billing', label: 'Billing' },
    { id: 'divider', label: '', divider: true },
    { id: 'logout', label: 'Sign out' },
  ];

  readonly sidebarItems = [
    { icon: '🏠', label: 'Dashboard', active: true },
    { icon: '📊', label: 'Analytics', badge: 'New' },
    { icon: '👥', label: 'Team' },
    { icon: '📁', label: 'Projects', badge: '12' },
    { icon: '📅', label: 'Calendar' },
    { icon: '⚙️', label: 'Settings' },
  ];

  nextStep() {
    if (this.currentStep() < this.steps.length - 1) {
      this.currentStep.update(s => s + 1);
    }
  }

  previousStep() {
    if (this.currentStep() > 0) {
      this.currentStep.update(s => s - 1);
    }
  }

  onMenuItemClick(item: MenuItem) {
    console.log('Menu item clicked:', item);
  }

  onPageChange(event: PageEvent) {
    this.currentPage.set(event.page);
  }
}
