import React, { useState, useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  Card,
  CardContent,
  Grid,
  Chip,
  IconButton,
  Collapse,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Slider,
  Switch,
  FormControlLabel,
  Tooltip,
  LinearProgress,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
} from '@mui/material';
import {
  ExpandMore,
  ExpandLess,
  Crisis,
  Policy,
  NaturalDisaster,
  TrendingDown,
  TrendingUp,
  Public,
  Timeline as TimelineIcon,
  Assessment,
  Warning,
  Error,
  Info,
} from '@mui/icons-material';
import { useQuery } from '@apollo/client';
import { gql } from '@apollo/client';

// GraphQL query
const GET_GLOBAL_EVENTS_WITH_IMPACTS = gql`
  query GetGlobalEventsWithImpacts(
    $startDate: String
    $endDate: String
    $minImpactScore: Float
  ) {
    globalEventsWithImpacts(
      startDate: $startDate
      endDate: $endDate
      minImpactScore: $minImpactScore
    ) {
      event {
        id
        name
        description
        eventType
        severity
        startDate
        endDate
        economicImpactScore
        affectedRegions
      }
      countryImpacts {
        country {
          id
          name
          isoCode
          region
        }
        impact {
          impactType
          impactMagnitude
          impactDurationDays
          recoveryTimeDays
          confidenceScore
        }
        impactSeverity
        recoveryStatus
      }
      affectedCountryCount
      totalEconomicImpact
    }
  }
`;

// Types
interface GlobalEvent {
  id: string;
  name: string;
  description?: string;
  eventType: string;
  severity: string;
  startDate: string;
  endDate?: string;
  economicImpactScore?: string;
  affectedRegions?: string[];
}

interface CountryImpact {
  country: {
    id: string;
    name: string;
    isoCode: string;
    region: string;
  };
  impact: {
    impactType: string;
    impactMagnitude?: string;
    impactDurationDays?: number;
    recoveryTimeDays?: number;
    confidenceScore?: string;
  };
  impactSeverity: string;
  recoveryStatus: string;
}

interface EventWithImpacts {
  event: GlobalEvent;
  countryImpacts: CountryImpact[];
  affectedCountryCount: number;
  totalEconomicImpact?: string;
}

