use serde::{Deserialize, Serialize};
use std::env;

/// Application configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Config {
    pub database_url: String,
    pub server: ServerConfig,
    pub cors: CorsConfig,
    pub crawler: CrawlerConfig,
    pub rate_limits: RateLimitConfig,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ServerConfig {
    pub host: String,
    pub port: u16,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CorsConfig {
    pub allowed_origins: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CrawlerConfig {
    pub fred_api_key: Option<String>,
    pub bls_api_key: Option<String>,
    pub max_concurrent_jobs: usize,
    pub queue_poll_interval_seconds: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RateLimitConfig {
    pub fred_rate_limit_per_minute: u32,
    pub bls_rate_limit_per_minute: u32,
}

impl Config {
    /// Load configuration from environment variables
    pub fn from_env() -> Result<Self, Box<dyn std::error::Error>> {
        // Load .env file if it exists
        dotenv::dotenv().ok();

        Ok(Config {
            database_url: env::var("DATABASE_URL")
                .unwrap_or_else(|_| "postgresql://localhost:5432/econ_graph".to_string()),
            
            server: ServerConfig {
                host: env::var("SERVER_HOST")
                    .unwrap_or_else(|_| "127.0.0.1".to_string()),
                port: env::var("SERVER_PORT")
                    .unwrap_or_else(|_| "8080".to_string())
                    .parse()
                    .unwrap_or(8080),
            },
            
            cors: CorsConfig {
                allowed_origins: env::var("CORS_ALLOWED_ORIGINS")
                    .unwrap_or_else(|_| "http://localhost:3000".to_string())
                    .split(',')
                    .map(|s| s.trim().to_string())
                    .collect(),
            },
            
            crawler: CrawlerConfig {
                fred_api_key: env::var("FRED_API_KEY").ok(),
                bls_api_key: env::var("BLS_API_KEY").ok(),
                max_concurrent_jobs: env::var("MAX_CONCURRENT_JOBS")
                    .unwrap_or_else(|_| "10".to_string())
                    .parse()
                    .unwrap_or(10),
                queue_poll_interval_seconds: env::var("QUEUE_POLL_INTERVAL_SECONDS")
                    .unwrap_or_else(|_| "5".to_string())
                    .parse()
                    .unwrap_or(5),
            },
            
            rate_limits: RateLimitConfig {
                fred_rate_limit_per_minute: env::var("FRED_RATE_LIMIT_PER_MINUTE")
                    .unwrap_or_else(|_| "120".to_string())
                    .parse()
                    .unwrap_or(120),
                bls_rate_limit_per_minute: env::var("BLS_RATE_LIMIT_PER_MINUTE")
                    .unwrap_or_else(|_| "500".to_string())
                    .parse()
                    .unwrap_or(500),
            },
        })
    }
}

impl Default for Config {
    fn default() -> Self {
        Config {
            database_url: "postgresql://localhost:5432/econ_graph_test".to_string(),
            server: ServerConfig {
                host: "127.0.0.1".to_string(),
                port: 8080,
            },
            cors: CorsConfig {
                allowed_origins: vec!["http://localhost:3000".to_string()],
            },
            crawler: CrawlerConfig {
                fred_api_key: None,
                bls_api_key: None,
                max_concurrent_jobs: 5,
                queue_poll_interval_seconds: 10,
            },
            rate_limits: RateLimitConfig {
                fred_rate_limit_per_minute: 120,
                bls_rate_limit_per_minute: 500,
            },
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_config_default() {
        // REQUIREMENT: The application should have sensible defaults for development
        // PURPOSE: Verify that default configuration values are set correctly for local development
        // This ensures developers can run the app without extensive configuration setup
        
        let config = Config::default();
        
        // Verify default server binds to localhost - safe for development
        assert_eq!(config.server.host, "127.0.0.1");
        // Verify default port 8080 - common development port that's usually available
        assert_eq!(config.server.port, 8080);
        // Verify CORS allows React dev server - required for frontend development
        assert_eq!(config.cors.allowed_origins, vec!["http://localhost:3000"]);
    }

    #[test]
    fn test_config_from_env() {
        // REQUIREMENT: The application should be configurable via environment variables for deployment
        // PURPOSE: Verify that configuration can be overridden using environment variables
        // This is essential for containerized deployments and different environments
        
        // Set test environment variables
        env::set_var("DATABASE_URL", "postgresql://test:test@localhost:5432/test_db");
        env::set_var("SERVER_PORT", "9000");
        
        let config = Config::from_env().unwrap();
        
        // Verify environment variables override defaults - required for deployment flexibility
        assert_eq!(config.database_url, "postgresql://test:test@localhost:5432/test_db");
        assert_eq!(config.server.port, 9000);
        
        // Clean up environment to avoid affecting other tests
        env::remove_var("DATABASE_URL");
        env::remove_var("SERVER_PORT");
    }
}
