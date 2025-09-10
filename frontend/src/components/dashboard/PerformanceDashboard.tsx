/**
 * REQUIREMENT: Real-time performance monitoring dashboard
 * PURPOSE: Provide enterprise-grade performance insights and system monitoring
 * This enables proactive performance optimization and system health monitoring
 */

import React from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  LinearProgress,
  Chip,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  Speed as SpeedIcon,
  Memory as MemoryIcon,
  Storage as CacheIcon,
  TrendingUp as TrendingUpIcon,
  Warning as WarningIcon,
  CheckCircle as HealthyIcon,
  Error as ErrorIcon,
  Timeline as MetricsIcon,
} from '@mui/icons-material';

interface PerformanceDashboardProps {
  refreshInterval?: number; // milliseconds
  onAlert?: (alert: PerformanceAlert) => void;
}

interface PerformanceMetrics {
  responseTime: number;
  cacheHitRate: number;
  memoryUsage: number;
  errorRate: number;
  requestsPerMinute: number;
  uptime: number;
}

interface PerformanceAlert {
  type: 'slow_response' | 'high_memory' | 'low_cache_hit' | 'high_error_rate';
  message: string;
  severity: 'low' | 'medium' | 'high';
  timestamp: Date;
}

interface EndpointMetric {
  endpoint: string;
  averageResponseTime: number;
  requestCount: number;
  errorCount: number;
  cacheHitRate: number;
}

/**
 * Professional performance monitoring dashboard
 * REQUIREMENT: Real-time system performance visualization
 */
