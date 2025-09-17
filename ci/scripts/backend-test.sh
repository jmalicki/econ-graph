#!/bin/bash
set -e

# Backend Test Script
# Runs backend tests using Docker for consistency

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$(dirname "$SCRIPT_DIR")")"

cd "$PROJECT_ROOT"

# Parse arguments
TEST_TYPE="all"
while [[ $# -gt 0 ]]; do
    case $1 in
        --unit)
            TEST_TYPE="unit"
            shift
            ;;
        --integration)
            TEST_TYPE="integration"
            shift
            ;;
        --smoke)
            TEST_TYPE="smoke"
            shift
            ;;
        --all)
            TEST_TYPE="all"
            shift
            ;;
        --help)
            echo "Usage: $0 [--unit|--integration|--smoke|--all]"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

echo "🧪 Running backend tests: $TEST_TYPE"

# Build test image
docker build \
    --target builder \
    --tag econ-graph-backend:test \
    --file backend/Dockerfile \
    backend/

# Run tests based on type
case $TEST_TYPE in
    "unit")
        echo "🔬 Running unit tests..."
        docker run --rm \
            -e DATABASE_URL=postgresql://postgres:password@host.docker.internal:5432/econ_graph_test \
            econ-graph-backend:test \
            cargo test --lib -- --test-threads=4 --nocapture
        ;;
    "integration")
        echo "🔗 Running integration tests..."
        docker run --rm \
            -e DATABASE_URL=postgresql://postgres:password@host.docker.internal:5432/econ_graph_test \
            econ-graph-backend:test \
            cargo test --test '*' -- --test-threads=2 --nocapture
        ;;
    "smoke")
        echo "💨 Running smoke tests..."
        docker run --rm \
            -e DATABASE_URL=postgresql://postgres:password@host.docker.internal:5432/econ_graph_test \
            econ-graph-backend:test \
            cargo test --lib -- --test-threads=2 --nocapture mcp_server::tests
        ;;
    "all")
        echo "🚀 Running all tests..."
        docker run --rm \
            -e DATABASE_URL=postgresql://postgres:password@host.docker.internal:5432/econ_graph_test \
            econ-graph-backend:test \
            cargo test --all-targets -- --test-threads=2 --nocapture
        ;;
esac

echo "✅ Backend tests completed!"
