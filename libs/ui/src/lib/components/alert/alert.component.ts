/**
 * @flyfront/ui - Alert Component
 * @license Apache-2.0
 */

import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';

export type AlertType = 'success' | 'error' | 'warning' | 'info';
export type AlertVariant = 'standard' | 'outlined' | 'filled';

@Component({
  selector: 'fly-alert',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (!dismissed()) {
      <div [class]="alertClasses()" role="alert">
        @if (showIcon()) {
          <div [class]="iconClasses()">
            @switch (type()) {
              @case ('success') {
                <svg class="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                </svg>
              }
              @case ('error') {
                <svg class="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                </svg>
              }
              @case ('warning') {
                <svg class="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
                </svg>
              }
              @case ('info') {
                <svg class="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
                </svg>
              }
            }
          </div>
        }

        <div class="flex-1">
          @if (title()) {
            <h4 class="font-medium mb-1 text-sm">{{ title() }}</h4>
          }
          <div class="text-sm">
            <ng-content />
          </div>
        </div>

        @if (dismissible()) {
          <button
            type="button"
            [class]="dismissClasses()"
            aria-label="Dismiss"
            (click)="dismiss()"
          >
            <svg class="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
            </svg>
          </button>
        }
      </div>
    }
  `,
})
export class AlertComponent {
  readonly type = input<AlertType>('info');
  readonly title = input<string>('');
  readonly variant = input<AlertVariant>('standard');
  readonly showIcon = input<boolean>(true);
  readonly dismissible = input<boolean>(false);
  readonly closed = output<void>();
  readonly dismissed = signal(false);

  private readonly baseClasses = 'flex items-start gap-3 p-4 rounded-lg border';

  private readonly typeClasses: Record<AlertType, Record<AlertVariant, string>> = {
    success: {
      standard: 'border-green-200 bg-green-50',
      outlined: 'border-green-500 bg-transparent',
      filled: 'border-green-500 bg-green-500 text-white',
    },
    error: {
      standard: 'border-red-200 bg-red-50',
      outlined: 'border-red-500 bg-transparent',
      filled: 'border-red-500 bg-red-500 text-white',
    },
    warning: {
      standard: 'border-amber-200 bg-amber-50',
      outlined: 'border-amber-500 bg-transparent',
      filled: 'border-amber-500 bg-amber-500 text-white',
    },
    info: {
      standard: 'border-blue-200 bg-blue-50',
      outlined: 'border-blue-500 bg-transparent',
      filled: 'border-blue-500 bg-blue-500 text-white',
    },
  };

  private readonly iconColors: Record<AlertType, Record<AlertVariant, string>> = {
    success: { standard: 'text-green-500', outlined: 'text-green-500', filled: 'text-white' },
    error: { standard: 'text-red-500', outlined: 'text-red-500', filled: 'text-white' },
    warning: { standard: 'text-amber-500', outlined: 'text-amber-500', filled: 'text-white' },
    info: { standard: 'text-blue-500', outlined: 'text-blue-500', filled: 'text-white' },
  };

  readonly alertClasses = computed(() => {
    const t = this.type();
    const v = this.variant();
    return `${this.baseClasses} ${this.typeClasses[t][v]}`;
  });

  readonly iconClasses = computed(() => {
    const t = this.type();
    const v = this.variant();
    return `shrink-0 ${this.iconColors[t][v]}`;
  });

  readonly dismissClasses = computed(() => {
    const v = this.variant();
    const baseBtn = 'shrink-0 p-1 rounded opacity-70 hover:opacity-100 transition-opacity cursor-pointer bg-transparent border-none';
    return v === 'filled' ? `${baseBtn} text-white` : baseBtn;
  });

  dismiss(): void {
    this.dismissed.set(true);
    this.closed.emit();
  }

  show(): void {
    this.dismissed.set(false);
  }
}
