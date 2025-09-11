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

# Deploy PostgreSQL
echo "🗄️  Deploying PostgreSQL..."
kubectl apply -f k8s/manifests/postgres-init.yaml
kubectl apply -f k8s/manifests/postgres-deployment.yaml
kubectl apply -f k8s/manifests/postgres.yaml

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
kubectl wait --for=condition=ready pod -l app=postgresql -n econ-graph --timeout=300s

# Deploy application
kubectl apply -f k8s/manifests/backend-deployment.yaml
kubectl apply -f k8s/manifests/backend-service.yaml
kubectl apply -f k8s/manifests/frontend-deployment.yaml
kubectl apply -f k8s/manifests/frontend-service.yaml
kubectl apply -f k8s/manifests/ingress.yaml

echo "⏳ Waiting for deployments to be ready..."
echo "📊 Monitoring pod status (updates every 10 seconds):"
kubectl get pods -n econ-graph
echo ""

# Start background monitoring
(
  while true; do
    sleep 10
    echo "📊 Pod status update:"
    kubectl get pods -n econ-graph
    echo ""
  done
) &
MONITOR_PID=$!

# Wait for backend deployment
echo "Waiting for backend deployment..."
kubectl wait --for=condition=available --timeout=300s deployment/econ-graph-backend -n econ-graph

# Wait for frontend deployment
echo "Waiting for frontend deployment..."
kubectl wait --for=condition=available --timeout=300s deployment/econ-graph-frontend -n econ-graph

# Stop monitoring
kill $MONITOR_PID 2>/dev/null || true

# Deploy monitoring stack
echo "📊 Deploying monitoring stack (Grafana + Loki + Prometheus)..."
kubectl apply -f k8s/monitoring/

# Configure Grafana dashboards
echo "📋 Configuring Grafana dashboards..."
kubectl create configmap grafana-dashboards \
  --from-file=grafana-dashboards/econgraph-overview.json \
  --from-file=k8s/monitoring/grafana-logging-dashboard.yaml \
  --dry-run=client -o yaml | kubectl apply -f -

# Wait for monitoring stack to be ready
echo "⏳ Waiting for monitoring stack to be ready..."
echo "📊 Monitoring pod status (updates every 10 seconds):"
kubectl get pods -n econ-graph
echo ""

# Start background monitoring
(
  while true; do
    sleep 10
    echo "📊 Pod status update:"
    kubectl get pods -n econ-graph
    echo ""
  done
) &
MONITOR_PID=$!

kubectl wait --for=condition=ready pod -l app=grafana -n econ-graph --timeout=300s
kubectl wait --for=condition=ready pod -l app=loki -n econ-graph --timeout=300s
kubectl wait --for=condition=ready pod -l app=prometheus -n econ-graph --timeout=300s

# Stop monitoring
kill $MONITOR_PID 2>/dev/null || true

# Show final pod status
echo "📊 Final pod status:"
kubectl get pods -n econ-graph

echo "✅ Deployment completed successfully!"
echo ""
echo "🌐 Application URLs:"
echo "  Frontend: http://localhost/"
echo "  Backend:  http://localhost:9876"
echo "  GraphQL:  http://localhost/graphql"
echo "  Playground: http://localhost/playground"
echo "  Grafana:  http://localhost:30001 (admin/admin123)"
echo ""
echo "📊 Useful commands:"
echo "  kubectl get pods -n econ-graph"
echo "  kubectl get services -n econ-graph"
echo "  kubectl logs -f deployment/econ-graph-backend -n econ-graph"
echo "  kubectl logs -f deployment/econ-graph-frontend -n econ-graph"
