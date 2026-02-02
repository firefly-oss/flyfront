/**
 * @flyfront/ui - Stepper Component
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
  Directive,
  TemplateRef,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';

export interface Step {
  id: string;
  label: string;
  description?: string;
  icon?: string;
  optional?: boolean;
  completed?: boolean;
  error?: boolean;
}

@Directive({
  selector: '[flyStepContent]',
  standalone: true,
})
export class StepContentDirective {
  readonly templateRef = inject(TemplateRef);
  readonly stepId = input.required<string>({ alias: 'flyStepContent' });
}

@Component({
  selector: 'fly-stepper',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col">
      <div [class]="headerClasses()" role="tablist" [attr.aria-label]="ariaLabel()">
        @for (step of steps(); track step.id; let i = $index; let last = $last) {
          <div
            [class]="getStepClasses(step, i)"
            role="tab"
            [attr.aria-selected]="currentStep() === i"
            [attr.tabindex]="currentStep() === i ? 0 : -1"
            (click)="goToStep(i)"
            (keydown)="onKeydown($event, i)"
          >
            <div [class]="getIndicatorClasses(step, i)">
              @if (step.completed || i < currentStep()) {
                <svg class="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                </svg>
              } @else if (step.error) {
                <svg class="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                </svg>
              } @else if (step.icon) {
                <span [innerHTML]="step.icon"></span>
              } @else {
                <span>{{ i + 1 }}</span>
              }
            </div>
            <div class="flex flex-col min-w-0">
              <span [class]="currentStep() === i ? 'text-sm font-medium text-blue-600' : 'text-sm font-medium text-gray-700'">{{ step.label }}</span>
              @if (step.description) {
                <span class="text-xs text-gray-500 mt-0.5">{{ step.description }}</span>
              }
              @if (step.optional) {
                <span class="text-xs text-gray-400 italic">Optional</span>
              }
            </div>
          </div>
          @if (!last) {
            <div [class]="getConnectorClasses(i)"></div>
          }
        }
      </div>
      <div class="mt-6" role="tabpanel">
        @for (step of steps(); track step.id; let i = $index) {
          @if (currentStep() === i) {
            <div class="animate-step-fade-in">
              <ng-container *ngTemplateOutlet="getStepTemplate(step.id)" />
            </div>
          }
        }
      </div>
      @if (showControls()) {
        <div class="flex items-center gap-3 mt-6 pt-6 border-t border-gray-200">
          <button type="button" class="py-2 px-4 text-sm font-medium rounded-md cursor-pointer transition-all bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed" [disabled]="currentStep() === 0" (click)="previous()">{{ backLabel() }}</button>
          <div class="flex-1"></div>
          @if (currentStep() < steps().length - 1) {
            <button type="button" class="py-2 px-4 text-sm font-medium rounded-md cursor-pointer transition-all bg-blue-600 border border-blue-600 text-white hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed" (click)="next()">{{ nextLabel() }}</button>
          } @else {
            <button type="button" class="py-2 px-4 text-sm font-medium rounded-md cursor-pointer transition-all bg-blue-600 border border-blue-600 text-white hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed" (click)="finish()">{{ finishLabel() }}</button>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    @keyframes stepFadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
    .animate-step-fade-in { animation: stepFadeIn 200ms ease-out; }
  `],
})
export class StepperComponent {
  readonly steps = input<Step[]>([]);
  readonly initialStep = input<number>(0);
  readonly linear = input<boolean>(true);
  readonly orientation = input<'horizontal' | 'vertical'>('horizontal');
  readonly showControls = input<boolean>(true);
  readonly backLabel = input<string>('Back');
  readonly nextLabel = input<string>('Next');
  readonly finishLabel = input<string>('Finish');
  readonly ariaLabel = input<string>('Stepper');

  readonly stepChange = output<number>();
  readonly completed = output<void>();

  readonly stepContents = contentChildren(StepContentDirective);

  private readonly _currentStep = signal<number | null>(null);
  readonly currentStep = computed(() => this._currentStep() ?? this.initialStep());

  readonly headerClasses = computed(() => {
    const isVertical = this.orientation() === 'vertical';
    return isVertical ? 'flex flex-col items-stretch' : 'flex items-start';
  });

  getStepClasses(step: Step, index: number): string {
    const base = 'flex items-center gap-3 cursor-pointer p-2 rounded-lg transition-colors hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500';
    const isDisabled = !this.linear() && index > this.currentStep();
    return isDisabled ? `${base} cursor-not-allowed opacity-50 hover:bg-transparent` : base;
  }

  getIndicatorClasses(step: Step, index: number): string {
    const base = 'flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold shrink-0 transition-all';
    const isActive = this.currentStep() === index;
    const isCompleted = step.completed || index < this.currentStep();
    const isError = step.error;
    
    if (isError) return `${base} bg-red-500 text-white`;
    if (isCompleted) return `${base} bg-green-500 text-white`;
    if (isActive) return `${base} bg-blue-600 text-white`;
    return `${base} bg-gray-200 text-gray-500`;
  }

  getConnectorClasses(index: number): string {
    const isVertical = this.orientation() === 'vertical';
    const isCompleted = index < this.currentStep();
    const baseColor = isCompleted ? 'bg-green-500' : 'bg-gray-200';
    
    if (isVertical) {
      return `w-0.5 h-8 ${baseColor} ml-4 my-1 transition-colors`;
    }
    return `flex-1 h-0.5 ${baseColor} mx-2 self-center min-w-8 transition-colors`;
  }

  goToStep(index: number): void {
    if (this.linear() && index > this.currentStep()) return;
    if (index < 0 || index >= this.steps().length) return;
    this._currentStep.set(index);
    this.stepChange.emit(index);
  }

  previous(): void {
    this.goToStep(this.currentStep() - 1);
  }

  next(): void {
    const nextIndex = this.currentStep() + 1;
    if (nextIndex < this.steps().length) {
      this._currentStep.set(nextIndex);
      this.stepChange.emit(nextIndex);
    }
  }

  finish(): void {
    this.completed.emit();
  }

  onKeydown(event: KeyboardEvent, index: number): void {
    const isHorizontal = this.orientation() === 'horizontal';
    const prevKey = isHorizontal ? 'ArrowLeft' : 'ArrowUp';
    const nextKey = isHorizontal ? 'ArrowRight' : 'ArrowDown';

    if (event.key === prevKey && index > 0) {
      event.preventDefault();
      this.goToStep(index - 1);
    } else if (event.key === nextKey && index < this.steps().length - 1) {
      event.preventDefault();
      if (!this.linear() || index < this.currentStep()) {
        this.goToStep(index + 1);
      }
    }
  }

  getStepTemplate(stepId: string): TemplateRef<unknown> | null {
    const content = this.stepContents().find((c) => c.stepId() === stepId);
    return content?.templateRef ?? null;
  }
}
