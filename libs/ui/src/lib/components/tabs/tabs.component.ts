/**
 * @flyfront/ui - Tabs Component
 * @license Apache-2.0
 */

import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  signal,
  computed,
  contentChildren,
  AfterContentInit,
  Directive,
  TemplateRef,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';

export interface Tab {
  id: string;
  label: string;
  disabled?: boolean;
  icon?: string;
}

@Directive({
  selector: '[flyTabContent]',
  standalone: true,
})
export class TabContentDirective {
  readonly templateRef = inject(TemplateRef);
  readonly tabId = input.required<string>({ alias: 'flyTabContent' });
}

@Component({
  selector: 'fly-tabs',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col">
      <div [class]="tabListClasses()" role="tablist" [attr.aria-label]="ariaLabel()">
        @for (tab of tabs(); track tab.id; let i = $index) {
          <button
            type="button"
            [class]="getTabClasses(tab)"
            role="tab"
            [id]="'tab-' + tab.id"
            [attr.aria-selected]="activeTab() === tab.id"
            [attr.aria-controls]="'panel-' + tab.id"
            [attr.tabindex]="activeTab() === tab.id ? 0 : -1"
            [disabled]="tab.disabled"
            (click)="selectTab(tab)"
            (keydown)="onKeydown($event, i)"
          >
            @if (tab.icon) {
              <span class="flex items-center justify-center w-5 h-5" [innerHTML]="tab.icon"></span>
            }
            <span>{{ tab.label }}</span>
          </button>
        }
        @if (variant() === 'underline') {
          <div class="absolute bottom-[-1px] h-0.5 bg-blue-600 transition-all duration-200" [style.left.px]="indicatorLeft()" [style.width.px]="indicatorWidth()"></div>
        }
      </div>
      <div class="pt-4">
        @for (tab of tabs(); track tab.id) {
          <div
            class="animate-fade-in"
            role="tabpanel"
            [id]="'panel-' + tab.id"
            [attr.aria-labelledby]="'tab-' + tab.id"
            [hidden]="activeTab() !== tab.id"
          >
            @if (activeTab() === tab.id) {
              <ng-container *ngTemplateOutlet="getTabTemplate(tab.id)" />
            }
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    .animate-fade-in { animation: fadeIn 150ms ease-out; }
  `],
})
export class TabsComponent implements AfterContentInit {
  readonly tabs = input<Tab[]>([]);
  readonly activeTabId = input<string>('');
  readonly variant = input<'underline' | 'pill' | 'boxed'>('underline');
  readonly ariaLabel = input<string>('Tabs');
  readonly tabChange = output<string>();

  readonly tabContents = contentChildren(TabContentDirective);

  private readonly _activeTab = signal<string>('');
  readonly activeTab = computed(() => this._activeTab() || this.activeTabId() || this.tabs()[0]?.id || '');

  readonly indicatorLeft = signal(0);
  readonly indicatorWidth = signal(0);

  readonly tabListClasses = computed(() => {
    const v = this.variant();
    const base = 'relative flex';
    switch (v) {
      case 'pill':
        return `${base} gap-1 p-1 bg-gray-100 rounded-lg`;
      case 'boxed':
        return `${base} gap-0`;
      default:
        return `${base} gap-0 border-b border-gray-200`;
    }
  });

  getTabClasses(tab: Tab): string {
    const v = this.variant();
    const isActive = this.activeTab() === tab.id;
    const isDisabled = tab.disabled;
    
    const base = 'flex items-center gap-2 py-3 px-4 text-sm font-medium bg-transparent border-none cursor-pointer transition-all relative focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-inset';
    
    if (isDisabled) {
      return `${base} opacity-50 cursor-not-allowed text-gray-500`;
    }
    
    switch (v) {
      case 'pill':
        return isActive
          ? `${base} rounded-md bg-white text-gray-900 shadow-sm`
          : `${base} rounded-md text-gray-500 hover:text-gray-700`;
      case 'boxed':
        return isActive
          ? `${base} border border-gray-200 border-b-white bg-white rounded-t-lg -mb-px`
          : `${base} border border-transparent border-b-gray-200 -mb-px text-gray-500 hover:text-gray-700`;
      default:
        return isActive
          ? `${base} text-blue-600`
          : `${base} text-gray-500 hover:text-gray-700`;
    }
  }

  ngAfterContentInit(): void {
    // Initialize active tab
    if (!this._activeTab() && this.tabs().length > 0) {
      const firstEnabled = this.tabs().find((t) => !t.disabled);
      if (firstEnabled) {
        this._activeTab.set(firstEnabled.id);
      }
    }
    // Update indicator position after render
    setTimeout(() => this.updateIndicator(), 0);
  }

  selectTab(tab: Tab): void {
    if (tab.disabled) return;
    this._activeTab.set(tab.id);
    this.tabChange.emit(tab.id);
    setTimeout(() => this.updateIndicator(), 0);
  }

  onKeydown(event: KeyboardEvent, index: number): void {
    const tabsList = this.tabs();
    let newIndex = index;

    switch (event.key) {
      case 'ArrowLeft':
        newIndex = index === 0 ? tabsList.length - 1 : index - 1;
        break;
      case 'ArrowRight':
        newIndex = index === tabsList.length - 1 ? 0 : index + 1;
        break;
      case 'Home':
        newIndex = 0;
        break;
      case 'End':
        newIndex = tabsList.length - 1;
        break;
      default:
        return;
    }

    event.preventDefault();
    const newTab = tabsList[newIndex];
    if (newTab && !newTab.disabled) {
      this.selectTab(newTab);
      const tabEl = document.getElementById(`tab-${newTab.id}`);
      tabEl?.focus();
    }
  }

  getTabTemplate(tabId: string): TemplateRef<unknown> | null {
    const content = this.tabContents().find((c) => c.tabId() === tabId);
    return content?.templateRef ?? null;
  }

  private updateIndicator(): void {
    const activeTabEl = document.getElementById(`tab-${this.activeTab()}`);
    if (activeTabEl) {
      const listEl = activeTabEl.parentElement;
      if (listEl) {
        this.indicatorLeft.set(activeTabEl.offsetLeft);
        this.indicatorWidth.set(activeTabEl.offsetWidth);
      }
    }
  }
}
