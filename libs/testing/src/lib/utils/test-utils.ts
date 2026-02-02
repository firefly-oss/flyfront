/**
 * @flyfront/testing - Test Utilities
 * @license Apache-2.0
 */

import { Type, DebugElement, signal, Signal } from '@angular/core';
import { ComponentFixture, TestBed, TestModuleMetadata } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Observable, of, Subject, firstValueFrom } from 'rxjs';
import { MockFn, createMockFn } from '../mocks/mock-services';

/**
 * Configuration for renderComponent
 */
export interface RenderConfig<T> extends TestModuleMetadata {
  inputs?: Partial<{ [K in keyof T]: T[K] extends Signal<infer U> ? U : T[K] }>;
  outputs?: Partial<{ [K in keyof T]: T[K] extends Subject<infer U> ? (value: U) => void : never }>;
  detectChanges?: boolean;
}

/**
 * Result of renderComponent
 */
export interface RenderResult<T> {
  fixture: ComponentFixture<T>;
  component: T;
  debugElement: DebugElement;
  nativeElement: HTMLElement;
  detectChanges: () => void;
  getByTestId: (testId: string) => HTMLElement | null;
  getAllByTestId: (testId: string) => HTMLElement[];
  getByText: (text: string) => HTMLElement | null;
  getAllByText: (text: string) => HTMLElement[];
  getByRole: (role: string) => HTMLElement | null;
  getAllByRole: (role: string) => HTMLElement[];
  query: <E extends HTMLElement>(selector: string) => E | null;
  queryAll: <E extends HTMLElement>(selector: string) => E[];
  click: (element: HTMLElement | string) => Promise<void>;
  type: (element: HTMLElement | string, text: string) => Promise<void>;
  clear: (element: HTMLElement | string) => Promise<void>;
}

/**
 * Render a component for testing
 *
 * @example
 * ```typescript
 * const { component, getByTestId, click } = await renderComponent(ButtonComponent, {
 *   inputs: { variant: 'primary', label: 'Click me' },
 *   outputs: { clicked: jest.fn() },
 * });
 *
 * await click('[data-testid="button"]');
 * expect(outputs.clicked).toHaveBeenCalled();
 * ```
 */
