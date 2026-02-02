/**
 * @flyfront/ui - DataTable Component
 * @license Apache-2.0
 */

import { Component, ChangeDetectionStrategy, input, output, signal, computed, TemplateRef, Directive } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface TableColumn<T = unknown> {
  key: string;
  header: string;
  sortable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
  template?: TemplateRef<{ $implicit: T; row: T; index: number }>;
}

export interface SortEvent {
  column: string;
  direction: 'asc' | 'desc' | null;
}

export interface SelectionEvent<T> {
  selected: T[];
  all: boolean;
}

@Directive({ selector: '[flyCellTemplate]', standalone: true })
export class CellTemplateDirective {
  readonly columnKey = input.required<string>({ alias: 'flyCellTemplate' });
}

@Component({
  selector: 'fly-data-table',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="relative w-full" [class.pointer-events-none]="loading()">
      @if (loading()) {
        <div class="absolute inset-0 bg-white/70 flex items-center justify-center z-10">
          <div class="w-8 h-8 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
        </div>
      }
      <div class="overflow-x-auto">
        <table class="w-full border-collapse">
          <thead class="bg-gray-50">
            <tr>
              @if (selectable()) {
                <th class="w-10 py-3 px-4 text-left text-sm font-semibold text-gray-900 border-b border-gray-200">
                  <input type="checkbox" [checked]="allSelected()" [indeterminate]="someSelected()" (change)="toggleSelectAll()" />
                </th>
              }
              @for (column of columns(); track column.key) {
                <th 
                  class="py-3 px-4 text-sm font-semibold text-gray-900 border-b border-gray-200"
                  [class.cursor-pointer]="column.sortable"
                  [class.select-none]="column.sortable"
                  [class.hover:bg-gray-100]="column.sortable"
                  [style.width]="column.width" 
                  [style.text-align]="column.align || 'left'" 
                  (click)="column.sortable && sort(column.key)"
                >
                  <div class="flex items-center gap-1">
                    {{ column.header }}
                    @if (column.sortable && sortColumn() === column.key) {
                      <span class="shrink-0 text-xs">{{ sortDirection() === 'asc' ? '↑' : '↓' }}</span>
                    }
                  </div>
                </th>
              }
            </tr>
          </thead>
          <tbody class="bg-white">
            @for (row of data(); track trackBy()(row, $index); let i = $index) {
              <tr 
                class="transition-colors hover:bg-gray-50"
                [class.bg-blue-50]="isSelected(row)"
                [class.hover:bg-blue-100]="isSelected(row)"
                [class.bg-gray-50]="striped() && i % 2 === 1 && !isSelected(row)"
                (click)="onRowClick(row)"
              >
                @if (selectable()) {
                  <td class="w-10 py-3 px-4 text-sm text-gray-700 border-b border-gray-200">
                    <input type="checkbox" [checked]="isSelected(row)" (change)="toggleSelect(row)" (click)="$event.stopPropagation()" />
                  </td>
                }
                @for (column of columns(); track column.key) {
                  <td class="py-3 px-4 text-sm text-gray-700 border-b border-gray-200" [style.text-align]="column.align || 'left'">
                    @if (column.template) {
                      <ng-container *ngTemplateOutlet="column.template; context: { $implicit: row[column.key], row: row, index: i }" />
                    } @else {
                      {{ row[column.key] }}
                    }
                  </td>
                }
              </tr>
            } @empty {
              <tr>
                <td [attr.colspan]="selectable() ? columns().length + 1 : columns().length" class="py-3 px-4 text-sm text-gray-700 border-b border-gray-200">
                  <div class="py-8 text-center text-gray-500">{{ emptyMessage() }}</div>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
})
export class DataTableComponent<T extends Record<string, unknown> = Record<string, unknown>> {
  readonly data = input<T[]>([]);
  readonly columns = input<TableColumn<T>[]>([]);
  readonly loading = input<boolean>(false);
  readonly selectable = input<boolean>(false);
  readonly striped = input<boolean>(false);
  readonly emptyMessage = input<string>('No data available');
  readonly trackBy = input<(row: T, index: number) => unknown>((row, index) => index);

  readonly sortChange = output<SortEvent>();
  readonly selectionChange = output<SelectionEvent<T>>();
  readonly rowClick = output<T>();

  readonly sortColumn = signal<string | null>(null);
  readonly sortDirection = signal<'asc' | 'desc' | null>(null);
  private readonly selectedRows = signal<Set<T>>(new Set());

  readonly allSelected = computed(() => {
    const data = this.data();
    const selected = this.selectedRows();
    return data.length > 0 && data.every((row) => selected.has(row));
  });

  readonly someSelected = computed(() => {
    const data = this.data();
    const selected = this.selectedRows();
    const selectedCount = data.filter((row) => selected.has(row)).length;
    return selectedCount > 0 && selectedCount < data.length;
  });

  sort(column: string): void {
    const currentColumn = this.sortColumn();
    const currentDirection = this.sortDirection();
    let newDirection: 'asc' | 'desc' | null = 'asc';
    if (currentColumn === column) {
      if (currentDirection === 'asc') newDirection = 'desc';
      else if (currentDirection === 'desc') newDirection = null;
    }
    this.sortColumn.set(newDirection ? column : null);
    this.sortDirection.set(newDirection);
    this.sortChange.emit({ column, direction: newDirection });
  }

  toggleSelectAll(): void {
    const data = this.data();
    if (this.allSelected()) {
      this.selectedRows.set(new Set());
    } else {
      this.selectedRows.set(new Set(data));
    }
    this.emitSelectionChange();
  }

  toggleSelect(row: T): void {
    const selected = new Set(this.selectedRows());
    if (selected.has(row)) selected.delete(row);
    else selected.add(row);
    this.selectedRows.set(selected);
    this.emitSelectionChange();
  }

  isSelected(row: T): boolean {
    return this.selectedRows().has(row);
  }

  onRowClick(row: T): void {
    this.rowClick.emit(row);
  }

  clearSelection(): void {
    this.selectedRows.set(new Set());
    this.emitSelectionChange();
  }

  private emitSelectionChange(): void {
    const selected = Array.from(this.selectedRows());
    this.selectionChange.emit({ selected, all: this.allSelected() });
  }
}
