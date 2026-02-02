/**
 * @flyfront/ui - Card Component
 * @license Apache-2.0
 */

import { Component, Input, ChangeDetectionStrategy, booleanAttribute } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Card padding sizes
 */
export type CardPadding = 'none' | 'sm' | 'md' | 'lg';

/**
 * Card component for content containers
 *
 * @example
 * ```html
 * <fly-card>
 *   <fly-card-header>
 *     <h3>Card Title</h3>
 *   </fly-card-header>
 *   <fly-card-content>
 *     Card content goes here
 *   </fly-card-content>
 *   <fly-card-footer>
 *     <fly-button>Action</fly-button>
 *   </fly-card-footer>
 * </fly-card>
 * ```
 */
@Component({
  selector: 'fly-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div [class]="cardClasses">
      <ng-content></ng-content>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardComponent {
  /** Card padding */
  @Input() padding: CardPadding = 'md';

  /** Whether the card has elevation shadow */
  @Input({ transform: booleanAttribute }) elevated = false;

  /** Whether the card has outline style */
  @Input({ transform: booleanAttribute }) outlined = true;

  /** Whether the card is interactive (hoverable) */
  @Input({ transform: booleanAttribute }) interactive = false;

  private readonly paddingClasses: Record<CardPadding, string> = {
    none: 'p-0',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  get cardClasses(): string {
    const classes = [
      'bg-white rounded-lg overflow-hidden',
      this.paddingClasses[this.padding],
    ];

    if (this.elevated) {
      classes.push('shadow-md border-0');
    } else if (this.outlined) {
      classes.push('border border-neutral-300');
    }

    if (this.interactive) {
      classes.push('cursor-pointer transition-all hover:shadow-lg hover:-translate-y-0.5');
    }

    return classes.join(' ');
  }
}

/**
 * Card header component
 */
@Component({
  selector: 'fly-card-header',
  standalone: true,
  template: `
    <div class="px-6 py-4 border-b border-neutral-300 font-semibold">
      <ng-content></ng-content>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardHeaderComponent {}

/**
 * Card content component
 */
@Component({
  selector: 'fly-card-content',
  standalone: true,
  template: `
    <div class="p-6">
      <ng-content></ng-content>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardContentComponent {}

/**
 * Card footer component
 */
@Component({
  selector: 'fly-card-footer',
  standalone: true,
  template: `
    <div class="px-6 py-4 border-t border-neutral-300 flex gap-2 justify-end">
      <ng-content></ng-content>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardFooterComponent {}
