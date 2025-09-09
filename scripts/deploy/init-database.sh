#!/bin/bash

# Initialize PostgreSQL database for EconGraph
# This script creates the database and user if they don't exist

set -e

echo "🗄️  Initializing PostgreSQL database for EconGraph..."

# Database configuration
DB_NAME="econ_graph"
DB_USER="postgres"
DB_PASSWORD="password"
DB_HOST="localhost"
DB_PORT="5432"

# Check if PostgreSQL is running
if ! pg_isready -h $DB_HOST -p $DB_PORT -U $DB_USER; then
    echo "❌ PostgreSQL is not running or not accessible at $DB_HOST:$DB_PORT"
    echo "Please make sure PostgreSQL is running and accessible."
    exit 1
fi

echo "✅ PostgreSQL is running and accessible"

# Create database if it doesn't exist
echo "📊 Creating database '$DB_NAME' if it doesn't exist..."
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -c "CREATE DATABASE $DB_NAME;" 2>/dev/null || echo "Database '$DB_NAME' already exists"

echo "✅ Database setup completed!"
echo ""
echo "Database connection details:"
echo "  Host: $DB_HOST"
echo "  Port: $DB_PORT"
echo "  Database: $DB_NAME"
echo "  User: $DB_USER"
echo "  Password: $DB_PASSWORD"
echo ""
echo "Connection string: postgresql://$DB_USER:$DB_PASSWORD@$DB_HOST:$DB_PORT/$DB_NAME"
