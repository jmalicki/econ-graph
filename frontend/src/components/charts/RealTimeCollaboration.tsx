/**
 * REQUIREMENT: Real-time collaboration interface for economic analysis
 * PURPOSE: Enable Google Docs-style collaborative annotation and analysis
 * This provides professional real-time collaboration capabilities
 */

import React from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Avatar,
  AvatarGroup,
  Chip,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemAvatar,
  IconButton,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Badge,
  Tooltip,
  Snackbar,
  Alert,
  Divider,
  Menu,
  MenuItem,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  PersonAdd as PersonAddIcon,
  Comment as CommentIcon,
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Share as ShareIcon,
  Settings as SettingsIcon,
  NotificationImportant as AlertIcon,
  CheckCircle as CheckIcon,
  RadioButtonUnchecked as UnresolvedIcon,
  Mouse as CursorIcon,
  Create as AnnotateIcon,
  Group as CollaborationIcon,
} from '@mui/icons-material';

interface RealTimeCollaborationProps {
  chartId: string;
  currentUserId: string;
  isEnabled?: boolean;
  onAnnotationAdd?: (annotation: AnnotationData) => void;
  onAnnotationUpdate?: (annotationId: string, content: string) => void;
  onAnnotationDelete?: (annotationId: string) => void;
  onInviteUser?: (email: string) => void;
}

interface CollaborationUser {
  id: string;
  name: string;
  avatar?: string;
  color: string;
  isOnline: boolean;
  lastActivity: Date;
  cursorPosition?: { x: number; y: number };
  permissions: UserPermissions;
}

interface UserPermissions {
  canAnnotate: boolean;
  canComment: boolean;
  canEditOthers: boolean;
  canModerate: boolean;
}

interface AnnotationData {
  id: string;
  authorId: string;
  position: { x: number; y: number; chartX?: string; chartY?: number };
  content: string;
  type: 'note' | 'highlight' | 'arrow' | 'box';
  createdAt: Date;
  isResolved: boolean;
  comments: CommentData[];
  style: AnnotationStyle;
}

interface CommentData {
  id: string;
  authorId: string;
  content: string;
  createdAt: Date;
  isResolved: boolean;
}

interface AnnotationStyle {
  color: string;
  backgroundColor?: string;
  borderStyle?: string;
  fontSize?: number;
  isBold: boolean;
  isItalic: boolean;
}

/**
 * Real-time collaboration component with Google Docs-style features
 * REQUIREMENT: Enable professional collaborative economic analysis
 */
