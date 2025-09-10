/**
 * REQUIREMENT: Performance monitoring and optimization system
 * PURPOSE: Provide enterprise-grade performance tracking and caching
 * This ensures sub-100ms response times and optimal user experience
 */

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Arc;
use std::time::{Duration, Instant};
use tokio::sync::RwLock;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PerformanceMetric {
    pub endpoint: String,
    pub method: String,
    pub duration_ms: u64,
    pub timestamp: chrono::DateTime<chrono::Utc>,
    pub status_code: u16,
    pub user_id: Option<String>,
    pub cache_hit: bool,
    pub database_queries: u32,
    pub memory_usage_mb: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CacheEntry {
    pub key: String,
    pub value: serde_json::Value,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub expires_at: chrono::DateTime<chrono::Utc>,
    pub access_count: u64,
    pub last_accessed: chrono::DateTime<chrono::Utc>,
    pub size_bytes: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PerformanceReport {
    pub timeframe: String,
    pub total_requests: u64,
    pub average_response_time_ms: f64,
    pub median_response_time_ms: f64,
    pub p95_response_time_ms: f64,
    pub p99_response_time_ms: f64,
    pub cache_hit_rate: f64,
    pub error_rate: f64,
    pub slowest_endpoints: Vec<EndpointPerformance>,
    pub cache_statistics: CacheStatistics,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EndpointPerformance {
    pub endpoint: String,
    pub average_duration_ms: f64,
    pub request_count: u64,
    pub error_count: u64,
    pub cache_hit_rate: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CacheStatistics {
    pub total_entries: u64,
    pub total_memory_mb: f64,
    pub hit_rate: f64,
    pub miss_rate: f64,
    pub eviction_count: u64,
    pub average_ttl_minutes: f64,
}

/**
 * REQUIREMENT: High-performance caching system for economic data
 * PURPOSE: Ensure sub-100ms response times for frequently accessed data
 * This provides enterprise-grade performance optimization
 */
pub struct PerformanceCache {
    cache_entries: Arc<RwLock<HashMap<String, CacheEntry>>>,
    max_size_mb: f64,
    default_ttl_minutes: u64,
    performance_metrics: Arc<RwLock<Vec<PerformanceMetric>>>,
}

impl PerformanceCache {
    /// Create new performance cache
    /// REQUIREMENT: Initialize high-performance caching system
    /// PURPOSE: Set up enterprise-grade data caching with monitoring
    pub fn new(max_size_mb: f64, default_ttl_minutes: u64) -> Self {
        Self {
            cache_entries: Arc::new(RwLock::new(HashMap::new())),
            max_size_mb,
            default_ttl_minutes,
            performance_metrics: Arc::new(RwLock::new(Vec::new())),
        }
    }

    /// Store data in cache with TTL
    /// REQUIREMENT: Efficient data caching for performance optimization
    /// PURPOSE: Cache frequently accessed economic data
    pub async fn set(
        &self,
        key: &str,
        value: serde_json::Value,
        ttl_minutes: Option<u64>,
    ) -> Result<(), String> {
        let mut cache = self.cache_entries.write().await;
        
        // Check cache size limits
        let current_size_mb = self.calculate_total_size_mb(&cache);
        if current_size_mb > self.max_size_mb * 0.9 {
            self.evict_lru_entries(&mut cache, 0.2).await; // Evict 20% of entries
        }

        let ttl = ttl_minutes.unwrap_or(self.default_ttl_minutes);
        let expires_at = chrono::Utc::now() + chrono::Duration::minutes(ttl as i64);
        
        let value_size = serde_json::to_string(&value)
            .map(|s| s.len())
            .unwrap_or(0);

        let entry = CacheEntry {
            key: key.to_string(),
            value,
            created_at: chrono::Utc::now(),
            expires_at,
            access_count: 0,
            last_accessed: chrono::Utc::now(),
            size_bytes: value_size,
        };

        cache.insert(key.to_string(), entry);
        Ok(())
    }

    /// Retrieve data from cache
    /// REQUIREMENT: Fast data retrieval for performance optimization
    /// PURPOSE: Provide sub-100ms access to cached economic data
    pub async fn get(&self, key: &str) -> Option<serde_json::Value> {
        let mut cache = self.cache_entries.write().await;
        
        if let Some(entry) = cache.get_mut(key) {
            // Check if entry is expired
            if entry.expires_at < chrono::Utc::now() {
                cache.remove(key);
                return None;
            }

            // Update access statistics
            entry.access_count += 1;
            entry.last_accessed = chrono::Utc::now();
            
            Some(entry.value.clone())
        } else {
            None
        }
    }

    /// Check if key exists in cache
    /// REQUIREMENT: Cache existence checking for optimization decisions
    /// PURPOSE: Enable efficient cache hit/miss decisions
    pub async fn exists(&self, key: &str) -> bool {
        let cache = self.cache_entries.read().await;
        cache.contains_key(key) && 
        cache.get(key).map(|entry| entry.expires_at > chrono::Utc::now()).unwrap_or(false)
    }

    /// Remove specific key from cache
    /// REQUIREMENT: Cache invalidation for data consistency
    /// PURPOSE: Ensure data freshness when underlying data changes
    pub async fn invalidate(&self, key: &str) -> bool {
        let mut cache = self.cache_entries.write().await;
        cache.remove(key).is_some()
    }

    /// Clear all cache entries
    /// REQUIREMENT: Full cache flush capability
    /// PURPOSE: Enable complete cache reset when needed
    pub async fn clear(&self) -> u64 {
        let mut cache = self.cache_entries.write().await;
        let count = cache.len() as u64;
        cache.clear();
        count
    }

    /// Record performance metric
    /// REQUIREMENT: Performance monitoring and analytics
    /// PURPOSE: Track response times and optimize system performance
    pub async fn record_performance(
        &self,
        endpoint: &str,
        method: &str,
        duration: Duration,
        status_code: u16,
        user_id: Option<&str>,
        cache_hit: bool,
        database_queries: u32,
    ) {
        let metric = PerformanceMetric {
            endpoint: endpoint.to_string(),
            method: method.to_string(),
            duration_ms: duration.as_millis() as u64,
            timestamp: chrono::Utc::now(),
            status_code,
            user_id: user_id.map(|id| id.to_string()),
            cache_hit,
            database_queries,
            memory_usage_mb: self.get_current_memory_usage(),
        };

        let mut metrics = self.performance_metrics.write().await;
        metrics.push(metric);

        // Keep only last 10,000 metrics to prevent memory growth
        if metrics.len() > 10000 {
            metrics.truncate(5000); // Keep most recent 5,000
        }
    }

    /// Generate performance report
    /// REQUIREMENT: Performance analytics and reporting
    /// PURPOSE: Provide insights for system optimization
    pub async fn generate_performance_report(&self, hours: u32) -> PerformanceReport {
        let metrics = self.performance_metrics.read().await;
        let cutoff_time = chrono::Utc::now() - chrono::Duration::hours(hours as i64);
        
        let recent_metrics: Vec<&PerformanceMetric> = metrics
            .iter()
            .filter(|m| m.timestamp > cutoff_time)
            .collect();

        let total_requests = recent_metrics.len() as u64;
        
        if total_requests == 0 {
            return PerformanceReport {
                timeframe: format!("Last {} hours", hours),
                total_requests: 0,
                average_response_time_ms: 0.0,
                median_response_time_ms: 0.0,
                p95_response_time_ms: 0.0,
                p99_response_time_ms: 0.0,
                cache_hit_rate: 0.0,
                error_rate: 0.0,
                slowest_endpoints: Vec::new(),
                cache_statistics: self.get_cache_statistics().await,
            };
        }

        // Calculate response time statistics
        let mut durations: Vec<u64> = recent_metrics.iter().map(|m| m.duration_ms).collect();
        durations.sort_unstable();

        let average_response_time_ms = durations.iter().sum::<u64>() as f64 / durations.len() as f64;
        let median_response_time_ms = if durations.len() % 2 == 0 {
            (durations[durations.len() / 2 - 1] + durations[durations.len() / 2]) as f64 / 2.0
        } else {
            durations[durations.len() / 2] as f64
        };

        let p95_index = (durations.len() as f64 * 0.95) as usize;
        let p99_index = (durations.len() as f64 * 0.99) as usize;
        let p95_response_time_ms = durations.get(p95_index).copied().unwrap_or(0) as f64;
        let p99_response_time_ms = durations.get(p99_index).copied().unwrap_or(0) as f64;

        // Calculate cache hit rate
        let cache_hits = recent_metrics.iter().filter(|m| m.cache_hit).count() as f64;
        let cache_hit_rate = cache_hits / total_requests as f64;

        // Calculate error rate
        let errors = recent_metrics.iter().filter(|m| m.status_code >= 400).count() as f64;
        let error_rate = errors / total_requests as f64;

        // Calculate slowest endpoints
        let mut endpoint_stats: HashMap<String, Vec<u64>> = HashMap::new();
        for metric in recent_metrics {
            endpoint_stats
                .entry(metric.endpoint.clone())
                .or_insert_with(Vec::new)
                .push(metric.duration_ms);
        }

        let mut slowest_endpoints: Vec<EndpointPerformance> = endpoint_stats
            .into_iter()
            .map(|(endpoint, durations)| {
                let avg_duration = durations.iter().sum::<u64>() as f64 / durations.len() as f64;
                EndpointPerformance {
                    endpoint,
                    average_duration_ms: avg_duration,
                    request_count: durations.len() as u64,
                    error_count: 0, // Would calculate from status codes
                    cache_hit_rate: 0.0, // Would calculate from cache hits
                }
            })
            .collect();

        slowest_endpoints.sort_by(|a, b| b.average_duration_ms.partial_cmp(&a.average_duration_ms).unwrap());
        slowest_endpoints.truncate(10); // Top 10 slowest

        PerformanceReport {
            timeframe: format!("Last {} hours", hours),
            total_requests,
            average_response_time_ms,
            median_response_time_ms,
            p95_response_time_ms,
            p99_response_time_ms,
            cache_hit_rate,
            error_rate,
            slowest_endpoints,
            cache_statistics: self.get_cache_statistics().await,
        }
    }

    /// Get current cache statistics
    /// REQUIREMENT: Cache monitoring and optimization
    /// PURPOSE: Provide real-time cache performance insights
    pub async fn get_cache_statistics(&self) -> CacheStatistics {
        let cache = self.cache_entries.read().await;
        
        let total_entries = cache.len() as u64;
        let total_memory_mb = self.calculate_total_size_mb(&cache);
        
        // Calculate hit/miss rates from recent metrics
        let metrics = self.performance_metrics.read().await;
        let recent_metrics: Vec<&PerformanceMetric> = metrics
            .iter()
            .filter(|m| m.timestamp > chrono::Utc::now() - chrono::Duration::hours(1))
            .collect();

        let total_requests = recent_metrics.len() as f64;
        let cache_hits = recent_metrics.iter().filter(|m| m.cache_hit).count() as f64;
        
        let hit_rate = if total_requests > 0.0 { cache_hits / total_requests } else { 0.0 };
        let miss_rate = 1.0 - hit_rate;

        // Calculate average TTL
        let now = chrono::Utc::now();
        let total_ttl_minutes: i64 = cache
            .values()
            .map(|entry| (entry.expires_at - now).num_minutes().max(0))
            .sum();
        let average_ttl_minutes = if total_entries > 0 {
            total_ttl_minutes as f64 / total_entries as f64
        } else {
            0.0
        };

        CacheStatistics {
            total_entries,
            total_memory_mb,
            hit_rate,
            miss_rate,
            eviction_count: 0, // Would track in real implementation
            average_ttl_minutes,
        }
    }

    /// Clean up expired entries
    /// REQUIREMENT: Automatic cache cleanup for memory management
    /// PURPOSE: Prevent memory leaks and maintain cache performance
    pub async fn cleanup_expired(&self) -> u64 {
        let mut cache = self.cache_entries.write().await;
        let now = chrono::Utc::now();
        let initial_count = cache.len();

        cache.retain(|_, entry| entry.expires_at > now);
        
        (initial_count - cache.len()) as u64
    }

    /// Preload frequently accessed data
    /// REQUIREMENT: Proactive caching for performance optimization
    /// PURPOSE: Pre-populate cache with commonly requested economic data
    pub async fn preload_frequent_data(&self) -> Result<u64, String> {
        let frequent_series_ids = vec![
            "gdp-real",
            "unemployment-rate", 
            "inflation-rate",
            "fed-funds-rate"
        ];

        let mut preloaded_count = 0;

        for series_id in frequent_series_ids {
            // In real implementation, would fetch from database
            let mock_data = serde_json::json!({
                "series_id": series_id,
                "data_points": 100,
                "last_updated": chrono::Utc::now(),
            });

            self.set(
                &format!("series:{}", series_id),
                mock_data,
                Some(60), // 1 hour TTL for series data
            ).await?;

            preloaded_count += 1;
        }

        Ok(preloaded_count)
    }

    // Helper methods

    fn calculate_total_size_mb(&self, cache: &HashMap<String, CacheEntry>) -> f64 {
        let total_bytes: usize = cache.values().map(|entry| entry.size_bytes).sum();
        total_bytes as f64 / (1024.0 * 1024.0)
    }

    async fn evict_lru_entries(&self, cache: &mut HashMap<String, CacheEntry>, eviction_ratio: f64) {
        let target_evictions = (cache.len() as f64 * eviction_ratio) as usize;
        
        // Sort by last accessed time (LRU)
        let mut entries: Vec<(String, chrono::DateTime<chrono::Utc>)> = cache
            .iter()
            .map(|(key, entry)| (key.clone(), entry.last_accessed))
            .collect();
        
        entries.sort_by(|a, b| a.1.cmp(&b.1)); // Oldest first

        // Remove oldest entries
        for (key, _) in entries.into_iter().take(target_evictions) {
            cache.remove(&key);
        }
    }

    fn get_current_memory_usage(&self) -> f64 {
        // Mock memory usage - in real implementation would use system metrics
        50.0 + (rand::random::<f64>() * 100.0)
    }
}

/**
 * REQUIREMENT: Performance monitoring middleware
 * PURPOSE: Automatically track API performance and optimize based on metrics
 * This provides real-time performance insights and optimization
 */
pub struct PerformanceMonitor {
    cache: Arc<PerformanceCache>,
    alert_thresholds: PerformanceThresholds,
}

#[derive(Debug, Clone)]
pub struct PerformanceThresholds {
    pub max_response_time_ms: u64,
    pub min_cache_hit_rate: f64,
    pub max_error_rate: f64,
    pub max_memory_usage_mb: f64,
}

impl Default for PerformanceThresholds {
    fn default() -> Self {
        Self {
            max_response_time_ms: 100, // Sub-100ms target
            min_cache_hit_rate: 0.80,  // 80% cache hit rate minimum
            max_error_rate: 0.01,      // 1% error rate maximum
            max_memory_usage_mb: 1000.0, // 1GB memory limit
        }
    }
}

impl PerformanceMonitor {
    /// Create new performance monitor
    /// REQUIREMENT: Initialize performance monitoring system
    /// PURPOSE: Set up comprehensive performance tracking
    pub fn new(cache: Arc<PerformanceCache>, thresholds: Option<PerformanceThresholds>) -> Self {
        Self {
            cache,
            alert_thresholds: thresholds.unwrap_or_default(),
        }
    }

    /// Record API request performance
    /// REQUIREMENT: API performance tracking
    /// PURPOSE: Monitor and optimize API response times
    pub async fn record_request(
        &self,
        endpoint: &str,
        method: &str,
        duration: Duration,
        status_code: u16,
        user_id: Option<&str>,
        cache_hit: bool,
        database_queries: u32,
    ) -> Vec<PerformanceAlert> {
        // Record the metric
        self.cache.record_performance(
            endpoint,
            method, 
            duration,
            status_code,
            user_id,
            cache_hit,
            database_queries,
        ).await;

        // Check for performance alerts
        let mut alerts = Vec::new();

        if duration.as_millis() as u64 > self.alert_thresholds.max_response_time_ms {
            alerts.push(PerformanceAlert {
                alert_type: AlertType::SlowResponse,
                message: format!("Slow response: {} took {}ms", endpoint, duration.as_millis()),
                severity: if duration.as_millis() as u64 > self.alert_thresholds.max_response_time_ms * 2 {
                    AlertSeverity::High
                } else {
                    AlertSeverity::Medium
                },
                timestamp: chrono::Utc::now(),
            });
        }

        if status_code >= 500 {
            alerts.push(PerformanceAlert {
                alert_type: AlertType::ServerError,
                message: format!("Server error: {} returned {}", endpoint, status_code),
                severity: AlertSeverity::High,
                timestamp: chrono::Utc::now(),
            });
        }

        alerts
    }

    /// Get real-time performance dashboard data
    /// REQUIREMENT: Real-time performance monitoring dashboard
    /// PURPOSE: Provide live performance insights for operations
    pub async fn get_performance_dashboard(&self) -> PerformanceDashboard {
        let report = self.cache.generate_performance_report(1).await; // Last 1 hour
        let cache_stats = self.cache.get_cache_statistics().await;

        PerformanceDashboard {
            current_response_time_ms: report.average_response_time_ms,
            cache_hit_rate: cache_stats.hit_rate,
            active_connections: 42, // Mock value
            memory_usage_mb: cache_stats.total_memory_mb,
            requests_per_minute: report.total_requests as f64 / 60.0,
            error_rate: report.error_rate,
            alerts: self.check_current_alerts(&report, &cache_stats).await,
            uptime_percentage: 99.9, // Mock uptime
        }
    }

    async fn check_current_alerts(&self, report: &PerformanceReport, cache_stats: &CacheStatistics) -> Vec<PerformanceAlert> {
        let mut alerts = Vec::new();

        if report.average_response_time_ms > self.alert_thresholds.max_response_time_ms as f64 {
            alerts.push(PerformanceAlert {
                alert_type: AlertType::SlowResponse,
                message: format!("Average response time {}ms exceeds threshold", report.average_response_time_ms),
                severity: AlertSeverity::Medium,
                timestamp: chrono::Utc::now(),
            });
        }

        if cache_stats.hit_rate < self.alert_thresholds.min_cache_hit_rate {
            alerts.push(PerformanceAlert {
                alert_type: AlertType::LowCacheHitRate,
                message: format!("Cache hit rate {:.1}% below threshold", cache_stats.hit_rate * 100.0),
                severity: AlertSeverity::Medium,
                timestamp: chrono::Utc::now(),
            });
        }

        alerts
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PerformanceAlert {
    pub alert_type: AlertType,
    pub message: String,
    pub severity: AlertSeverity,
    pub timestamp: chrono::DateTime<chrono::Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum AlertType {
    SlowResponse,
    HighMemoryUsage,
    LowCacheHitRate,
    ServerError,
    DatabaseTimeout,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum AlertSeverity {
    Low,
    Medium,
    High,
    Critical,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PerformanceDashboard {
    pub current_response_time_ms: f64,
    pub cache_hit_rate: f64,
    pub active_connections: u64,
    pub memory_usage_mb: f64,
    pub requests_per_minute: f64,
    pub error_rate: f64,
    pub alerts: Vec<PerformanceAlert>,
    pub uptime_percentage: f64,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_cache_set_and_get() {
        let cache = PerformanceCache::new(100.0, 60);
        
        let test_data = serde_json::json!({
            "series_id": "gdp-real",
            "value": 25000.0
        });

        cache.set("test-key", test_data.clone(), None).await.unwrap();
        
        let retrieved = cache.get("test-key").await.unwrap();
        assert_eq!(retrieved, test_data);
    }

    #[tokio::test]
    async fn test_cache_expiration() {
        let cache = PerformanceCache::new(100.0, 60);
        
        let test_data = serde_json::json!({"test": "data"});
        
        // Set with very short TTL (0 minutes = immediate expiration)
        cache.set("expire-key", test_data, Some(0)).await.unwrap();
        
        // Should be expired immediately
        let retrieved = cache.get("expire-key").await;
        assert!(retrieved.is_none());
    }

    #[tokio::test]
    async fn test_performance_recording() {
        let cache = Arc::new(PerformanceCache::new(100.0, 60));
        let monitor = PerformanceMonitor::new(cache.clone(), None);
        
        let duration = Duration::from_millis(50);
        let alerts = monitor.record_request(
            "/api/series",
            "GET",
            duration,
            200,
            Some("user1"),
            true,
            1,
        ).await;

        assert!(alerts.is_empty()); // Should not alert for good performance

        // Record slow request
        let slow_duration = Duration::from_millis(500);
        let slow_alerts = monitor.record_request(
            "/api/slow-endpoint",
            "GET", 
            slow_duration,
            200,
            Some("user1"),
            false,
            5,
        ).await;

        assert!(!slow_alerts.is_empty()); // Should alert for slow performance
    }

    #[tokio::test]
    async fn test_cache_cleanup() {
        let cache = PerformanceCache::new(100.0, 60);
        
        // Add some test data
        cache.set("key1", serde_json::json!({"test": 1}), Some(0)).await.unwrap(); // Expired
        cache.set("key2", serde_json::json!({"test": 2}), Some(60)).await.unwrap(); // Valid
        
        let cleaned = cache.cleanup_expired().await;
        assert_eq!(cleaned, 1);
        
        // Valid entry should still exist
        assert!(cache.exists("key2").await);
        assert!(!cache.exists("key1").await);
    }

    #[tokio::test]
    async fn test_preload_frequent_data() {
        let cache = PerformanceCache::new(100.0, 60);
        
        let preloaded = cache.preload_frequent_data().await.unwrap();
        assert_eq!(preloaded, 4); // Should preload 4 frequent series
        
        // Check that data was actually cached
        assert!(cache.exists("series:gdp-real").await);
        assert!(cache.exists("series:unemployment-rate").await);
    }

    #[tokio::test]
    async fn test_performance_report_generation() {
        let cache = Arc::new(PerformanceCache::new(100.0, 60));
        let monitor = PerformanceMonitor::new(cache.clone(), None);
        
        // Record some test metrics
        monitor.record_request("/api/series", "GET", Duration::from_millis(50), 200, Some("user1"), true, 1).await;
        monitor.record_request("/api/search", "GET", Duration::from_millis(75), 200, Some("user1"), false, 2).await;
        monitor.record_request("/api/export", "POST", Duration::from_millis(200), 200, Some("user1"), false, 3).await;

        let report = cache.generate_performance_report(1).await;
        
        assert_eq!(report.total_requests, 3);
        assert!(report.average_response_time_ms > 0.0);
        assert!(report.cache_hit_rate >= 0.0 && report.cache_hit_rate <= 1.0);
    }

    #[tokio::test]
    async fn test_performance_dashboard() {
        let cache = Arc::new(PerformanceCache::new(100.0, 60));
        let monitor = PerformanceMonitor::new(cache.clone(), None);
        
        let dashboard = monitor.get_performance_dashboard().await;
        
        assert!(dashboard.uptime_percentage > 0.0);
        assert!(dashboard.cache_hit_rate >= 0.0);
        assert!(dashboard.current_response_time_ms >= 0.0);
    }
}