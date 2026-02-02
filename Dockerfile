# Flyfront - Multi-stage Dockerfile
# License: Apache-2.0

# ===========================================
# Stage 1: Build
# ===========================================
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --legacy-peer-deps

# Copy source code
COPY . .

# Build the application
ARG APP_NAME=demo-app
ARG CONFIGURATION=production

RUN npx nx build ${APP_NAME} --configuration=${CONFIGURATION}

# ===========================================
# Stage 2: Production
# ===========================================
FROM nginx:alpine AS production

# Install envsubst for runtime environment variable substitution
RUN apk add --no-cache gettext

# Copy nginx configuration
COPY docker/nginx.conf /etc/nginx/nginx.conf
COPY docker/default.conf.template /etc/nginx/templates/default.conf.template

# Copy built application
ARG APP_NAME=demo-app
COPY --from=builder /app/dist/${APP_NAME}/browser /usr/share/nginx/html

# Copy environment configuration script
COPY docker/env.sh /docker-entrypoint.d/40-env.sh
RUN chmod +x /docker-entrypoint.d/40-env.sh

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost/health || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
