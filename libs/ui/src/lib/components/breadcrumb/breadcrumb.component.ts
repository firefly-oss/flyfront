/**
 * @flyfront/ui - Breadcrumb Component
 * @license Apache-2.0
 */

import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

export interface BreadcrumbItem {
  label: string;
  url?: string;
  icon?: string;
  disabled?: boolean;
}

@Component({
  selector: 'fly-breadcrumb',
  standalone: true,
  imports: [CommonModule, RouterModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nav class="block" [attr.aria-label]="ariaLabel()">
      <ol class="flex flex-wrap items-center gap-0 list-none p-0 m-0">
        @for (item of items(); track item.label; let i = $index; let last = $last) {
          <li class="flex items-center text-sm" [class.font-medium]="last">
            @if (item.icon) {
              <span class="flex items-center mr-1 w-4 h-4 text-gray-500" [innerHTML]="item.icon"></span>
            }
            @if (last || !item.url || item.disabled) {
              <span [class]="last ? 'text-gray-900 font-medium' : item.disabled ? 'text-gray-400' : 'text-gray-900'" [attr.aria-current]="last ? 'page' : null">{{ item.label }}</span>
            } @else {
              <a class="text-blue-600 no-underline transition-colors hover:text-blue-700 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 rounded" [routerLink]="item.url" (click)="onItemClick($event, item)">{{ item.label }}</a>
            }
            @if (!last) {
              <span class="flex items-center mx-2 text-gray-400" aria-hidden="true">
                @switch (separator()) {
                  @case ('slash') { / }
                  @case ('arrow') { → }
                  @case ('dot') { · }
                  @default {
                    <svg class="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
                    </svg>
                  }
                }
              </span>
            }
          </li>
        }
      </ol>
    </nav>
  `,
})
export class BreadcrumbComponent {
  readonly items = input<BreadcrumbItem[]>([]);
  readonly separator = input<'chevron' | 'slash' | 'arrow' | 'dot'>('chevron');
  readonly ariaLabel = input<string>('Breadcrumb');
  readonly itemClick = output<BreadcrumbItem>();

  onItemClick(event: MouseEvent, item: BreadcrumbItem): void {
    this.itemClick.emit(item);
  }
}
