/**
 * REQUIREMENT: Test binary to verify Google authentication system
 * PURPOSE: Standalone test to verify authentication works end-to-end
 * This helps debug authentication issues without needing the full server
 */

use econ_graph_backend::auth::simple_test::test_auth_system;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Initialize tracing
    tracing_subscriber::fmt::init();

    println!("🚀 Starting Authentication System Test");
    println!("=====================================");
    
    match test_auth_system().await {
        Ok(()) => {
            println!("=====================================");
            println!("✅ Authentication system is working!");
            println!("🎯 Google auth endpoints should be functional");
            std::process::exit(0);
        }
        Err(e) => {
            println!("=====================================");
            println!("❌ Authentication system test failed: {}", e);
            println!("🔧 Check the error details above");
            std::process::exit(1);
        }
    }
}
