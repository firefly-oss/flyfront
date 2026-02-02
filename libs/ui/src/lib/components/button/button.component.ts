/**
 * @flyfront/ui - Button Component
 * @license Apache-2.0
 */

import {
  Component,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
  HostBinding,
  HostListener,
  booleanAttribute,
} from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Button variants
 */
export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';

/**
 * Button sizes
 */
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

/**
 * Button component
 *
 * @example
 * ```html
 * <fly-button variant="primary" size="md">Click me</fly-button>
 * <fly-button variant="outline" [loading]="true">Loading...</fly-button>
 * <fly-button variant="danger" [disabled]="true">Disabled</fly-button>
 * ```
 */
@Component({
  selector: 'fly-button',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button
      [type]="type"
      [disabled]="disabled || loading"
      [class]="buttonClasses"
      [attr.aria-busy]="loading"
      [attr.aria-disabled]="disabled"
    >
      @if (loading) {
        <span class="flex items-center" aria-hidden="true">
          <svg class="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
            <circle
              class="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              stroke-width="4"
            ></circle>
            <path
              class="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            ></path>
          </svg>
        </span>
      }
      @if (icon && iconPosition === 'left' && !loading) {
        <span class="flex items-center justify-center" [innerHTML]="icon"></span>
      }
      <span>
        <ng-content></ng-content>
      </span>
      @if (icon && iconPosition === 'right' && !loading) {
        <span class="flex items-center justify-center" [innerHTML]="icon"></span>
      }
    </button>
  `,
  styles: [`
    :host {
      @apply inline-flex;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ButtonComponent {
  /** Button variant */
  @Input() variant: ButtonVariant = 'primary';

  /** Button size */
  @Input() size: ButtonSize = 'md';

  /** Button type */
  @Input() type: 'button' | 'submit' | 'reset' = 'button';

  /** Whether the button is disabled */
  @Input({ transform: booleanAttribute }) disabled = false;

  /** Whether the button is in loading state */
  @Input({ transform: booleanAttribute }) loading = false;

  /** Whether the button should take full width */
  @Input({ transform: booleanAttribute }) fullWidth = false;

  /** Whether this is an icon-only button */
  @Input({ transform: booleanAttribute }) iconOnly = false;

  /** Icon HTML content */
  @Input() icon?: string;

  /** Icon position */
  @Input() iconPosition: 'left' | 'right' = 'left';

  /** Click event */
  @Output() clicked = new EventEmitter<MouseEvent>();

  private readonly baseClasses = 'inline-flex items-center justify-center gap-2 font-medium rounded transition-all cursor-pointer border whitespace-nowrap focus-visible:outline-2 focus-visible:outline-primary-500 focus-visible:outline-offset-2 disabled:opacity-60 disabled:cursor-not-allowed';

  private readonly sizeClasses: Record<ButtonSize, string> = {
    xs: 'h-6 px-2 text-xs',
    sm: 'h-8 px-3 text-sm',
    md: 'h-10 px-4 text-sm',
    lg: 'h-12 px-6 text-base',
    xl: 'h-14 px-8 text-lg',
  };

  private readonly variantClasses: Record<ButtonVariant, string> = {
    primary: 'bg-primary-500 text-white border-transparent hover:bg-primary-700 active:bg-primary-800',
    secondary: 'bg-neutral-200 text-neutral-800 border-transparent hover:bg-neutral-300 active:bg-neutral-400',
    outline: 'bg-transparent text-primary-500 border-primary-500 hover:bg-primary-50 active:bg-primary-100',
    ghost: 'bg-transparent text-primary-500 border-transparent hover:bg-primary-50 active:bg-primary-100',
    danger: 'bg-error-500 text-white border-transparent hover:bg-error-700 active:bg-error-800',
    success: 'bg-success-500 text-white border-transparent hover:bg-success-700 active:bg-success-800',
  };

  get buttonClasses(): string {
    const classes = [
      this.baseClasses,
      this.sizeClasses[this.size],
      this.variantClasses[this.variant],
    ];

    if (this.fullWidth) {
      classes.push('w-full');
    }

    if (this.iconOnly) {
      classes.push('!p-0 aspect-square');
    }

    return classes.join(' ');
  }
}
