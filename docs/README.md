# Flyfront Documentation

Welcome to the official documentation for **Flyfront** - the centralized Angular frontend architecture for the Firefly ecosystem.

## Documentation Structure

This documentation is organized into the following sections:

### [Architecture](architecture/README.md)
Technical architecture documentation covering system design, library structure, and architectural decisions.

- [Overview](architecture/README.md) - High-level architecture overview
- [Libraries](architecture/libraries.md) - Detailed library documentation
- [Dependency Rules](architecture/dependency-rules.md) - Library dependency constraints
- [Design Patterns](architecture/patterns.md) - Common patterns and best practices

### [Guides](guides/README.md)
Step-by-step guides for common development tasks.

- [Getting Started](guides/getting-started.md) - Initial setup and configuration
- [Creating Applications](guides/creating-applications.md) - How to create new apps
- [Design System](guides/design-system.md) - Using the design system
- [Authentication](guides/authentication.md) - Implementing authentication
- [State Management](guides/state-management.md) - Managing application state
- [Internationalization](guides/internationalization.md) - Adding multi-language support
- [Testing](guides/testing.md) - Writing and running tests
- [Deployment](guides/deployment.md) - Building and deploying applications

### [API Reference](api/README.md)
Complete API documentation for all libraries.

- [@flyfront/core](api/core.md)
- [@flyfront/ui](api/ui.md)
- [@flyfront/auth](api/auth.md)
- [@flyfront/data-access](api/data-access.md)
- [@flyfront/state](api/state.md)
- [@flyfront/i18n](api/i18n.md)
- [@flyfront/testing](api/testing.md)

### [Contributing](contributing/README.md)
Guidelines for contributing to Flyfront.

- [Code of Conduct](contributing/code-of-conduct.md)
- [Development Setup](contributing/development-setup.md)
- [Pull Request Guidelines](contributing/pull-requests.md)
- [Coding Standards](contributing/coding-standards.md)

---

## Quick Links

| I want to... | Go to... |
|--------------|----------|
| Get started with Flyfront | [Getting Started Guide](guides/getting-started.md) |
| Create a new application | [Creating Applications](guides/creating-applications.md) |
| Use UI components | [Design System Guide](guides/design-system.md) |
| Add authentication | [Authentication Guide](guides/authentication.md) |
| Understand the architecture | [Architecture Overview](architecture/README.md) |
| Contribute to the project | [Contributing Guide](contributing/README.md) |

---

## Conventions Used in This Documentation

### Code Examples

Code examples are provided in TypeScript and use Angular's latest patterns:

```typescript
// Modern Angular with standalone components and signals
@Component({
  selector: 'app-example',
  standalone: true,
  template: `<p>{{ message() }}</p>`,
})
export class ExampleComponent {
  message = signal('Hello, Flyfront!');
}
```

### Admonitions

Throughout the documentation, you'll find these callouts:

> **Tip**: Helpful suggestions and best practices

> **Warning**: Important information to avoid common pitfalls

> **Note**: Additional context or clarification

> **Security**: Security-related considerations

---

## Getting Help

If you can't find what you're looking for:

1. **Search the documentation** using your browser's find feature
2. **Check the FAQ** in the relevant guide section
3. **Open an issue** on [GitHub](https://github.com/firefly-oss/flyfront/issues)
4. **Ask in discussions** on [GitHub Discussions](https://github.com/firefly-oss/flyfront/discussions)

---

## Documentation Versions

This documentation corresponds to Flyfront version **1.0.0**.

For documentation of other versions, switch branches in the repository.
