# GitHub Actions CI/CD Pipeline

This directory contains GitHub Actions workflows for automated testing, security scanning, and deployment of the EconGraph application.

## Workflows Overview

### 1. CI/CD Pipeline (`ci.yml`)

**Trigger**: Push to `main`/`develop` branches, Pull Requests

**Jobs**:
- **Backend Tests**: Rust compilation, testing, and linting with PostgreSQL
- **Frontend Tests**: React/TypeScript compilation, testing, and linting
- **Integration Tests**: Full-stack integration testing
- **Security Audit**: Dependency vulnerability scanning
- **Docker Build**: Container image building and validation
- **Quality Checks**: Code formatting, linting, and type checking

**Features**:
- Parallel job execution for faster feedback
- Comprehensive caching for Rust and Node.js dependencies
- PostgreSQL service containers for database testing
- Security scanning with cargo-audit and npm audit
- Docker image building with layer caching

### 2. Release and Deploy (`release.yml`)

**Trigger**: Git tags starting with `v*`, Manual workflow dispatch

**Jobs**:
- **Test Before Release**: Full test suite validation
- **Build and Push**: Docker image building and publishing to GitHub Container Registry
- **Create Release**: Automated GitHub release creation with changelog
- **Deploy Staging**: Automated staging environment deployment
- **Deploy Production**: Production deployment (requires manual approval)
- **Notify Team**: Success/failure notifications

**Features**:
- Semantic versioning support
- Automated changelog generation
- Multi-environment deployment strategy
- Container image publishing with proper tagging
- Environment-specific configurations

### 3. Security and Dependency Updates (`security.yml`)

**Trigger**: Daily schedule (2 AM UTC), Manual workflow dispatch

**Jobs**:
- **Security Audit**: Comprehensive vulnerability scanning
- **Dependency Check**: Trivy filesystem scanning
- **Update Dependencies**: Automated dependency updates via PR
- **CodeQL Analysis**: GitHub's semantic code analysis
- **License Check**: License compliance verification
- **Docker Security Scan**: Container image vulnerability scanning

**Features**:
- Daily automated security monitoring
- Automated dependency update PRs
- SARIF report integration with GitHub Security tab
- License compliance tracking
- Multi-layer security scanning

## Setup Requirements

### Repository Secrets

Configure these secrets in your GitHub repository settings:

```
GITHUB_TOKEN (automatically provided)
```

### Repository Variables (Optional)

For enhanced functionality, configure these variables:

```
REGISTRY_URL=ghcr.io
STAGING_URL=https://staging.econgraph.dev
PRODUCTION_URL=https://econgraph.dev
```

### Branch Protection Rules

Recommended branch protection settings for `main`:

- Require status checks to pass before merging
- Require branches to be up to date before merging
- Required status checks:
  - `Backend Tests (Rust)`
  - `Frontend Tests (React)`
  - `Integration Tests`
  - `Security Audit`
  - `Quality Checks`
- Require pull request reviews before merging
- Dismiss stale PR approvals when new commits are pushed
- Require review from code owners
- Restrict pushes that create files

### Environment Configuration

#### Staging Environment
- **Name**: `staging`
- **URL**: `https://staging.econgraph.dev`
- **Protection Rules**: None (auto-deploy)

#### Production Environment
- **Name**: `production`
- **URL**: `https://econgraph.dev`
- **Protection Rules**: 
  - Required reviewers: 2
  - Wait timer: 5 minutes
  - Prevent administrators from bypassing

## Workflow Features

### Caching Strategy

**Rust Dependencies**:
- Registry cache: `~/.cargo/registry`
- Git cache: `~/.cargo/git`
- Build cache: `backend/target`

**Node.js Dependencies**:
- Package cache: `node_modules`
- npm cache: Built-in npm caching

**Docker Build Cache**:
- GitHub Actions cache integration
- Layer-level caching for optimal build times

### Security Integration

**SARIF Integration**:
- Trivy vulnerability reports
- CodeQL analysis results
- Custom security findings

**Dependency Tracking**:
- Automated vulnerability detection
- License compliance monitoring
- Automated update PRs with testing

### Monitoring and Notifications

**Status Badges** (add to main README):
```markdown
[![CI/CD Pipeline](https://github.com/username/econ-graph/workflows/CI/CD%20Pipeline/badge.svg)](https://github.com/username/econ-graph/actions/workflows/ci.yml)
[![Security Scan](https://github.com/username/econ-graph/workflows/Security%20and%20Dependency%20Updates/badge.svg)](https://github.com/username/econ-graph/actions/workflows/security.yml)
```

**Integration Points**:
- GitHub Security tab for vulnerability reports
- GitHub Packages for container registry
- GitHub Releases for version management

## Local Development

### Running Tests Locally

**Backend Tests**:
```bash
cd backend
cargo test
```

**Frontend Tests**:
```bash
cd frontend
npm test
```

**Integration Tests with Docker**:
```bash
docker-compose --profile test up --build
```

### Security Scanning Locally

**Rust Security Audit**:
```bash
cd backend
cargo install cargo-audit
cargo audit
```

**npm Security Audit**:
```bash
cd frontend
npm audit
```

**Container Security Scan**:
```bash
# Install trivy
brew install aquasecurity/trivy/trivy

# Scan images
trivy image econ-graph-backend:latest
trivy image econ-graph-frontend:latest
```

## Troubleshooting

### Common Issues

1. **PostgreSQL Connection Failures**:
   - Ensure service health checks are passing
   - Check DATABASE_URL environment variable
   - Verify migration files are accessible

2. **Cache Invalidation**:
   - Update cache keys when dependencies change
   - Clear caches manually if corruption occurs

3. **Docker Build Failures**:
   - Check Dockerfile syntax and dependencies
   - Verify multi-stage build targets
   - Ensure proper file permissions

4. **Security Scan False Positives**:
   - Review and whitelist known safe vulnerabilities
   - Update scanning configurations as needed

### Debugging Workflows

**Enable Debug Logging**:
```yaml
env:
  ACTIONS_STEP_DEBUG: true
  ACTIONS_RUNNER_DEBUG: true
```

**SSH Access for Debugging**:
```yaml
- name: Setup tmate session
  uses: mxschmitt/action-tmate@v3
  if: failure()
```

## Best Practices

1. **Keep workflows DRY**: Use composite actions for repeated steps
2. **Minimize secrets**: Use GITHUB_TOKEN when possible
3. **Cache aggressively**: Cache all expensive operations
4. **Fail fast**: Order jobs by execution time and failure probability
5. **Monitor costs**: Use appropriate runner types and optimize build times
6. **Security first**: Scan early and often, never ignore security alerts

## Contributing

When modifying workflows:

1. Test changes in a fork first
2. Use workflow_dispatch for manual testing
3. Update this documentation
4. Ensure backwards compatibility
5. Monitor workflow execution after merging
