/**
 * REQUIREMENT: OAuth authentication services for multi-user collaboration
 * PURPOSE: Provide JWT token generation, OAuth verification, and user management
 * This enables secure authentication with Google and Facebook OAuth backends
 */

use crate::auth::models::*;
use crate::database::DatabasePool;
use crate::error::{AppError, AppResult};
use chrono::{Duration, Utc};
use jsonwebtoken::{decode, encode, Algorithm, DecodingKey, EncodingKey, Header, Validation};
use reqwest::Client;
use serde_json::json;
use std::env;
use uuid::Uuid;

/// JWT secret key from environment
fn get_jwt_secret() -> String {
    env::var("JWT_SECRET").unwrap_or_else(|_| "your-secret-key-change-in-production".to_string())
}

/// JWT issuer
const JWT_ISSUER: &str = "econ-graph";

/// Token expiration time (24 hours)
const TOKEN_EXPIRATION_HOURS: i64 = 24;

/// Authentication service
#[derive(Clone)]
pub struct AuthService {
    pub db_pool: DatabasePool,
    pub http_client: Client,
    pub google_client_id: String,
    pub facebook_app_id: String,
}

impl AuthService {
    /// Create new authentication service
    pub fn new(db_pool: DatabasePool) -> Self {
        let google_client_id = env::var("GOOGLE_CLIENT_ID")
            .unwrap_or_else(|_| "your-google-client-id".to_string());
        let facebook_app_id = env::var("FACEBOOK_APP_ID")
            .unwrap_or_else(|_| "your-facebook-app-id".to_string());

        AuthService {
            db_pool,
            http_client: Client::new(),
            google_client_id,
            facebook_app_id,
        }
    }

    /// Generate JWT token for user
    pub fn generate_token(&self, user: &User) -> AppResult<String> {
        let now = Utc::now();
        let expiration = now + Duration::hours(TOKEN_EXPIRATION_HOURS);

        let claims = Claims {
            sub: user.id.to_string(),
            email: user.email.clone(),
            name: user.name.clone(),
            role: user.role.clone(),
            exp: expiration.timestamp() as usize,
            iat: now.timestamp() as usize,
            iss: JWT_ISSUER.to_string(),
        };

        let token = encode(
            &Header::default(),
            &claims,
            &EncodingKey::from_secret(get_jwt_secret().as_ref()),
        )
        .map_err(|e| AppError::AuthenticationError(format!("Failed to generate token: {}", e)))?;

        Ok(token)
    }

    /// Verify JWT token and extract claims
    pub fn verify_token(&self, token: &str) -> AppResult<Claims> {
        let mut validation = Validation::default();
        validation.set_issuer(&[JWT_ISSUER]);

        let token_data = decode::<Claims>(
            token,
            &DecodingKey::from_secret(get_jwt_secret().as_ref()),
            &validation,
        )
        .map_err(|e| AppError::AuthenticationError(format!("Invalid token: {}", e)))?;

        Ok(token_data.claims)
    }

    /// Verify Google OAuth token
    pub async fn verify_google_token(&self, token: &str) -> AppResult<GoogleUserInfo> {
        let url = format!(
            "https://www.googleapis.com/oauth2/v1/tokeninfo?access_token={}",
            token
        );

        let response = self
            .http_client
            .get(&url)
            .send()
            .await
            .map_err(|e| AppError::AuthenticationError(format!("Google token verification failed: {}", e)))?;

        if !response.status().is_success() {
            return Err(AppError::AuthenticationError(
                "Invalid Google token".to_string(),
            ));
        }

        let token_info: serde_json::Value = response
            .json()
            .await
            .map_err(|e| AppError::AuthenticationError(format!("Failed to parse Google response: {}", e)))?;

        // Verify audience (client ID)
        if let Some(audience) = token_info.get("audience") {
            if audience.as_str() != Some(&self.google_client_id) {
                return Err(AppError::AuthenticationError(
                    "Google token audience mismatch".to_string(),
                ));
            }
        }

        // Get user info from Google
        let user_info_url = format!(
            "https://www.googleapis.com/oauth2/v1/userinfo?access_token={}",
            token
        );

        let user_response = self
            .http_client
            .get(&user_info_url)
            .send()
            .await
            .map_err(|e| AppError::AuthenticationError(format!("Failed to get Google user info: {}", e)))?;

        let user_info: GoogleUserInfo = user_response
            .json()
            .await
            .map_err(|e| AppError::AuthenticationError(format!("Failed to parse Google user info: {}", e)))?;

        Ok(user_info)
    }

