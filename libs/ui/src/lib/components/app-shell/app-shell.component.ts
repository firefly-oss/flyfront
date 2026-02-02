/**
 * @flyfront/ui - AppShell Layout Component
 * @license Apache-2.0
 */

import {
  Component,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
  signal,
  booleanAttribute,
} from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * AppShell layout component providing a standard application layout
 * with header, sidebar, and main content area.
 *
 * @example
 * ```html
 * <fly-app-shell
 *   [sidebarOpen]="sidebarOpen"
 *   (sidebarToggle)="toggleSidebar()"
 * >
 *   <fly-shell-header>
 *     <!-- Header content -->
 *   </fly-shell-header>
 *
 *   <fly-shell-sidebar>
 *     <!-- Sidebar content -->
 *   </fly-shell-sidebar>
 *
 *   <fly-shell-content>
 *     <!-- Main content -->
 *   </fly-shell-content>
 * </fly-app-shell>
 * ```
 */
@Component({
  selector: 'fly-app-shell',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div [class]="shellClasses()">
      <header class="col-span-full lg:col-span-2 flex items-center gap-4 px-6 bg-white border-b border-gray-200 sticky top-0 z-[100] h-16">
        <button
          class="flex lg:hidden items-center justify-center w-10 h-10 bg-transparent border-none rounded cursor-pointer text-gray-500 transition-all hover:bg-gray-100 hover:text-gray-900"
          (click)="toggleSidebar()"
          aria-label="Toggle sidebar"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="3" y1="12" x2="21" y2="12"/>
            <line x1="3" y1="6" x2="21" y2="6"/>
            <line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        </button>
        <ng-content select="fly-shell-header"></ng-content>
      </header>

      <aside [class]="sidebarClasses()">
        <ng-content select="fly-shell-sidebar"></ng-content>
      </aside>

      <main class="p-6 overflow-y-auto">
        <ng-content select="fly-shell-content"></ng-content>
      </main>

      @if (sidebarOpen && hasOverlay) {
        <div
          class="lg:hidden fixed inset-0 top-16 bg-black/50 z-[90]"
          (click)="closeSidebar()"
          aria-hidden="true"
        ></div>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppShellComponent {
  /** Whether the sidebar is open */
  @Input() sidebarOpen = true;

  /** Whether to show overlay on mobile when sidebar is open */
  @Input({ transform: booleanAttribute }) hasOverlay = true;

  /** Event emitted when sidebar toggle is requested */
  @Output() sidebarToggle = new EventEmitter<boolean>();

  shellClasses(): string {
    const base = 'grid min-h-screen bg-gray-100';
    // Desktop: 2-column layout (sidebar + content), Mobile: 1-column
    const gridCols = this.sidebarOpen
      ? 'grid-cols-1 lg:grid-cols-[16rem_1fr]'
      : 'grid-cols-1 lg:grid-cols-[4rem_1fr]';
    const gridRows = 'grid-rows-[4rem_1fr]';
    return `${base} ${gridCols} ${gridRows}`;
  }

  sidebarClasses(): string {
    const base = 'bg-white border-r border-gray-200 overflow-y-auto overflow-x-hidden transition-transform duration-200';
    // Desktop: normal flow. Mobile: fixed overlay
    const position = 'lg:relative fixed lg:translate-x-0 top-16 lg:top-0 left-0 bottom-0 w-64 z-[95]';
    const transform = this.sidebarOpen ? 'translate-x-0' : '-translate-x-full';
    return `${base} ${position} ${transform}`;
  }

  toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
    this.sidebarToggle.emit(this.sidebarOpen);
  }

  closeSidebar(): void {
    this.sidebarOpen = false;
    this.sidebarToggle.emit(false);
  }
}

/**
 * Shell header component
 */
@Component({
  selector: 'fly-shell-header',
  standalone: true,
  template: `
    <div class="flex items-center gap-4 flex-1">
      <ng-content></ng-content>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShellHeaderComponent {}

/**
 * Shell sidebar component
 */
@Component({
  selector: 'fly-shell-sidebar',
  standalone: true,
  template: `
    <nav class="flex flex-col h-full p-4">
      <ng-content></ng-content>
    </nav>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShellSidebarComponent {}

/**
 * Shell content component
 */
@Component({
  selector: 'fly-shell-content',
  standalone: true,
  template: `
    <div class="w-full max-w-7xl mx-auto">
      <ng-content></ng-content>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShellContentComponent {}
