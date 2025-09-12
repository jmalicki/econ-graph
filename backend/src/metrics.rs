//! Prometheus metrics collection for the EconGraph backend
//!
//! This module provides comprehensive metrics collection for monitoring
//! application performance, database operations, GraphQL queries, and more.
//! All metrics are exposed via the /metrics endpoint for Prometheus scraping.

use prometheus::{
    Encoder, Histogram, HistogramOpts, HistogramVec, IntCounter, IntCounterVec, IntGauge,
    IntGaugeVec, Opts, Registry, TextEncoder,
};
use std::sync::Arc;
use warp::http::StatusCode;
use warp::Reply;

/// Global metrics registry for the application
pub static REGISTRY: once_cell::sync::Lazy<Arc<Registry>> =
    once_cell::sync::Lazy::new(|| Arc::new(Registry::new()));

/// Application-level metrics
pub struct AppMetrics {
    /// Total HTTP requests received
    pub http_requests_total: IntCounterVec,

    /// HTTP request duration in seconds
    pub http_request_duration_seconds: HistogramVec,

    /// Number of active HTTP connections
    pub http_connections_active: IntGauge,

    /// Total number of GraphQL queries executed
    pub graphql_queries_total: IntCounterVec,

    /// GraphQL query execution time in seconds
    pub graphql_query_duration_seconds: HistogramVec,

    /// GraphQL query complexity score
    pub graphql_query_complexity: Histogram,

    /// Number of active database connections
    pub db_connections_active: IntGauge,
    /// Number of idle database connections
    pub db_connections_idle: IntGauge,
    /// Total number of database connections in pool
    pub db_connections_total: IntGauge,

    /// Total number of database queries
    pub db_queries_total: IntCounterVec,
    /// Database query execution time in seconds
    pub db_query_duration_seconds: HistogramVec,

    /// Total number of authentication attempts
    pub auth_attempts_total: IntCounterVec,
    /// Total number of successful authentications
    pub auth_success_total: IntCounterVec,
    /// Total number of failed authentications
    pub auth_failures_total: IntCounterVec,

    /// Total number of crawler requests
    pub crawler_requests_total: IntCounterVec,
    /// Crawler request duration in seconds
    pub crawler_duration_seconds: HistogramVec,
    /// Total number of data points collected by crawler
    pub crawler_data_points_collected: IntCounter,

    /// Total number of errors
    pub errors_total: IntCounterVec,

    /// Application uptime in seconds
    pub app_uptime_seconds: IntCounter,
    /// Current memory usage in bytes
    pub memory_usage_bytes: IntGauge,
}

impl AppMetrics {
    /// Create a new instance of AppMetrics and register all collectors
    pub fn new() -> anyhow::Result<Self> {
        Self::new_with_registry(REGISTRY.clone())
    }

