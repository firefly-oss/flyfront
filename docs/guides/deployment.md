# Deployment Guide

This guide covers building and deploying Flyfront applications to production environments.

## Table of Contents

- [Overview](#overview)
- [Building for Production](#building-for-production)
- [Docker Deployment](#docker-deployment)
- [CI/CD Pipeline](#cicd-pipeline)
- [Environment Configuration](#environment-configuration)
- [Performance Optimization](#performance-optimization)
- [Monitoring](#monitoring)

---

## Overview

Flyfront applications can be deployed in multiple ways:

| Method | Use Case |
|--------|----------|
| Static hosting | CDN, S3, Vercel, Netlify |
| Docker containers | Kubernetes, Docker Swarm |
| Traditional servers | Nginx, Apache |

### Deployment Flow

```
┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐
│  Build  │ ──► │  Test   │ ──► │  Image  │ ──► │ Deploy  │
│   App   │     │  Suite  │     │  Build  │     │   Env   │
└─────────┘     └─────────┘     └─────────┘     └─────────┘
```

---

## Building for Production

Before deploying, you need to create an optimized production build. This process minifies code, removes development-only features, and generates hashed filenames for cache busting.

### Step 1: Run the Production Build

The most basic production build uses the `--configuration=production` flag:

```bash
# Build a single application
npx nx build my-app --configuration=production

# Build all affected projects
npx nx affected -t build --configuration=production

# Build with specific output path
npx nx build my-app --outputPath=dist/my-app
```

**Why this matters**: The production configuration enables several optimizations:
- **Tree shaking**: Removes unused code to reduce bundle size
- **Minification**: Compresses JavaScript and CSS
- **AOT compilation**: Pre-compiles templates for faster startup
- **Hash-based filenames**: Enables browser caching with automatic cache busting

### Step 2: Verify the Build Output

After building, check the `dist` folder to ensure everything was generated correctly:

```
dist/apps/my-app/
├── browser/
│   ├── index.html
│   ├── main-[hash].js
│   ├── polyfills-[hash].js
│   ├── styles-[hash].css
│   └── assets/
│       ├── i18n/
│       └── images/
└── 3rdpartylicenses.txt
```

Each file has a hash suffix (e.g., `main-abc123.js`) that changes when the file content changes. This allows browsers to cache files indefinitely while still getting updates when code changes.

### Step 3: Configure Build Settings

Production settings are configured in your application's `project.json`. Here's what each option does:

```json
{
  "targets": {
    "build": {
      "configurations": {
        "production": {
          "budgets": [
            {
              "type": "initial",
              "maximumWarning": "500kb",
              "maximumError": "1mb"
            },
            {
              "type": "anyComponentStyle",
              "maximumWarning": "2kb",
              "maximumError": "4kb"
            }
          ],
          "outputHashing": "all",
          "optimization": true,
          "sourceMap": false,
          "namedChunks": false,
          "extractLicenses": true,
          "fileReplacements": [
            {
              "replace": "apps/my-app/src/environments/environment.ts",
              "with": "apps/my-app/src/environments/environment.prod.ts"
            }
          ]
        }
      }
    }
  }
}
```

---

## Docker Deployment

Docker provides a consistent deployment environment. We use a multi-stage build to keep the final image small.

### Understanding Multi-Stage Builds

A multi-stage Dockerfile separates the build environment from the runtime environment:

1. **Builder stage**: Contains Node.js, npm, and all build tools (large image)
2. **Runtime stage**: Contains only Nginx and the built files (small image)

This approach results in a final image under 50MB instead of several hundred MB.

### Step 1: Create the Dockerfile

Create a file named `Dockerfile` in your project root:

```dockerfile
# Dockerfile
# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci

# Copy source
COPY . .

# Build production
ARG APP_NAME=demo-app
RUN npx nx build ${APP_NAME} --configuration=production

# Stage 2: Serve
FROM nginx:alpine

# Copy nginx config
COPY docker/nginx.conf /etc/nginx/nginx.conf

# Copy built app
ARG APP_NAME=demo-app
COPY --from=builder /app/dist/apps/${APP_NAME}/browser /usr/share/nginx/html

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost/health || exit 1

CMD ["nginx", "-g", "daemon off;"]
```

**Key points about this Dockerfile:**
- Line 1-11: Builder stage installs dependencies and builds the app
- Line 13-19: Runtime stage starts fresh with only Nginx
- The `ARG APP_NAME` allows building different applications with the same Dockerfile

### Step 2: Configure Nginx

Create a configuration file at `docker/nginx.conf`. Nginx serves the static files and handles Angular's client-side routing:

```nginx
# docker/nginx.conf
events {
    worker_connections 1024;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;

    # Logging
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';
    access_log /var/log/nginx/access.log main;

    # Performance
    sendfile        on;
    tcp_nopush      on;
    tcp_nodelay     on;
    keepalive_timeout  65;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_types text/plain text/css application/json application/javascript 
               text/xml application/xml application/xml+rss text/javascript;

    server {
        listen 80;
        server_name _;
        root /usr/share/nginx/html;
        index index.html;

        # Security headers
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header Referrer-Policy "strict-origin-when-cross-origin" always;

        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }

        # Health check endpoint
        location /health {
            return 200 'OK';
            add_header Content-Type text/plain;
        }

        # API proxy (if needed)
        location /api/ {
            proxy_pass http://api-server:3000/;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
        }

        # Angular routing - serve index.html for all routes
        location / {
            try_files $uri $uri/ /index.html;
        }
    }
}
```

**Important Nginx settings explained:**
- `try_files $uri $uri/ /index.html`: Routes all requests to `index.html` for Angular's client-side router
- Security headers prevent common web vulnerabilities
- Gzip compression reduces bandwidth usage by ~70%
- Static asset caching (`expires 1y`) improves load times for returning users

### Step 3: Create Docker Compose File (Optional)

For local development and simple deployments, Docker Compose orchestrates multiple services:

```yaml
# docker-compose.yml
version: '3.8'

services:
  frontend:
    build:
      context: .
      dockerfile: Dockerfile
      args:
        APP_NAME: demo-app
    ports:
      - "80:80"
    environment:
      - API_URL=http://api:3000
    depends_on:
      - api
    networks:
      - flyfront-network
    restart: unless-stopped

  api:
    image: ghcr.io/firefly-oss/api:latest  # Replace with your actual API image
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=${DATABASE_URL}
    networks:
      - flyfront-network
    restart: unless-stopped

networks:
  flyfront-network:
    driver: bridge
```

### Step 4: Build and Run the Container

**Build the Docker image:**

```bash
# Build the image, specifying which app to build
docker build -t flyfront-app:latest --build-arg APP_NAME=demo-app .
```

**Run the container:**

```bash
# Start the container, mapping port 80
docker run -d -p 80:80 --name flyfront flyfront-app:latest

# Verify it's running
docker ps
curl http://localhost/health
```

**Using Docker Compose:**

```bash
# Start all services in the background
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

---

## CI/CD Pipeline

### GitHub Actions

```yaml
# .github/workflows/ci.yml
name: CI/CD

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

env:
  NODE_VERSION: '20'
  NX_CLOUD_ACCESS_TOKEN: ${{ secrets.NX_CLOUD_ACCESS_TOKEN }}

jobs:
  build:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Lint
        run: npx nx affected -t lint --parallel=3

      - name: Test
        run: npx nx affected -t test --parallel=3 --coverage

      - name: Build
        run: npx nx affected -t build --configuration=production

      - name: Upload build artifacts
        uses: actions/upload-artifact@v4
        with:
          name: dist
          path: dist/

  deploy-staging:
    needs: build
    if: github.ref == 'refs/heads/develop'
    runs-on: ubuntu-latest
    environment: staging
    
    steps:
      - uses: actions/checkout@v4

      - name: Download artifacts
        uses: actions/download-artifact@v4
        with:
          name: dist
          path: dist/

      - name: Deploy to staging
        run: |
          # Deploy to staging environment
          echo "Deploying to staging..."

  deploy-production:
    needs: build
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    environment: production
    
    steps:
      - uses: actions/checkout@v4

      - name: Download artifacts
        uses: actions/download-artifact@v4
        with:
          name: dist
          path: dist/

      - name: Build Docker image
        run: |
          docker build -t ${{ secrets.REGISTRY }}/flyfront:${{ github.sha }} .
          docker push ${{ secrets.REGISTRY }}/flyfront:${{ github.sha }}

      - name: Deploy to production
        run: |
          # Deploy to Kubernetes or other platform
          kubectl set image deployment/flyfront \
            flyfront=${{ secrets.REGISTRY }}/flyfront:${{ github.sha }}
```

---

## Environment Configuration

### Runtime Configuration

For runtime configuration, inject environment variables:

```typescript
// main.ts
import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';

// Load runtime config before bootstrap
fetch('/assets/config.json')
  .then(response => response.json())
  .then(config => {
    (window as any).__APP_CONFIG__ = config;
    bootstrapApplication(AppComponent, appConfig);
  });
```

```json
// assets/config.json (generated at deploy time)
{
  "apiUrl": "https://api.example.com",
  "authIssuer": "https://auth.example.com",
  "features": {
    "darkMode": true,
    "analytics": true
  }
}
```

### Environment Variables in Docker

```dockerfile
# Generate config at container start
COPY docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh
ENTRYPOINT ["/entrypoint.sh"]
```

```bash
#!/bin/sh
# docker/entrypoint.sh

# Generate config from environment variables
cat > /usr/share/nginx/html/assets/config.json << EOF
{
  "apiUrl": "${API_URL:-http://localhost:3000}",
  "authIssuer": "${AUTH_ISSUER:-http://localhost:8080}",
  "features": {
    "darkMode": ${FEATURE_DARK_MODE:-true},
    "analytics": ${FEATURE_ANALYTICS:-false}
  }
}
EOF

exec nginx -g 'daemon off;'
```

---

## Performance Optimization

### Bundle Analysis

```bash
# Analyze bundle size
npx nx build my-app --configuration=production --stats-json
npx webpack-bundle-analyzer dist/apps/my-app/browser/stats.json
```

### Lazy Loading

Ensure routes are lazy-loaded:

```typescript
// app.routes.ts
export const routes: Routes = [
  {
    path: 'dashboard',
    loadComponent: () => import('./pages/dashboard/dashboard.component')
      .then(m => m.DashboardComponent),
  },
  {
    path: 'admin',
    loadChildren: () => import('./features/admin/admin.routes')
      .then(m => m.adminRoutes),
  },
];
```

### Preloading Strategy

```typescript
// app.config.ts
import { PreloadAllModules } from '@angular/router';

provideRouter(
  routes,
  withPreloading(PreloadAllModules)
)
```

### Service Worker

```typescript
// app.config.ts
import { provideServiceWorker } from '@angular/service-worker';

providers: [
  provideServiceWorker('ngsw-worker.js', {
    enabled: environment.production,
    registrationStrategy: 'registerWhenStable:30000',
  }),
]
```

---

## Monitoring

### Error Tracking

```typescript
// error-handler.service.ts
@Injectable({ providedIn: 'root' })
export class GlobalErrorHandler implements ErrorHandler {
  handleError(error: Error): void {
    console.error('Unhandled error:', error);
    
    // Send to error tracking service
    if (environment.production) {
      // Sentry, LogRocket, etc.
      Sentry.captureException(error);
    }
  }
}
```

### Health Checks

```typescript
// health.component.ts
@Component({
  selector: 'app-health',
  template: `{{ status | json }}`,
})
export class HealthComponent {
  status = {
    status: 'healthy',
    version: environment.version,
    timestamp: new Date().toISOString(),
  };
}
```

### Logging

```typescript
// Configure logging levels per environment
provideConfig({
  logging: {
    level: environment.production ? 'error' : 'debug',
    console: true,
    remote: environment.production,
  },
})
```

---

## Related Documentation

- [Getting Started Guide](getting-started.md)
- [Creating Applications](creating-applications.md)
- [Architecture Overview](../architecture/README.md)
