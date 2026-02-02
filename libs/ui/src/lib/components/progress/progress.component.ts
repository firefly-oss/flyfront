/**
 * @flyfront/ui - Progress Components
 * @license Apache-2.0
 */

import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

export type ProgressColor = 'primary' | 'success' | 'warning' | 'error';
export type ProgressSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'fly-progress-bar',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex items-center gap-3 w-full">
      <div
        [class]="trackClasses()"
        role="progressbar"
        [attr.aria-valuenow]="value()"
        [attr.aria-valuemin]="0"
        [attr.aria-valuemax]="max()"
        [attr.aria-label]="label()"
      >
        <div
          [class]="fillClasses()"
          [style.width.%]="indeterminate() ? null : percentage()"
        ></div>
      </div>
      @if (showLabel()) {
        <span class="text-sm text-gray-600 min-w-12 text-right">{{ indeterminate() ? '' : percentage() + '%' }}</span>
      }
    </div>
  `,
  styles: [`
    @keyframes indeterminate { 0% { transform: translateX(-100%); } 100% { transform: translateX(400%); } }
    .animate-indeterminate { width: 33%; animation: indeterminate 1.5s infinite ease-in-out; }
  `],
})
export class ProgressBarComponent {
  readonly value = input<number>(0);
  readonly max = input<number>(100);
  readonly color = input<ProgressColor>('primary');
  readonly size = input<ProgressSize>('md');
  readonly showLabel = input<boolean>(false);
  readonly indeterminate = input<boolean>(false);
  readonly label = input<string>('Progress');

  private readonly sizeHeights: Record<ProgressSize, string> = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3',
  };

  private readonly colorClasses: Record<ProgressColor, string> = {
    primary: 'bg-blue-600',
    success: 'bg-green-500',
    warning: 'bg-amber-500',
    error: 'bg-red-500',
  };

  readonly percentage = computed(() => {
    const val = this.value();
    const max = this.max();
    return Math.min(100, Math.max(0, Math.round((val / max) * 100)));
  });

  readonly trackClasses = computed(() => {
    const s = this.size();
    return `flex-1 bg-gray-200 rounded-full overflow-hidden ${this.sizeHeights[s]}`;
  });

  readonly fillClasses = computed(() => {
    const c = this.color();
    const base = `h-full rounded-full transition-[width] duration-300 ease-out ${this.colorClasses[c]}`;
    return this.indeterminate() ? `${base} animate-indeterminate` : base;
  });
}

@Component({
  selector: 'fly-progress-spinner',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div [class]="spinnerClasses()" role="progressbar" [attr.aria-valuenow]="indeterminate() ? null : value()" [attr.aria-valuemin]="0" [attr.aria-valuemax]="max()" [attr.aria-label]="label()">
      <svg class="w-full h-full -rotate-90" viewBox="0 0 50 50">
        <circle class="stroke-gray-200" cx="25" cy="25" [attr.r]="radius" fill="none" [attr.stroke-width]="strokeWidth()" />
        <circle [class]="fillClasses()" cx="25" cy="25" [attr.r]="radius" fill="none" [attr.stroke-width]="strokeWidth()" [attr.stroke-dasharray]="circumference" [attr.stroke-dashoffset]="indeterminate() ? null : dashOffset()" />
      </svg>
      @if (showLabel() && !indeterminate()) {
        <span class="absolute text-xs font-medium text-gray-600">{{ percentage() }}%</span>
      }
    </div>
  `,
  styles: [`
    @keyframes spinnerRotate { 0% { stroke-dasharray: 1 200; stroke-dashoffset: 0; } 50% { stroke-dasharray: 100 200; stroke-dashoffset: -15; } 100% { stroke-dasharray: 100 200; stroke-dashoffset: -125; } }
    .spinner-indeterminate { animation: spinnerRotate 2s linear infinite; stroke-dasharray: 80 200; stroke-dashoffset: 0; }
  `],
})
export class ProgressSpinnerComponent {
  readonly value = input<number>(0);
  readonly max = input<number>(100);
  readonly color = input<ProgressColor>('primary');
  readonly size = input<ProgressSize>('md');
  readonly showLabel = input<boolean>(false);
  readonly indeterminate = input<boolean>(false);
  readonly strokeWidth = input<number>(4);
  readonly label = input<string>('Progress');

  readonly radius = 20;
  readonly circumference = 2 * Math.PI * this.radius;

  private readonly sizeClasses: Record<ProgressSize, string> = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  };

  private readonly strokeColors: Record<ProgressColor, string> = {
    primary: 'stroke-blue-600',
    success: 'stroke-green-500',
    warning: 'stroke-amber-500',
    error: 'stroke-red-500',
  };

  readonly percentage = computed(() => {
    const val = this.value();
    const max = this.max();
    return Math.min(100, Math.max(0, Math.round((val / max) * 100)));
  });

  readonly dashOffset = computed(() => this.circumference - (this.percentage() / 100) * this.circumference);

  readonly spinnerClasses = computed(() => {
    const s = this.size();
    return `relative inline-flex items-center justify-center ${this.sizeClasses[s]}`;
  });

  readonly fillClasses = computed(() => {
    const c = this.color();
    const base = `transition-[stroke-dashoffset] duration-300 ease-out ${this.strokeColors[c]}`;
    return this.indeterminate() ? `${base} spinner-indeterminate` : base;
  });
}
