/**
 * @flyfront/ui - Loading Components
 * @license Apache-2.0
 */

import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Spinner sizes
 */
export type SpinnerSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

/**
 * Spinner component
 *
 * @example
 * ```html
 * <fly-spinner size="md"></fly-spinner>
 * <fly-spinner size="lg" color="#ff5722"></fly-spinner>
 * ```
 */
@Component({
  selector: 'fly-spinner',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div [class]="spinnerClasses" [style.color]="color" role="status" aria-label="Loading">
      <svg class="animate-spin" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle
          class="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          stroke-width="3"
        />
        <path
          d="M12 2C6.477 2 2 6.477 2 12"
          stroke="currentColor"
          stroke-width="3"
          stroke-linecap="round"
        />
      </svg>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SpinnerComponent {
  /** Spinner size */
  @Input() size: SpinnerSize = 'md';

  /** Spinner color */
  @Input() color?: string;

  private readonly sizeClasses: Record<SpinnerSize, string> = {
    xs: 'w-4 h-4',
    sm: 'w-5 h-5',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12',
  };

  get spinnerClasses(): string {
    return `inline-flex text-blue-500 ${this.sizeClasses[this.size]}`;
  }
}

/**
 * Loading overlay component
 *
 * @example
 * ```html
 * <fly-loading-overlay [visible]="isLoading" message="Loading data...">
 *   <div>Content to overlay</div>
 * </fly-loading-overlay>
 * ```
 */
@Component({
  selector: 'fly-loading-overlay',
  standalone: true,
  imports: [CommonModule, SpinnerComponent],
  template: `
    <div class="relative">
      <ng-content></ng-content>
      @if (visible) {
        <div [class]="overlayClasses">
          <div class="flex flex-col items-center gap-3">
            <fly-spinner [size]="spinnerSize"></fly-spinner>
            @if (message) {
              <p class="m-0 text-sm text-gray-500">{{ message }}</p>
            }
          </div>
        </div>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoadingOverlayComponent {
  /** Whether the overlay is visible */
  @Input() visible = false;

  /** Loading message */
  @Input() message?: string;

  /** Spinner size */
  @Input() spinnerSize: SpinnerSize = 'lg';

  /** Whether the overlay is opaque */
  @Input() opaque = false;

  get overlayClasses(): string {
    const base = 'absolute inset-0 flex items-center justify-center z-10 backdrop-blur-sm';
    return this.opaque ? `${base} bg-white` : `${base} bg-white/80`;
  }
}

/**
 * Skeleton component for loading placeholders
 *
 * @example
 * ```html
 * <fly-skeleton width="100%" height="20px"></fly-skeleton>
 * <fly-skeleton variant="circle" width="40px" height="40px"></fly-skeleton>
 * ```
 */
@Component({
  selector: 'fly-skeleton',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      [class]="skeletonClasses"
      [style.width]="width"
      [style.height]="height"
      [style.border-radius]="borderRadius"
    ></div>
  `,
  styles: [`
    @keyframes shimmer {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }
    .fly-skeleton-animate {
      background: linear-gradient(90deg, #e5e7eb 25%, #f3f4f6 50%, #e5e7eb 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SkeletonComponent {
  /** Skeleton variant */
  @Input() variant: 'rectangle' | 'circle' | 'text' = 'rectangle';

  /** Width */
  @Input() width = '100%';

  /** Height */
  @Input() height = '1rem';

  /** Border radius */
  @Input() borderRadius?: string;

  get skeletonClasses(): string {
    const base = 'fly-skeleton-animate';
    if (this.variant === 'circle') return `${base} rounded-full`;
    if (this.variant === 'text') return `${base} rounded`;
    return base;
  }
}
