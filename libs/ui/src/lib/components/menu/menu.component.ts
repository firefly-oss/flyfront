/**
 * @flyfront/ui - Menu Component
 * @license Apache-2.0
 */

import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  signal,
  computed,
  ElementRef,
  inject,
  OnDestroy,
  Directive,
  HostListener,
} from '@angular/core';
import { CommonModule } from '@angular/common';

export interface MenuItem {
  id: string;
  label: string;
  icon?: string;
  disabled?: boolean;
  divider?: boolean;
  children?: MenuItem[];
  data?: unknown;
}

@Directive({
  selector: '[flyMenuTrigger]',
  standalone: true,
})
export class MenuTriggerDirective {
  readonly menuRef = input.required<MenuComponent>({ alias: 'flyMenuTrigger' });

  @HostListener('click', ['$event'])
  onClick(event: MouseEvent): void {
    event.stopPropagation();
    this.menuRef().toggle(event);
  }

  @HostListener('keydown.enter', ['$event'])
  @HostListener('keydown.space', ['$event'])
  onKeydown(event: Event): void {
    event.preventDefault();
    this.menuRef().toggle(event);
  }
}

@Component({
  selector: 'fly-menu',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (isOpen()) {
      <div class="fixed inset-0 z-[999]" (click)="close()"></div>
      <div
        class="fixed z-[1000] min-w-40 max-w-70 p-1 bg-white border border-gray-200 rounded-lg shadow-lg animate-menu-fade-in"
        [style.top.px]="menuTop()"
        [style.left.px]="menuLeft()"
        role="menu"
        [attr.aria-label]="ariaLabel()"
      >
        @for (item of items(); track item.id) {
          @if (item.divider) {
            <div class="h-px my-1 bg-gray-200" role="separator"></div>
          } @else {
            <button
              type="button"
              [class]="getItemClasses(item)"
              role="menuitem"
              [attr.aria-disabled]="item.disabled"
              [disabled]="item.disabled"
              (click)="onItemClick(item, $event)"
              (mouseenter)="onItemHover(item)"
            >
              @if (item.icon) {
                <span class="flex items-center justify-center w-4 h-4 shrink-0" [innerHTML]="item.icon"></span>
              }
              <span class="flex-1 whitespace-nowrap overflow-hidden text-ellipsis">{{ item.label }}</span>
              @if (item.children && item.children.length > 0) {
                <svg class="w-4 h-4 shrink-0 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
                </svg>
              }
            </button>
            @if (activeSubmenu() === item.id && item.children && item.children.length > 0) {
              <div class="absolute top-[-0.25rem] left-full min-w-40 max-w-70 p-1 bg-white border border-gray-200 rounded-lg shadow-lg animate-menu-fade-in" role="menu">
                @for (child of item.children; track child.id) {
                  @if (child.divider) {
                    <div class="h-px my-1 bg-gray-200" role="separator"></div>
                  } @else {
                    <button
                      type="button"
                      [class]="getItemClasses(child)"
                      role="menuitem"
                      [attr.aria-disabled]="child.disabled"
                      [disabled]="child.disabled"
                      (click)="onItemClick(child, $event)"
                    >
                      @if (child.icon) {
                        <span class="flex items-center justify-center w-4 h-4 shrink-0" [innerHTML]="child.icon"></span>
                      }
                      <span class="flex-1 whitespace-nowrap overflow-hidden text-ellipsis">{{ child.label }}</span>
                    </button>
                  }
                }
              </div>
            }
          }
        }
      </div>
    }
  `,
  styles: [`
    @keyframes menuFadeIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
    .animate-menu-fade-in { animation: menuFadeIn 150ms ease-out; }
  `],
})
export class MenuComponent implements OnDestroy {
  private readonly el = inject(ElementRef);

  readonly items = input<MenuItem[]>([]);
  readonly position = input<'bottom-left' | 'bottom-right' | 'top-left' | 'top-right'>('bottom-left');
  readonly ariaLabel = input<string>('Menu');
  readonly itemClick = output<MenuItem>();
  readonly opened = output<void>();
  readonly closed = output<void>();

  readonly isOpen = signal(false);
  readonly menuTop = signal(0);
  readonly menuLeft = signal(0);
  readonly activeSubmenu = signal<string | null>(null);

  private escListener: ((e: KeyboardEvent) => void) | null = null;

  getItemClasses(item: MenuItem): string {
    const base = 'flex items-center gap-2 w-full py-2 px-3 text-sm text-gray-700 bg-transparent border-none rounded-md cursor-pointer text-left transition-colors relative hover:bg-gray-100 focus:outline-none focus:bg-gray-100';
    return item.disabled ? `${base} opacity-50 cursor-not-allowed` : base;
  }

  ngOnDestroy(): void {
    this.removeEscListener();
  }

  toggle(event: Event): void {
    if (this.isOpen()) {
      this.close();
    } else {
      this.open(event);
    }
  }

  open(event: Event): void {
    const target = event.target as HTMLElement;
    const rect = target.getBoundingClientRect();
    const pos = this.position();

    let top = 0;
    let left = 0;

    switch (pos) {
      case 'bottom-left':
        top = rect.bottom + 4;
        left = rect.left;
        break;
      case 'bottom-right':
        top = rect.bottom + 4;
        left = rect.right;
        break;
      case 'top-left':
        top = rect.top - 4;
        left = rect.left;
        break;
      case 'top-right':
        top = rect.top - 4;
        left = rect.right;
        break;
    }

    this.menuTop.set(top);
    this.menuLeft.set(left);
    this.isOpen.set(true);
    this.opened.emit();
    this.addEscListener();
  }

  close(): void {
    this.isOpen.set(false);
    this.activeSubmenu.set(null);
    this.closed.emit();
    this.removeEscListener();
  }

  onItemClick(item: MenuItem, event: MouseEvent): void {
    event.stopPropagation();
    if (item.disabled) return;
    if (item.children && item.children.length > 0) {
      this.activeSubmenu.set(this.activeSubmenu() === item.id ? null : item.id);
      return;
    }
    this.itemClick.emit(item);
    this.close();
  }

  onItemHover(item: MenuItem): void {
    if (item.children && item.children.length > 0) {
      this.activeSubmenu.set(item.id);
    } else {
      this.activeSubmenu.set(null);
    }
  }

  private addEscListener(): void {
    this.escListener = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        this.close();
      }
    };
    document.addEventListener('keydown', this.escListener);
  }

  private removeEscListener(): void {
    if (this.escListener) {
      document.removeEventListener('keydown', this.escListener);
      this.escListener = null;
    }
  }
}
