/**
 * @flyfront/ui - Badge Component
 * @license Apache-2.0
 */

import {
  Component,
  ChangeDetectionStrategy,
  input,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';

export type BadgeColor = 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
export type BadgeSize = 'sm' | 'md' | 'lg';
export type BadgeVariant = 'solid' | 'outline' | 'subtle';

@Component({
  selector: 'fly-badge',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span [class]="classes()">
      @if (dot()) {
        <span [class]="dotClasses()"></span>
      }
      <ng-content />
    </span>
  `,
})
export class BadgeComponent {
  readonly color = input<BadgeColor>('primary');
  readonly size = input<BadgeSize>('md');
  readonly variant = input<BadgeVariant>('solid');
  readonly pill = input<boolean>(false);
  readonly dot = input<boolean>(false);

  private readonly baseClasses = 'inline-flex items-center gap-1 font-medium';

  private readonly sizeClasses: Record<BadgeSize, string> = {
    sm: 'py-0.5 px-1.5 text-xs',
    md: 'py-0.5 px-2 text-sm',
    lg: 'py-1 px-2.5 text-sm',
  };

  private readonly colorVariantClasses: Record<BadgeColor, Record<BadgeVariant, string>> = {
    primary: {
      solid: 'bg-blue-600 text-white',
      outline: 'border border-blue-600 text-blue-600 bg-transparent',
      subtle: 'bg-blue-100 text-blue-700',
    },
    secondary: {
      solid: 'bg-gray-600 text-white',
      outline: 'border border-gray-600 text-gray-600 bg-transparent',
      subtle: 'bg-gray-100 text-gray-700',
    },
    success: {
      solid: 'bg-green-600 text-white',
      outline: 'border border-green-600 text-green-600 bg-transparent',
      subtle: 'bg-green-100 text-green-700',
    },
    warning: {
      solid: 'bg-amber-600 text-white',
      outline: 'border border-amber-600 text-amber-600 bg-transparent',
      subtle: 'bg-amber-100 text-amber-700',
    },
    error: {
      solid: 'bg-red-600 text-white',
      outline: 'border border-red-600 text-red-600 bg-transparent',
      subtle: 'bg-red-100 text-red-700',
    },
    info: {
      solid: 'bg-blue-600 text-white',
      outline: 'border border-blue-600 text-blue-600 bg-transparent',
      subtle: 'bg-blue-100 text-blue-700',
    },
  };

  private readonly dotColorClasses: Record<BadgeColor, string> = {
    primary: 'bg-blue-600',
    secondary: 'bg-gray-600',
    success: 'bg-green-600',
    warning: 'bg-amber-600',
    error: 'bg-red-600',
    info: 'bg-blue-600',
  };

  readonly classes = computed(() => {
    const c = this.color();
    const s = this.size();
    const v = this.variant();
    const radius = this.pill() ? 'rounded-full' : 'rounded';
    return `${this.baseClasses} ${this.sizeClasses[s]} ${this.colorVariantClasses[c][v]} ${radius}`;
  });

  readonly dotClasses = computed(() => {
    const c = this.color();
    return `w-2 h-2 rounded-full ${this.dotColorClasses[c]}`;
  });
}
