/**
 * @flyfront/ui - Radio Components
 * @license Apache-2.0
 */

import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  signal,
  forwardRef,
  ContentChildren,
  QueryList,
  AfterContentInit,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';

export interface RadioOption<T = unknown> {
  value: T;
  label: string;
  disabled?: boolean;
}

@Component({
  selector: 'fly-radio',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <label class="inline-flex items-center cursor-pointer select-none" [class.opacity-50]="disabled()" [class.cursor-not-allowed]="disabled()">
      <input
        type="radio"
        class="sr-only peer"
        [name]="name()"
        [value]="value()"
        [checked]="checked()"
        [disabled]="disabled()"
        (change)="onRadioChange()"
      />
      <span
        class="w-5 h-5 flex items-center justify-center border-2 rounded-full transition-all duration-200 bg-white peer-focus:ring-2 peer-focus:ring-primary-500/30 peer-focus:border-primary-500"
        [class.border-neutral-300]="!checked()"
        [class.border-primary-600]="checked()"
      >
        @if (checked()) {
          <span class="w-2.5 h-2.5 rounded-full bg-primary-600"></span>
        }
      </span>
      @if (label()) {
        <span class="ml-2 text-neutral-700 text-sm">{{ label() }}</span>
      }
      <ng-content />
    </label>
  `,
})
export class RadioComponent<T = unknown> {
  readonly name = input<string>('');
  readonly value = input.required<T>();
  readonly label = input<string>('');
  readonly disabled = input<boolean>(false);
  readonly checked = input<boolean>(false);
  readonly selected = output<T>();

  onRadioChange(): void {
    this.selected.emit(this.value());
  }
}

@Component({
  selector: 'fly-radio-group',
  standalone: true,
  imports: [CommonModule, RadioComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => RadioGroupComponent),
      multi: true,
    },
  ],
  template: `
    <fieldset class="border-0 p-0 m-0">
      @if (label()) {
        <legend class="block text-sm font-medium text-neutral-700 mb-2">
          {{ label() }}
          @if (required()) {
            <span class="text-error-500 ml-0.5">*</span>
          }
        </legend>
      }

      <div class="flex gap-2" [class.flex-col]="!inline()" [class.flex-row]="inline()" [class.flex-wrap]="inline()" [class.gap-4]="inline()">
        @for (option of options(); track option.value) {
          <fly-radio
            [name]="groupName"
            [value]="option.value"
            [label]="option.label"
            [disabled]="option.disabled || disabled()"
            [checked]="isSelected(option.value)"
            (selected)="selectOption($event)"
          />
        }
        <ng-content />
      </div>

      @if (hint() && !error()) {
        <p class="mt-1 text-sm text-neutral-500">{{ hint() }}</p>
      }
      @if (error()) {
        <p class="mt-1 text-sm text-error-600">{{ error() }}</p>
      }
    </fieldset>
  `,
})
export class RadioGroupComponent<T = unknown> implements ControlValueAccessor, AfterContentInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();

  @ContentChildren(RadioComponent) radioButtons!: QueryList<RadioComponent<T>>;

  readonly options = input<RadioOption<T>[]>([]);
  readonly label = input<string>('');
  readonly hint = input<string>('');
  readonly error = input<string>('');
  readonly disabled = input<boolean>(false);
  readonly required = input<boolean>(false);
  readonly inline = input<boolean>(false);
  readonly valueChange = output<T>();

  private readonly _value = signal<T | null>(null);
  readonly groupName = `fly-radio-group-${Math.random().toString(36).substring(2, 9)}`;

  private onChange: (value: T | null) => void = () => {};
  private onTouched: () => void = () => {};

  ngAfterContentInit(): void {
    this.radioButtons?.changes.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.setupRadioListeners();
    });
    this.setupRadioListeners();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupRadioListeners(): void {
    this.radioButtons?.forEach((radio) => {
      radio.selected.subscribe((value: T) => {
        this.selectOption(value);
      });
    });
  }

  writeValue(value: T | null): void {
    this._value.set(value);
  }

  registerOnChange(fn: (value: T | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {}

  isSelected(value: T): boolean {
    return this._value() === value;
  }

  selectOption(value: T): void {
    this._value.set(value);
    this.onChange(value);
    this.onTouched();
    this.valueChange.emit(value);
  }
}
