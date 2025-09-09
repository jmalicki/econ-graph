#!/bin/bash

# EconGraph Development Tools Setup
# Sets up pre-commit hooks and development environment

set -e

echo "🔧 Setting up EconGraph development tools..."

# Check if we're in the right directory
if [[ ! -f "Cargo.toml" ]] && [[ ! -f "backend/Cargo.toml" ]]; then
    echo "❌ Please run this script from the project root directory"
    exit 1
fi

# Install pre-commit if not already installed
if ! command -v pre-commit &> /dev/null; then
    echo "📦 Installing pre-commit..."

    # Try different installation methods
    if command -v pip3 &> /dev/null; then
        pip3 install pre-commit
    elif command -v pip &> /dev/null; then
        pip install pre-commit
    elif command -v brew &> /dev/null; then
        brew install pre-commit
    else
        echo "❌ Could not install pre-commit. Please install it manually:"
        echo "   pip install pre-commit"
        echo "   or visit: https://pre-commit.com/#install"
        exit 1
    fi
else
    echo "✅ pre-commit already installed"
fi

# Install pre-commit hooks
echo "🪝 Installing pre-commit hooks..."
pre-commit install
pre-commit install --hook-type pre-push

# Install additional development tools
echo "🛠️ Installing additional development tools..."

# Rust tools
if command -v cargo &> /dev/null; then
    echo "📦 Installing Rust development tools..."
    cargo install cargo-audit 2>/dev/null || echo "cargo-audit already installed"
    cargo install cargo-watch 2>/dev/null || echo "cargo-watch already installed"
else
    echo "⚠️ Rust not found. Please install Rust first: https://rustup.rs/"
fi

# Node.js tools (frontend)
if [[ -d "frontend" ]]; then
    echo "📦 Installing frontend development tools..."
    cd frontend

    # Install prettier if not already in package.json
    if ! npm list prettier &> /dev/null; then
        npm install --save-dev prettier
    fi

    # Install eslint plugins if needed
    if ! npm list @typescript-eslint/parser &> /dev/null; then
        npm install --save-dev @typescript-eslint/parser @typescript-eslint/eslint-plugin
    fi

    cd ..
fi

echo ""
echo "🎉 Development tools setup complete!"
echo ""
echo "📋 What's been set up:"
echo "   ✅ Pre-commit hooks (run on every commit)"
echo "   ✅ Pre-push hooks (run on every push)"
echo "   ✅ Rust formatting and linting checks"
echo "   ✅ Frontend formatting and TypeScript checks"
echo "   ✅ Security audit checks"
echo "   ✅ File quality checks (trailing whitespace, etc.)"
echo ""
echo "🔍 To test the hooks manually:"
echo "   pre-commit run --all-files"
echo ""
echo "⚡ To skip hooks temporarily (use sparingly):"
echo "   git commit --no-verify"
echo ""
echo "🚀 Happy coding with automatic quality checks!"
