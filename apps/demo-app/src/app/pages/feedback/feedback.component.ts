/**
 * @flyfront/demo-app - Feedback Components Showcase
 * @license Apache-2.0
 * @copyright 2026 Firefly Software Solutions Inc.
 */

import { Component, signal, inject, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PageHeaderComponent, SectionComponent, ShowcaseCardComponent, ComponentGridComponent } from '../../shared/showcase.component';
import {
  AlertComponent,
  ProgressBarComponent,
  ProgressSpinnerComponent,
  DialogComponent,
  ToastContainerComponent,
  ToastService,
  ButtonComponent,
  LoadingOverlayComponent,
  SpinnerComponent,
} from '@flyfront/ui';

@Component({
  selector: 'app-feedback',
  standalone: true,
  imports: [
    CommonModule,
    PageHeaderComponent,
    SectionComponent,
    ShowcaseCardComponent,
    ComponentGridComponent,
    AlertComponent,
    ProgressBarComponent,
    ProgressSpinnerComponent,
    DialogComponent,
    ToastContainerComponent,
    ButtonComponent,
    LoadingOverlayComponent,
    SpinnerComponent,
  ],
  template: `
    <app-page-header
      title="Feedback Components"
      description="Components for providing feedback, status, and notifications to users"
    />

    <!-- Alerts -->
    <app-section title="Alerts" description="Contextual feedback messages">
      <div class="space-y-4">
        <fly-alert type="info" title="Information">
          This is an informational alert. Use it to provide helpful context.
        </fly-alert>
        <fly-alert type="success" title="Success">
          Your changes have been saved successfully.
        </fly-alert>
        <fly-alert type="warning" title="Warning">
          Please review your input before proceeding.
        </fly-alert>
        <fly-alert type="error" title="Error">
          An error occurred while processing your request.
        </fly-alert>
      </div>
    </app-section>

    <!-- Alerts without titles -->
    <app-section title="Compact Alerts" description="Alerts without titles for simpler messages">
      <div class="space-y-3">
        <fly-alert type="info">A simple informational message.</fly-alert>
        <fly-alert type="success">Operation completed successfully!</fly-alert>
        <fly-alert type="warning">This action cannot be undone.</fly-alert>
        <fly-alert type="error">Please fix the errors above.</fly-alert>
      </div>
    </app-section>

    <!-- Progress Bar -->
    <app-section title="Progress Bar" description="Linear progress indicators">
      <app-component-grid [columns]="2">
        <app-showcase-card title="Determinate">
          <div class="space-y-4">
            <div>
              <div class="text-sm text-gray-600 dark:text-gray-400 mb-1">25% Complete</div>
              <fly-progress-bar [value]="25" />
            </div>
            <div>
              <div class="text-sm text-gray-600 dark:text-gray-400 mb-1">50% Complete</div>
              <fly-progress-bar [value]="50" />
            </div>
            <div>
              <div class="text-sm text-gray-600 dark:text-gray-400 mb-1">75% Complete</div>
              <fly-progress-bar [value]="75" />
            </div>
            <div>
              <div class="text-sm text-gray-600 dark:text-gray-400 mb-1">100% Complete</div>
              <fly-progress-bar [value]="100" />
            </div>
          </div>
        </app-showcase-card>
        <app-showcase-card title="With Labels">
          <div class="space-y-4">
            <fly-progress-bar [value]="progressValue()" [showLabel]="true" />
            <div class="flex gap-2">
              <fly-button variant="outline" size="sm" (click)="decrementProgress()">-10</fly-button>
              <fly-button variant="outline" size="sm" (click)="incrementProgress()">+10</fly-button>
            </div>
          </div>
        </app-showcase-card>
      </app-component-grid>
    </app-section>

    <!-- Progress Spinner -->
    <app-section title="Progress Spinner" description="Circular loading indicators">
      <app-showcase-card>
        <div class="flex items-end gap-8">
          <div class="text-center">
            <fly-progress-spinner size="sm" />
            <div class="text-sm text-gray-600 dark:text-gray-400 mt-2">Small</div>
          </div>
          <div class="text-center">
            <fly-progress-spinner size="md" />
            <div class="text-sm text-gray-600 dark:text-gray-400 mt-2">Medium</div>
          </div>
          <div class="text-center">
            <fly-progress-spinner size="lg" />
            <div class="text-sm text-gray-600 dark:text-gray-400 mt-2">Large</div>
          </div>
        </div>
      </app-showcase-card>
    </app-section>

    <!-- Loading -->
    <app-section title="Loading" description="Full-screen or container loading states">
      <app-showcase-card title="Spinner">
        <div class="flex items-end gap-6">
          <div class="text-center">
            <fly-spinner size="xs" />
            <div class="text-sm text-gray-600 dark:text-gray-400 mt-2">XS</div>
          </div>
          <div class="text-center">
            <fly-spinner size="sm" />
            <div class="text-sm text-gray-600 dark:text-gray-400 mt-2">SM</div>
          </div>
          <div class="text-center">
            <fly-spinner size="md" />
            <div class="text-sm text-gray-600 dark:text-gray-400 mt-2">MD</div>
          </div>
          <div class="text-center">
            <fly-spinner size="lg" />
            <div class="text-sm text-gray-600 dark:text-gray-400 mt-2">LG</div>
          </div>
        </div>
      </app-showcase-card>
      <app-showcase-card title="Loading Overlay">
        <fly-loading-overlay [visible]="showLoading()" message="Loading content...">
          <div class="h-32 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <p class="text-gray-600 dark:text-gray-400">This content is behind the loading overlay.</p>
          </div>
        </fly-loading-overlay>
        <div class="mt-4">
          <fly-button variant="outline" (click)="toggleLoading()">
            {{ showLoading() ? 'Hide' : 'Show' }} Loading
          </fly-button>
        </div>
      </app-showcase-card>
    </app-section>

    <!-- Dialog -->
    <app-section title="Dialog" description="Modal dialog for focused interactions">
      <app-showcase-card>
        <fly-button variant="primary" (click)="openDialog()">Open Dialog</fly-button>
        
        <fly-dialog #dialog title="Confirm Action" [showFooter]="false">
          <p class="text-gray-600 dark:text-gray-400 mb-4">
            Are you sure you want to proceed? This action cannot be undone.
          </p>
          <div class="flex justify-end gap-2">
            <fly-button variant="outline" (click)="dialog.close()">Cancel</fly-button>
            <fly-button variant="danger" (click)="dialog.close()">Delete</fly-button>
          </div>
        </fly-dialog>
      </app-showcase-card>
    </app-section>

    <!-- Toast -->
    <app-section title="Toast" description="Temporary notification messages">
      <app-showcase-card>
        <div class="flex flex-wrap gap-2 mb-4">
          <fly-button variant="outline" (click)="showToast('info')">Info Toast</fly-button>
          <fly-button variant="outline" (click)="showToast('success')">Success Toast</fly-button>
          <fly-button variant="outline" (click)="showToast('warning')">Warning Toast</fly-button>
          <fly-button variant="outline" (click)="showToast('error')">Error Toast</fly-button>
        </div>
        <p class="text-sm text-gray-500 dark:text-gray-400">Click a button to trigger a toast notification</p>
      </app-showcase-card>
    </app-section>
    
    <!-- Toast Container (required for toasts to appear) -->
    <fly-toast-container />
  `,
})
export class FeedbackComponent {
  private readonly toastService = inject(ToastService);
  private readonly dialogRef = viewChild<DialogComponent>('dialog');
  
  progressValue = signal(60);
  showLoading = signal(false);

  incrementProgress() {
    this.progressValue.update(v => Math.min(100, v + 10));
  }

  decrementProgress() {
    this.progressValue.update(v => Math.max(0, v - 10));
  }

  toggleLoading() {
    this.showLoading.update(v => !v);
    if (this.showLoading()) {
      setTimeout(() => this.showLoading.set(false), 3000);
    }
  }

  openDialog() {
    this.dialogRef()?.open();
  }

  showToast(type: 'info' | 'success' | 'warning' | 'error') {
    const messages = {
      info: 'This is an informational message.',
      success: 'Operation completed successfully!',
      warning: 'Please proceed with caution.',
      error: 'An error has occurred.',
    };
    this.toastService.show({
      type,
      message: messages[type],
      title: type.charAt(0).toUpperCase() + type.slice(1),
    });
  }
}
