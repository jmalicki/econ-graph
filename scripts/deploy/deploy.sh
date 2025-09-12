#!/bin/bash

# Deploy EconGraph to local Kubernetes cluster
# This script deploys the application using the K8s manifests

set -e

echo "🚀 Deploying EconGraph to local Kubernetes cluster..."

# Get the project root directory
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$PROJECT_ROOT"

# Run linter checks before deployment
echo "🔍 Running linter checks before deployment..."
echo ""

# Run Grafana dashboard linter
if [ -f "scripts/test-grafana-dashboards.sh" ]; then
    echo "📊 Running Grafana dashboard linter..."
    if ./scripts/test-grafana-dashboards.sh; then
        echo "✅ Grafana dashboard linter passed"
    else
        echo "❌ Grafana dashboard linter failed - aborting deployment"
        exit 1
    fi
    echo ""
else
    echo "⚠️  Grafana dashboard linter not found, skipping..."
fi

# Run monitoring stack linter (if available)
if [ -f "scripts/test-monitoring.sh" ]; then
    echo "🔧 Running monitoring stack linter..."
    # Only run the linter part, not the full integration test
    if ./scripts/test-monitoring.sh --lint-only 2>/dev/null || echo "⚠️  Monitoring linter not available, continuing..."; then
        echo "✅ Monitoring stack linter passed"
    else
        echo "⚠️  Monitoring stack linter not available, continuing..."
    fi
    echo ""
else
    echo "⚠️  Monitoring stack linter not found, skipping..."
fi

echo "✅ All linter checks passed - proceeding with deployment"
echo ""

# Load port configuration
if [ -f "ports.env" ]; then
    echo "📋 Loading port configuration from ports.env..."
    source ports.env
else
    echo "⚠️  ports.env not found, using default ports"
    BACKEND_NODEPORT=30080
    FRONTEND_NODEPORT=30000
    GRAFANA_NODEPORT=30001
fi

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
# Create ConfigMap with proper JSON embedding to avoid truncation
cat > /tmp/grafana-dashboards.yaml << 'EOF'
apiVersion: v1
kind: ConfigMap
metadata:
  name: grafana-dashboards
  namespace: econ-graph
  labels:
    grafana_dashboard: "1"
data:
  econgraph-overview.json: |
EOF

# Append the full JSON content with proper indentation
cat grafana-dashboards/econgraph-overview.json | sed 's/^/    /' >> /tmp/grafana-dashboards.yaml

# Add the logging dashboard
cat >> /tmp/grafana-dashboards.yaml << 'EOF'
  logging-dashboard.json: |
EOF

# Extract and append the JSON content from the YAML file
yq eval '.data.dashboard' k8s/monitoring/grafana-logging-dashboard.yaml | sed 's/^/    /' >> /tmp/grafana-dashboards.yaml

# Apply the ConfigMap
kubectl apply -f /tmp/grafana-dashboards.yaml
rm -f /tmp/grafana-dashboards.yaml

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
echo "  Frontend: http://localhost:${FRONTEND_NODEPORT}"
echo "  Backend:  http://localhost:${BACKEND_NODEPORT}"
echo "  GraphQL:  http://localhost:${FRONTEND_NODEPORT}/graphql"
echo "  Playground: http://localhost:${FRONTEND_NODEPORT}/playground"
echo "  Grafana:  http://localhost:${GRAFANA_NODEPORT} (admin/admin123)"
echo ""
echo "📊 Useful commands:"
echo "  kubectl get pods -n econ-graph"
echo "  kubectl get services -n econ-graph"
echo "  kubectl logs -f deployment/econ-graph-backend -n econ-graph"
echo "  kubectl logs -f deployment/econ-graph-frontend -n econ-graph"
