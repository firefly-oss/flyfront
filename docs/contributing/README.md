#  Contributing to Flyfront

Thank you for your interest in contributing to Flyfront! This guide will help you get started with contributing to the project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Testing Requirements](#testing-requirements)
- [Documentation](#documentation)

---

## Code of Conduct

This project adheres to a Code of Conduct that all contributors are expected to follow. By participating, you agree to uphold this code. Please report unacceptable behavior to the maintainers.

### Our Pledge

We pledge to make participation in our project a harassment-free experience for everyone, regardless of age, body size, disability, ethnicity, gender identity and expression, level of experience, nationality, personal appearance, race, religion, or sexual identity and orientation.

---

## Getting Started

### Prerequisites

1. **Development Environment**: Follow the [Getting Started Guide](../guides/getting-started.md) to set up your environment
2. **Git**: Familiarity with Git and GitHub workflows
3. **Angular/TypeScript**: Understanding of Angular 21+ and TypeScript

### Finding Something to Work On

- **Good First Issues**: Look for issues labeled `good first issue`
- **Help Wanted**: Issues labeled `help wanted` need community assistance
- **Feature Requests**: Issues labeled `enhancement` for new features
- **Bug Fixes**: Issues labeled `bug` for defects

### Before You Start

1. **Check existing issues** to avoid duplicate work
2. **Open an issue first** for significant changes to discuss the approach
3. **Claim the issue** by commenting that you're working on it

---

## Development Workflow

### 1. Fork and Clone

```bash
# Fork the repository on GitHub, then:
git clone https://github.com/YOUR_USERNAME/flyfront.git
cd flyfront
npm install
```

### 2. Create a Branch

Use a descriptive branch name:

```bash
# Feature
git checkout -b feature/add-date-picker

# Bug fix
git checkout -b fix/button-loading-state

# Documentation
git checkout -b docs/update-auth-guide
```

### 3. Make Your Changes

- Follow the [Coding Standards](#coding-standards)
- Add tests for new functionality
- Update documentation as needed

### 4. Verify Your Changes

```bash
# Run affected tests
npx nx affected -t test

# Run affected linting
npx nx affected -t lint

# Build affected projects
npx nx affected -t build
```

### 5. Commit Your Changes

Use [Conventional Commits](https://www.conventionalcommits.org/):

```bash
# Format: <type>(<scope>): <description>

# Features
git commit -m "feat(ui): add DatePicker component"

# Bug fixes
git commit -m "fix(core): resolve config loading race condition"

# Documentation
git commit -m "docs(guides): add state management guide"

# Refactoring
git commit -m "refactor(auth): simplify token refresh logic"

# Tests
git commit -m "test(ui): add Button component tests"
```

#### Commit Types

| Type | Description |
|------|-------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation only |
| `style` | Code style changes (formatting, semicolons, etc.) |
| `refactor` | Code change that neither fixes a bug nor adds a feature |
| `test` | Adding or updating tests |
| `chore` | Maintenance tasks, dependency updates |
| `perf` | Performance improvements |
| `ci` | CI/CD changes |

### 6. Push and Create PR

```bash
git push origin feature/your-feature-name
```

Then create a Pull Request on GitHub.

---

## Pull Request Process

### PR Title

Use the same format as commits:

```
feat(ui): add DatePicker component with range selection
fix(auth): resolve token refresh on network error
```

### PR Description

Use the PR template and include:

1. **Summary**: What does this PR do?
2. **Motivation**: Why is this change needed?
3. **Changes**: List of significant changes
4. **Testing**: How was this tested?
5. **Screenshots**: For UI changes

### PR Checklist

- [ ] Code follows the project's coding standards
- [ ] Tests pass locally (`npx nx affected -t test`)
- [ ] Linting passes (`npx nx affected -t lint`)
- [ ] Documentation is updated (if applicable)
- [ ] Commit messages follow Conventional Commits
- [ ] PR has a clear title and description

### Review Process

1. **Automated Checks**: CI must pass (tests, lint, build)
2. **Code Review**: At least one maintainer approval required
3. **Feedback**: Address review comments or discuss alternatives
4. **Merge**: Maintainer merges after approval

---

## Coding Standards

### TypeScript

```typescript
//  Use strict types
interface UserData {
  id: string;
  name: string;
  email: string;
}

//  Use readonly where appropriate
readonly users = signal<UserData[]>([]);

//  Prefer const assertions
const ROLES = ['admin', 'user', 'guest'] as const;

//  Use explicit return types for public methods
getUserById(id: string): Observable<UserData> {
  return this.http.get<UserData>(`/users/${id}`);
}
```

### Angular Components

```typescript
//  Use standalone components
@Component({
  selector: 'fly-example',
  standalone: true,
  imports: [CommonModule],
  template: `...`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExampleComponent {
  //  Use inject() over constructor injection
  private readonly http = inject(HttpClient);
  
  //  Use signals for reactive state
  readonly isLoading = signal(false);
  
  //  Use input() and output() signals
  readonly title = input.required<string>();
  readonly clicked = output<void>();
}
```

### File Naming

| Type | Convention | Example |
|------|------------|---------|
| Component | `kebab-case.component.ts` | `date-picker.component.ts` |
| Service | `kebab-case.service.ts` | `auth.service.ts` |
| Guard | `kebab-case.guard.ts` | `auth.guard.ts` |
| Interface | `kebab-case.models.ts` | `user.models.ts` |
| Utility | `kebab-case.utils.ts` | `string.utils.ts` |

### Imports

Order imports as follows:

```typescript
// 1. Angular core
import { Component, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';

// 2. Third-party libraries
import { Observable, map } from 'rxjs';

// 3. Flyfront libraries
import { ConfigService } from '@flyfront/core';
import { ButtonComponent } from '@flyfront/ui';

// 4. Relative imports
import { UserService } from './user.service';
```

---

## Testing Requirements

### Unit Tests

All new code should have unit tests:

```typescript
describe('ButtonComponent', () => {
  it('should emit clicked event when clicked', async () => {
    const fixture = TestBed.createComponent(ButtonComponent);
    const component = fixture.componentInstance;
    const clickedSpy = jest.spyOn(component.clicked, 'emit');
    
    const button = fixture.nativeElement.querySelector('button');
    button.click();
    
    expect(clickedSpy).toHaveBeenCalled();
  });
  
  it('should not emit when disabled', () => {
    const fixture = TestBed.createComponent(ButtonComponent);
    const component = fixture.componentInstance;
    component.disabled = true;
    fixture.detectChanges();
    
    const clickedSpy = jest.spyOn(component.clicked, 'emit');
    const button = fixture.nativeElement.querySelector('button');
    button.click();
    
    expect(clickedSpy).not.toHaveBeenCalled();
  });
});
```

### Test Coverage

- **New features**: Aim for 80%+ coverage
- **Bug fixes**: Add tests that would have caught the bug
- **Services**: Test all public methods
- **Components**: Test user interactions and edge cases

### Running Tests

```bash
# Run tests for a specific project
npx nx test ui

# Run tests with coverage
npx nx test ui --coverage

# Run affected tests
npx nx affected -t test
```

---

## Documentation

### When to Update Documentation

- Adding new features or APIs
- Changing existing behavior
- Fixing documentation errors
- Adding examples for complex features

### Documentation Locations

| Type | Location |
|------|----------|
| API docs | `docs/api/` |
| Guides | `docs/guides/` |
| Architecture | `docs/architecture/` |
| README | `README.md` |
| Library README | `libs/*/README.md` |

### Documentation Style

- Use clear, concise language
- Include code examples
- Add screenshots for UI features
- Keep examples simple and focused

---

## Questions?

- **GitHub Issues**: For bugs and feature requests
- **GitHub Discussions**: For questions and ideas
- **Pull Requests**: For code contributions

Thank you for contributing to Flyfront! 
