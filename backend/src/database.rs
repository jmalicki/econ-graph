use diesel_async::{AsyncConnection, AsyncPgConnection};
use diesel_async::pooled_connection::{bb8::Pool, bb8::PooledConnection, AsyncDieselConnectionManager};
use diesel::prelude::*;
use std::time::Duration;
use tracing::{info, error};

use crate::error::{AppError, AppResult};

/// Type alias for the database pool
pub type DatabasePool = Pool<AsyncPgConnection>;

/// Type alias for a pooled connection  
pub type PooledConn<'a> = PooledConnection<'a, AsyncPgConnection>;

/// Create a database connection pool
pub async fn create_pool(database_url: &str) -> AppResult<DatabasePool> {
    let config = AsyncDieselConnectionManager::<AsyncPgConnection>::new(database_url);
    
    let pool = Pool::builder()
        .max_size(10)
        .connection_timeout(Duration::from_secs(30))
        .build(config)
        .await
        .map_err(|e| AppError::Internal(format!("Failed to create database pool: {}", e)))?;
    
    info!("Database connection pool created successfully");
    Ok(pool)
}

/// Test database connectivity
pub async fn test_connection(pool: &DatabasePool) -> AppResult<()> {
    use diesel_async::RunQueryDsl;
    
    let mut conn = pool.get().await
        .map_err(|e| AppError::Internal(format!("Failed to get database connection: {}", e)))?;
    
    // Test with a simple query
    let result: i32 = diesel::select(diesel::dsl::sql("1"))
        .get_result(&mut conn)
        .await
        .map_err(|e| AppError::Internal(format!("Database connection test failed: {}", e)))?;
    
    if result == 1 {
        info!("Database connection test successful");
        Ok(())
    } else {
        Err(AppError::Internal("Database connection test returned unexpected result".to_string()))
    }
}

/// Run database migrations
pub async fn run_migrations(pool: &DatabasePool) -> AppResult<()> {
    use diesel_migrations::{embed_migrations, EmbeddedMigrations, MigrationHarness};
    
    const MIGRATIONS: EmbeddedMigrations = embed_migrations!();
    
    let mut conn = pool.get().await
        .map_err(|e| AppError::Internal(format!("Failed to get database connection for migrations: {}", e)))?;
    
    // Run migrations in a blocking task since migrations are sync
    tokio::task::spawn_blocking(move || {
        conn.run_pending_migrations(MIGRATIONS)
            .map_err(|e| AppError::Internal(format!("Failed to run migrations: {}", e)))
    })
    .await
    .map_err(|e| AppError::Internal(format!("Migration task failed: {}", e)))??;
    
    info!("Database migrations completed successfully");
    Ok(())
}

/// Execute a database transaction
pub async fn transaction<T, E, F, Fut>(
    pool: &DatabasePool,
    f: F,
) -> Result<T, E>
where
    F: FnOnce(&mut AsyncPgConnection) -> Fut + Send + 'static,
    Fut: std::future::Future<Output = Result<T, E>> + Send,
    T: Send + 'static,
    E: From<AppError> + Send + 'static,
{
    let mut conn = pool.get().await
        .map_err(|e| E::from(AppError::Internal(format!("Failed to get database connection: {}", e))))?;
    
    conn.transaction(f).await
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::test_utils::get_test_pool;

    #[tokio::test]
    async fn test_database_connection() {
        // Test database connection functionality
        // REQUIREMENT: Database layer testing with testcontainers
        // PURPOSE: Verify database connectivity and basic operations work correctly
        
        let pool = get_test_pool().await;
        
        // Test basic connectivity
        test_connection(&pool).await.expect("Database connection should work");
        
        // Test getting a connection from the pool
        let _conn = pool.get().await.expect("Should be able to get connection from pool");
    }
    
    #[tokio::test]
    async fn test_transaction() {
        // Test transaction functionality
        // REQUIREMENT: Database transaction testing
        // PURPOSE: Verify database transactions work correctly with async connections
        
        let pool = get_test_pool().await;
        
        let result: Result<i32, AppError> = transaction(&pool, |conn| async move {
            let result: i32 = diesel::select(diesel::dsl::sql("1 + 1"))
                .get_result(conn)
                .await
                .map_err(|e| AppError::Internal(format!("Query failed: {}", e)))?;
            Ok(result)
        }).await;
        
        assert_eq!(result.unwrap(), 2);
    }
}