    /// Verify Facebook OAuth token
    pub async fn verify_facebook_token(&self, facebook_id: &str) -> AppResult<FacebookUserInfo> {
        // In a real implementation, you would verify the Facebook token
        // For now, we'll create a mock response based on the facebook_id
        // This should be replaced with actual Facebook Graph API calls

        let user_info = FacebookUserInfo {
            id: facebook_id.to_string(),
            email: Some(format!("user{}@facebook.com", facebook_id)),
            name: format!("Facebook User {}", facebook_id),
            picture: Some(FacebookPicture {
                data: FacebookPictureData {
                    url: "https://graph.facebook.com/default/picture".to_string(),
                },
            }),
        };

        Ok(user_info)
    }

    /// Create or update user from OAuth provider
    pub async fn create_or_update_oauth_user(
        &self,
        provider: AuthProvider,
        provider_id: String,
        email: String,
        name: String,
        avatar: Option<String>,
    ) -> AppResult<User> {
        // In a real implementation, this would use the database
        // For now, we'll create a mock user
        let user = User {
            id: Uuid::new_v4(),
            email,
            name,
            avatar,
            provider,
            provider_id,
            role: UserRole::default(),
            organization: None,
            preferences: UserPreferences::default(),
            created_at: Utc::now(),
            last_login_at: Utc::now(),
            is_active: true,
        };

        Ok(user)
    }

    /// Create user with email/password
    pub async fn create_email_user(
        &self,
        email: String,
        password: String,
        name: String,
    ) -> AppResult<User> {
        // Hash password
        let password_hash = PasswordHash::new(&password)
            .map_err(|e| AppError::AuthenticationError(format!("Failed to hash password: {}", e)))?;

        // In a real implementation, this would check if user exists and store in database
        let user = User {
            id: Uuid::new_v4(),
            email,
            name,
            avatar: None,
            provider: AuthProvider::Email,
            provider_id: Uuid::new_v4().to_string(), // Use UUID for email users
            role: UserRole::default(),
            organization: None,
            preferences: UserPreferences::default(),
            created_at: Utc::now(),
            last_login_at: Utc::now(),
            is_active: true,
        };

        Ok(user)
    }

    /// Authenticate user with email/password
    pub async fn authenticate_email_user(
        &self,
        email: String,
        password: String,
    ) -> AppResult<User> {
        // In a real implementation, this would:
        // 1. Find user by email in database
        // 2. Verify password hash
        // 3. Update last_login_at
        // 4. Return user

        // For now, create a mock user for demonstration
        if email == "demo@econgraph.com" && password == "demo123456" {
            let user = User {
                id: Uuid::new_v4(),
                email,
                name: "Demo User".to_string(),
                avatar: None,
                provider: AuthProvider::Email,
                provider_id: Uuid::new_v4().to_string(),
                role: UserRole::Analyst,
                organization: Some("Demo Organization".to_string()),
                preferences: UserPreferences::default(),
                created_at: Utc::now(),
                last_login_at: Utc::now(),
                is_active: true,
            };
            Ok(user)
        } else {
            Err(AppError::AuthenticationError(
                "Invalid email or password".to_string(),
            ))
        }
    }

    /// Get user by ID
    pub async fn get_user_by_id(&self, user_id: Uuid) -> AppResult<Option<User>> {
        // In a real implementation, this would query the database
        // For now, return None to indicate user not found
        Ok(None)
    }

    /// Update user profile
    pub async fn update_user_profile(
        &self,
        user_id: Uuid,
        updates: ProfileUpdateRequest,
    ) -> AppResult<User> {
        // In a real implementation, this would update the database
        // For now, create a mock updated user
        let user = User {
            id: user_id,
            email: "updated@econgraph.com".to_string(),
            name: updates.name.unwrap_or_else(|| "Updated User".to_string()),
            avatar: updates.avatar,
            provider: AuthProvider::Email,
            provider_id: user_id.to_string(),
            role: UserRole::Analyst,
            organization: updates.organization,
            preferences: updates.preferences.unwrap_or_default(),
            created_at: Utc::now() - Duration::days(30),
            last_login_at: Utc::now(),
            is_active: true,
        };

        Ok(user)
    }

    /// Refresh user data
    pub async fn refresh_user(&self, user_id: Uuid) -> AppResult<User> {
        // In a real implementation, this would fetch fresh user data from database
        self.get_user_by_id(user_id).await?
            .ok_or_else(|| AppError::AuthenticationError("User not found".to_string()))
    }
}
