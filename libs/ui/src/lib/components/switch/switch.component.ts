/**
 * @flyfront/ui - Switch Component
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
  selector: 'fly-switch',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SwitchComponent),
      multi: true,
    },
  ],
  template: `
    <label class="inline-flex items-center cursor-pointer select-none" [class.opacity-50]="disabled()" [class.cursor-not-allowed]="disabled()">
      <input
        type="checkbox"
        class="sr-only peer"
        role="switch"
        [checked]="checked()"
        [disabled]="disabled()"
        [attr.aria-checked]="checked()"
        (change)="onSwitchChange($event)"
      />
      <span
        class="relative inline-flex items-center rounded-full transition-colors duration-200 peer-focus:ring-2 peer-focus:ring-primary-500/30"
        [class.w-11]="size() === 'md'"
        [class.h-6]="size() === 'md'"
        [class.w-8]="size() === 'sm'"
        [class.h-4]="size() === 'sm'"
        [class.w-14]="size() === 'lg'"
        [class.h-8]="size() === 'lg'"
        [class.bg-neutral-200]="!checked()"
        [class.bg-primary-600]="checked()"
      >
        <span
          class="absolute rounded-full bg-white shadow-sm transition-transform duration-200"
          [class.w-5]="size() === 'md'"
          [class.h-5]="size() === 'md'"
          [class.w-3]="size() === 'sm'"
          [class.h-3]="size() === 'sm'"
          [class.w-7]="size() === 'lg'"
          [class.h-7]="size() === 'lg'"
          [class.translate-x-0.5]="!checked()"
          [class.translate-x-checked-md]="checked() && size() === 'md'"
          [class.translate-x-checked-sm]="checked() && size() === 'sm'"
          [class.translate-x-checked-lg]="checked() && size() === 'lg'"
        ></span>
      </span>
      @if (label()) {
        <span
          class="text-neutral-700 text-sm"
          [class.ml-3]="labelPosition() === 'right'"
          [class.mr-3]="labelPosition() === 'left'"
          [class.order-first]="labelPosition() === 'left'"
        >
          {{ label() }}
        </span>
      }
      <ng-content />
    </label>
  `,
  styles: [`
    .translate-x-checked-md { transform: translateX(1.375rem); }
    .translate-x-checked-sm { transform: translateX(1.125rem); }
    .translate-x-checked-lg { transform: translateX(1.625rem); }
  `],
})
export class SwitchComponent implements ControlValueAccessor {
  readonly label = input<string>('');
  readonly disabled = input<boolean>(false);
  readonly size = input<'sm' | 'md' | 'lg'>('md');
  readonly labelPosition = input<'left' | 'right'>('right');
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

  onSwitchChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = input.checked;
    this.checked.set(value);
    this.onChange(value);
    this.onTouched();
    this.checkedChange.emit(value);
  }
}
