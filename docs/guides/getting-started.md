# Getting Started

This guide will help you set up your development environment and get started with Flyfront.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Project Overview](#project-overview)
- [Running the Application](#running-the-application)
- [Making Your First Change](#making-your-first-change)
- [Understanding the Workflow](#understanding-the-workflow)
- [Next Steps](#next-steps)

---

## Prerequisites

Before you begin, ensure you have the following installed on your development machine:

### Required Software

| Software | Minimum Version | Recommended | Installation |
|----------|----------------|-------------|--------------|
| **Node.js** | 20.x | 22.x LTS | [nodejs.org](https://nodejs.org/) |
| **npm** | 10.x | Latest | Included with Node.js |
| **Git** | 2.x | Latest | [git-scm.com](https://git-scm.com/) |

### Verify Installation

Run these commands to verify your setup:

```bash
# Check Node.js version
node --version
# Expected: v20.x.x or higher

# Check npm version
npm --version
# Expected: 10.x.x or higher

# Check Git version
git --version
# Expected: git version 2.x.x or higher
```

### Recommended Tools

| Tool | Purpose |
|------|---------|
| **VS Code** | Recommended IDE with excellent Angular/TypeScript support |
| **Nx Console** | VS Code extension for running Nx commands |
| **Angular Language Service** | VS Code extension for Angular IntelliSense |
| **Prettier** | Code formatting extension |
| **ESLint** | Linting extension |

#### VS Code Extensions

Install these recommended extensions:

```bash
code --install-extension nrwl.angular-console
code --install-extension angular.ng-template
code --install-extension esbenp.prettier-vscode
code --install-extension dbaeumer.vscode-eslint
code --install-extension bradlc.vscode-tailwindcss
```

---

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/firefly-oss/flyfront.git
cd flyfront
```

### 2. Install Dependencies

```bash
npm install
```

> **Tip**: This installs dependencies for all projects in the monorepo. Nx handles dependency management efficiently.

### 3. Verify Installation

```bash
# Check Nx version
npx nx --version

# View the project graph
npx nx graph
```

The `nx graph` command opens a browser window showing the dependency relationships between all projects.

---

## Project Overview

After installation, you'll have this structure:

```
flyfront/
├── apps/                    # Applications
│   └── demo-app/           # Demo showcase application
├── libs/                    # Shared libraries
│   ├── core/               # Core utilities (@flyfront/core)
│   ├── ui/                 # UI components (@flyfront/ui)
│   ├── auth/               # Authentication (@flyfront/auth)
│   └── ...                 # Other libraries
├── docs/                    # Documentation
├── nx.json                  # Nx configuration
└── package.json            # Root dependencies
```

### Key Files

| File | Purpose |
|------|---------|
| `nx.json` | Nx workspace configuration, caching, and task runner settings |
| `tsconfig.base.json` | Base TypeScript configuration with path mappings |
| `tailwind.config.js` | TailwindCSS design tokens and theme |
| `package.json` | Root dependencies and npm scripts |

---

## Running the Application

### Start Development Server

```bash
# Using npm script
npm start

# Or using Nx directly
npx nx serve demo-app
```

The application will be available at **http://localhost:4200**.

### Development Server Features

- **Hot Module Replacement**: Changes are reflected instantly
- **TypeScript Compilation**: Errors show in the console
- **Source Maps**: Debug TypeScript directly in browser DevTools

### Other Useful Commands

```bash
# Build for production
npx nx build demo-app --configuration=production

# Run unit tests
npx nx test core

# Run linting
npx nx lint ui

# Run all affected tests (based on git changes)
npx nx affected -t test
```

---

## Making Your First Change

Let's make a simple change to understand the development workflow.

### 1. Create a New Component

Navigate to the demo app and create a greeting component:

```bash
npx nx g @nx/angular:component --name=greeting --project=demo-app --standalone
```

### 2. Edit the Component

Open `apps/demo-app/src/app/greeting/greeting.component.ts`:

```typescript
import { Component, input } from '@angular/core';
import { ButtonComponent } from '@flyfront/ui';

@Component({
  selector: 'app-greeting',
  standalone: true,
  imports: [ButtonComponent],
  template: `
    <div class="p-6 bg-white rounded-lg shadow-md">
      <h2 class="text-2xl font-bold text-primary-600 mb-4">
        Hello, {{ name() }}!
      </h2>
      <p class="text-gray-600 mb-4">
        Welcome to Flyfront - the Firefly frontend architecture.
      </p>
      <fly-button variant="primary" (clicked)="sayHello()">
        Say Hello
      </fly-button>
    </div>
  `,
})
export class GreetingComponent {
  name = input('World');

  sayHello() {
    alert(`Hello from ${this.name()}!`);
  }
}
```

### 3. Use the Component

Add it to your app component:

```typescript
// In app.component.ts
import { GreetingComponent } from './greeting/greeting.component';

@Component({
  imports: [GreetingComponent],
  template: `
    <div class="min-h-screen bg-gray-100 p-8">
      <app-greeting name="Developer" />
    </div>
  `,
})
export class AppComponent {}
```

### 4. See the Results

The development server will automatically reload. Open http://localhost:4200 to see your new component.

---

## Understanding the Workflow

### Import from Libraries

Always import from library public APIs, not internal paths:

```typescript
// Correct: Import from public API
import { ButtonComponent, CardComponent } from '@flyfront/ui';
import { ConfigService, authGuard } from '@flyfront/core';
import { AuthService } from '@flyfront/auth';

// Wrong: Import from internal path
import { ButtonComponent } from '@flyfront/ui/src/lib/components/button';
```

### Running Affected Commands

Nx's affected commands only run tasks for projects affected by your changes:

```bash
# Only test affected projects
npx nx affected -t test

# Only build affected projects
npx nx affected -t build

# Only lint affected projects
npx nx affected -t lint
```

This significantly speeds up CI/CD pipelines.

### Viewing Dependencies

```bash
# Open interactive project graph
npx nx graph

# Show dependencies for a specific project
npx nx graph --focus=demo-app
```

### Caching

Nx caches task results. If you run the same command twice without changes, the second run is instant:

```bash
npx nx build demo-app
# First run: compiles everything

npx nx build demo-app
# Second run: reads from cache (instant)
```

---

## Next Steps

Now that you have Flyfront running, explore these guides:

### Learn the Fundamentals

1. **[Architecture Overview](../architecture/README.md)**: Understand how Flyfront is structured
2. **[Libraries Reference](../architecture/libraries.md)**: Learn about each library

### Build Something

3. **[Creating Applications](creating-applications.md)**: Create a new application
4. **[Design System](design-system.md)**: Use UI components effectively
5. **[Authentication](authentication.md)**: Add user authentication

### Quality & Deployment

6. **[Testing](testing.md)**: Write tests for your code
7. **[Deployment](deployment.md)**: Deploy to production

---

## Troubleshooting

### Common Issues

#### "Module not found" errors

Ensure you're importing from library public APIs:

```typescript
// Check your import paths
import { Something } from '@flyfront/core';  // Correct
import { Something } from 'libs/core/src';   // Wrong
```

#### Port 4200 already in use

```bash
# Use a different port
npx nx serve demo-app --port=4300
```

#### Node modules issues

```bash
# Remove node_modules and reinstall
rm -rf node_modules
npm install
```

#### Nx cache issues

```bash
# Clear Nx cache
npx nx reset
```

### Getting Help

- Check the [FAQ](#troubleshooting) section in relevant guides
- Open an issue on [GitHub](https://github.com/firefly-oss/flyfront/issues)
- Ask in [GitHub Discussions](https://github.com/firefly-oss/flyfront/discussions)