const RealTimeCollaboration: React.FC<RealTimeCollaborationProps> = ({
  chartId,
  currentUserId,
  isEnabled = true,
  onAnnotationAdd,
  onAnnotationUpdate,
  onAnnotationDelete,
  onInviteUser,
}) => {
  // WebSocket connection
  const [websocket, setWebsocket] = React.useState<WebSocket | null>(null);
  const [connectionStatus, setConnectionStatus] = React.useState<'connecting' | 'connected' | 'disconnected'>('disconnected');

  // Collaboration state
  const [activeUsers, setActiveUsers] = React.useState<CollaborationUser[]>([]);
  const [annotations, setAnnotations] = React.useState<AnnotationData[]>([]);
  const [isAnnotationMode, setIsAnnotationMode] = React.useState(false);
  const [selectedAnnotationType, setSelectedAnnotationType] = React.useState<'note' | 'highlight' | 'arrow' | 'box'>('note');

  // UI state
  const [inviteDialogOpen, setInviteDialogOpen] = React.useState(false);
  const [settingsMenuAnchor, setSettingsMenuAnchor] = React.useState<null | HTMLElement>(null);
  const [snackbarOpen, setSnackbarOpen] = React.useState(false);
  const [snackbarMessage, setSnackbarMessage] = React.useState('');
  const [showCursors, setShowCursors] = React.useState(true);
  const [showResolvedAnnotations, setShowResolvedAnnotations] = React.useState(false);

  // Mock data for development
  const mockUsers: CollaborationUser[] = React.useMemo(() => [
    {
      id: 'user1',
      name: 'Alice Johnson',
      avatar: undefined,
      color: '#1976d2',
      isOnline: true,
      lastActivity: new Date(),
      cursorPosition: { x: 150, y: 200 },
      permissions: {
        canAnnotate: true,
        canComment: true,
        canEditOthers: false,
        canModerate: false,
      },
    },
    {
      id: 'user2',
      name: 'Bob Smith',
      avatar: undefined,
      color: '#dc004e',
      isOnline: true,
      lastActivity: new Date(),
      cursorPosition: { x: 300, y: 400 },
      permissions: {
        canAnnotate: true,
        canComment: true,
        canEditOthers: true,
        canModerate: true,
      },
    },
  ], []);

  const mockAnnotations: AnnotationData[] = React.useMemo(() => [
    {
      id: 'annotation1',
      authorId: 'user1',
      position: { x: 200, y: 300, chartX: '2024-01-15', chartY: 100.5 },
      content: 'Significant economic event occurred here',
      type: 'note',
      createdAt: new Date('2024-01-15'),
      isResolved: false,
      comments: [
        {
          id: 'comment1',
          authorId: 'user2',
          content: 'I agree, this correlates with the Fed announcement',
          createdAt: new Date('2024-01-15T10:30:00'),
          isResolved: false,
        },
      ],
      style: {
        color: '#1976d2',
        backgroundColor: '#e3f2fd',
        isBold: false,
        isItalic: false,
      },
    },
    {
      id: 'annotation2',
      authorId: 'user2',
      position: { x: 400, y: 150, chartX: '2024-02-01', chartY: 95.2 },
      content: 'Market volatility increased',
      type: 'highlight',
      createdAt: new Date('2024-02-01'),
      isResolved: true,
      comments: [],
      style: {
        color: '#dc004e',
        backgroundColor: '#ffebee',
        isBold: true,
        isItalic: false,
      },
    },
  ], []);

  // Initialize collaboration state
  React.useEffect(() => {
    if (isEnabled) {
      setActiveUsers(mockUsers);
      setAnnotations(mockAnnotations);
    }
  }, [isEnabled, mockUsers, mockAnnotations]);

  // WebSocket connection management
  React.useEffect(() => {
    if (!isEnabled) return;

    const connectWebSocket = () => {
      setConnectionStatus('connecting');
      
      // In real app: const ws = new WebSocket(`ws://localhost:8080/collaboration/${chartId}`);
      // Mock WebSocket connection for development
      setTimeout(() => {
        setConnectionStatus('connected');
        setSnackbarMessage('Connected to collaboration session');
        setSnackbarOpen(true);
      }, 1000);
    };

    connectWebSocket();

    return () => {
      if (websocket) {
        websocket.close();
      }
    };
  }, [isEnabled, chartId, websocket]);

  // Handle annotation creation
  const handleAddAnnotation = (position: { x: number; y: number }) => {
    if (!isAnnotationMode) return;

    const newAnnotation: AnnotationData = {
      id: `annotation-${Date.now()}`,
      authorId: currentUserId,
      position: { ...position, chartX: '2024-01-01', chartY: 100 },
      content: 'New annotation',
      type: selectedAnnotationType,
      createdAt: new Date(),
      isResolved: false,
      comments: [],
      style: {
        color: '#1976d2',
        backgroundColor: '#e3f2fd',
        isBold: false,
        isItalic: false,
      },
    };

    setAnnotations(prev => [...prev, newAnnotation]);
    onAnnotationAdd?.(newAnnotation);
    setSnackbarMessage('Annotation added');
    setSnackbarOpen(true);
  };

  // Handle annotation update
  const handleUpdateAnnotation = (annotationId: string, content: string) => {
    setAnnotations(prev =>
      prev.map(ann =>
        ann.id === annotationId ? { ...ann, content, updatedAt: new Date() } : ann
      )
    );
    onAnnotationUpdate?.(annotationId, content);
  };

  // Handle annotation deletion
  const handleDeleteAnnotation = (annotationId: string) => {
    setAnnotations(prev => prev.filter(ann => ann.id !== annotationId));
    onAnnotationDelete?.(annotationId);
    setSnackbarMessage('Annotation deleted');
    setSnackbarOpen(true);
  };

  // Resolve/unresolve annotation
  const toggleAnnotationResolution = (annotationId: string) => {
    setAnnotations(prev =>
      prev.map(ann =>
        ann.id === annotationId ? { ...ann, isResolved: !ann.isResolved } : ann
      )
    );
  };

  // Get user by ID
  const getUserById = (userId: string) => 
    activeUsers.find(user => user.id === userId) || {
      id: userId,
      name: `User ${userId}`,
      color: '#666666',
      isOnline: false,
      lastActivity: new Date(),
      permissions: {
        canAnnotate: false,
        canComment: false,
        canEditOthers: false,
        canModerate: false,
      },
    };

  if (!isEnabled) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Real-time Collaboration
          </Typography>
          <Alert severity="info">
            Real-time collaboration is disabled. Enable it to start collaborating on this analysis.
          </Alert>
          <Button variant="contained" sx={{ mt: 2 }} data-testid="enable-collaboration-button">
            Enable Collaboration
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Box>
      {/* Collaboration Header */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Grid container alignItems="center" spacing={2}>
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CollaborationIcon color="primary" />
                <Typography variant="h6">Real-time Collaboration</Typography>
                <Chip
                  label={connectionStatus}
                  color={connectionStatus === 'connected' ? 'success' : connectionStatus === 'connecting' ? 'warning' : 'error'}
                  size="small"
                  data-testid="connection-status"
                />
              </Box>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', alignItems: 'center' }}>
                {/* Active Users */}
                <AvatarGroup max={4} data-testid="active-users-avatars">
                  {activeUsers.filter(user => user.isOnline).map((user) => (
                    <Tooltip key={user.id} title={`${user.name} - Online`}>
                      <Avatar
                        sx={{ 
                          bgcolor: user.color,
                          width: 32,
                          height: 32,
                          fontSize: '0.875rem'
                        }}
                        data-testid={`user-avatar-${user.id}`}
                      >
                        {user.name.charAt(0)}
                      </Avatar>
                    </Tooltip>
                  ))}
                </AvatarGroup>

                {/* Collaboration Controls */}
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<PersonAddIcon />}
                  onClick={() => setInviteDialogOpen(true)}
                  data-testid="invite-user-button"
                >
                  Invite
                </Button>

                <IconButton
                  size="small"
                  onClick={(e) => setSettingsMenuAnchor(e.currentTarget)}
                  data-testid="collaboration-settings-button"
                >
                  <SettingsIcon />
                </IconButton>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Annotation Tools */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Annotation Tools
          </Typography>
          
          <Grid container spacing={2} alignItems="center">
            <Grid item>
              <FormControlLabel
                control={
                  <Switch
                    checked={isAnnotationMode}
                    onChange={(e) => setIsAnnotationMode(e.target.checked)}
                    data-testid="annotation-mode-toggle"
                  />
                }
                label="Annotation Mode"
              />
            </Grid>
            
            {isAnnotationMode && (
              <>
                <Grid item>
                  <Button
                    variant={selectedAnnotationType === 'note' ? 'contained' : 'outlined'}
                    size="small"
                    onClick={() => setSelectedAnnotationType('note')}
                    data-testid="annotation-type-note"
                  >
                    Note
                  </Button>
                </Grid>
                <Grid item>
                  <Button
                    variant={selectedAnnotationType === 'highlight' ? 'contained' : 'outlined'}
                    size="small"
                    onClick={() => setSelectedAnnotationType('highlight')}
                    data-testid="annotation-type-highlight"
                  >
                    Highlight
                  </Button>
                </Grid>
                <Grid item>
                  <Button
                    variant={selectedAnnotationType === 'arrow' ? 'contained' : 'outlined'}
                    size="small"
                    onClick={() => setSelectedAnnotationType('arrow')}
                    data-testid="annotation-type-arrow"
                  >
                    Arrow
                  </Button>
                </Grid>
                <Grid item>
                  <Button
                    variant={selectedAnnotationType === 'box' ? 'contained' : 'outlined'}
                    size="small"
                    onClick={() => setSelectedAnnotationType('box')}
                    data-testid="annotation-type-box"
                  >
                    Box
                  </Button>
                </Grid>
              </>
            )}
          </Grid>
        </CardContent>
      </Card>

      {/* Active Annotations List */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6">
              Annotations ({annotations.filter(ann => showResolvedAnnotations || !ann.isResolved).length})
            </Typography>
            <FormControlLabel
              control={
                <Switch
                  checked={showResolvedAnnotations}
                  onChange={(e) => setShowResolvedAnnotations(e.target.checked)}
                  data-testid="show-resolved-toggle"
                />
              }
              label="Show Resolved"
              sx={{ ml: 'auto' }}
            />
          </Box>

          <List data-testid="annotations-list">
            {annotations
              .filter(ann => showResolvedAnnotations || !ann.isResolved)
              .map((annotation) => {
                const author = getUserById(annotation.authorId);
                return (
                  <ListItem key={annotation.id} data-testid={`annotation-${annotation.id}`}>
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: author.color, width: 28, height: 28, fontSize: '0.75rem' }}>
                        {author.name.charAt(0)}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body2">{annotation.content}</Typography>
                          <Chip
                            label={annotation.type}
                            size="small"
                            variant="outlined"
                          />
                          {annotation.isResolved ? (
                            <CheckIcon color="success" fontSize="small" />
                          ) : (
                            <UnresolvedIcon color="action" fontSize="small" />
                          )}
                        </Box>
                      }
                      secondary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                          <Typography variant="caption" color="text.secondary">
                            {author.name} • {annotation.createdAt.toLocaleDateString()}
                          </Typography>
                          {annotation.position.chartX && (
                            <Typography variant="caption" color="text.secondary">
                              @ {annotation.position.chartX}
                            </Typography>
                          )}
                          {annotation.comments.length > 0 && (
                            <Chip
                              label={`${annotation.comments.length} comments`}
                              size="small"
                              color="primary"
                              variant="outlined"
                            />
                          )}
                        </Box>
                      }
                    />
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <IconButton
                        size="small"
                        onClick={() => toggleAnnotationResolution(annotation.id)}
                        data-testid={`resolve-annotation-${annotation.id}`}
                        color={annotation.isResolved ? 'success' : 'default'}
                      >
                        {annotation.isResolved ? <CheckIcon /> : <UnresolvedIcon />}
                      </IconButton>
                      <IconButton
                        size="small"
                        data-testid={`edit-annotation-${annotation.id}`}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDeleteAnnotation(annotation.id)}
                        data-testid={`delete-annotation-${annotation.id}`}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </ListItem>
                );
              })}
          </List>

          {annotations.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <AnnotateIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
              <Typography variant="body2" color="text.secondary">
                No annotations yet. Enable annotation mode to start collaborating.
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Collaboration Activity Feed */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Activity Feed
          </Typography>
          <List dense data-testid="activity-feed">
            <ListItem>
              <ListItemIcon>
                <PersonAddIcon color="success" fontSize="small" />
              </ListItemIcon>
              <ListItemText
                primary="Alice Johnson joined the collaboration"
                secondary="2 minutes ago"
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <CommentIcon color="primary" fontSize="small" />
              </ListItemIcon>
              <ListItemText
                primary="Bob Smith added a comment"
                secondary="5 minutes ago"
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <AnnotateIcon color="secondary" fontSize="small" />
              </ListItemIcon>
              <ListItemText
                primary="Alice Johnson added annotation 'Significant event'"
                secondary="10 minutes ago"
              />
            </ListItem>
          </List>
        </CardContent>
      </Card>

      {/* Live Cursors Overlay (would be positioned absolutely over chart) */}
      {showCursors && (
        <Box data-testid="cursor-overlay" sx={{ position: 'relative' }}>
          {activeUsers
            .filter(user => user.isOnline && user.id !== currentUserId && user.cursorPosition)
            .map(user => (
              <Box
                key={user.id}
                data-testid={`user-cursor-${user.id}`}
                sx={{
                  position: 'absolute',
                  left: user.cursorPosition?.x,
                  top: user.cursorPosition?.y,
                  zIndex: 1000,
                  pointerEvents: 'none',
                }}
              >
                <CursorIcon sx={{ color: user.color, fontSize: 16 }} />
                <Typography
                  variant="caption"
                  sx={{
                    backgroundColor: user.color,
                    color: 'white',
                    padding: '2px 4px',
                    borderRadius: '4px',
                    fontSize: '10px',
                    ml: 1,
                  }}
                >
                  {user.name}
                </Typography>
              </Box>
            ))}
        </Box>
      )}

      {/* Invite User Dialog */}
      <Dialog open={inviteDialogOpen} onClose={() => setInviteDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Invite Collaborators</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Invite team members to collaborate on this economic analysis
          </Typography>
          <TextField
            fullWidth
            label="Email Address"
            placeholder="colleague@company.com"
            sx={{ mb: 2 }}
            data-testid="invite-email-input"
          />
          <Typography variant="caption" color="text.secondary">
            Invited users will receive an email with access to this collaborative session
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setInviteDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={() => {
              onInviteUser?.('colleague@company.com');
              setInviteDialogOpen(false);
              setSnackbarMessage('Invitation sent');
              setSnackbarOpen(true);
            }}
            data-testid="send-invite-button"
          >
            Send Invitation
          </Button>
        </DialogActions>
      </Dialog>

      {/* Settings Menu */}
      <Menu
        anchorEl={settingsMenuAnchor}
        open={Boolean(settingsMenuAnchor)}
        onClose={() => setSettingsMenuAnchor(null)}
      >
        <MenuItem onClick={() => setShowCursors(!showCursors)}>
          <Typography variant="body2">
            {showCursors ? 'Hide' : 'Show'} Live Cursors
          </Typography>
        </MenuItem>
        <MenuItem onClick={() => setShowResolvedAnnotations(!showResolvedAnnotations)}>
          <Typography variant="body2">
            {showResolvedAnnotations ? 'Hide' : 'Show'} Resolved Annotations
          </Typography>
        </MenuItem>
        <Divider />
        <MenuItem data-testid="collaboration-preferences-menu">
          <Typography variant="body2">Collaboration Preferences</Typography>
        </MenuItem>
      </Menu>

      {/* Notification Snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
      />
    </Box>
  );
};

export default RealTimeCollaboration;