#!/bin/bash

# Deploy EconGraph to local Kubernetes cluster
# This script deploys the application using the K8s manifests

set -e

echo "🚀 Deploying EconGraph to local Kubernetes cluster..."

# Get the project root directory
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$PROJECT_ROOT"

# Check if kind cluster exists
if ! kind get clusters | grep -q "econ-graph"; then
    echo "❌ Kind cluster 'econ-graph' not found. Please run terraform first."
    echo "   cd terraform/k8s && terraform init && terraform apply"
    exit 1
fi

# Set kubectl context
kubectl config use-context kind-econ-graph

# Apply all manifests
echo "📋 Applying Kubernetes manifests..."

# Apply in order
kubectl apply -f k8s/manifests/namespace.yaml
kubectl apply -f k8s/manifests/configmap.yaml
kubectl apply -f k8s/manifests/secret.yaml
kubectl apply -f k8s/manifests/postgres.yaml
kubectl apply -f k8s/manifests/backend-deployment.yaml
kubectl apply -f k8s/manifests/backend-service.yaml
kubectl apply -f k8s/manifests/frontend-deployment.yaml
kubectl apply -f k8s/manifests/frontend-service.yaml
kubectl apply -f k8s/manifests/ingress.yaml

echo "⏳ Waiting for deployments to be ready..."

# Wait for backend deployment
echo "Waiting for backend deployment..."
kubectl wait --for=condition=available --timeout=300s deployment/econ-graph-backend -n econ-graph

# Wait for frontend deployment
echo "Waiting for frontend deployment..."
kubectl wait --for=condition=available --timeout=300s deployment/econ-graph-frontend -n econ-graph

echo "✅ Deployment completed successfully!"
echo ""
echo "🌐 Application URLs:"
echo "  Frontend: http://localhost:3000"
echo "  Backend:  http://localhost:8080"
echo "  GraphQL:  http://localhost:8080/graphql"
echo ""
echo "📊 Useful commands:"
echo "  kubectl get pods -n econ-graph"
echo "  kubectl get services -n econ-graph"
echo "  kubectl logs -f deployment/econ-graph-backend -n econ-graph"
echo "  kubectl logs -f deployment/econ-graph-frontend -n econ-graph"
