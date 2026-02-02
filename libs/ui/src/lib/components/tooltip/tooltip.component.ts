/**
 * @flyfront/ui - Tooltip Directive
 * @license Apache-2.0
 */

import {
  Directive,
  input,
  ElementRef,
  inject,
  OnDestroy,
  Renderer2,
  PLATFORM_ID,
} from '@angular/core';
import { isPlatformBrowser, DOCUMENT } from '@angular/common';

export type TooltipPosition = 'top' | 'bottom' | 'left' | 'right';

@Directive({
  selector: '[flyTooltip]',
  standalone: true,
})
export class TooltipDirective implements OnDestroy {
  private readonly elementRef = inject(ElementRef);
  private readonly renderer = inject(Renderer2);
  private readonly document = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);

  // Inputs
  readonly content = input.required<string>({ alias: 'flyTooltip' });
  readonly position = input<TooltipPosition>('top');
  readonly delay = input<number>(200);
  readonly disabled = input<boolean>(false);

  private tooltipElement: HTMLElement | null = null;
  private showTimeout: ReturnType<typeof setTimeout> | null = null;
  private hideTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.setupListeners();
    }
  }

  ngOnDestroy(): void {
    this.removeTooltip();
    if (this.showTimeout) clearTimeout(this.showTimeout);
    if (this.hideTimeout) clearTimeout(this.hideTimeout);
  }

  private setupListeners(): void {
    const el = this.elementRef.nativeElement;

    this.renderer.listen(el, 'mouseenter', () => this.onMouseEnter());
    this.renderer.listen(el, 'mouseleave', () => this.onMouseLeave());
    this.renderer.listen(el, 'focus', () => this.onMouseEnter());
    this.renderer.listen(el, 'blur', () => this.onMouseLeave());
  }

  private onMouseEnter(): void {
    if (this.disabled() || !this.content()) return;

    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
      this.hideTimeout = null;
    }

    this.showTimeout = setTimeout(() => {
      this.createTooltip();
    }, this.delay());
  }

  private onMouseLeave(): void {
    if (this.showTimeout) {
      clearTimeout(this.showTimeout);
      this.showTimeout = null;
    }

    this.hideTimeout = setTimeout(() => {
      this.removeTooltip();
    }, 100);
  }

  private createTooltip(): void {
    if (this.tooltipElement) return;

    this.tooltipElement = this.renderer.createElement('div');
    this.renderer.addClass(this.tooltipElement, 'fly-tooltip');
    this.renderer.addClass(this.tooltipElement, `fly-tooltip--${this.position()}`);

    const text = this.renderer.createText(this.content());
    this.renderer.appendChild(this.tooltipElement, text);

    this.renderer.appendChild(this.document.body, this.tooltipElement);

    // Apply styles
    this.applyStyles();

    // Position the tooltip
    this.positionTooltip();

    // Animate in
    requestAnimationFrame(() => {
      if (this.tooltipElement) {
        this.renderer.addClass(this.tooltipElement, 'fly-tooltip--visible');
      }
    });
  }

  private applyStyles(): void {
    if (!this.tooltipElement) return;

    const styles: Record<string, string> = {
      position: 'fixed',
      zIndex: '9999',
      padding: '0.5rem 0.75rem',
      fontSize: '0.75rem',
      fontWeight: '500',
      color: 'white',
      backgroundColor: '#1f2937',
      borderRadius: '0.375rem',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      maxWidth: '200px',
      wordWrap: 'break-word',
      opacity: '0',
      transition: 'opacity 150ms ease-in-out',
      pointerEvents: 'none',
    };

    Object.entries(styles).forEach(([prop, value]) => {
      this.renderer.setStyle(this.tooltipElement, prop, value);
    });
  }

  private positionTooltip(): void {
    if (!this.tooltipElement) return;

    const hostRect = this.elementRef.nativeElement.getBoundingClientRect();
    const tooltipRect = this.tooltipElement.getBoundingClientRect();
    const gap = 8;

    let top = 0;
    let left = 0;

    switch (this.position()) {
      case 'top':
        top = hostRect.top - tooltipRect.height - gap;
        left = hostRect.left + (hostRect.width - tooltipRect.width) / 2;
        break;
      case 'bottom':
        top = hostRect.bottom + gap;
        left = hostRect.left + (hostRect.width - tooltipRect.width) / 2;
        break;
      case 'left':
        top = hostRect.top + (hostRect.height - tooltipRect.height) / 2;
        left = hostRect.left - tooltipRect.width - gap;
        break;
      case 'right':
        top = hostRect.top + (hostRect.height - tooltipRect.height) / 2;
        left = hostRect.right + gap;
        break;
    }

    // Keep tooltip within viewport
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    if (left < 0) left = gap;
    if (left + tooltipRect.width > viewportWidth) {
      left = viewportWidth - tooltipRect.width - gap;
    }
    if (top < 0) top = gap;
    if (top + tooltipRect.height > viewportHeight) {
      top = viewportHeight - tooltipRect.height - gap;
    }

    this.renderer.setStyle(this.tooltipElement, 'top', `${top}px`);
    this.renderer.setStyle(this.tooltipElement, 'left', `${left}px`);
  }

  private removeTooltip(): void {
    if (this.tooltipElement) {
      this.renderer.removeChild(this.document.body, this.tooltipElement);
      this.tooltipElement = null;
    }
  }
}
