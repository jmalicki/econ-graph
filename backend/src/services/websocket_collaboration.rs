/**
 * REQUIREMENT: Real-time collaboration system for economic analysis
 * PURPOSE: Enable Google Docs-style real-time collaboration on charts and annotations
 * This provides professional collaborative analysis capabilities
 */

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::{Arc, RwLock};
use tokio::sync::broadcast;
use uuid::Uuid;
use warp::ws::{Message, WebSocket};
use futures_util::{SinkExt, StreamExt};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CollaborationEvent {
    pub event_type: CollaborationEventType,
    pub user_id: String,
    pub chart_id: String,
    pub session_id: String,
    pub timestamp: chrono::DateTime<chrono::Utc>,
    pub data: CollaborationEventData,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type")]
pub enum CollaborationEventType {
    UserJoined,
    UserLeft,
    AnnotationAdded,
    AnnotationUpdated,
    AnnotationDeleted,
    CursorMoved,
    ChartInteraction,
    CommentAdded,
    CommentUpdated,
    CommentDeleted,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(untagged)]
pub enum CollaborationEventData {
    UserEvent {
        user_name: String,
        user_avatar: Option<String>,
    },
    AnnotationEvent {
        annotation_id: String,
        position: ChartPosition,
        content: String,
        annotation_type: String,
    },
    CursorEvent {
        position: ChartPosition,
        user_color: String,
    },
    CommentEvent {
        comment_id: String,
        parent_annotation_id: Option<String>,
        content: String,
        is_resolved: bool,
    },
    ChartInteractionEvent {
        interaction_type: String,
        chart_config: serde_json::Value,
    },
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChartPosition {
    pub x: f64,
    pub y: f64,
    pub chart_x: Option<String>, // Date/time on chart
    pub chart_y: Option<f64>,    // Value on chart
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CollaborationSession {
    pub session_id: String,
    pub chart_id: String,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub active_users: HashMap<String, CollaborationUser>,
    pub annotations: HashMap<String, CollaborationAnnotation>,
    pub settings: SessionSettings,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CollaborationUser {
    pub user_id: String,
    pub user_name: String,
    pub user_avatar: Option<String>,
    pub user_color: String,
    pub joined_at: chrono::DateTime<chrono::Utc>,
    pub last_activity: chrono::DateTime<chrono::Utc>,
    pub cursor_position: Option<ChartPosition>,
    pub permissions: UserPermissions,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UserPermissions {
    pub can_annotate: bool,
    pub can_comment: bool,
    pub can_edit_others_annotations: bool,
    pub can_moderate: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CollaborationAnnotation {
    pub id: String,
    pub author_id: String,
    pub position: ChartPosition,
    pub content: String,
    pub annotation_type: String, // "note", "highlight", "arrow", "box"
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub updated_at: chrono::DateTime<chrono::Utc>,
    pub is_resolved: bool,
    pub comments: Vec<AnnotationComment>,
    pub style: AnnotationStyle,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AnnotationComment {
    pub id: String,
    pub author_id: String,
    pub content: String,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub updated_at: chrono::DateTime<chrono::Utc>,
    pub is_resolved: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AnnotationStyle {
    pub color: String,
    pub background_color: Option<String>,
    pub border_style: Option<String>,
    pub font_size: Option<i32>,
    pub is_bold: bool,
    pub is_italic: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SessionSettings {
    pub max_concurrent_users: usize,
    pub annotation_permissions: String, // "open", "restricted", "owner-only"
    pub auto_save_interval: u64,        // seconds
    pub session_timeout: u64,           // seconds of inactivity
    pub enable_cursor_sharing: bool,
    pub enable_real_time_sync: bool,
}

/// WebSocket connection manager for real-time collaboration
/// REQUIREMENT: Real-time communication infrastructure
/// PURPOSE: Manage WebSocket connections and event broadcasting
pub struct CollaborationManager {
    sessions: Arc<RwLock<HashMap<String, CollaborationSession>>>,
    event_sender: broadcast::Sender<CollaborationEvent>,
    user_connections: Arc<RwLock<HashMap<String, broadcast::Sender<CollaborationEvent>>>>,
}

impl CollaborationManager {
    /// Create new collaboration manager
    /// REQUIREMENT: Initialize collaboration infrastructure
    /// PURPOSE: Set up real-time collaboration system
    pub fn new() -> Self {
        let (event_sender, _) = broadcast::channel(1000); // Buffer up to 1000 events
        
        Self {
            sessions: Arc::new(RwLock::new(HashMap::new())),
            event_sender,
            user_connections: Arc::new(RwLock::new(HashMap::new())),
        }
    }

    /// Handle new WebSocket connection
    /// REQUIREMENT: WebSocket connection management
    /// PURPOSE: Establish real-time communication with clients
    pub async fn handle_websocket_connection(
        &self,
        websocket: WebSocket,
        user_id: String,
        chart_id: String,
    ) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
        let (mut ws_sender, mut ws_receiver) = websocket.split();
        let session_id = self.get_or_create_session(&chart_id).await?;
        
        // Create user-specific event channel
        let (user_sender, mut user_receiver) = broadcast::channel(100);
        {
            let mut connections = self.user_connections.write().unwrap();
            connections.insert(user_id.clone(), user_sender);
        }

        // Add user to session
        self.add_user_to_session(&session_id, &user_id).await?;

        // Handle incoming messages from this user
        let event_sender = self.event_sender.clone();
        let user_id_clone = user_id.clone();
        let chart_id_clone = chart_id.clone();
        let session_id_clone = session_id.clone();

        tokio::spawn(async move {
            while let Some(msg) = ws_receiver.next().await {
                match msg {
                    Ok(Message::Text(text)) => {
                        if let Ok(event) = serde_json::from_str::<CollaborationEvent>(&text) {
                            // Broadcast event to all users in the session
                            let _ = event_sender.send(event);
                        }
                    }
                    Ok(Message::Close(_)) => break,
                    Err(_) => break,
                }
            }
        });

        // Handle outgoing messages to this user
        tokio::spawn(async move {
            while let Ok(event) = user_receiver.recv().await {
                // Only send events relevant to this user's session
                if event.chart_id == chart_id_clone {
                    if let Ok(json) = serde_json::to_string(&event) {
                        if ws_sender.send(Message::text(json)).await.is_err() {
                            break; // Connection closed
                        }
                    }
                }
            }
        });

        // Remove user when connection closes
        self.remove_user_from_session(&session_id, &user_id).await?;

        Ok(())
    }

    /// Create or get existing collaboration session
    /// REQUIREMENT: Session management for collaborative analysis
    /// PURPOSE: Organize users into chart-specific collaboration sessions
    async fn get_or_create_session(&self, chart_id: &str) -> Result<String, Box<dyn std::error::Error + Send + Sync>> {
        let mut sessions = self.sessions.write().unwrap();
        
        // Look for existing session for this chart
        for (session_id, session) in sessions.iter() {
            if session.chart_id == chart_id {
                return Ok(session_id.clone());
            }
        }

        // Create new session
        let session_id = Uuid::new_v4().to_string();
        let session = CollaborationSession {
            session_id: session_id.clone(),
            chart_id: chart_id.to_string(),
            created_at: chrono::Utc::now(),
            active_users: HashMap::new(),
            annotations: HashMap::new(),
            settings: SessionSettings {
                max_concurrent_users: 10,
                annotation_permissions: "open".to_string(),
                auto_save_interval: 30,
                session_timeout: 3600,
                enable_cursor_sharing: true,
                enable_real_time_sync: true,
            },
        };

        sessions.insert(session_id.clone(), session);
        Ok(session_id)
    }

    /// Add user to collaboration session
    /// REQUIREMENT: User session management
    /// PURPOSE: Track active collaborators and their permissions
    async fn add_user_to_session(&self, session_id: &str, user_id: &str) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
        let mut sessions = self.sessions.write().unwrap();
        
        if let Some(session) = sessions.get_mut(session_id) {
            let collaboration_user = CollaborationUser {
                user_id: user_id.to_string(),
                user_name: format!("User {}", user_id), // In real app, get from user service
                user_avatar: None,
                user_color: self.generate_user_color(user_id),
                joined_at: chrono::Utc::now(),
                last_activity: chrono::Utc::now(),
                cursor_position: None,
                permissions: UserPermissions {
                    can_annotate: true,
                    can_comment: true,
                    can_edit_others_annotations: false,
                    can_moderate: false,
                },
            };

            session.active_users.insert(user_id.to_string(), collaboration_user);

            // Broadcast user joined event
            let event = CollaborationEvent {
                event_type: CollaborationEventType::UserJoined,
                user_id: user_id.to_string(),
                chart_id: session.chart_id.clone(),
                session_id: session_id.to_string(),
                timestamp: chrono::Utc::now(),
                data: CollaborationEventData::UserEvent {
                    user_name: format!("User {}", user_id),
                    user_avatar: None,
                },
            };

            let _ = self.event_sender.send(event);
        }

        Ok(())
    }

    /// Remove user from collaboration session
    /// REQUIREMENT: Session cleanup and user departure handling
    /// PURPOSE: Maintain accurate session state and notify other collaborators
    async fn remove_user_from_session(&self, session_id: &str, user_id: &str) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
        let mut sessions = self.sessions.write().unwrap();
        
        if let Some(session) = sessions.get_mut(session_id) {
            session.active_users.remove(user_id);

            // Broadcast user left event
            let event = CollaborationEvent {
                event_type: CollaborationEventType::UserLeft,
                user_id: user_id.to_string(),
                chart_id: session.chart_id.clone(),
                session_id: session_id.to_string(),
                timestamp: chrono::Utc::now(),
                data: CollaborationEventData::UserEvent {
                    user_name: format!("User {}", user_id),
                    user_avatar: None,
                },
            };

            let _ = self.event_sender.send(event);

            // Remove session if no active users
            if session.active_users.is_empty() {
                sessions.remove(session_id);
            }
        }

        // Remove user connection
        {
            let mut connections = self.user_connections.write().unwrap();
            connections.remove(user_id);
        }

        Ok(())
    }

    /// Add annotation with real-time broadcasting
    /// REQUIREMENT: Real-time annotation system
    /// PURPOSE: Enable collaborative annotation of economic charts
    pub async fn add_annotation(
        &self,
        session_id: &str,
        user_id: &str,
        annotation: CollaborationAnnotation,
    ) -> Result<String, Box<dyn std::error::Error + Send + Sync>> {
        let annotation_id = Uuid::new_v4().to_string();
        let mut annotation = annotation;
        annotation.id = annotation_id.clone();

        {
            let mut sessions = self.sessions.write().unwrap();
            if let Some(session) = sessions.get_mut(session_id) {
                session.annotations.insert(annotation_id.clone(), annotation.clone());

                // Broadcast annotation added event
                let event = CollaborationEvent {
                    event_type: CollaborationEventType::AnnotationAdded,
                    user_id: user_id.to_string(),
                    chart_id: session.chart_id.clone(),
                    session_id: session_id.to_string(),
                    timestamp: chrono::Utc::now(),
                    data: CollaborationEventData::AnnotationEvent {
                        annotation_id: annotation_id.clone(),
                        position: annotation.position,
                        content: annotation.content,
                        annotation_type: annotation.annotation_type,
                    },
                };

                let _ = self.event_sender.send(event);
            }
        }

        Ok(annotation_id)
    }

    /// Update cursor position with real-time broadcasting
    /// REQUIREMENT: Real-time cursor sharing
    /// PURPOSE: Show live cursor movements for enhanced collaboration awareness
    pub async fn update_cursor_position(
        &self,
        session_id: &str,
        user_id: &str,
        position: ChartPosition,
    ) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
        {
            let mut sessions = self.sessions.write().unwrap();
            if let Some(session) = sessions.get_mut(session_id) {
                if let Some(user) = session.active_users.get_mut(user_id) {
                    user.cursor_position = Some(position.clone());
                    user.last_activity = chrono::Utc::now();

                    // Broadcast cursor movement event
                    let event = CollaborationEvent {
                        event_type: CollaborationEventType::CursorMoved,
                        user_id: user_id.to_string(),
                        chart_id: session.chart_id.clone(),
                        session_id: session_id.to_string(),
                        timestamp: chrono::Utc::now(),
                        data: CollaborationEventData::CursorEvent {
                            position,
                            user_color: user.user_color.clone(),
                        },
                    };

                    let _ = self.event_sender.send(event);
                }
            }
        }

        Ok(())
    }

    /// Get active collaboration session
    /// REQUIREMENT: Session state access
    /// PURPOSE: Provide current session state to clients
    pub async fn get_session(&self, session_id: &str) -> Option<CollaborationSession> {
        let sessions = self.sessions.read().unwrap();
        sessions.get(session_id).cloned()
    }

    /// Get all sessions for a chart
    /// REQUIREMENT: Chart collaboration state
    /// PURPOSE: Show all active collaboration on a chart
    pub async fn get_chart_sessions(&self, chart_id: &str) -> Vec<CollaborationSession> {
        let sessions = self.sessions.read().unwrap();
        sessions.values()
            .filter(|session| session.chart_id == chart_id)
            .cloned()
            .collect()
    }

    /// Generate unique color for user cursor and annotations
    /// REQUIREMENT: User identification in collaborative environment
    /// PURPOSE: Visual distinction between collaborators
    fn generate_user_color(&self, user_id: &str) -> String {
        // Generate consistent color based on user ID
        let colors = [
            "#1976d2", "#dc004e", "#2e7d32", "#ed6c02", "#9c27b0", 
            "#00acc1", "#f57c00", "#5d4037", "#616161", "#0288d1"
        ];
        
        let hash = user_id.chars().fold(0usize, |acc, c| acc.wrapping_add(c as usize));
        colors[hash % colors.len()].to_string()
    }

    /// Clean up inactive sessions
    /// REQUIREMENT: Resource management for collaboration sessions
    /// PURPOSE: Prevent memory leaks and maintain performance
    pub async fn cleanup_inactive_sessions(&self) -> usize {
        let mut sessions = self.sessions.write().unwrap();
        let cutoff_time = chrono::Utc::now() - chrono::Duration::hours(1);
        
        let initial_count = sessions.len();
        sessions.retain(|_, session| {
            // Keep session if it has active users or recent activity
            !session.active_users.is_empty() || 
            session.active_users.values().any(|user| user.last_activity > cutoff_time)
        });
        
        initial_count - sessions.len()
    }

    /// Get collaboration statistics
    /// REQUIREMENT: Collaboration monitoring and analytics
    /// PURPOSE: Provide insights into collaboration usage
    pub async fn get_collaboration_statistics(&self) -> CollaborationStatistics {
        let sessions = self.sessions.read().unwrap();
        
        let total_sessions = sessions.len();
        let total_active_users: usize = sessions.values()
            .map(|session| session.active_users.len())
            .sum();
        let total_annotations: usize = sessions.values()
            .map(|session| session.annotations.len())
            .sum();

        CollaborationStatistics {
            total_sessions,
            total_active_users,
            total_annotations,
            average_users_per_session: if total_sessions > 0 {
                total_active_users as f64 / total_sessions as f64
            } else {
                0.0
            },
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CollaborationStatistics {
    pub total_sessions: usize,
    pub total_active_users: usize,
    pub total_annotations: usize,
    pub average_users_per_session: f64,
}

/// WebSocket message types for collaboration
/// REQUIREMENT: Structured communication protocol
/// PURPOSE: Define clear message format for real-time events
#[derive(Debug, Serialize, Deserialize)]
#[serde(tag = "type")]
pub enum WebSocketMessage {
    JoinSession { chart_id: String, user_id: String },
    LeaveSession { session_id: String, user_id: String },
    AddAnnotation { session_id: String, annotation: CollaborationAnnotation },
    UpdateAnnotation { session_id: String, annotation_id: String, content: String },
    DeleteAnnotation { session_id: String, annotation_id: String },
    MoveCursor { session_id: String, position: ChartPosition },
    AddComment { session_id: String, annotation_id: String, content: String },
    GetSessionState { session_id: String },
    Error { message: String },
    Success { message: String, data: Option<serde_json::Value> },
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_collaboration_manager_creation() {
        let manager = CollaborationManager::new();
        
        // Should initialize with empty sessions
        let stats = manager.get_collaboration_statistics().await;
        assert_eq!(stats.total_sessions, 0);
        assert_eq!(stats.total_active_users, 0);
    }

    #[tokio::test]
    async fn test_session_creation() {
        let manager = CollaborationManager::new();
        
        let session_id = manager.get_or_create_session("test-chart-1").await.unwrap();
        assert!(!session_id.is_empty());
        
        // Should reuse existing session for same chart
        let session_id2 = manager.get_or_create_session("test-chart-1").await.unwrap();
        assert_eq!(session_id, session_id2);
    }

    #[tokio::test]
    async fn test_user_management() {
        let manager = CollaborationManager::new();
        
        let session_id = manager.get_or_create_session("test-chart-1").await.unwrap();
        manager.add_user_to_session(&session_id, "user1").await.unwrap();
        
        let session = manager.get_session(&session_id).await.unwrap();
        assert_eq!(session.active_users.len(), 1);
        assert!(session.active_users.contains_key("user1"));
    }

    #[tokio::test]
    async fn test_annotation_management() {
        let manager = CollaborationManager::new();
        
        let session_id = manager.get_or_create_session("test-chart-1").await.unwrap();
        manager.add_user_to_session(&session_id, "user1").await.unwrap();

        let annotation = CollaborationAnnotation {
            id: "".to_string(), // Will be set by add_annotation
            author_id: "user1".to_string(),
            position: ChartPosition { x: 100.0, y: 200.0, chart_x: None, chart_y: None },
            content: "Test annotation".to_string(),
            annotation_type: "note".to_string(),
            created_at: chrono::Utc::now(),
            updated_at: chrono::Utc::now(),
            is_resolved: false,
            comments: Vec::new(),
            style: AnnotationStyle {
                color: "#1976d2".to_string(),
                background_color: None,
                border_style: None,
                font_size: None,
                is_bold: false,
                is_italic: false,
            },
        };

        let annotation_id = manager.add_annotation(&session_id, "user1", annotation).await.unwrap();
        assert!(!annotation_id.is_empty());

        let session = manager.get_session(&session_id).await.unwrap();
        assert_eq!(session.annotations.len(), 1);
    }

    #[tokio::test]
    async fn test_cursor_position_updates() {
        let manager = CollaborationManager::new();
        
        let session_id = manager.get_or_create_session("test-chart-1").await.unwrap();
        manager.add_user_to_session(&session_id, "user1").await.unwrap();

        let position = ChartPosition {
            x: 150.0,
            y: 250.0,
            chart_x: Some("2024-01-01".to_string()),
            chart_y: Some(100.5),
        };

        manager.update_cursor_position(&session_id, "user1", position.clone()).await.unwrap();

        let session = manager.get_session(&session_id).await.unwrap();
        let user = session.active_users.get("user1").unwrap();
        assert!(user.cursor_position.is_some());
        assert_eq!(user.cursor_position.as_ref().unwrap().x, 150.0);
    }

    #[tokio::test]
    async fn test_session_cleanup() {
        let manager = CollaborationManager::new();
        
        let session_id = manager.get_or_create_session("test-chart-1").await.unwrap();
        manager.add_user_to_session(&session_id, "user1").await.unwrap();
        
        // Initially should have 1 session
        let stats = manager.get_collaboration_statistics().await;
        assert_eq!(stats.total_sessions, 1);

        // Remove user - session should be cleaned up since no users remain
        manager.remove_user_from_session(&session_id, "user1").await.unwrap();
        
        let stats = manager.get_collaboration_statistics().await;
        assert_eq!(stats.total_sessions, 0);
    }

    #[tokio::test]
    async fn test_user_color_generation() {
        let manager = CollaborationManager::new();
        
        let color1 = manager.generate_user_color("user1");
        let color2 = manager.generate_user_color("user2");
        let color1_again = manager.generate_user_color("user1");
        
        // Should be consistent for same user
        assert_eq!(color1, color1_again);
        
        // Should be different for different users (usually)
        // Note: Could be same due to hash collision, but unlikely
        
        // Should be valid hex color
        assert!(color1.starts_with("#"));
        assert_eq!(color1.len(), 7);
    }
}