/**
 * REQUIREMENT: Enhanced InteractiveChart with professional collaboration features
 * PURPOSE: Bloomberg Terminal-level chart with real-time collaboration
 * This provides institutional-grade economic analysis with team collaboration
 */

import React, { useState, useCallback } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
  TooltipItem,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import 'chartjs-adapter-date-fns';
import {
  Box,
  Paper,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Grid,
  Chip,
  useTheme,
  IconButton,
  Tooltip as MuiTooltip,
  Fab,
} from '@mui/material';
import {
  Groups as CollaborationIcon,
  Share as ShareIcon,
  Comment as CommentIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import ChartCollaborationConnected from './ChartCollaborationConnected';
import { ChartAnnotationType } from '../../utils/graphql';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale
);

interface DataPoint {
  date: string;
  value: number | null;
  isOriginalRelease: boolean;
  revisionDate: string;
}

interface InteractiveChartWithCollaborationProps {
  data: DataPoint[];
  seriesId: string;
  seriesTitle: string;
  units: string;
  frequency: string;
  loading?: boolean;
}

type TransformationType = 'none' | 'growth_rate' | 'log' | 'diff' | 'pct_change';

const InteractiveChartWithCollaboration: React.FC<InteractiveChartWithCollaborationProps> = ({
  data,
  seriesId,
  seriesTitle,
  units,
  frequency,
  loading = false,
}) => {
  const theme = useTheme();
  
  // Chart state
  const [transformation, setTransformation] = useState<TransformationType>('none');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [showOriginalReleases, setShowOriginalReleases] = useState(true);
  const [showRevisedData, setShowRevisedData] = useState(true);
  
  // Collaboration state
  const [collaborationOpen, setCollaborationOpen] = useState(false);
  const [selectedAnnotations, setSelectedAnnotations] = useState<ChartAnnotationType[]>([]);

  // Generate unique chart ID based on series and current filters
  const chartId = `${seriesId}-${transformation}-${startDate?.getTime() || 'all'}-${endDate?.getTime() || 'all'}`;

  // Filter data by date range
  const filteredData = data.filter(point => {
    const pointDate = new Date(point.date);
    if (startDate && pointDate < startDate) return false;
    if (endDate && pointDate > endDate) return false;
    return true;
  });

  // Apply transformations
  const transformData = useCallback((data: DataPoint[]) => {
    if (transformation === 'none') return data;

    return data.map((point, index) => {
      if (point.value === null) return point;
      
      let transformedValue = point.value;
      
      switch (transformation) {
        case 'growth_rate':
          if (index > 0 && data[index - 1].value !== null) {
            transformedValue = ((point.value - data[index - 1].value!) / data[index - 1].value!) * 100;
          } else {
            transformedValue = 0;
          }
          break;
        case 'log':
          transformedValue = Math.log(point.value);
          break;
        case 'diff':
          if (index > 0 && data[index - 1].value !== null) {
            transformedValue = point.value - data[index - 1].value!;
          } else {
            transformedValue = 0;
          }
          break;
        case 'pct_change':
          if (index > 0 && data[index - 1].value !== null) {
            transformedValue = ((point.value - data[index - 1].value!) / data[index - 1].value!) * 100;
          } else {
            transformedValue = 0;
          }
          break;
      }
      
      return { ...point, value: transformedValue };
    });
  }, [transformation]);

  // Process data
  const processedData = {
    revised: transformData(filteredData.filter(d => !d.isOriginalRelease)),
    original: transformData(filteredData.filter(d => d.isOriginalRelease)),
  };

  // Create chart data
  const chartData = {
    datasets: [
      ...(showRevisedData ? [{
        label: 'Revised Data',
        data: processedData.revised.map(d => ({
          x: d.date,
          y: d.value?.toString() || '0',
        })),
        borderColor: theme.palette.primary.main,
        backgroundColor: theme.palette.primary.main + '20',
        fill: false,
        tension: 0.1,
        pointRadius: 2,
        pointHoverRadius: 4,
      }] : []),
      ...(showOriginalReleases ? [{
        label: 'Original Releases',
        data: processedData.original.map(d => ({
          x: d.date,
          y: d.value?.toString() || '0',
        })),
        borderColor: theme.palette.secondary.main,
        backgroundColor: theme.palette.secondary.main + '20',
        fill: false,
        tension: 0.1,
        pointRadius: 1,
        pointHoverRadius: 3,
        borderDash: [5, 5],
      }] : []),
      // Add annotation lines (simplified for now)
      ...selectedAnnotations.map(annotation => ({
        label: annotation.title,
        data: [
          { x: annotation.annotationDate, y: '0' },
        ],
        borderColor: annotation.color || theme.palette.warning.main,
        backgroundColor: 'transparent',
        fill: false,
        pointRadius: 4,
        borderWidth: 2,
        showLine: false,
      })),
    ],
  };

  const getTransformationLabel = (transform: TransformationType) => {
    switch (transform) {
      case 'growth_rate': return 'Growth Rate (%)';
      case 'log': return 'Logarithmic';
      case 'diff': return 'First Difference';
      case 'pct_change': return 'Percent Change';
      default: return 'None';
    }
  };

  const getYAxisTitle = () => {
    if (transformation === 'none') return units;
    if (transformation === 'growth_rate' || transformation === 'pct_change') return 'Percent (%)';
    if (transformation === 'log') return `Log(${units})`;
    if (transformation === 'diff') return `Δ ${units}`;
    return units;
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      intersect: false,
      mode: 'index' as const,
    },
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          padding: 20,
        },
      },
      title: {
        display: true,
        text: `${seriesTitle}${transformation !== 'none' ? ` (${getTransformationLabel(transformation)})` : ''}`,
        font: {
          size: 14,
          weight: 'bold' as const,
        },
        padding: {
          top: 10,
          bottom: 20,
        },
      },
      tooltip: {
        callbacks: {
          title: (tooltipItems: TooltipItem<'line'>[]) => {
            const date = new Date(tooltipItems[0].parsed.x);
            return date.toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            });
          },
          label: (tooltipItem: TooltipItem<'line'>) => {
            const value = tooltipItem.parsed.y;
            if (value === null) return `${tooltipItem.dataset.label}: No data`;
            
            const formattedValue = typeof value === 'number' 
              ? value.toLocaleString('en-US', { 
                  minimumFractionDigits: 2, 
                  maximumFractionDigits: 2 
                })
              : value;
            
            return `${tooltipItem.dataset.label}: ${formattedValue} ${getYAxisTitle()}`;
          },
        },
      },
    },
    scales: {
      x: {
        type: 'time' as const,
        time: {
          displayFormats: {
            month: 'MMM yyyy',
            year: 'yyyy',
          },
        },
        title: {
          display: true,
          text: 'Date',
        },
        grid: {
          display: true,
          color: theme.palette.divider,
        },
      },
      y: {
        title: {
          display: true,
          text: getYAxisTitle(),
        },
        grid: {
          display: true,
          color: theme.palette.divider,
        },
      },
    },
  };

  const handleAnnotationClick = useCallback((annotation: ChartAnnotationType) => {
    setSelectedAnnotations(prev => {
      const exists = prev.find(a => a.id === annotation.id);
      if (exists) {
        return prev.filter(a => a.id !== annotation.id);
      } else {
        return [...prev, annotation];
      }
    });
  }, []);

  return (
    <Box sx={{ position: 'relative' }}>
      <Paper elevation={2} sx={{ p: 3 }}>
        {/* Chart Controls */}
        <Box sx={{ mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Transformation</InputLabel>
                <Select
                  value={transformation}
                  onChange={(e) => setTransformation(e.target.value as TransformationType)}
                  label="Transformation"
                >
                  <MenuItem value="none">None</MenuItem>
                  <MenuItem value="growth_rate">Growth Rate</MenuItem>
                  <MenuItem value="log">Logarithmic</MenuItem>
                  <MenuItem value="diff">First Difference</MenuItem>
                  <MenuItem value="pct_change">Percent Change</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={3}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="Start Date"
                  value={startDate}
                  onChange={setStartDate}
                  slotProps={{
                    textField: {
                      size: 'small',
                      fullWidth: true,
                    },
                  }}
                />
              </LocalizationProvider>
            </Grid>
            
            <Grid item xs={12} md={3}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="End Date"
                  value={endDate}
                  onChange={setEndDate}
                  slotProps={{
                    textField: {
                      size: 'small',
                      fullWidth: true,
                    },
                  }}
                />
              </LocalizationProvider>
            </Grid>
            
            <Grid item xs={12} md={3}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={showRevisedData}
                      onChange={(e) => setShowRevisedData(e.target.checked)}
                      size="small"
                    />
                  }
                  label="Revised Data"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={showOriginalReleases}
                      onChange={(e) => setShowOriginalReleases(e.target.checked)}
                      size="small"
                    />
                  }
                  label="Original Releases"
                />
              </Box>
            </Grid>
          </Grid>

          {/* Active filters display */}
          <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
            {transformation !== 'none' && (
              <Chip
                label={getTransformationLabel(transformation)}
                size="small"
                color="primary"
                onDelete={() => setTransformation('none')}
              />
            )}
            {startDate && (
              <Chip
                label={`From: ${startDate.toLocaleDateString()}`}
                size="small"
                variant="outlined"
                onDelete={() => setStartDate(null)}
              />
            )}
            {endDate && (
              <Chip
                label={`To: ${endDate.toLocaleDateString()}`}
                size="small"
                variant="outlined"
                onDelete={() => setEndDate(null)}
              />
            )}
            {selectedAnnotations.length > 0 && (
              <Chip
                label={`${selectedAnnotations.length} annotation${selectedAnnotations.length !== 1 ? 's' : ''} shown`}
                size="small"
                color="secondary"
                variant="outlined"
              />
            )}
            
            {/* Collaboration Controls */}
            <Box sx={{ ml: 'auto', display: 'flex', gap: 1 }}>
              <MuiTooltip title="Open Collaboration Panel">
                <IconButton
                  size="small"
                  onClick={() => setCollaborationOpen(true)}
                  color={collaborationOpen ? 'primary' : 'default'}
                >
                  <CollaborationIcon />
                </IconButton>
              </MuiTooltip>
            </Box>
          </Box>
        </Box>

        {/* Chart */}
        <Box sx={{ height: 400, position: 'relative' }}>
          <Line data={chartData} options={chartOptions} />
        </Box>

        {/* Chart info */}
        <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
          <Typography variant="caption" color="text.secondary">
            Frequency: {frequency} • 
            Data Points: {processedData.revised.length + processedData.original.length} • 
            {showOriginalReleases && showRevisedData && ' Both original and revised data shown'}
            {selectedAnnotations.length > 0 && ` • ${selectedAnnotations.length} annotations displayed`}
          </Typography>
        </Box>
      </Paper>

      {/* Collaboration Panel */}
      <ChartCollaborationConnected
        seriesId={seriesId}
        chartId={chartId}
        isOpen={collaborationOpen}
        onToggle={() => setCollaborationOpen(!collaborationOpen)}
        onAnnotationClick={handleAnnotationClick}
      />

      {/* Floating Collaboration Button */}
      {!collaborationOpen && (
        <Fab
          color="primary"
          size="small"
          sx={{
            position: 'absolute',
            bottom: 16,
            right: 16,
            zIndex: 1000,
          }}
          onClick={() => setCollaborationOpen(true)}
        >
          <CommentIcon />
        </Fab>
      )}
    </Box>
  );
};

export default InteractiveChartWithCollaboration;