    /// Create a new instance of AppMetrics with a specific registry
    /// This is useful for testing to avoid duplicate registration issues
    pub fn new_with_registry(registry: Arc<Registry>) -> anyhow::Result<Self> {
        // HTTP metrics
        let http_requests_total = IntCounterVec::new(
            Opts::new("http_requests_total", "Total number of HTTP requests"),
            &["method", "endpoint", "status_code"],
        )?;
        registry.register(Box::new(http_requests_total.clone()))?;

        let http_request_duration_seconds = HistogramVec::new(
            HistogramOpts::new(
                "http_request_duration_seconds",
                "HTTP request duration in seconds",
            ),
            &["method", "endpoint"],
        )?;
        registry.register(Box::new(http_request_duration_seconds.clone()))?;

        let http_connections_active = IntGauge::new(
            "http_connections_active",
            "Number of active HTTP connections",
        )?;
        registry.register(Box::new(http_connections_active.clone()))?;

        // GraphQL metrics
        let graphql_queries_total = IntCounterVec::new(
            Opts::new(
                "graphql_queries_total",
                "Total number of GraphQL queries executed",
            ),
            &["operation_type", "operation_name"],
        )?;
        registry.register(Box::new(graphql_queries_total.clone()))?;

        let graphql_query_duration_seconds = HistogramVec::new(
            HistogramOpts::new(
                "graphql_query_duration_seconds",
                "GraphQL query execution time in seconds",
            ),
            &["operation_type", "operation_name"],
        )?;
        registry.register(Box::new(graphql_query_duration_seconds.clone()))?;

        let graphql_query_complexity = Histogram::with_opts(HistogramOpts::new(
            "graphql_query_complexity",
            "GraphQL query complexity score",
        ))?;
        registry.register(Box::new(graphql_query_complexity.clone()))?;

        // Database metrics
        let db_connections_active = IntGauge::new(
            "db_connections_active",
            "Number of active database connections",
        )?;
        registry.register(Box::new(db_connections_active.clone()))?;

        let db_connections_idle =
            IntGauge::new("db_connections_idle", "Number of idle database connections")?;
        registry.register(Box::new(db_connections_idle.clone()))?;

        let db_connections_total = IntGauge::new(
            "db_connections_total",
            "Total number of database connections in pool",
        )?;
        registry.register(Box::new(db_connections_total.clone()))?;

        let db_queries_total = IntCounterVec::new(
            Opts::new("db_queries_total", "Total number of database queries"),
            &["query_type", "table"],
        )?;
        registry.register(Box::new(db_queries_total.clone()))?;

        let db_query_duration_seconds = HistogramVec::new(
            HistogramOpts::new(
                "db_query_duration_seconds",
                "Database query execution time in seconds",
            ),
            &["query_type", "table"],
        )?;
        registry.register(Box::new(db_query_duration_seconds.clone()))?;

        // Authentication metrics
        let auth_attempts_total = IntCounterVec::new(
            Opts::new(
                "auth_attempts_total",
                "Total number of authentication attempts",
            ),
            &["provider", "method"],
        )?;
        registry.register(Box::new(auth_attempts_total.clone()))?;

        let auth_success_total = IntCounterVec::new(
            Opts::new(
                "auth_success_total",
                "Total number of successful authentications",
            ),
            &["provider", "method"],
        )?;
        registry.register(Box::new(auth_success_total.clone()))?;

        let auth_failures_total = IntCounterVec::new(
            Opts::new(
                "auth_failures_total",
                "Total number of failed authentications",
            ),
            &["provider", "method", "reason"],
        )?;
        registry.register(Box::new(auth_failures_total.clone()))?;

        // Crawler metrics
        let crawler_requests_total = IntCounterVec::new(
            Opts::new("crawler_requests_total", "Total number of crawler requests"),
            &["source", "status"],
        )?;
        registry.register(Box::new(crawler_requests_total.clone()))?;

        let crawler_duration_seconds = HistogramVec::new(
            HistogramOpts::new(
                "crawler_duration_seconds",
                "Crawler request duration in seconds",
            ),
            &["source"],
        )?;
        registry.register(Box::new(crawler_duration_seconds.clone()))?;

        let crawler_data_points_collected = IntCounter::new(
            "crawler_data_points_collected",
            "Total number of data points collected by crawler",
        )?;
        registry.register(Box::new(crawler_data_points_collected.clone()))?;

        // Error metrics
        let errors_total = IntCounterVec::new(
            Opts::new("errors_total", "Total number of errors"),
            &["error_type", "component"],
        )?;
        registry.register(Box::new(errors_total.clone()))?;

        // Application metrics
        let app_uptime_seconds =
            IntCounter::new("app_uptime_seconds", "Application uptime in seconds")?;
        registry.register(Box::new(app_uptime_seconds.clone()))?;

        let memory_usage_bytes =
            IntGauge::new("memory_usage_bytes", "Current memory usage in bytes")?;
        registry.register(Box::new(memory_usage_bytes.clone()))?;

        Ok(AppMetrics {
            http_requests_total,
            http_request_duration_seconds,
            http_connections_active,
            graphql_queries_total,
            graphql_query_duration_seconds,
            graphql_query_complexity,
            db_connections_active,
            db_connections_idle,
            db_connections_total,
            db_queries_total,
            db_query_duration_seconds,
            auth_attempts_total,
            auth_success_total,
            auth_failures_total,
            crawler_requests_total,
            crawler_duration_seconds,
            crawler_data_points_collected,
            errors_total,
            app_uptime_seconds,
            memory_usage_bytes,
        })
    }
}

/// Global metrics instance
pub static METRICS: once_cell::sync::Lazy<AppMetrics> =
    once_cell::sync::Lazy::new(|| AppMetrics::new().expect("Failed to initialize metrics"));

