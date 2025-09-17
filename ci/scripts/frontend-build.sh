#!/bin/bash
set -e

# Frontend Build Script
# Builds frontend using Docker for consistent, cached builds

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$(dirname "$SCRIPT_DIR")")"

cd "$PROJECT_ROOT"

echo "🔨 Building frontend with Docker..."

# Build frontend image with cache
docker build \
    --tag econ-graph-frontend:latest \
    --file frontend/Dockerfile \
    frontend/

echo "✅ Frontend build completed!"
echo "📦 Built image: econ-graph-frontend:latest"
