#!/bin/bash

# Build Docker images for EconGraph
# This script builds both frontend and backend images for local K8s deployment

set -e

echo "🐳 Building EconGraph Docker images..."

# Get the project root directory
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$PROJECT_ROOT"

# Build backend image
echo "📦 Building backend image..."
cd backend
docker build -t econ-graph-backend:latest .
echo "✅ Backend image built successfully"

# Build frontend image
echo "📦 Building frontend image..."
cd ../frontend
docker build \
  --build-arg REACT_APP_API_URL="" \
  --build-arg REACT_APP_GRAPHQL_URL="/graphql" \
  --build-arg REACT_APP_WS_URL="ws://localhost/graphql" \
  --build-arg NODE_ENV="production" \
  -t econ-graph-frontend:latest .
echo "✅ Frontend image built successfully"

# Load images into kind cluster
echo "🚀 Loading images into kind cluster..."
kind load docker-image econ-graph-backend:latest --name econ-graph
kind load docker-image econ-graph-frontend:latest --name econ-graph

echo "🎉 All images built and loaded successfully!"
echo ""
echo "Images available in kind cluster:"
echo "  - econ-graph-backend:latest"
echo "  - econ-graph-frontend:latest"