/// Generate Prometheus metrics output
pub fn generate_metrics() -> anyhow::Result<String> {
    let encoder = TextEncoder::new();
    let metric_families = REGISTRY.gather();
    encoder
        .encode_to_string(&metric_families)
        .map_err(|e| anyhow::anyhow!("Failed to encode metrics: {}", e))
}

/// Metrics endpoint handler for Prometheus scraping
pub async fn metrics_handler() -> Result<impl Reply, warp::Rejection> {
    match generate_metrics() {
        Ok(metrics) => Ok(warp::reply::with_header(
            metrics,
            "Content-Type",
            "text/plain; version=0.0.4; charset=utf-8",
        )),
        Err(e) => {
            tracing::error!("Failed to generate metrics: {}", e);
            Ok(warp::reply::with_status(
                warp::reply::html("Internal Server Error"),
                StatusCode::INTERNAL_SERVER_ERROR,
            ))
        }
    }
}

/// Record HTTP request metrics
pub fn record_http_request(method: &str, endpoint: &str, status_code: u16, duration: f64) {
    METRICS
        .http_requests_total
        .with_label_values(&[method, endpoint, &status_code.to_string()])
        .inc();

    METRICS
        .http_request_duration_seconds
        .with_label_values(&[method, endpoint])
        .observe(duration);
}

/// Record GraphQL query metrics
pub fn record_graphql_query(
    operation_type: &str,
    operation_name: &str,
    duration: f64,
    complexity: f64,
) {
    METRICS
        .graphql_queries_total
        .with_label_values(&[operation_type, operation_name])
        .inc();

    METRICS
        .graphql_query_duration_seconds
        .with_label_values(&[operation_type, operation_name])
        .observe(duration);

    METRICS.graphql_query_complexity.observe(complexity);
}

/// Record database query metrics
pub fn record_db_query(query_type: &str, table: &str, duration: f64) {
    METRICS
        .db_queries_total
        .with_label_values(&[query_type, table])
        .inc();

    METRICS
        .db_query_duration_seconds
        .with_label_values(&[query_type, table])
        .observe(duration);
}

/// Record authentication metrics
pub fn record_auth_attempt(provider: &str, method: &str) {
    METRICS
        .auth_attempts_total
        .with_label_values(&[provider, method])
        .inc();
}

pub fn record_auth_success(provider: &str, method: &str) {
    METRICS
        .auth_success_total
        .with_label_values(&[provider, method])
        .inc();
}

pub fn record_auth_failure(provider: &str, method: &str, reason: &str) {
    METRICS
        .auth_failures_total
        .with_label_values(&[provider, method, reason])
        .inc();
}

/// Record crawler metrics
pub fn record_crawler_request(source: &str, status: &str, duration: f64) {
    METRICS
        .crawler_requests_total
        .with_label_values(&[source, status])
        .inc();

    METRICS
        .crawler_duration_seconds
        .with_label_values(&[source])
        .observe(duration);
}

pub fn record_crawler_data_points(count: u64) {
    METRICS.crawler_data_points_collected.inc_by(count);
}

/// Record error metrics
pub fn record_error(error_type: &str, component: &str) {
    METRICS
        .errors_total
        .with_label_values(&[error_type, component])
        .inc();
}

/// Update database connection pool metrics
pub fn update_db_pool_metrics(active: i64, idle: i64, total: i64) {
    METRICS.db_connections_active.set(active);
    METRICS.db_connections_idle.set(idle);
    METRICS.db_connections_total.set(total);
}

/// Update HTTP connections gauge
pub fn update_http_connections(count: i64) {
    METRICS.http_connections_active.set(count);
}

/// Increment application uptime counter
pub fn increment_uptime(seconds: u64) {
    METRICS.app_uptime_seconds.inc_by(seconds);
}

/// Update memory usage gauge
pub fn update_memory_usage(bytes: i64) {
    METRICS.memory_usage_bytes.set(bytes);
}

#[cfg(test)]
mod tests {
    use super::*;
    use anyhow::Result;
    use prometheus::proto::MetricType;