const PerformanceDashboard: React.FC<PerformanceDashboardProps> = ({
  refreshInterval = 30000,
  onAlert,
}) => {
  // State management
  const [metrics, setMetrics] = React.useState<PerformanceMetrics>({
    responseTime: 45.2,
    cacheHitRate: 0.89,
    memoryUsage: 234.5,
    errorRate: 0.003,
    requestsPerMinute: 152.4,
    uptime: 99.94,
  });

  const [alerts, setAlerts] = React.useState<PerformanceAlert[]>([
    {
      type: 'slow_response',
      message: 'Slow response detected on /api/series endpoint (156ms)',
      severity: 'medium',
      timestamp: new Date(Date.now() - 5 * 60 * 1000),
    },
  ]);

  const [slowestEndpoints] = React.useState<EndpointMetric[]>([
    {
      endpoint: '/api/statistical-analysis/correlation',
      averageResponseTime: 89.5,
      requestCount: 245,
      errorCount: 2,
      cacheHitRate: 0.72,
    },
    {
      endpoint: '/api/export/pdf',
      averageResponseTime: 156.3,
      requestCount: 89,
      errorCount: 1,
      cacheHitRate: 0.45,
    },
    {
      endpoint: '/api/series/data-points',
      averageResponseTime: 34.7,
      requestCount: 1024,
      errorCount: 0,
      cacheHitRate: 0.94,
    },
  ]);

  // Auto-refresh metrics
  React.useEffect(() => {
    const interval = setInterval(() => {
      // Mock real-time updates
      setMetrics(prev => ({
        ...prev,
        responseTime: 40 + Math.random() * 20,
        cacheHitRate: 0.85 + Math.random() * 0.10,
        memoryUsage: 200 + Math.random() * 100,
        requestsPerMinute: 140 + Math.random() * 30,
      }));
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [refreshInterval]);

  // Get status color based on metric value
  const getStatusColor = (value: number, thresholds: { good: number; warning: number }) => {
    if (value <= thresholds.good) return 'success';
    if (value <= thresholds.warning) return 'warning';
    return 'error';
  };

  // Format uptime percentage
  const formatUptime = (uptime: number) => {
    if (uptime >= 99.9) return 'success';
    if (uptime >= 99.5) return 'warning';
    return 'error';
  };

  return (
    <Box>
      {/* Performance Metrics Overview */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6} lg={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <SpeedIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Response Time</Typography>
              </Box>
              <Typography variant="h3" color="primary" data-testid="response-time-value">
                {metrics.responseTime.toFixed(1)}ms
              </Typography>
              <LinearProgress
                variant="determinate"
                value={Math.min((100 - metrics.responseTime) / 100 * 100, 100)}
                color={getStatusColor(metrics.responseTime, { good: 50, warning: 100 })}
                sx={{ mt: 1, mb: 1 }}
                data-testid="response-time-progress"
              />
              <Typography variant="caption" color="text.secondary">
                Target: &lt; 100ms
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6} lg={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <CacheIcon color="secondary" sx={{ mr: 1 }} />
                <Typography variant="h6">Cache Hit Rate</Typography>
              </Box>
              <Typography variant="h3" color="secondary" data-testid="cache-hit-rate-value">
                {(metrics.cacheHitRate * 100).toFixed(1)}%
              </Typography>
              <LinearProgress
                variant="determinate"
                value={metrics.cacheHitRate * 100}
                color={getStatusColor(1 - metrics.cacheHitRate, { good: 0.15, warning: 0.25 })}
                sx={{ mt: 1, mb: 1 }}
                data-testid="cache-hit-rate-progress"
              />
              <Typography variant="caption" color="text.secondary">
                Target: &gt; 80%
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6} lg={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <MemoryIcon color="warning" sx={{ mr: 1 }} />
                <Typography variant="h6">Memory Usage</Typography>
              </Box>
              <Typography variant="h3" color="warning" data-testid="memory-usage-value">
                {metrics.memoryUsage.toFixed(0)}MB
              </Typography>
              <LinearProgress
                variant="determinate"
                value={Math.min(metrics.memoryUsage / 1000 * 100, 100)}
                color={getStatusColor(metrics.memoryUsage, { good: 500, warning: 800 })}
                sx={{ mt: 1, mb: 1 }}
                data-testid="memory-usage-progress"
              />
              <Typography variant="caption" color="text.secondary">
                Target: &lt; 500MB
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6} lg={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <TrendingUpIcon color="info" sx={{ mr: 1 }} />
                <Typography variant="h6">Requests/Min</Typography>
              </Box>
              <Typography variant="h3" color="info" data-testid="requests-per-minute-value">
                {metrics.requestsPerMinute.toFixed(0)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Current load
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6} lg={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <ErrorIcon color="error" sx={{ mr: 1 }} />
                <Typography variant="h6">Error Rate</Typography>
              </Box>
              <Typography variant="h3" color="error" data-testid="error-rate-value">
                {(metrics.errorRate * 100).toFixed(2)}%
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Target: &lt; 1%
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6} lg={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <HealthyIcon color="success" sx={{ mr: 1 }} />
                <Typography variant="h6">System Uptime</Typography>
              </Box>
              <Typography variant="h3" color="success" data-testid="uptime-value">
                {metrics.uptime.toFixed(2)}%
              </Typography>
              <Chip
                label="Healthy"
                color={formatUptime(metrics.uptime)}
                size="small"
                sx={{ mt: 1 }}
                data-testid="uptime-status"
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Performance Alerts */}
      {alerts.length > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Performance Alerts
            </Typography>
            <List data-testid="performance-alerts">
              {alerts.map((alert, index) => (
                <ListItem key={index} data-testid={`alert-${index}`}>
                  <ListItemIcon>
                    <WarningIcon color={alert.severity === 'high' ? 'error' : 'warning'} />
                  </ListItemIcon>
                  <ListItemText
                    primary={alert.message}
                    secondary={`${alert.severity.toUpperCase()} • ${alert.timestamp.toLocaleString()}`}
                  />
                  <Chip
                    label={alert.severity}
                    color={alert.severity === 'high' ? 'error' : alert.severity === 'medium' ? 'warning' : 'default'}
                    size="small"
                  />
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>
      )}

      {/* Endpoint Performance Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Slowest Endpoints
          </Typography>
          <TableContainer component={Paper} sx={{ mt: 2 }}>
            <Table data-testid="endpoint-performance-table">
              <TableHead>
                <TableRow>
                  <TableCell><strong>Endpoint</strong></TableCell>
                  <TableCell><strong>Avg Response Time</strong></TableCell>
                  <TableCell><strong>Requests</strong></TableCell>
                  <TableCell><strong>Errors</strong></TableCell>
                  <TableCell><strong>Cache Hit Rate</strong></TableCell>
                  <TableCell><strong>Status</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {slowestEndpoints.map((endpoint, index) => (
                  <TableRow key={index} data-testid={`endpoint-row-${index}`}>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                        {endpoint.endpoint}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {endpoint.averageResponseTime.toFixed(1)}ms
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {endpoint.requestCount.toLocaleString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color={endpoint.errorCount > 0 ? 'error' : 'text.primary'}>
                        {endpoint.errorCount}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={`${(endpoint.cacheHitRate * 100).toFixed(0)}%`}
                        color={endpoint.cacheHitRate > 0.8 ? 'success' : endpoint.cacheHitRate > 0.5 ? 'warning' : 'error'}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={endpoint.averageResponseTime < 100 ? 'Good' : endpoint.averageResponseTime < 200 ? 'Warning' : 'Slow'}
                        color={endpoint.averageResponseTime < 100 ? 'success' : endpoint.averageResponseTime < 200 ? 'warning' : 'error'}
                        size="small"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
};

export default PerformanceDashboard;