// Component
const GlobalEventsExplorer: React.FC = () => {
  const [selectedEventType, setSelectedEventType] = useState<string>('all');
  const [minImpactScore, setMinImpactScore] = useState<number>(50);
  const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set());
  const [showRecoveredCountries, setShowRecoveredCountries] = useState<boolean>(false);

  const { data, loading, error } = useQuery(GET_GLOBAL_EVENTS_WITH_IMPACTS, {
    variables: {
      minImpactScore,
    },
  });

  const events: EventWithImpacts[] = data?.globalEventsWithImpacts || [];

  const filteredEvents = useMemo(() => {
    return events.filter(eventData => 
      selectedEventType === 'all' || eventData.event.eventType.toLowerCase() === selectedEventType.toLowerCase()
    );
  }, [events, selectedEventType]);

  const toggleEventExpansion = (eventId: string) => {
    const newExpanded = new Set(expandedEvents);
    if (newExpanded.has(eventId)) {
      newExpanded.delete(eventId);
    } else {
      newExpanded.add(eventId);
    }
    setExpandedEvents(newExpanded);
  };

  const getEventIcon = (eventType: string, severity: string) => {
    const iconProps = {
      sx: {
        color: severity === 'Critical' ? '#f44336' :
               severity === 'High' ? '#ff9800' :
               severity === 'Medium' ? '#2196f3' : '#4caf50'
      }
    };

    switch (eventType.toLowerCase()) {
      case 'crisis':
        return <Crisis {...iconProps} />;
      case 'policy':
        return <Policy {...iconProps} />;
      case 'natural disaster':
        return <NaturalDisaster {...iconProps} />;
      default:
        return <Public {...iconProps} />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical':
        return '#f44336';
      case 'high':
        return '#ff9800';
      case 'medium':
        return '#2196f3';
      case 'low':
        return '#4caf50';
      default:
        return '#9e9e9e';
    }
  };

  const getImpactSeverityIcon = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical':
        return <Error color="error" />;
      case 'severe':
        return <Warning color="warning" />;
      case 'moderate':
        return <Info color="info" />;
      default:
        return <Info color="action" />;
    }
  };

  const getRecoveryStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'recovered':
        return 'success';
      case 'recovering':
        return 'warning';
      case 'ongoing':
        return 'error';
      default:
        return 'default';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const calculateRecoveryProgress = (impact: CountryImpact) => {
    if (impact.recoveryStatus.toLowerCase() === 'recovered') return 100;
    if (impact.recoveryStatus.toLowerCase() === 'ongoing') return 0;
    
    // For "recovering" status, estimate progress based on recovery time
    const recoveryDays = impact.impact.recoveryTimeDays || 365;
    const impactDays = impact.impact.impactDurationDays || 90;
    
    // Simple progress estimation
    return Math.min(75, (impactDays / recoveryDays) * 100);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height={400}>
        <CircularProgress />
        <Typography variant="body1" sx={{ ml: 2 }}>
          Loading global economic events...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error">
        Failed to load global economic events: {error.message}
      </Alert>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        🌍 Global Economic Events Explorer
        <TimelineIcon />
      </Typography>

      {/* Controls */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Event Type</InputLabel>
              <Select
                value={selectedEventType}
                onChange={(e) => setSelectedEventType(e.target.value)}
                label="Event Type"
              >
                <MenuItem value="all">All Events</MenuItem>
                <MenuItem value="crisis">Financial Crisis</MenuItem>
                <MenuItem value="policy">Policy Changes</MenuItem>
                <MenuItem value="natural disaster">Natural Disasters</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={4}>
            <Typography variant="caption" gutterBottom>
              Minimum Impact Score: {minImpactScore}
            </Typography>
            <Slider
              value={minImpactScore}
              onChange={(_, value) => setMinImpactScore(value as number)}
              min={0}
              max={100}
              step={10}
              marks
              valueLabelDisplay="auto"
            />
          </Grid>

          <Grid item xs={12} md={3}>
            <FormControlLabel
              control={
                <Switch
                  checked={showRecoveredCountries}
                  onChange={(e) => setShowRecoveredCountries(e.target.checked)}
                />
              }
              label="Show Recovered Countries"
            />
          </Grid>

          <Grid item xs={12} md={2}>
            <Typography variant="body2" color="textSecondary">
              {filteredEvents.length} events found
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* Events Timeline */}
      {filteredEvents.length === 0 ? (
        <Alert severity="info">
          No global economic events match the current filters.
        </Alert>
      ) : (
        <Timeline position="alternate">
          {filteredEvents.map((eventData, index) => {
            const { event, countryImpacts, affectedCountryCount } = eventData;
            const isExpanded = expandedEvents.has(event.id);
            const visibleImpacts = showRecoveredCountries 
              ? countryImpacts 
              : countryImpacts.filter(impact => impact.recoveryStatus.toLowerCase() !== 'recovered');

            return (
              <TimelineItem key={event.id}>
                <TimelineSeparator>
                  <TimelineDot sx={{ bgcolor: getSeverityColor(event.severity), p: 1 }}>
                    {getEventIcon(event.eventType, event.severity)}
                  </TimelineDot>
                  {index < filteredEvents.length - 1 && <TimelineConnector />}
                </TimelineSeparator>

                <TimelineContent>
                  <Card sx={{ mb: 2 }}>
                    <CardContent>
                      {/* Event Header */}
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Box sx={{ flexGrow: 1 }}>
                          <Typography variant="h6" gutterBottom>
                            {event.name}
                          </Typography>
                          
                          <Box sx={{ display: 'flex', gap: 1, mb: 1, flexWrap: 'wrap' }}>
                            <Chip
                              label={event.eventType}
                              size="small"
                              color="primary"
                              variant="outlined"
                            />
                            <Chip
                              label={`${event.severity} Severity`}
                              size="small"
                              sx={{ 
                                bgcolor: getSeverityColor(event.severity) + '20',
                                color: getSeverityColor(event.severity),
                                border: `1px solid ${getSeverityColor(event.severity)}`,
                              }}
                            />
                            <Chip
                              label={`${affectedCountryCount} Countries`}
                              size="small"
                              variant="outlined"
                            />
                            {event.economicImpactScore && (
                              <Chip
                                label={`Impact: ${parseFloat(event.economicImpactScore).toFixed(0)}/100`}
                                size="small"
                                color="warning"
                                variant="outlined"
                              />
                            )}
                          </Box>

                          <Typography variant="body2" color="textSecondary" gutterBottom>
                            {formatDate(event.startDate)}
                            {event.endDate && ` - ${formatDate(event.endDate)}`}
                          </Typography>

                          {event.description && (
                            <Typography variant="body2" paragraph>
                              {event.description}
                            </Typography>
                          )}
                        </Box>

                        <IconButton
                          onClick={() => toggleEventExpansion(event.id)}
                          size="small"
                        >
                          {isExpanded ? <ExpandLess /> : <ExpandMore />}
                        </IconButton>
                      </Box>

                      {/* Country Impacts Summary */}
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" gutterBottom>
                          Economic Impact Summary
                        </Typography>
                        
                        <Grid container spacing={2}>
                          <Grid item xs={6} sm={3}>
                            <Box sx={{ textAlign: 'center' }}>
                              <Typography variant="h6" color="error">
                                {countryImpacts.filter(i => i.impactSeverity === 'Critical').length}
                              </Typography>
                              <Typography variant="caption">Critical</Typography>
                            </Box>
                          </Grid>
                          <Grid item xs={6} sm={3}>
                            <Box sx={{ textAlign: 'center' }}>
                              <Typography variant="h6" color="warning">
                                {countryImpacts.filter(i => i.impactSeverity === 'Severe').length}
                              </Typography>
                              <Typography variant="caption">Severe</Typography>
                            </Box>
                          </Grid>
                          <Grid item xs={6} sm={3}>
                            <Box sx={{ textAlign: 'center' }}>
                              <Typography variant="h6" color="info">
                                {countryImpacts.filter(i => i.impactSeverity === 'Moderate').length}
                              </Typography>
                              <Typography variant="caption">Moderate</Typography>
                            </Box>
                          </Grid>
                          <Grid item xs={6} sm={3}>
                            <Box sx={{ textAlign: 'center' }}>
                              <Typography variant="h6" color="success">
                                {countryImpacts.filter(i => i.recoveryStatus === 'Recovered').length}
                              </Typography>
                              <Typography variant="caption">Recovered</Typography>
                            </Box>
                          </Grid>
                        </Grid>
                      </Box>

                      {/* Expanded Country Details */}
                      <Collapse in={isExpanded}>
                        <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid #e0e0e0' }}>
                          <Typography variant="subtitle2" gutterBottom>
                            Country Impact Details ({visibleImpacts.length} countries)
                          </Typography>
                          
                          <List dense>
                            {visibleImpacts.map((countryImpact, idx) => {
                              const recoveryProgress = calculateRecoveryProgress(countryImpact);
                              
                              return (
                                <ListItem key={idx} sx={{ px: 0 }}>
                                  <ListItemAvatar>
                                    <Avatar sx={{ width: 32, height: 32, fontSize: '0.75rem' }}>
                                      {countryImpact.country.isoCode}
                                    </Avatar>
                                  </ListItemAvatar>
                                  
                                  <ListItemText
                                    primary={
                                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Typography variant="body2" fontWeight="medium">
                                          {countryImpact.country.name}
                                        </Typography>
                                        {getImpactSeverityIcon(countryImpact.impactSeverity)}
                                        <Chip
                                          label={countryImpact.recoveryStatus}
                                          size="small"
                                          color={getRecoveryStatusColor(countryImpact.recoveryStatus) as any}
                                          variant="outlined"
                                        />
                                      </Box>
                                    }
                                    secondary={
                                      <Box sx={{ mt: 1 }}>
                                        <Typography variant="caption" display="block">
                                          Impact Type: {countryImpact.impact.impactType}
                                          {countryImpact.impact.impactMagnitude && 
                                            ` | Magnitude: ${parseFloat(countryImpact.impact.impactMagnitude).toFixed(1)}%`
                                          }
                                        </Typography>
                                        
                                        {countryImpact.recoveryStatus.toLowerCase() !== 'recovered' && (
                                          <Box sx={{ mt: 0.5 }}>
                                            <Typography variant="caption" color="textSecondary">
                                              Recovery Progress: {recoveryProgress.toFixed(0)}%
                                            </Typography>
                                            <LinearProgress
                                              variant="determinate"
                                              value={recoveryProgress}
                                              sx={{ mt: 0.5, height: 4, borderRadius: 2 }}
                                              color={
                                                recoveryProgress > 75 ? 'success' :
                                                recoveryProgress > 50 ? 'warning' : 'error'
                                              }
                                            />
                                          </Box>
                                        )}
                                      </Box>
                                    }
                                  />
                                </ListItem>
                              );
                            })}
                          </List>
                        </Box>
                      </Collapse>
                    </CardContent>
                  </Card>
                </TimelineContent>
              </TimelineItem>
            );
          })}
        </Timeline>
      )}

      {/* Global Impact Statistics */}
      <Paper sx={{ p: 2, mt: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Assessment />
          Global Impact Statistics
        </Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="primary">
                {filteredEvents.length}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Major Economic Events
              </Typography>
            </Box>
          </Grid>
          
          <Grid item xs={12} md={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="warning.main">
                {filteredEvents.reduce((sum, e) => sum + e.affectedCountryCount, 0)}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Total Country Impacts
              </Typography>
            </Box>
          </Grid>
          
          <Grid item xs={12} md={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="error">
                {filteredEvents.filter(e => e.event.severity === 'Critical').length}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Critical Severity Events
              </Typography>
            </Box>
          </Grid>
          
          <Grid item xs={12} md={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="success.main">
                {Math.round(
                  filteredEvents.reduce((sum, e) => {
                    const recoveredCount = e.countryImpacts.filter(i => i.recoveryStatus === 'Recovered').length;
                    return sum + (recoveredCount / e.affectedCountryCount * 100);
                  }, 0) / Math.max(filteredEvents.length, 1)
                )}%
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Average Recovery Rate
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

export default GlobalEventsExplorer;
