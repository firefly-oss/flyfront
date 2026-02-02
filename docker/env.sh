#!/bin/sh
# Flyfront - Runtime Environment Variable Injection
# License: Apache-2.0

set -e

# Create runtime environment configuration
ENV_FILE="/usr/share/nginx/html/assets/env.js"

echo "window.__env = {" > $ENV_FILE
echo "  API_URL: \"${API_URL:-/api}\"," >> $ENV_FILE
echo "  AUTH_URL: \"${AUTH_URL:-}\"," >> $ENV_FILE
echo "  AUTH_CLIENT_ID: \"${AUTH_CLIENT_ID:-}\"," >> $ENV_FILE
echo "  AUTH_REALM: \"${AUTH_REALM:-}\"," >> $ENV_FILE
echo "  ENVIRONMENT: \"${ENVIRONMENT:-production}\"," >> $ENV_FILE
echo "  VERSION: \"${VERSION:-1.0.0}\"," >> $ENV_FILE
echo "  FEATURE_FLAGS: ${FEATURE_FLAGS:-{}}," >> $ENV_FILE
echo "};" >> $ENV_FILE

echo "Runtime environment configured successfully"