    /// Test metrics initialization with a separate registry to avoid conflicts
    #[tokio::test]
    async fn test_metrics_initialization() {
        // Create a separate registry for testing to avoid duplicate registration
        let test_registry = Arc::new(Registry::new());
        let metrics = AppMetrics::new_with_registry(test_registry.clone())
            .expect("Metrics should initialize successfully");

        // Verify that metrics were created (just check they exist, not their values)
        assert!(metrics.http_requests_total.get_metric_with_label_values(&["GET", "/test", "200"]).is_ok());
        assert!(metrics.graphql_queries_total.get_metric_with_label_values(&["query", "TestQuery"]).is_ok());
        assert!(metrics.db_queries_total.get_metric_with_label_values(&["select", "users"]).is_ok());
    }

    /// Test metrics recording with a separate registry
    #[tokio::test]
    async fn test_metrics_recording() {
        // Create a separate registry for testing to avoid duplicate registration
        let test_registry = Arc::new(Registry::new());
        let metrics = AppMetrics::new_with_registry(test_registry.clone())
            .expect("Failed to initialize metrics");

        // Record some test metrics
        metrics
            .http_requests_total
            .with_label_values(&["GET", "/test", "200"])
            .inc();

        metrics
            .graphql_queries_total
            .with_label_values(&["query", "TestQuery"])
            .inc();

        metrics
            .db_queries_total
            .with_label_values(&["select", "users"])
            .inc();

        // Verify the metrics were recorded
        assert_eq!(
            metrics
                .http_requests_total
                .get_metric_with_label_values(&["GET", "/test", "200"])
                .unwrap()
                .get_counter()
                .get_value(),
            1.0
        );

        assert_eq!(
            metrics
                .graphql_queries_total
                .get_metric_with_label_values(&["query", "TestQuery"])
                .unwrap()
                .get_counter()
                .get_value(),
            1.0
        );

        assert_eq!(
            metrics
                .db_queries_total
                .get_metric_with_label_values(&["select", "users"])
                .unwrap()
                .get_counter()
                .get_value(),
            1.0
        );
    }

    /// Test metrics generation with a separate registry
    #[tokio::test]
    async fn test_metrics_generation() {
        // Create a separate registry for testing to avoid duplicate registration
        let test_registry = Arc::new(Registry::new());
        let metrics = AppMetrics::new_with_registry(test_registry.clone())
            .expect("Should initialize metrics");

        // Record some dummy metrics
        metrics
            .http_requests_total
            .with_label_values(&["GET", "/test", "200"])
            .inc();
        metrics
            .graphql_queries_total
            .with_label_values(&["query", "TestQuery"])
            .inc();
        metrics
            .db_queries_total
            .with_label_values(&["select", "users"])
            .inc();

        // Test that metrics can be generated
        let encoder = TextEncoder::new();
        let metric_families = test_registry.gather();
        let metrics_output = encoder
            .encode_to_string(&metric_families)
            .expect("Should generate metrics");

        assert!(!metrics_output.is_empty());
        assert!(metrics_output.contains("# HELP"));
        assert!(metrics_output.contains("# TYPE"));
        assert!(metrics_output.contains("http_requests_total{method=\"GET\",endpoint=\"/test\",status_code=\"200\"} 1"));
        assert!(metrics_output.contains("graphql_queries_total{operation_type=\"query\",operation_name=\"TestQuery\"} 1"));
        assert!(metrics_output.contains("db_queries_total{query_type=\"select\",table=\"users\"} 1"));

        // Verify metric types
        let http_requests_total_family = metric_families
            .iter()
            .find(|m| m.get_name() == "http_requests_total")
            .expect("http_requests_total metric family not found");
        assert_eq!(http_requests_total_family.get_field_type(), MetricType::COUNTER);

        let http_request_duration_seconds_family = metric_families
            .iter()
            .find(|m| m.get_name() == "http_request_duration_seconds")
            .expect("http_request_duration_seconds metric family not found");
        assert_eq!(http_request_duration_seconds_family.get_field_type(), MetricType::HISTOGRAM);
    }

    /// Test that multiple test instances can run without conflicts
    #[tokio::test]
    async fn test_metrics_isolation() {
        // This test should run in parallel with other tests without issues
        let test_registry = Arc::new(Registry::new());
        let _metrics = AppMetrics::new_with_registry(test_registry)
            .expect("Should initialize metrics without conflicts");

        // Just verify it doesn't panic
        assert!(true);
    }
}
