/**
 * @flyfront/ui - Avatar Component
 * @license Apache-2.0
 */

import {
  Component,
  ChangeDetectionStrategy,
  input,
  computed,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type AvatarShape = 'circle' | 'square';

@Component({
  selector: 'fly-avatar',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      [class]="avatarClasses()"
      [style.background-color]="!src() || imageError() ? backgroundColor() : null"
    >
      @if (src() && !imageError()) {
        <img class="w-full h-full object-cover" [src]="src()" [alt]="alt()" (error)="onImageError()" />
      } @else if (initials()) {
        <span class="uppercase text-white">{{ initials() }}</span>
      } @else {
        <svg class="w-3/5 h-3/5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd" />
        </svg>
      }
      @if (status()) {
        <span [class]="statusClasses()"></span>
      }
    </div>
  `,
})
export class AvatarComponent {
  readonly src = input<string>('');
  readonly alt = input<string>('Avatar');
  readonly name = input<string>('');
  readonly size = input<AvatarSize>('md');
  readonly shape = input<AvatarShape>('circle');
  readonly status = input<'online' | 'offline' | 'busy' | 'away' | null>(null);

  readonly imageError = signal(false);

  private readonly baseClasses = 'relative inline-flex items-center justify-center bg-gray-200 text-gray-600 font-medium overflow-hidden';

  private readonly sizeClasses: Record<AvatarSize, string> = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg',
    xl: 'w-16 h-16 text-xl',
  };

  private readonly statusSizeClasses: Record<AvatarSize, string> = {
    xs: 'w-2 h-2',
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4',
    xl: 'w-4 h-4',
  };

  private readonly statusColorClasses: Record<string, string> = {
    online: 'bg-green-500',
    offline: 'bg-gray-400',
    busy: 'bg-red-500',
    away: 'bg-amber-500',
  };

  readonly avatarClasses = computed(() => {
    const s = this.size();
    const sh = this.shape();
    const shapeClass = sh === 'circle' ? 'rounded-full' : 'rounded-lg';
    return `${this.baseClasses} ${this.sizeClasses[s]} ${shapeClass}`;
  });

  readonly statusClasses = computed(() => {
    const s = this.size();
    const st = this.status();
    const baseStatus = 'absolute bottom-0 right-0 rounded-full border-2 border-white';
    const colorClass = st ? this.statusColorClasses[st] : '';
    return `${baseStatus} ${this.statusSizeClasses[s]} ${colorClass}`;
  });

  readonly initials = computed(() => {
    const name = this.name();
    if (!name) return '';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) {
      return parts[0].charAt(0).toUpperCase();
    }
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  });

  readonly backgroundColor = computed(() => {
    const name = this.name();
    if (!name) return undefined;
    const colors = [
      '#EF4444', '#F97316', '#F59E0B', '#84CC16',
      '#22C55E', '#14B8A6', '#06B6D4', '#0EA5E9',
      '#3B82F6', '#6366F1', '#8B5CF6', '#A855F7',
      '#D946EF', '#EC4899', '#F43F5E',
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  });

  onImageError(): void {
    this.imageError.set(true);
  }
}
