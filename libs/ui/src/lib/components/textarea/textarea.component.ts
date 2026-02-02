/**
 * @flyfront/ui - Textarea Component
 * @license Apache-2.0
 */

import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  signal,
  computed,
  forwardRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'fly-textarea',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => TextareaComponent),
      multi: true,
    },
  ],
  template: `
    <div class="w-full">
      @if (label()) {
        <label class="block text-sm font-medium text-neutral-700 mb-1" [for]="inputId">
          {{ label() }}
          @if (required()) {
            <span class="text-error-500 ml-0.5">*</span>
          }
        </label>
      }

      <div class="relative">
        <textarea
          [id]="inputId"
          class="w-full px-3 py-2 border rounded-md shadow-xs text-neutral-900 text-sm leading-relaxed font-inherit transition-all placeholder:text-neutral-400 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 disabled:bg-neutral-100 disabled:cursor-not-allowed"
          [class.border-error-500]="error()"
          [class.focus:border-error-500]="error()"
          [class.focus:ring-error-500/20]="error()"
          [class.border-neutral-300]="!error()"
          [class.resize-none]="resize() === 'none'"
          [class.resize-y]="resize() === 'vertical'"
          [class.resize-x]="resize() === 'horizontal'"
          [class.resize]="resize() === 'both'"
          [placeholder]="placeholder()"
          [disabled]="disabled()"
          [readonly]="readonly()"
          [rows]="rows()"
          [attr.maxlength]="maxLength() || null"
          [value]="value()"
          (input)="onInput($event)"
          (blur)="onBlur()"
        ></textarea>
      </div>

      <div class="flex justify-between items-center mt-1">
        @if (hint() && !error()) {
          <p class="text-sm text-neutral-500 m-0">{{ hint() }}</p>
        }
        @if (error()) {
          <p class="text-sm text-error-600 m-0">{{ error() }}</p>
        }
        @if (showCount() && maxLength()) {
          <p class="text-sm m-0 ml-auto" [class.text-neutral-400]="!isAtLimit()" [class.text-error-500]="isAtLimit()">
            {{ value().length }} / {{ maxLength() }}
          </p>
        }
      </div>
    </div>
  `,
})
export class TextareaComponent implements ControlValueAccessor {
  readonly label = input<string>('');
  readonly placeholder = input<string>('');
  readonly hint = input<string>('');
  readonly error = input<string>('');
  readonly disabled = input<boolean>(false);
  readonly readonly = input<boolean>(false);
  readonly required = input<boolean>(false);
  readonly rows = input<number>(4);
  readonly maxLength = input<number | undefined>(undefined);
  readonly showCount = input<boolean>(false);
  readonly resize = input<'none' | 'vertical' | 'horizontal' | 'both'>('vertical');

  readonly valueChange = output<string>();
  readonly value = signal('');

  readonly isAtLimit = computed(() => {
    const max = this.maxLength();
    return max ? this.value().length >= max : false;
  });

  readonly inputId = `fly-textarea-${Math.random().toString(36).substring(2, 9)}`;

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

  setDisabledState(isDisabled: boolean): void {}

  onInput(event: Event): void {
    const input = event.target as HTMLTextAreaElement;
    const newValue = input.value;
    this.value.set(newValue);
    this.onChange(newValue);
    this.valueChange.emit(newValue);
  }

  onBlur(): void {
    this.onTouched();
  }
}
