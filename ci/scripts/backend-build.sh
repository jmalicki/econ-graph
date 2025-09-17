#!/bin/bash
set -e

# Backend Build Script
# Builds backend using Docker for consistent, cached builds

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$(dirname "$SCRIPT_DIR")")"

cd "$PROJECT_ROOT"

echo "🔨 Building backend with Docker..."

# Build backend image with cache
docker build \
    --target builder \
    --tag econ-graph-backend:builder \
    --file backend/Dockerfile \
    backend/

echo "✅ Backend build completed!"
echo "📦 Built image: econ-graph-backend:builder"
