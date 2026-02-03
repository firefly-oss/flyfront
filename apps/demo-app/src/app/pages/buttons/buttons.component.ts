/**
 * @flyfront/demo-app - Buttons Showcase
 * @license Apache-2.0
 * @copyright 2026 Firefly Software Solutions Inc.
 */

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PageHeaderComponent, SectionComponent, ShowcaseCardComponent, ComponentGridComponent, PropTableComponent, CodeBlockComponent } from '../../shared/showcase.component';
import { ButtonComponent } from '@flyfront/ui';

@Component({
  selector: 'app-buttons',
  standalone: true,
  imports: [
    CommonModule,
    PageHeaderComponent,
    SectionComponent,
    ShowcaseCardComponent,
    ComponentGridComponent,
    PropTableComponent,
    CodeBlockComponent,
    ButtonComponent,
  ],
  template: `
    <app-page-header
      title="Buttons"
      description="Interactive button components for user actions and form submissions"
    />

    <app-section title="Usage" description="Import and use the button component">
      <app-showcase-card>
        <app-code-block 
          title="button.component.ts"
          [code]="usageCode"
        />
      </app-showcase-card>
    </app-section>

    <app-section title="Variants" description="Different visual styles for various use cases">
      <app-showcase-card>
        <div class="flex flex-wrap items-center gap-4 mb-4">
          <fly-button variant="primary">Primary</fly-button>
          <fly-button variant="secondary">Secondary</fly-button>
          <fly-button variant="outline">Outline</fly-button>
          <fly-button variant="ghost">Ghost</fly-button>
          <fly-button variant="danger">Danger</fly-button>
          <fly-button variant="success">Success</fly-button>
        </div>
        <app-code-block [code]="variantsCode" />
      </app-showcase-card>
    </app-section>

    <app-section title="Sizes" description="Different sizes for various contexts">
      <app-showcase-card>
        <div class="flex flex-wrap items-end gap-4">
          <fly-button variant="primary" size="xs">Extra Small</fly-button>
          <fly-button variant="primary" size="sm">Small</fly-button>
          <fly-button variant="primary" size="md">Medium</fly-button>
          <fly-button variant="primary" size="lg">Large</fly-button>
          <fly-button variant="primary" size="xl">Extra Large</fly-button>
        </div>
      </app-showcase-card>
    </app-section>

    <app-section title="States" description="Loading and disabled states">
      <app-component-grid [columns]="2">
        <app-showcase-card title="Loading">
          <div class="flex flex-wrap items-center gap-4">
            <fly-button variant="primary" [loading]="true">Loading</fly-button>
            <fly-button variant="outline" [loading]="true">Processing</fly-button>
            <fly-button variant="secondary" [loading]="true">Please wait</fly-button>
          </div>
        </app-showcase-card>
        <app-showcase-card title="Disabled">
          <div class="flex flex-wrap items-center gap-4">
            <fly-button variant="primary" [disabled]="true">Disabled</fly-button>
            <fly-button variant="outline" [disabled]="true">Disabled</fly-button>
            <fly-button variant="danger" [disabled]="true">Disabled</fly-button>
          </div>
        </app-showcase-card>
      </app-component-grid>
    </app-section>

    <app-section title="Full Width" description="Buttons that span the full container width">
      <app-showcase-card>
        <div class="space-y-3 max-w-md">
          <fly-button variant="primary" [fullWidth]="true">Sign In</fly-button>
          <fly-button variant="outline" [fullWidth]="true">Create Account</fly-button>
        </div>
      </app-showcase-card>
    </app-section>

    <app-section title="Button Group" description="Grouped buttons for related actions">
      <app-showcase-card>
        <div class="inline-flex rounded-lg overflow-hidden border border-gray-300 dark:border-gray-600">
          <fly-button variant="ghost" class="rounded-none border-r border-gray-300 dark:border-gray-600">Left</fly-button>
          <fly-button variant="ghost" class="rounded-none border-r border-gray-300 dark:border-gray-600">Center</fly-button>
          <fly-button variant="ghost" class="rounded-none">Right</fly-button>
        </div>
      </app-showcase-card>
    </app-section>

    <app-section title="API Reference">
      <app-showcase-card>
        <app-prop-table [props]="buttonProps" />
      </app-showcase-card>
    </app-section>
  `,
})
export class ButtonsComponent {
  readonly usageCode = `import { ButtonComponent } from '@flyfront/ui';

@Component({
  imports: [ButtonComponent],
  template: \`<fly-button variant="primary">Click me</fly-button>\`
})`;

  readonly variantsCode = `<fly-button variant="primary">Primary</fly-button>
<fly-button variant="secondary">Secondary</fly-button>
<fly-button variant="outline">Outline</fly-button>
<fly-button variant="ghost">Ghost</fly-button>
<fly-button variant="danger">Danger</fly-button>
<fly-button variant="success">Success</fly-button>`;

  readonly buttonProps = [
    { name: 'variant', type: "'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success'", default: "'primary'", description: 'Visual style of the button' },
    { name: 'size', type: "'xs' | 'sm' | 'md' | 'lg' | 'xl'", default: "'md'", description: 'Size of the button' },
    { name: 'type', type: "'button' | 'submit' | 'reset'", default: "'button'", description: 'HTML button type' },
    { name: 'disabled', type: 'boolean', default: 'false', description: 'Whether the button is disabled' },
    { name: 'loading', type: 'boolean', default: 'false', description: 'Shows loading spinner and disables button' },
    { name: 'fullWidth', type: 'boolean', default: 'false', description: 'Whether button takes full container width' },
    { name: 'iconOnly', type: 'boolean', default: 'false', description: 'Square button for icon-only usage' },
    { name: 'icon', type: 'string', default: '-', description: 'HTML content for icon' },
    { name: 'iconPosition', type: "'left' | 'right'", default: "'left'", description: 'Position of the icon' },
  ];
}
