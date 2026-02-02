/**
 * @flyfront/ui - Select Component
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
  ElementRef,
  inject,
  HostListener,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

export interface SelectOption<T = unknown> {
  value: T;
  label: string;
  disabled?: boolean;
  group?: string;
}

@Component({
  selector: 'fly-select',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SelectComponent),
      multi: true,
    },
  ],
  template: `
    <div class="w-full" [class.opacity-60]="disabled()">
      @if (label()) {
        <label class="block text-sm font-medium text-neutral-700 mb-1" [for]="inputId">
          {{ label() }}
          @if (required()) {
            <span class="text-error-500 ml-0.5">*</span>
          }
        </label>
      }

      <div class="relative">
        <button
          type="button"
          [id]="inputId"
          class="w-full flex items-center justify-between px-3 py-2 text-left border border-neutral-300 rounded-md shadow-xs bg-white text-neutral-900 cursor-pointer transition-all focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-neutral-100 disabled:cursor-not-allowed"
          [disabled]="disabled()"
          [attr.aria-expanded]="isOpen()"
          [attr.aria-haspopup]="'listbox'"
          (click)="toggleDropdown()"
          (keydown)="onKeyDown($event)"
        >
          <span class="flex-1 overflow-hidden text-ellipsis whitespace-nowrap">
            @if (selectedOption()) {
              {{ selectedOption()?.label }}
            } @else {
              <span class="text-neutral-400">{{ placeholder() }}</span>
            }
          </span>
          <svg
            class="w-5 h-5 text-neutral-400 transition-transform duration-200"
            [class.rotate-180]="isOpen()"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fill-rule="evenodd"
              d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
              clip-rule="evenodd"
            />
          </svg>
        </button>

        @if (isOpen()) {
          <div class="absolute z-50 w-full mt-1 bg-white border border-neutral-300 rounded-md shadow-lg max-h-60 overflow-auto" role="listbox">
            @if (searchable()) {
              <div class="p-2 border-b border-neutral-200">
                <input
                  type="text"
                  class="w-full px-3 py-2 text-sm border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Search..."
                  [value]="searchQuery()"
                  (input)="onSearchInput($event)"
                  (keydown)="onSearchKeyDown($event)"
                />
              </div>
            }

            <div class="py-1">
              @for (option of filteredOptions(); track option.value) {
                <button
                  type="button"
                  class="w-full flex items-center justify-between px-3 py-2 text-left text-neutral-900 bg-transparent border-none cursor-pointer transition-colors hover:bg-neutral-100 focus:outline-none focus:bg-neutral-100 disabled:text-neutral-400 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                  [class.bg-primary-50]="isSelected(option)"
                  [class.text-primary-700]="isSelected(option)"
                  [disabled]="option.disabled"
                  role="option"
                  [attr.aria-selected]="isSelected(option)"
                  (click)="selectOption(option)"
                >
                  {{ option.label }}
                  @if (isSelected(option)) {
                    <svg class="w-5 h-5 text-primary-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                    </svg>
                  }
                </button>
              }

              @if (filteredOptions().length === 0) {
                <div class="px-3 py-2 text-sm text-neutral-500 text-center">No options found</div>
              }
            </div>
          </div>
        }
      </div>

      @if (hint() && !error()) {
        <p class="mt-1 text-sm text-neutral-500">{{ hint() }}</p>
      }

      @if (error()) {
        <p class="mt-1 text-sm text-error-600">{{ error() }}</p>
      }
    </div>
  `,
})
export class SelectComponent<T = unknown> implements ControlValueAccessor {
  private readonly elementRef = inject(ElementRef);

  // Inputs
  readonly options = input<SelectOption<T>[]>([]);
  readonly label = input<string>('');
  readonly placeholder = input<string>('Select an option');
  readonly hint = input<string>('');
  readonly error = input<string>('');
  readonly disabled = input<boolean>(false);
  readonly required = input<boolean>(false);
  readonly searchable = input<boolean>(false);
  readonly clearable = input<boolean>(false);

  // Outputs
  readonly valueChange = output<T | null>();
  readonly opened = output<void>();
  readonly closed = output<void>();

  // State
  readonly isOpen = signal(false);
  readonly searchQuery = signal('');
  private readonly _value = signal<T | null>(null);

  // Computed
  readonly selectedOption = computed(() => {
    const value = this._value();
    return this.options().find((opt) => opt.value === value) ?? null;
  });

  readonly filteredOptions = computed(() => {
    const query = this.searchQuery().toLowerCase();
    if (!query) return this.options();
    return this.options().filter((opt) => opt.label.toLowerCase().includes(query));
  });

  // Generate unique ID
  readonly inputId = `fly-select-${Math.random().toString(36).substring(2, 9)}`;

  // ControlValueAccessor
  private onChange: (value: T | null) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(value: T | null): void {
    this._value.set(value);
  }

  registerOnChange(fn: (value: T | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    // Handled by input
  }

  // Methods
  toggleDropdown(): void {
    if (this.disabled()) return;

    if (this.isOpen()) {
      this.closeDropdown();
    } else {
      this.openDropdown();
    }
  }

  openDropdown(): void {
    this.isOpen.set(true);
    this.searchQuery.set('');
    this.opened.emit();
  }

  closeDropdown(): void {
    this.isOpen.set(false);
    this.searchQuery.set('');
    this.onTouched();
    this.closed.emit();
  }

  selectOption(option: SelectOption<T>): void {
    if (option.disabled) return;

    this._value.set(option.value);
    this.onChange(option.value);
    this.valueChange.emit(option.value);
    this.closeDropdown();
  }

  isSelected(option: SelectOption<T>): boolean {
    return this._value() === option.value;
  }

  onSearchInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchQuery.set(input.value);
  }

  onKeyDown(event: KeyboardEvent): void {
    switch (event.key) {
      case 'Enter':
      case ' ':
        event.preventDefault();
        this.toggleDropdown();
        break;
      case 'Escape':
        this.closeDropdown();
        break;
      case 'ArrowDown':
        event.preventDefault();
        if (!this.isOpen()) {
          this.openDropdown();
        }
        break;
    }
  }

  onSearchKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.closeDropdown();
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.closeDropdown();
    }
  }
}
