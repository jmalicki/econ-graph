/**
 * REQUIREMENT: OAuth authentication system for multi-user collaboration
 * PURPOSE: Provide secure authentication with Google and Facebook OAuth backends
 * This enables professional chart collaboration with proper user management
 */

pub mod handlers;
pub mod models;
pub mod routes;
pub mod services;
pub mod middleware;
pub mod simple_test;

#[cfg(test)]
pub mod integration_tests;

pub use handlers::*;
pub use models::*;
pub use routes::*;
pub use services::*;
pub use middleware::*;
