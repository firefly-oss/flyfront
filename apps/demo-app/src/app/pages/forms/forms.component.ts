/**
 * @flyfront/demo-app - Forms Showcase
 * @license Apache-2.0
 * @copyright 2026 Firefly Software Solutions Inc.
 */

import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PageHeaderComponent, SectionComponent, ShowcaseCardComponent, ComponentGridComponent, CodeBlockComponent } from '../../shared/showcase.component';
import {
  InputComponent,
  SelectComponent,
  TextareaComponent,
  CheckboxComponent,
  RadioGroupComponent,
  SwitchComponent,
} from '@flyfront/ui';

@Component({
  selector: 'app-forms',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    PageHeaderComponent,
    SectionComponent,
    ShowcaseCardComponent,
    ComponentGridComponent,
    CodeBlockComponent,
    InputComponent,
    SelectComponent,
    TextareaComponent,
    CheckboxComponent,
    RadioGroupComponent,
    SwitchComponent,
  ],
  template: `
    <app-page-header
      title="Form Components"
      description="Input controls for collecting and validating user data"
    />

    <!-- Text Inputs -->
    <app-section title="Text Input" description="Standard text input fields">
      <app-component-grid [columns]="2">
        <app-showcase-card title="Basic Input">
          <div class="space-y-4">
            <fly-input label="Username" placeholder="Enter username" />
            <fly-input label="Email" type="email" placeholder="you@example.com" />
            <fly-input label="Password" type="password" placeholder="••••••••" />
          </div>
        </app-showcase-card>
        <app-showcase-card title="States">
          <div class="space-y-4">
            <fly-input label="Disabled" placeholder="Disabled input" [disabled]="true" />
            <fly-input label="With Error" placeholder="Invalid value" error="This field is required" />
            <fly-input label="With Hint" placeholder="Enter value" hint="Minimum 8 characters" />
          </div>
        </app-showcase-card>
      </app-component-grid>
      <app-showcase-card title="Usage" class="mt-4">
        <app-code-block [code]="inputCode" title="input-example.html" />
      </app-showcase-card>
    </app-section>

    <!-- Select -->
    <app-section title="Select" description="Dropdown selection component">
      <app-component-grid [columns]="2">
        <app-showcase-card title="Basic Select">
          <div class="space-y-4">
            <fly-select label="Country" [options]="countries" placeholder="Select a country" />
            <fly-select label="With Default" [options]="countries" [(ngModel)]="selectedCountry" />
          </div>
        </app-showcase-card>
        <app-showcase-card title="States">
          <div class="space-y-4">
            <fly-select label="Disabled" [options]="countries" [disabled]="true" placeholder="Select..." />
            <fly-select label="With Error" [options]="countries" error="Please select a country" />
          </div>
        </app-showcase-card>
      </app-component-grid>
    </app-section>

    <!-- Textarea -->
    <app-section title="Textarea" description="Multi-line text input">
      <app-component-grid [columns]="2">
        <app-showcase-card title="Basic Textarea">
          <fly-textarea label="Description" placeholder="Enter your description here..." [rows]="4" />
        </app-showcase-card>
        <app-showcase-card title="With Validation">
          <fly-textarea 
            label="Bio" 
            placeholder="Tell us about yourself..." 
            hint="Maximum 500 characters"
            [rows]="4"
          />
        </app-showcase-card>
      </app-component-grid>
    </app-section>

    <!-- Checkbox -->
    <app-section title="Checkbox" description="For selecting multiple options">
      <app-showcase-card>
        <div class="space-y-4">
          <div class="flex flex-col gap-3">
            <fly-checkbox label="Accept terms and conditions" />
            <fly-checkbox label="Subscribe to newsletter" />
            <fly-checkbox label="Remember my preferences" [(ngModel)]="rememberPrefs" />
          </div>
          <hr class="border-gray-200 dark:border-gray-700" />
          <div class="flex flex-col gap-3">
            <fly-checkbox label="Disabled unchecked" [disabled]="true" />
            <fly-checkbox label="Disabled checked" [disabled]="true" [(ngModel)]="disabledChecked" />
          </div>
        </div>
      </app-showcase-card>
    </app-section>

    <!-- Radio -->
    <app-section title="Radio Group" description="For selecting a single option from a group">
      <app-component-grid [columns]="2">
        <app-showcase-card title="Plan Selection">
          <fly-radio-group 
            label="Select a plan"
            [options]="planOptions" 
            [(ngModel)]="selectedPlan"
          />
        </app-showcase-card>
        <app-showcase-card title="Notification Preferences">
          <fly-radio-group 
            label="Notification level"
            [options]="notificationOptions" 
            [(ngModel)]="selectedNotification"
          />
        </app-showcase-card>
      </app-component-grid>
      <app-showcase-card title="Code Example" class="mt-4">
        <app-code-block [code]="radioCode" />
      </app-showcase-card>
    </app-section>

    <!-- Switch -->
    <app-section title="Switch" description="Toggle switches for on/off states">
      <app-showcase-card>
        <div class="space-y-4">
          <div class="flex items-center justify-between max-w-md">
            <span class="text-gray-700 dark:text-gray-300">Enable notifications</span>
            <fly-switch />
          </div>
          <div class="flex items-center justify-between max-w-md">
            <span class="text-gray-700 dark:text-gray-300">Dark mode</span>
            <fly-switch [(ngModel)]="darkModeSwitch" />
          </div>
          <div class="flex items-center justify-between max-w-md">
            <span class="text-gray-700 dark:text-gray-300">Auto-save (disabled)</span>
            <fly-switch [disabled]="true" />
          </div>
          <div class="flex items-center justify-between max-w-md">
            <span class="text-gray-700 dark:text-gray-300">Premium features (disabled, on)</span>
            <fly-switch [disabled]="true" [(ngModel)]="premiumSwitch" />
          </div>
        </div>
      </app-showcase-card>
    </app-section>

    <!-- Complete Form Example -->
    <app-section title="Complete Form" description="A full form example using all components">
      <app-showcase-card>
        <form class="space-y-6 max-w-lg">
          <div class="grid grid-cols-2 gap-4">
            <fly-input label="First Name" placeholder="John" />
            <fly-input label="Last Name" placeholder="Doe" />
          </div>
          <fly-input label="Email" type="email" placeholder="john.doe@example.com" />
          <fly-select label="Role" [options]="roles" placeholder="Select your role" />
          <fly-textarea label="Bio" placeholder="Tell us about yourself..." [rows]="3" />
          <div class="space-y-2">
            <label class="text-sm font-medium text-gray-700 dark:text-gray-300">Notification Preferences</label>
            <fly-checkbox label="Email notifications" />
            <fly-checkbox label="Push notifications" />
          </div>
          <div class="flex items-center justify-between">
            <span class="text-sm text-gray-700 dark:text-gray-300">Enable two-factor authentication</span>
            <fly-switch />
          </div>
          <fly-checkbox label="I agree to the terms and conditions" />
        </form>
      </app-showcase-card>
    </app-section>
  `,
})
export class FormsComponent {
  selectedCountry = 'us';
  rememberPrefs = true;
  disabledChecked = true;
  darkModeSwitch = true;
  premiumSwitch = true;
  selectedPlan = 'free';
  selectedNotification = 'important';
  