export async function renderComponent<T>(
  component: Type<T>,
  config: RenderConfig<T> = {}
): Promise<RenderResult<T>> {
  const { inputs = {}, outputs = {}, detectChanges = true, ...moduleConfig } = config;

  await TestBed.configureTestingModule({
    imports: [NoopAnimationsModule, component, ...(moduleConfig.imports || [])],
    providers: moduleConfig.providers || [],
    declarations: moduleConfig.declarations || [],
  }).compileComponents();

  const fixture = TestBed.createComponent(component);
  const instance = fixture.componentInstance;

  // Set inputs
  Object.entries(inputs).forEach(([key, value]) => {
    const prop = instance[key as keyof T];
    if (prop && typeof prop === 'object' && 'set' in prop) {
      // It's a signal
      (prop as { set: (v: unknown) => void }).set(value);
    } else {
      (instance as Record<string, unknown>)[key] = value;
    }
  });

  // Subscribe to outputs
  Object.entries(outputs).forEach(([key, handler]) => {
    const prop = instance[key as keyof T];
    if (prop && typeof prop === 'object' && 'subscribe' in prop && typeof (prop as { subscribe?: unknown }).subscribe === 'function') {
      ((prop as unknown) as Observable<unknown>).subscribe(handler as (value: unknown) => void);
    }
  });

  if (detectChanges) {
    fixture.detectChanges();
  }

  const debugElement = fixture.debugElement;
  const nativeElement = fixture.nativeElement as HTMLElement;

  const getByTestId = (testId: string): HTMLElement | null => {
    return nativeElement.querySelector(`[data-testid="${testId}"]`);
  };

  const getAllByTestId = (testId: string): HTMLElement[] => {
    return Array.from(nativeElement.querySelectorAll(`[data-testid="${testId}"]`));
  };

  const getByText = (text: string): HTMLElement | null => {
    const walker = document.createTreeWalker(nativeElement, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      if (walker.currentNode.textContent?.trim() === text) {
        return walker.currentNode.parentElement;
      }
    }
    return null;
  };

  const getAllByText = (text: string): HTMLElement[] => {
    const elements: HTMLElement[] = [];
    const walker = document.createTreeWalker(nativeElement, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      if (walker.currentNode.textContent?.includes(text)) {
        const parent = walker.currentNode.parentElement;
        if (parent && !elements.includes(parent)) {
          elements.push(parent);
        }
      }
    }
    return elements;
  };

  const getByRole = (role: string): HTMLElement | null => {
    return nativeElement.querySelector(`[role="${role}"]`);
  };

  const getAllByRole = (role: string): HTMLElement[] => {
    return Array.from(nativeElement.querySelectorAll(`[role="${role}"]`));
  };

  const query = <E extends HTMLElement>(selector: string): E | null => {
    return nativeElement.querySelector(selector);
  };

  const queryAll = <E extends HTMLElement>(selector: string): E[] => {
    return Array.from(nativeElement.querySelectorAll(selector));
  };

  const resolveElement = (elementOrSelector: HTMLElement | string): HTMLElement | null => {
    if (typeof elementOrSelector === 'string') {
      return nativeElement.querySelector(elementOrSelector);
    }
    return elementOrSelector;
  };

  const click = async (elementOrSelector: HTMLElement | string): Promise<void> => {
    const element = resolveElement(elementOrSelector);
    if (!element) {
      throw new Error(`Element not found: ${elementOrSelector}`);
    }
    element.click();
    fixture.detectChanges();
    await fixture.whenStable();
  };

  const type = async (elementOrSelector: HTMLElement | string, text: string): Promise<void> => {
    const element = resolveElement(elementOrSelector) as HTMLInputElement;
    if (!element) {
      throw new Error(`Element not found: ${elementOrSelector}`);
    }
    element.focus();
    element.value = text;
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
    fixture.detectChanges();
    await fixture.whenStable();
  };

  const clear = async (elementOrSelector: HTMLElement | string): Promise<void> => {
    const element = resolveElement(elementOrSelector) as HTMLInputElement;
    if (!element) {
      throw new Error(`Element not found: ${elementOrSelector}`);
    }
    element.value = '';
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
    fixture.detectChanges();
    await fixture.whenStable();
  };

  return {
    fixture,
    component: instance,
    debugElement,
    nativeElement,
    detectChanges: () => fixture.detectChanges(),
    getByTestId,
    getAllByTestId,
    getByText,
    getAllByText,
    getByRole,
    getAllByRole,
    query,
    queryAll,
    click,
    type,
    clear,
  };
}

/**
 * Create a spy object with all methods mocked
 */
export function createSpyObj<T extends object>(
  baseName: string,
  methodNames: (keyof T)[]
): Record<string, MockFn> {
  const obj: Record<string, MockFn> = {};
  methodNames.forEach((name) => {
    obj[name as string] = createMockFn();
  });
  return obj;
}

/**
 * Wait for a condition to be true
 */
export async function waitFor(
  condition: () => boolean | Promise<boolean>,
  options: { timeout?: number; interval?: number } = {}
): Promise<void> {
  const { timeout = 5000, interval = 50 } = options;
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    const result = await condition();
    if (result) return;
    await new Promise((resolve) => setTimeout(resolve, interval));
  }

  throw new Error(`waitFor timed out after ${timeout}ms`);
}

/**
 * Wait for fixture to be stable
 */
export async function waitForStable<T>(fixture: ComponentFixture<T>): Promise<void> {
  fixture.detectChanges();
  await fixture.whenStable();
}

/**
 * Get the first emitted value from an Observable
 */
export async function getEmittedValue<T>(observable: Observable<T>): Promise<T> {
  return firstValueFrom(observable);
}

/**
 * Create a mock signal for testing
 */
export function createMockSignal<T>(initialValue: T) {
  return signal(initialValue);
}

/**
 * Flush all pending microtasks
 */
export function flushMicrotasks(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

