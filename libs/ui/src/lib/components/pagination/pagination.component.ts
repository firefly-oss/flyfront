/**
 * @flyfront/ui - Pagination Component
 * @license Apache-2.0
 */

import { Component, ChangeDetectionStrategy, input, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface PageEvent {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

@Component({
  selector: 'fly-pagination',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nav class="flex items-center justify-between gap-4 flex-wrap" [attr.aria-label]="ariaLabel()">
      <div>
        @if (showInfo()) {
          <span class="text-sm text-gray-600">Showing {{ startItem() }} - {{ endItem() }} of {{ totalItems() }}</span>
        }
      </div>
      <div class="flex items-center gap-4">
        @if (showPageSize()) {
          <div class="flex items-center gap-2">
            <label class="text-sm text-gray-600">Per page:</label>
            <select class="py-1 px-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" [value]="pageSize()" (change)="onPageSizeChange($event)">
              @for (size of pageSizeOptions(); track size) {
                <option [value]="size">{{ size }}</option>
              }
            </select>
          </div>
        }
        <ul class="flex items-center gap-1 list-none p-0 m-0">
          @if (showFirstLast()) {
            <li><button type="button" class="flex items-center justify-center min-w-8 h-8 px-2 text-sm text-gray-600 border border-gray-300 rounded-md bg-white cursor-pointer transition-all hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed" [disabled]="currentPage() === 1" (click)="goToPage(1)" aria-label="First page">««</button></li>
          }
          <li><button type="button" class="flex items-center justify-center min-w-8 h-8 px-2 text-sm text-gray-600 border border-gray-300 rounded-md bg-white cursor-pointer transition-all hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed" [disabled]="currentPage() === 1" (click)="goToPage(currentPage() - 1)" aria-label="Previous page">«</button></li>
          @for (page of visiblePages(); track page) {
            <li>
              @if (page === '...') {
                <span class="px-2 text-gray-400">...</span>
              } @else {
                <button type="button" [class]="page === currentPage() ? 'flex items-center justify-center min-w-8 h-8 px-3 text-sm border rounded-md cursor-pointer transition-all bg-blue-600 border-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500' : 'flex items-center justify-center min-w-8 h-8 px-3 text-sm text-gray-600 border border-gray-300 rounded-md bg-white cursor-pointer transition-all hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500'" (click)="goToPage(+page)" [attr.aria-current]="page === currentPage() ? 'page' : null">{{ page }}</button>
              }
            </li>
          }
          <li><button type="button" class="flex items-center justify-center min-w-8 h-8 px-2 text-sm text-gray-600 border border-gray-300 rounded-md bg-white cursor-pointer transition-all hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed" [disabled]="currentPage() === totalPages()" (click)="goToPage(currentPage() + 1)" aria-label="Next page">»</button></li>
          @if (showFirstLast()) {
            <li><button type="button" class="flex items-center justify-center min-w-8 h-8 px-2 text-sm text-gray-600 border border-gray-300 rounded-md bg-white cursor-pointer transition-all hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed" [disabled]="currentPage() === totalPages()" (click)="goToPage(totalPages())" aria-label="Last page">»»</button></li>
          }
        </ul>
      </div>
    </nav>
  `,
})
export class PaginationComponent {
  readonly currentPage = input<number>(1);
  readonly pageSize = input<number>(10);
  readonly totalItems = input<number>(0);
  readonly pageSizeOptions = input<number[]>([10, 25, 50, 100]);
  readonly maxVisiblePages = input<number>(5);
  readonly showInfo = input<boolean>(true);
  readonly showPageSize = input<boolean>(true);
  readonly showFirstLast = input<boolean>(true);
  readonly ariaLabel = input<string>('Pagination');
  readonly pageChange = output<PageEvent>();

  readonly totalPages = computed(() => Math.ceil(this.totalItems() / this.pageSize()) || 1);
  readonly startItem = computed(() => (this.currentPage() - 1) * this.pageSize() + 1);
  readonly endItem = computed(() => Math.min(this.currentPage() * this.pageSize(), this.totalItems()));

  readonly visiblePages = computed(() => {
    const total = this.totalPages();
    const current = this.currentPage();
    const maxVisible = this.maxVisiblePages();
    if (total <= maxVisible) return Array.from({ length: total }, (_, i) => i + 1);
    const pages: (number | string)[] = [];
    const half = Math.floor(maxVisible / 2);
    let start = Math.max(1, current - half);
    let end = Math.min(total, start + maxVisible - 1);
    if (end - start < maxVisible - 1) start = Math.max(1, end - maxVisible + 1);
    if (start > 1) { pages.push(1); if (start > 2) pages.push('...'); }
    for (let i = start; i <= end; i++) pages.push(i);
    if (end < total) { if (end < total - 1) pages.push('...'); pages.push(total); }
    return pages;
  });

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages() || page === this.currentPage()) return;
    this.emitPageEvent(page, this.pageSize());
  }

  onPageSizeChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const newSize = parseInt(select.value, 10);
    const newPage = Math.ceil(this.startItem() / newSize);
    this.emitPageEvent(newPage, newSize);
  }

  private emitPageEvent(page: number, pageSize: number): void {
    this.pageChange.emit({ page, pageSize, totalItems: this.totalItems(), totalPages: Math.ceil(this.totalItems() / pageSize) });
  }
}
