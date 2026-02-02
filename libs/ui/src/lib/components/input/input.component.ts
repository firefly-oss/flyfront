/**
 * @flyfront/ui - Input Component
 * @license Apache-2.0
 */

import {
  Component,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
  forwardRef,
  booleanAttribute,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';

/**
 * Input sizes
 */
export type InputSize = 'sm' | 'md' | 'lg';

/**
 * Input types
 */
export type InputType = 'text' | 'password' | 'email' | 'number' | 'tel' | 'url' | 'search';

/**
 * Input component with form control support
 *
 * @example
 * ```html
 * <fly-input
 *   label="Email"
 *   placeholder="Enter your email"
 *   type="email"
 *   [(ngModel)]="email"
 * ></fly-input>
 *
 * <fly-input
 *   label="Password"
 *   type="password"
 *   [error]="passwordError"
 *   [formControl]="passwordControl"
 * ></fly-input>
 * ```
 */
@Component({
  selector: 'fly-input',
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => InputComponent),
      multi: true,
    },
  ],
  template: `
    <div class="flex flex-col gap-1 w-full" [class.opacity-60]="disabled" [class.pointer-events-none]="disabled">
      @if (label) {
        <label [for]="inputId" class="text-sm font-medium text-neutral-900">
          {{ label }}
          @if (required) {
            <span class="text-error-500 ml-0.5">*</span>
          }
        </label>
      }

      <div [class]="containerClasses()">
        @if (prefixIcon) {
          <span class="flex items-center text-neutral-500" [innerHTML]="prefixIcon"></span>
        }

        <input
          [id]="inputId"
          [type]="actualType()"
          [placeholder]="placeholder"
          [disabled]="disabled"
          [readonly]="readonly"
          [required]="required"
          [attr.aria-invalid]="!!error"
          [attr.aria-describedby]="error ? errorId : hint ? hintId : null"
          [value]="value()"
          (input)="onInput($event)"
          (focus)="onFocus()"
          (blur)="onBlur()"
          class="flex-1 border-none outline-none bg-transparent font-inherit text-inherit text-neutral-900 w-full placeholder:text-neutral-400 disabled:cursor-not-allowed"
        />

        @if (type === 'password') {
          <button
            type="button"
            class="flex items-center justify-center bg-transparent border-none cursor-pointer text-neutral-500 p-1 rounded hover:text-neutral-900 transition-colors"
            (click)="togglePasswordVisibility()"
            [attr.aria-label]="showPassword() ? 'Hide password' : 'Show password'"
          >
            @if (showPassword()) {
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                <line x1="1" y1="1" x2="23" y2="23"/>
              </svg>
            } @else {
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
            }
          </button>
        }

        @if (suffixIcon && type !== 'password') {
          <span class="flex items-center text-neutral-500" [innerHTML]="suffixIcon"></span>
        }

        @if (clearable && value() && !disabled) {
          <button
            type="button"
            class="flex items-center justify-center bg-transparent border-none cursor-pointer text-neutral-500 p-1 rounded hover:text-neutral-900 transition-colors"
            (click)="clear()"
            aria-label="Clear input"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        }
      </div>

      @if (error) {
        <p [id]="errorId" class="text-xs text-error-500 m-0" role="alert">
          {{ error }}
        </p>
      } @else if (hint) {
        <p [id]="hintId" class="text-xs text-neutral-500 m-0">
          {{ hint }}
        </p>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InputComponent implements ControlValueAccessor {
  private static idCounter = 0;

  /** Input type */
  @Input() type: InputType = 'text';

  /** Input size */
  @Input() size: InputSize = 'md';

  /** Label text */
  @Input() label?: string;

  /** Placeholder text */
  @Input() placeholder = '';

  /** Hint text */
  @Input() hint?: string;

  /** Error message */
  @Input() error?: string;

  /** Prefix icon HTML */
  @Input() prefixIcon?: string;

  /** Suffix icon HTML */
  @Input() suffixIcon?: string;

  /** Whether the input is disabled */
  @Input({ transform: booleanAttribute }) disabled = false;

  /** Whether the input is readonly */
  @Input({ transform: booleanAttribute }) readonly = false;

  /** Whether the input is required */
  @Input({ transform: booleanAttribute }) required = false;

  /** Whether to show a clear button */
  @Input({ transform: booleanAttribute }) clearable = false;

  /** Value changed event */
  @Output() valueChange = new EventEmitter<string>();

  /** Focus event */
  @Output() inputFocus = new EventEmitter<void>();

  /** Blur event */
  @Output() inputBlur = new EventEmitter<void>();

  protected readonly inputId = `fly-input-${++InputComponent.idCounter}`;
  protected readonly errorId = `${this.inputId}-error`;
  protected readonly hintId = `${this.inputId}-hint`;

  protected readonly value = signal('');
  protected readonly focused = signal(false);
  protected readonly showPassword = signal(false);

  protected readonly actualType = computed(() => {
    if (this.type === 'password') {
      return this.showPassword() ? 'text' : 'password';
    }
    return this.type;
  });

  private readonly sizeClasses: Record<InputSize, string> = {
    sm: 'h-8',
    md: 'h-10',
    lg: 'h-12',
  };

  protected readonly containerClasses = computed(() => {
    const baseClasses = 'flex items-center gap-2 border rounded bg-white transition-all px-3';
    const sizeClass = this.sizeClasses[this.size];
    const focusedClasses = this.focused() ? 'border-primary-500 ring-2 ring-primary-500/20' : 'border-neutral-300 hover:border-neutral-500';
    const errorClasses = this.error ? 'border-error-500 ring-2 ring-error-500/20' : '';
    
    return `${baseClasses} ${sizeClass} ${this.error ? errorClasses : focusedClasses}`;
  });

  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(value: string): void {
    this.value.set(value ?? '');
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  onInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    const value = target.value;
    this.value.set(value);
    this.onChange(value);
    this.valueChange.emit(value);
  }

  onFocus(): void {
    this.focused.set(true);
    this.inputFocus.emit();
  }

  onBlur(): void {
    this.focused.set(false);
    this.onTouched();
    this.inputBlur.emit();
  }

  togglePasswordVisibility(): void {
    this.showPassword.update((show) => !show);
  }

  clear(): void {
    this.value.set('');
    this.onChange('');
    this.valueChange.emit('');
  }
}
