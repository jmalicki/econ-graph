/**
 * REQUIREMENT: Customizable dashboard system for personalized economic analysis
 * PURPOSE: Provide Grafana-level dashboard customization with drag-and-drop widgets
 * This enables personalized economic monitoring and analysis workflows
 */

import React from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Switch,
  FormControlLabel,
  Tooltip,
  Menu,
  Divider,
  Alert,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  DragIndicator as DragIcon,
  Dashboard as DashboardIcon,
  Analytics as AnalyticsIcon,
  TrendingUp as TrendingUpIcon,
  Assessment as ChartIcon,
  TableChart as TableIcon,
  Article as NewsIcon,
  Speed as MetricsIcon,
  Settings as SettingsIcon,
  Save as SaveIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';

interface CustomizableDashboardProps {
  userId: string;
  onSaveDashboard?: (dashboard: DashboardConfig) => void;
  onLoadDashboard?: (dashboardId: string) => void;
}

interface DashboardConfig {
  id: string;
  name: string;
  description: string;
  widgets: DashboardWidget[];
  layout: 'grid' | 'masonry' | 'flow';
  theme: 'light' | 'dark' | 'auto';
  refreshInterval: number;
  isShared: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface DashboardWidget {
  id: string;
  type: WidgetType;
  title: string;
  position: { x: number; y: number; width: number; height: number };
  config: WidgetConfig;
  refreshInterval: number;
  isVisible: boolean;
  permissions: WidgetPermissions;
}

type WidgetType = 'chart' | 'metric' | 'table' | 'news' | 'performance' | 'collaboration';

interface WidgetConfig {
  seriesIds?: string[];
  chartType?: 'line' | 'bar' | 'area' | 'scatter';
  timeRange?: { start: Date; end: Date };
  transformation?: 'none' | 'yoy' | 'qoq' | 'mom';
  thresholds?: { warning: number; critical: number };
  dataSource?: string;
  filterCriteria?: Record<string, any>;
}

interface WidgetPermissions {
  canEdit: boolean;
  canDelete: boolean;
  canMove: boolean;
  canResize: boolean;
}

/**
 * Professional customizable dashboard with Grafana-level capabilities
 * REQUIREMENT: Enable personalized economic monitoring dashboards
 */
const CustomizableDashboard: React.FC<CustomizableDashboardProps> = ({
  userId,
  onSaveDashboard,
  onLoadDashboard,
}) => {
  // Dashboard state
  const [dashboard, setDashboard] = React.useState<DashboardConfig>({
    id: 'default-dashboard',
    name: 'My Economic Dashboard',
    description: 'Personalized economic indicators monitoring',
    widgets: [],
    layout: 'grid',
    theme: 'light',
    refreshInterval: 30000,
    isShared: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  // UI state
  const [editMode, setEditMode] = React.useState(false);
  const [widgetDialogOpen, setWidgetDialogOpen] = React.useState(false);
  const [settingsMenuAnchor, setSettingsMenuAnchor] = React.useState<null | HTMLElement>(null);
  const [selectedWidget, setSelectedWidget] = React.useState<DashboardWidget | null>(null);

  // Mock widgets for demonstration
  const mockWidgets: DashboardWidget[] = React.useMemo(() => [
    {
      id: 'widget-gdp-chart',
      type: 'chart',
      title: 'Real GDP Trend',
      position: { x: 0, y: 0, width: 6, height: 4 },
      config: {
        seriesIds: ['gdp-real'],
        chartType: 'line',
        timeRange: { start: new Date('2023-01-01'), end: new Date('2024-01-01') },
        transformation: 'yoy',
      },
      refreshInterval: 60000,
      isVisible: true,
      permissions: {
        canEdit: true,
        canDelete: true,
        canMove: true,
        canResize: true,
      },
    },
    {
      id: 'widget-unemployment-metric',
      type: 'metric',
      title: 'Current Unemployment Rate',
      position: { x: 6, y: 0, width: 3, height: 2 },
      config: {
        seriesIds: ['unemployment-rate'],
        thresholds: { warning: 4.0, critical: 6.0 },
      },
      refreshInterval: 300000, // 5 minutes
      isVisible: true,
      permissions: {
        canEdit: true,
        canDelete: true,
        canMove: true,
        canResize: true,
      },
    },
    {
      id: 'widget-performance-monitor',
      type: 'performance',
      title: 'System Performance',
      position: { x: 9, y: 0, width: 3, height: 4 },
      config: {},
      refreshInterval: 10000, // 10 seconds
      isVisible: true,
      permissions: {
        canEdit: true,
        canDelete: false,
        canMove: true,
        canResize: true,
      },
    },
  ], []);

  // Initialize dashboard with mock widgets
  React.useEffect(() => {
    setDashboard(prev => ({
      ...prev,
      widgets: mockWidgets,
    }));
  }, [mockWidgets]);

  // Add new widget
  const handleAddWidget = (widgetType: WidgetType) => {
    const newWidget: DashboardWidget = {
      id: `widget-${Date.now()}`,
      type: widgetType,
      title: `New ${widgetType.charAt(0).toUpperCase() + widgetType.slice(1)} Widget`,
      position: { x: 0, y: 0, width: 4, height: 3 },
      config: {},
      refreshInterval: 60000,
      isVisible: true,
      permissions: {
        canEdit: true,
        canDelete: true,
        canMove: true,
        canResize: true,
      },
    };

    setDashboard(prev => ({
      ...prev,
      widgets: [...prev.widgets, newWidget],
      updatedAt: new Date(),
    }));

    setWidgetDialogOpen(false);
  };

  // Remove widget
  const handleRemoveWidget = (widgetId: string) => {
    setDashboard(prev => ({
      ...prev,
      widgets: prev.widgets.filter(w => w.id !== widgetId),
      updatedAt: new Date(),
    }));
  };

  // Toggle widget visibility
  const handleToggleWidget = (widgetId: string) => {
    setDashboard(prev => ({
      ...prev,
      widgets: prev.widgets.map(w => 
        w.id === widgetId ? { ...w, isVisible: !w.isVisible } : w
      ),
      updatedAt: new Date(),
    }));
  };

  // Save dashboard
  const handleSaveDashboard = () => {
    onSaveDashboard?.(dashboard);
  };

  // Get widget icon
  const getWidgetIcon = (type: WidgetType) => {
    switch (type) {
      case 'chart': return <ChartIcon />;
      case 'metric': return <MetricsIcon />;
      case 'table': return <TableIcon />;
      case 'news': return <NewsIcon />;
      case 'performance': return <TrendingUpIcon />;
      case 'collaboration': return <AnalyticsIcon />;
      default: return <DashboardIcon />;
    }
  };

  // Render widget content (mock implementation)
  const renderWidget = (widget: DashboardWidget) => {
    if (!widget.isVisible) return null;

    return (
      <Grid item xs={12} md={widget.position.width} key={widget.id}>
        <Card 
          sx={{ 
            height: widget.position.height * 50, 
            position: 'relative',
            border: editMode ? '2px dashed #ccc' : 'none',
          }}
          data-testid={`widget-${widget.id}`}
        >
          <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* Widget Header */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {editMode && <DragIcon color="action" />}
                {getWidgetIcon(widget.type)}
                <Typography variant="h6" sx={{ fontSize: '1rem' }}>
                  {widget.title}
                </Typography>
              </Box>
              
              {editMode && (
                <Box>
                  <IconButton 
                    size="small"
                    onClick={() => setSelectedWidget(widget)}
                    data-testid={`edit-widget-${widget.id}`}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => handleRemoveWidget(widget.id)}
                    disabled={!widget.permissions.canDelete}
                    data-testid={`delete-widget-${widget.id}`}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
              )}
            </Box>

            {/* Widget Content */}
            <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {widget.type === 'chart' && (
                <Typography variant="body2" color="text.secondary">
                  Chart: {widget.config.seriesIds?.join(', ') || 'No series selected'}
                </Typography>
              )}
              {widget.type === 'metric' && (
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h3" color="primary">
                    3.7%
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Current Value
                  </Typography>
                </Box>
              )}
              {widget.type === 'performance' && (
                <Typography variant="body2" color="text.secondary">
                  Performance metrics and system health
                </Typography>
              )}
              {widget.type === 'table' && (
                <Typography variant="body2" color="text.secondary">
                  Data table with {widget.config.seriesIds?.length || 0} series
                </Typography>
              )}
            </Box>
          </CardContent>
        </Card>
      </Grid>
    );
  };

  return (
    <Box>
      {/* Dashboard Header */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container alignItems="center" spacing={2}>
            <Grid item xs={12} md={8}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <DashboardIcon color="primary" />
                <Typography variant="h5">{dashboard.name}</Typography>
                <Chip
                  label={editMode ? 'Edit Mode' : 'View Mode'}
                  color={editMode ? 'secondary' : 'primary'}
                  size="small"
                  data-testid="dashboard-mode-indicator"
                />
              </Box>
              <Typography variant="body2" color="text.secondary">
                {dashboard.description} • {dashboard.widgets.filter(w => w.isVisible).length} widgets
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                <Button
                  variant={editMode ? 'contained' : 'outlined'}
                  size="small"
                  onClick={() => setEditMode(!editMode)}
                  data-testid="toggle-edit-mode"
                >
                  {editMode ? 'Exit Edit' : 'Edit Dashboard'}
                </Button>
                
                {editMode && (
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<AddIcon />}
                    onClick={() => setWidgetDialogOpen(true)}
                    data-testid="add-widget-button"
                  >
                    Add Widget
                  </Button>
                )}
                
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<SaveIcon />}
                  onClick={handleSaveDashboard}
                  data-testid="save-dashboard-button"
                >
                  Save
                </Button>
                
                <IconButton
                  size="small"
                  onClick={(e) => setSettingsMenuAnchor(e.currentTarget)}
                  data-testid="dashboard-settings-button"
                >
                  <SettingsIcon />
                </IconButton>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Dashboard Widgets Grid */}
      <Grid container spacing={2} data-testid="dashboard-widgets-grid">
        {dashboard.widgets.map(widget => renderWidget(widget))}
        
        {/* Empty State */}
        {dashboard.widgets.filter(w => w.isVisible).length === 0 && (
          <Grid item xs={12}>
            <Paper sx={{ p: 4, textAlign: 'center' }} data-testid="empty-dashboard">
              <DashboardIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Your dashboard is empty
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Add widgets to create your personalized economic monitoring dashboard
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setWidgetDialogOpen(true)}
                data-testid="add-first-widget-button"
              >
                Add Your First Widget
              </Button>
            </Paper>
          </Grid>
        )}
      </Grid>

