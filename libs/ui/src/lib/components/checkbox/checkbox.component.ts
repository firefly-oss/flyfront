/**
 * @flyfront/ui - Checkbox Component
 * @license Apache-2.0
 */

import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  signal,
  forwardRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'fly-checkbox',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CheckboxComponent),
      multi: true,
    },
  ],
  template: `
    <label class="inline-flex items-center cursor-pointer select-none" [class.opacity-50]="disabled()" [class.cursor-not-allowed]="disabled()">
      <input
        type="checkbox"
        class="sr-only peer"
        [checked]="checked()"
        [disabled]="disabled()"
        [indeterminate]="indeterminate()"
        [attr.aria-checked]="indeterminate() ? 'mixed' : checked()"
        (change)="onCheckboxChange($event)"
      />
      <span
        class="w-5 h-5 flex items-center justify-center border-2 rounded transition-all duration-200 bg-white peer-focus:ring-2 peer-focus:ring-primary-500/30 peer-focus:border-primary-500"
        [class.border-neutral-300]="!checked() && !indeterminate()"
        [class.bg-primary-600]="checked() || indeterminate()"
        [class.border-primary-600]="checked() || indeterminate()"
        [class.bg-neutral-100]="disabled() && !checked()"
      >
        @if (checked() && !indeterminate()) {
          <svg class="w-4 h-4 text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
          </svg>
        }
        @if (indeterminate()) {
          <svg class="w-4 h-4 text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clip-rule="evenodd" />
          </svg>
        }
      </span>
      @if (label()) {
        <span class="ml-2 text-neutral-700 text-sm">{{ label() }}</span>
      }
      <ng-content />
    </label>
  `,
})
export class CheckboxComponent implements ControlValueAccessor {
  readonly label = input<string>('');
  readonly disabled = input<boolean>(false);
  readonly indeterminate = input<boolean>(false);
  readonly checkedChange = output<boolean>();
  readonly checked = signal(false);

  private onChange: (value: boolean) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(value: boolean): void {
    this.checked.set(!!value);
  }

  registerOnChange(fn: (value: boolean) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {}

  onCheckboxChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = input.checked;
    this.checked.set(value);
    this.onChange(value);
    this.onTouched();
    this.checkedChange.emit(value);
  }
}
