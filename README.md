# EconGraph - Economic Time Series Visualization Platform

A modern economic data visualization platform inspired by FRED, built with React frontend and Rust backend.

## Features

- Interactive time series charts with tooltips
- Support for multiple data transformations (YoY, QoQ, MoM changes)
- Original vs. revised data comparison
- Modern, responsive UI
- Automated data crawling from Federal Reserve and BLS
- Kubernetes deployment with monitoring

## Architecture

- **Frontend**: React with TypeScript, Chart.js/D3.js for visualizations
- **Backend**: Rust with Axum web framework, Diesel ORM, PostgreSQL
- **Crawler**: Async job processing with queue-based architecture
- **Deployment**: Kubernetes with Terraform, Grafana monitoring

## Getting Started

### Prerequisites

- Node.js 18+
- Rust 1.70+
- PostgreSQL 14+
- Docker (for containerized deployment)

### Development Setup

1. **Database Setup**
   ```bash
   # Start PostgreSQL (using Docker)
   docker run -d --name econ-postgres -e POSTGRES_PASSWORD=password -p 5432:5432 postgres:14
   ```

2. **Backend Setup**
   ```bash
   cd backend
   cargo run
   ```

3. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   npm start
   ```

## Project Structure

```
econ-graph/
├── backend/           # Rust backend API and crawler
├── frontend/          # React frontend application
├── terraform/         # Infrastructure as Code
├── monitoring/        # Grafana dashboards and configs
└── docs/             # Additional documentation
```

## License

MIT License
