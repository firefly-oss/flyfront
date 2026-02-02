/**
 * @flyfront/ui - Toast Component
 * @license Apache-2.0
 */

import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  signal,
  computed,
  Injectable,
  inject,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil, timer } from 'rxjs';

export type ToastType = 'success' | 'error' | 'warning' | 'info';
export type ToastPosition = 'top-right' | 'top-left' | 'top-center' | 'bottom-right' | 'bottom-left' | 'bottom-center';

export interface ToastConfig {
  message: string;
  title?: string;
  type?: ToastType;
  duration?: number;
  dismissible?: boolean;
  position?: ToastPosition;
  action?: { label: string; callback: () => void };
}

export interface Toast extends Required<Omit<ToastConfig, 'action'>> {
  id: string;
  action?: ToastConfig['action'];
}

@Component({
  selector: 'fly-toast-item',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div [class]="toastClasses()" role="alert">
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
      <div class="flex-1">
        @if (title()) {
          <p class="font-medium text-gray-900 m-0 mb-1">{{ title() }}</p>
        }
        <p class="text-sm text-gray-600 m-0">{{ message() }}</p>
        @if (action()) {
          <button type="button" class="mt-2 text-sm font-medium text-blue-600 bg-transparent border-none cursor-pointer p-0 hover:text-blue-700" (click)="onAction()">{{ action()?.label }}</button>
        }
      </div>
      @if (dismissible()) {
        <button type="button" class="shrink-0 p-1 rounded text-gray-400 bg-transparent border-none cursor-pointer hover:text-gray-500" aria-label="Dismiss" (click)="onDismiss()">
          <svg class="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
          </svg>
        </button>
      }
    </div>
  `,
  styles: [`
    @keyframes slideIn { from { opacity: 0; transform: translateX(100%); } to { opacity: 1; transform: translateX(0); } }
    .animate-slide-in { animation: slideIn 200ms ease-out; }
  `],
})
export class ToastItemComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();

  readonly id = input.required<string>();
  readonly type = input<ToastType>('info');
  readonly title = input<string>('');
  readonly message = input.required<string>();
  readonly duration = input<number>(5000);
  readonly dismissible = input<boolean>(true);
  readonly action = input<ToastConfig['action']>();
  readonly dismissed = output<string>();

  private readonly typeStyles: Record<ToastType, { bg: string; border: string; icon: string }> = {
    success: { bg: 'bg-green-50', border: 'border-green-200', icon: 'text-green-500' },
    error: { bg: 'bg-red-50', border: 'border-red-200', icon: 'text-red-500' },
    warning: { bg: 'bg-amber-50', border: 'border-amber-200', icon: 'text-amber-500' },
    info: { bg: 'bg-blue-50', border: 'border-blue-200', icon: 'text-blue-500' },
  };

  readonly toastClasses = computed(() => {
    const t = this.type();
    const styles = this.typeStyles[t];
    return `flex items-start gap-3 p-4 rounded-lg shadow-lg bg-white border min-w-[300px] max-w-md animate-slide-in ${styles.bg} ${styles.border}`;
  });

  readonly iconClasses = computed(() => {
    const t = this.type();
    return `shrink-0 ${this.typeStyles[t].icon}`;
  });

  ngOnInit(): void {
    const duration = this.duration();
    if (duration > 0) {
      timer(duration).pipe(takeUntil(this.destroy$)).subscribe(() => this.onDismiss());
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onDismiss(): void {
    this.dismissed.emit(this.id());
  }

  onAction(): void {
    this.action()?.callback();
    this.onDismiss();
  }
}

@Component({
  selector: 'fly-toast-container',
  standalone: true,
  imports: [CommonModule, ToastItemComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div [class]="containerClasses()">
      @for (toast of toasts(); track toast.id) {
        <fly-toast-item
          [id]="toast.id"
          [type]="toast.type"
          [title]="toast.title"
          [message]="toast.message"
          [duration]="toast.duration"
          [dismissible]="toast.dismissible"
          [action]="toast.action"
          (dismissed)="removeToast($event)"
        />
      }
    </div>
  `,
})
export class ToastContainerComponent {
  private readonly toastService = inject(ToastService);
  readonly toasts = this.toastService.toasts;

  private readonly positionClasses: Record<ToastPosition, string> = {
    'top-right': 'top-0 right-0',
    'top-left': 'top-0 left-0',
    'top-center': 'top-0 left-1/2 -translate-x-1/2',
    'bottom-right': 'bottom-0 right-0',
    'bottom-left': 'bottom-0 left-0',
    'bottom-center': 'bottom-0 left-1/2 -translate-x-1/2',
  };

  readonly containerClasses = computed(() => {
    const pos = this.toastService.position();
    return `fixed z-[1100] flex flex-col gap-2 p-4 ${this.positionClasses[pos]}`;
  });

  removeToast(id: string): void {
    this.toastService.dismiss(id);
  }
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly _toasts = signal<Toast[]>([]);
  private readonly _position = signal<ToastPosition>('top-right');

  readonly toasts = this._toasts.asReadonly();
  readonly position = this._position.asReadonly();

  private generateId(): string {
    return `toast-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  setPosition(position: ToastPosition): void {
    this._position.set(position);
  }

  show(config: ToastConfig): string {
    const toast: Toast = {
      id: this.generateId(),
      message: config.message,
      title: config.title ?? '',
      type: config.type ?? 'info',
      duration: config.duration ?? 5000,
      dismissible: config.dismissible ?? true,
      position: config.position ?? this._position(),
      action: config.action,
    };
    this._toasts.update((toasts) => [...toasts, toast]);
    return toast.id;
  }

  success(message: string, title?: string): string {
    return this.show({ message, title, type: 'success' });
  }

  error(message: string, title?: string): string {
    return this.show({ message, title, type: 'error' });
  }

  warning(message: string, title?: string): string {
    return this.show({ message, title, type: 'warning' });
  }

  info(message: string, title?: string): string {
    return this.show({ message, title, type: 'info' });
  }

  dismiss(id: string): void {
    this._toasts.update((toasts) => toasts.filter((t) => t.id !== id));
  }

  dismissAll(): void {
    this._toasts.set([]);
  }
}
