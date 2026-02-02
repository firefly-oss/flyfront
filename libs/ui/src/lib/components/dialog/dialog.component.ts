/**
 * @flyfront/ui - Dialog Component
 * @license Apache-2.0
 */

import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  signal,
  computed,
  inject,
  Injectable,
  TemplateRef,
  ViewContainerRef,
  ComponentRef,
  Type,
  OnDestroy,
  effect,
  PLATFORM_ID,
} from '@angular/core';
import { CommonModule, isPlatformBrowser, DOCUMENT } from '@angular/common';
import { Subject } from 'rxjs';

export interface DialogConfig<T = unknown> {
  title?: string;
  content?: string | TemplateRef<unknown> | Type<unknown>;
  data?: T;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  closable?: boolean;
  closeOnBackdrop?: boolean;
  closeOnEscape?: boolean;
  showFooter?: boolean;
  confirmText?: string;
  cancelText?: string;
}

export interface DialogRef<R = unknown> {
  close: (result?: R) => void;
  afterClosed: () => Subject<R | undefined>;
}

@Component({
  selector: 'fly-dialog',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (isOpen()) {
      <div class="fixed inset-0 z-[1050] flex items-center justify-center bg-black/50 transition-opacity duration-200" (click)="onBackdropClick()">
        <div
          [class]="dialogClasses()"
          role="dialog"
          aria-modal="true"
          [attr.aria-labelledby]="title() ? dialogTitleId : null"
          (click)="$event.stopPropagation()"
        >
          <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            @if (title()) {
              <h2 [id]="dialogTitleId" class="text-lg font-semibold text-gray-900 m-0">{{ title() }}</h2>
            }
            @if (closable()) {
              <button type="button" class="p-1 rounded-md text-gray-400 bg-transparent border-none cursor-pointer transition-colors hover:text-gray-500 hover:bg-gray-100" aria-label="Close dialog" (click)="close()">
                <svg class="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                </svg>
              </button>
            }
          </div>
          <div class="flex-1 overflow-y-auto px-6 py-4">
            <ng-content />
          </div>
          @if (showFooter()) {
            <div class="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200">
              <ng-content select="[dialog-footer]" />
              @if (!hasCustomFooter) {
                <button type="button" class="py-2 px-4 text-sm font-medium rounded-md cursor-pointer transition-all bg-white text-gray-700 border border-gray-300 hover:bg-gray-50" (click)="onCancel()">
                  {{ cancelText() }}
                </button>
                <button type="button" class="py-2 px-4 text-sm font-medium rounded-md cursor-pointer transition-all bg-blue-600 text-white border-none hover:bg-blue-700" (click)="onConfirm()">
                  {{ confirmText() }}
                </button>
              }
            </div>
          }
        </div>
      </div>
    }
  `,
})
export class DialogComponent implements OnDestroy {
  private readonly document = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);

  readonly title = input<string>('');
  readonly size = input<'sm' | 'md' | 'lg' | 'xl' | 'full'>('md');
  readonly closable = input<boolean>(true);
  readonly closeOnBackdrop = input<boolean>(true);
  readonly closeOnEscape = input<boolean>(true);
  readonly showFooter = input<boolean>(true);
  readonly confirmText = input<string>('Confirm');
  readonly cancelText = input<string>('Cancel');

  readonly closed = output<void>();
  readonly confirmed = output<void>();
  readonly cancelled = output<void>();

  readonly isOpen = signal(false);
  hasCustomFooter = false;

  readonly dialogTitleId = `fly-dialog-title-${Math.random().toString(36).substring(2, 9)}`;

  private readonly sizeClasses: Record<string, string> = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    full: 'max-w-4xl',
  };

  readonly dialogClasses = computed(() => {
    const s = this.size();
    return `bg-white rounded-lg shadow-2xl flex flex-col max-h-[90vh] w-full ${this.sizeClasses[s]}`;
  });

  private keydownListener?: (event: KeyboardEvent) => void;

  constructor() {
    effect(() => {
      if (this.isOpen() && isPlatformBrowser(this.platformId)) {
        this.document.body.style.overflow = 'hidden';
        this.setupEscapeListener();
      } else if (isPlatformBrowser(this.platformId)) {
        this.document.body.style.overflow = '';
        this.removeEscapeListener();
      }
    });
  }

  ngOnDestroy(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.document.body.style.overflow = '';
      this.removeEscapeListener();
    }
  }

  private setupEscapeListener(): void {
    if (!this.closeOnEscape()) return;
    this.keydownListener = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        this.close();
      }
    };
    this.document.addEventListener('keydown', this.keydownListener);
  }

  private removeEscapeListener(): void {
    if (this.keydownListener) {
      this.document.removeEventListener('keydown', this.keydownListener);
      this.keydownListener = undefined;
    }
  }

  open(): void {
    this.isOpen.set(true);
  }

  close(): void {
    this.isOpen.set(false);
    this.closed.emit();
  }

  onBackdropClick(): void {
    if (this.closeOnBackdrop()) {
      this.close();
    }
  }

  onConfirm(): void {
    this.confirmed.emit();
    this.close();
  }

  onCancel(): void {
    this.cancelled.emit();
    this.close();
  }
}

@Injectable({ providedIn: 'root' })
export class DialogService {
  private activeDialogs: ComponentRef<DialogComponent>[] = [];

  open<T = unknown, R = unknown>(viewContainerRef: ViewContainerRef, config: DialogConfig<T>): DialogRef<R> {
    const componentRef = viewContainerRef.createComponent(DialogComponent);
    const instance = componentRef.instance;

    instance.open();
    this.activeDialogs.push(componentRef);

    const afterClosed$ = new Subject<R | undefined>();

    instance.closed.subscribe(() => {
      afterClosed$.next(undefined);
      afterClosed$.complete();
      this.destroyDialog(componentRef);
    });

    return {
      close: (result?: R) => {
        afterClosed$.next(result);
        afterClosed$.complete();
        instance.close();
      },
      afterClosed: () => afterClosed$,
    };
  }

  closeAll(): void {
    this.activeDialogs.forEach((ref) => ref.instance.close());
  }

  private destroyDialog(componentRef: ComponentRef<DialogComponent>): void {
    const index = this.activeDialogs.indexOf(componentRef);
    if (index > -1) {
      this.activeDialogs.splice(index, 1);
    }
    componentRef.destroy();
  }
}