      {/* Add Widget Dialog */}
      <Dialog open={widgetDialogOpen} onClose={() => setWidgetDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Dashboard Widget</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 3 }}>
            Choose a widget type to add to your dashboard
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Button
                fullWidth
                variant="outlined"
                sx={{ height: 80, flexDirection: 'column' }}
                onClick={() => handleAddWidget('chart')}
                data-testid="add-chart-widget"
              >
                <ChartIcon sx={{ mb: 1 }} />
                Chart Widget
              </Button>
            </Grid>
            <Grid item xs={6}>
              <Button
                fullWidth
                variant="outlined"
                sx={{ height: 80, flexDirection: 'column' }}
                onClick={() => handleAddWidget('metric')}
                data-testid="add-metric-widget"
              >
                <MetricsIcon sx={{ mb: 1 }} />
                Metric Widget
              </Button>
            </Grid>
            <Grid item xs={6}>
              <Button
                fullWidth
                variant="outlined"
                sx={{ height: 80, flexDirection: 'column' }}
                onClick={() => handleAddWidget('table')}
                data-testid="add-table-widget"
              >
                <TableIcon sx={{ mb: 1 }} />
                Data Table
              </Button>
            </Grid>
            <Grid item xs={6}>
              <Button
                fullWidth
                variant="outlined"
                sx={{ height: 80, flexDirection: 'column' }}
                onClick={() => handleAddWidget('performance')}
                data-testid="add-performance-widget"
              >
                <TrendingUpIcon sx={{ mb: 1 }} />
                Performance
              </Button>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setWidgetDialogOpen(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>

      {/* Settings Menu */}
      <Menu
        anchorEl={settingsMenuAnchor}
        open={Boolean(settingsMenuAnchor)}
        onClose={() => setSettingsMenuAnchor(null)}
      >
        <MenuItem onClick={() => setDashboard(prev => ({ ...prev, layout: 'grid' }))}>
          <Typography variant="body2">Grid Layout</Typography>
        </MenuItem>
        <MenuItem onClick={() => setDashboard(prev => ({ ...prev, layout: 'masonry' }))}>
          <Typography variant="body2">Masonry Layout</Typography>
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => setDashboard(prev => ({ ...prev, theme: 'light' }))}>
          <Typography variant="body2">Light Theme</Typography>
        </MenuItem>
        <MenuItem onClick={() => setDashboard(prev => ({ ...prev, theme: 'dark' }))}>
          <Typography variant="body2">Dark Theme</Typography>
        </MenuItem>
        <Divider />
        <MenuItem data-testid="dashboard-preferences">
          <Typography variant="body2">Dashboard Preferences</Typography>
        </MenuItem>
      </Menu>

      {/* Widget Configuration Panel (when widget selected) */}
      {selectedWidget && (
        <Dialog
          open={Boolean(selectedWidget)}
          onClose={() => setSelectedWidget(null)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>Configure {selectedWidget.title}</DialogTitle>
          <DialogContent>
            <TextField
              fullWidth
              label="Widget Title"
              value={selectedWidget.title}
              onChange={(e) => setSelectedWidget(prev => prev ? { ...prev, title: e.target.value } : null)}
              sx={{ mb: 2 }}
              data-testid="widget-title-input"
            />
            
            {selectedWidget.type === 'chart' && (
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Chart Type</InputLabel>
                <Select
                  value={selectedWidget.config.chartType || 'line'}
                  label="Chart Type"
                  data-testid="widget-chart-type-select"
                >
                  <MenuItem value="line">Line Chart</MenuItem>
                  <MenuItem value="bar">Bar Chart</MenuItem>
                  <MenuItem value="area">Area Chart</MenuItem>
                  <MenuItem value="scatter">Scatter Plot</MenuItem>
                </Select>
              </FormControl>
            )}

            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Refresh Interval</InputLabel>
              <Select
                value={selectedWidget.refreshInterval}
                label="Refresh Interval"
                onChange={(e) => setSelectedWidget(prev => prev ? { ...prev, refreshInterval: e.target.value as number } : null)}
                data-testid="widget-refresh-interval-select"
              >
                <MenuItem value={10000}>10 seconds</MenuItem>
                <MenuItem value={60000}>1 minute</MenuItem>
                <MenuItem value={300000}>5 minutes</MenuItem>
                <MenuItem value={600000}>10 minutes</MenuItem>
              </Select>
            </FormControl>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setSelectedWidget(null)}>Cancel</Button>
            <Button
              variant="contained"
              onClick={() => {
                setDashboard(prev => ({
                  ...prev,
                  widgets: prev.widgets.map(w => w.id === selectedWidget.id ? selectedWidget : w),
                  updatedAt: new Date(),
                }));
                setSelectedWidget(null);
              }}
              data-testid="save-widget-config-button"
            >
              Save Configuration
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </Box>
  );
};

export default CustomizableDashboard;