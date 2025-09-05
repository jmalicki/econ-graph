import React from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  LinearProgress,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Button,
  IconButton,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Assessment as AssessmentIcon,
  Update as UpdateIcon,
  Refresh as RefreshIcon,
  OpenInNew as OpenInNewIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

/**
 * REQUIREMENT: Dashboard overview similar to FRED but with modern design
 * PURPOSE: Provide quick access to key economic indicators and recent data
 * This improves on FRED's homepage by showing relevant data upfront
 */
const Dashboard: React.FC = () => {
  const navigate = useNavigate();

  // Mock data - in real app this would come from GraphQL queries
  const featuredIndicators = [
    {
      id: 'gdp',
      title: 'Real Gross Domestic Product',
      value: '$27.36T',
      change: '+2.4%',
      changeType: 'positive' as const,
      period: 'Q3 2024',
      source: 'BEA',
    },
    {
      id: 'unemployment',
      title: 'Unemployment Rate',
      value: '3.7%',
      change: '-0.1%',
      changeType: 'positive' as const,
      period: 'Nov 2024',
      source: 'BLS',
    },
    {
      id: 'inflation',
      title: 'Consumer Price Index',
      value: '3.2%',
      change: '+0.2%',
      changeType: 'negative' as const,
      period: 'Nov 2024',
      source: 'BLS',
    },
    {
      id: 'fed-funds',
      title: 'Federal Funds Rate',
      value: '5.25%',
      change: '0.0%',
      changeType: 'neutral' as const,
      period: 'Dec 2024',
      source: 'Federal Reserve',
    },
  ];

  const recentUpdates = [
    {
      title: 'Employment Situation Summary',
      date: '2024-12-06',
      source: 'BLS',
      series: 'Nonfarm Payrolls, Unemployment Rate',
    },
    {
      title: 'Consumer Price Index',
      date: '2024-12-10',
      source: 'BLS',
      series: 'CPI-U, Core CPI',
    },
    {
      title: 'Industrial Production',
      date: '2024-12-15',
      source: 'Federal Reserve',
      series: 'Industrial Production Index',
    },
  ];

  const getChangeColor = (changeType: 'positive' | 'negative' | 'neutral') => {
    switch (changeType) {
      case 'positive':
        return 'success';
      case 'negative':
        return 'error';
      default:
        return 'default';
    }
  };

  const getChangeIcon = (changeType: 'positive' | 'negative' | 'neutral') => {
    switch (changeType) {
      case 'positive':
        return <TrendingUpIcon fontSize="small" />;
      case 'negative':
        return <TrendingDownIcon fontSize="small" />;
      default:
        return null;
    }
  };

  return (
    <Box>
      {/* Page header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Economic Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Key economic indicators and recent data releases
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Featured Economic Indicators */}
        <Grid item xs={12}>
          <Typography variant="h5" gutterBottom sx={{ mb: 2 }}>
            Key Indicators
          </Typography>
        </Grid>

        {featuredIndicators.map((indicator) => (
          <Grid item xs={12} sm={6} md={3} key={indicator.id}>
            <Card
              sx={{
                height: '100%',
                cursor: 'pointer',
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: 4,
                },
              }}
              onClick={() => navigate(`/series/${indicator.id}`)}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                  <AssessmentIcon color="primary" sx={{ mr: 1, mt: 0.5 }} />
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="h6" component="div" sx={{ fontSize: '1rem', lineHeight: 1.3 }}>
                      {indicator.title}
                    </Typography>
                    <Chip
                      label={indicator.source}
                      size="small"
                      variant="outlined"
                      sx={{ mt: 0.5 }}
                    />
                  </Box>
                </Box>

                <Typography variant="h4" component="div" sx={{ mb: 1, fontWeight: 600 }}>
                  {indicator.value}
                </Typography>

                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    {getChangeIcon(indicator.changeType)}
                    <Chip
                      label={indicator.change}
                      size="small"
                      color={getChangeColor(indicator.changeType)}
                      sx={{ ml: 0.5 }}
                    />
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    {indicator.period}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}

        {/* Recent Data Releases */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6">
                Recent Data Releases
              </Typography>
              <IconButton size="small" aria-label="refresh data">
                <RefreshIcon />
              </IconButton>
            </Box>

            <List>
              {recentUpdates.map((update, index) => (
                <ListItem
                  key={index}
                  sx={{
                    px: 0,
                    '&:hover': {
                      backgroundColor: 'action.hover',
                      borderRadius: 1,
                    },
                  }}
                  secondaryAction={
                    <IconButton edge="end" aria-label="view details">
                      <OpenInNewIcon />
                    </IconButton>
                  }
                >
                  <ListItemIcon>
                    <UpdateIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary={update.title}
                    secondary={
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          {update.series}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {update.source} • {new Date(update.date).toLocaleDateString()}
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>
              ))}
            </List>

            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <Button
                variant="outlined"
                onClick={() => navigate('/explore')}
                startIcon={<AssessmentIcon />}
              >
                Explore All Series
              </Button>
            </Box>
          </Paper>
        </Grid>

        {/* Quick Actions */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, height: 'fit-content' }}>
            <Typography variant="h6" gutterBottom>
              Quick Actions
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Button
                variant="contained"
                fullWidth
                startIcon={<AssessmentIcon />}
                onClick={() => navigate('/explore?category=employment')}
              >
                Employment Data
              </Button>

              <Button
                variant="contained"
                fullWidth
                startIcon={<AssessmentIcon />}
                onClick={() => navigate('/explore?category=inflation')}
              >
                Inflation Indicators
              </Button>

              <Button
                variant="contained"
                fullWidth
                startIcon={<AssessmentIcon />}
                onClick={() => navigate('/explore?category=gdp')}
              >
                GDP & Growth
              </Button>

              <Button
                variant="outlined"
                fullWidth
                onClick={() => navigate('/sources')}
              >
                Browse Data Sources
              </Button>
            </Box>

            {/* System Status */}
            <Box sx={{ mt: 3, pt: 2, borderTop: 1, borderColor: 'divider' }}>
              <Typography variant="subtitle2" gutterBottom>
                System Status
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Typography variant="body2" sx={{ flexGrow: 1 }}>
                  Data Freshness
                </Typography>
                <Chip label="Current" size="small" color="success" />
              </Box>
              <LinearProgress
                variant="determinate"
                value={95}
                color="success"
                sx={{ height: 6, borderRadius: 3 }}
              />
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                Last updated: 2 hours ago
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