  readonly planOptions = [
    { value: 'free', label: 'Free Plan' },
    { value: 'pro', label: 'Pro Plan - $9/month' },
    { value: 'enterprise', label: 'Enterprise - Contact us' },
  ];

  readonly notificationOptions = [
    { value: 'all', label: 'All notifications' },
    { value: 'important', label: 'Important only' },
    { value: 'none', label: 'None' },
  ];

  readonly inputCode = `<fly-input 
  label="Email" 
  type="email" 
  placeholder="you@example.com"
  [(ngModel)]="email"
/>

<fly-input 
  label="Password" 
  type="password" 
  hint="Minimum 8 characters"
  error="Password is required"
/>`;  

  readonly radioCode = `<fly-radio-group 
  label="Select a plan"
  [options]="planOptions" 
  [(ngModel)]="selectedPlan"
/>

// In your component:
planOptions = [
  { value: 'free', label: 'Free Plan' },
  { value: 'pro', label: 'Pro Plan' },
];`;
  
  readonly countries = [
    { value: 'us', label: 'United States' },
    { value: 'uk', label: 'United Kingdom' },
    { value: 'ca', label: 'Canada' },
    { value: 'au', label: 'Australia' },
    { value: 'de', label: 'Germany' },
  ];

  readonly roles = [
    { value: 'developer', label: 'Developer' },
    { value: 'designer', label: 'Designer' },
    { value: 'manager', label: 'Manager' },
    { value: 'other', label: 'Other' },
  ];
}
