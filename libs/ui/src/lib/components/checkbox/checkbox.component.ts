/**
 * @flyfront/ui - Checkbox Component
 * @license Apache-2.0
 * @copyright 2026 Firefly Software Solutions Inc.
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
    <label class="checkbox-wrapper" [class.is-disabled]="disabled()">
      <input
        type="checkbox"
        class="checkbox-input"
        [checked]="checked()"
        [disabled]="disabled()"
        [indeterminate]="indeterminate()"
        [attr.aria-checked]="indeterminate() ? 'mixed' : checked()"
        (change)="onCheckboxChange($event)"
      />
      <span class="checkbox-box" [class.is-checked]="checked()" [class.is-indeterminate]="indeterminate()">
        @if (checked() && !indeterminate()) {
          <svg class="checkbox-icon" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
          </svg>
        }
        @if (indeterminate()) {
          <svg class="checkbox-icon" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clip-rule="evenodd" />
          </svg>
        }
      </span>
      @if (label()) {
        <span class="checkbox-label">{{ label() }}</span>
      }
      <ng-content />
    </label>
  `,
  styles: [`
    .checkbox-wrapper {
      display: inline-flex;
      align-items: center;
      cursor: pointer;
      user-select: none;
      gap: 8px;
    }
    .checkbox-wrapper.is-disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    .checkbox-input {
      position: absolute;
      opacity: 0;
      width: 0;
      height: 0;
    }
    .checkbox-box {
      width: 20px;
      height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 2px solid #d1d5db;
      border-radius: 4px;
      background: white;
      transition: all 0.15s ease;
      flex-shrink: 0;
    }
    .checkbox-input:focus + .checkbox-box {
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
    }
    .checkbox-box.is-checked,
    .checkbox-box.is-indeterminate {
      background: #3b82f6;
      border-color: #3b82f6;
    }
    .checkbox-icon {
      width: 14px;
      height: 14px;
      color: white;
    }
    .checkbox-label {
      font-size: 14px;
      color: #374151;
    }
  `]
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

  setDisabledState(_isDisabled: boolean): void {
    // Disabled state is handled via input binding
  }

  onCheckboxChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = input.checked;
    this.checked.set(value);
    this.onChange(value);
    this.onTouched();
    this.checkedChange.emit(value);
  }
}
