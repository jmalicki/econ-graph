import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
  Button,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Breadcrumbs,
  Link,
  Skeleton,
  Alert,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Share as ShareIcon,
  Download as DownloadIcon,
  Bookmark as BookmarkIcon,
  Info as InfoIcon,
  TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';

import InteractiveChartWithCollaboration from '../components/charts/InteractiveChartWithCollaboration';

interface SeriesData {
  id: string;
  title: string;
  description: string;
  source: string;
  frequency: string;
  units: string;
  seasonalAdjustment: string;
  startDate: string;
  endDate: string;
  lastUpdated: string;
  dataPoints: Array<{
    date: string;
    value: number | null;
    isOriginalRelease: boolean;
    revisionDate: string;
  }>;
}

/**
 * REQUIREMENT: Detailed series view with interactive charts and data transformation options
 * PURPOSE: Provide comprehensive analysis tools for individual economic time series
 * This creates a detailed view similar to FRED's series pages but with modern UX
 */
const SeriesDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [seriesData, setSeriesData] = React.useState<SeriesData | null>(null);

  // Mock data - in real app this would come from GraphQL queries
  React.useEffect(() => {
    const fetchSeriesData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Mock data based on series ID
        const mockData: SeriesData = {
          id: id || 'unknown',
          title: id === 'gdp-real' 
            ? 'Real Gross Domestic Product'
            : id === 'unemployment-rate'
            ? 'Unemployment Rate'
            : 'Consumer Price Index for All Urban Consumers: All Items',
          description: id === 'gdp-real'
            ? 'Inflation-adjusted measure of the value of all goods and services produced in the economy'
            : id === 'unemployment-rate'
            ? 'The unemployment rate represents the number of unemployed as a percentage of the labor force'
            : 'A measure of the average change over time in the prices paid by urban consumers for a market basket of consumer goods and services',
          source: id === 'gdp-real' ? 'Bureau of Economic Analysis' : 'Bureau of Labor Statistics',
          frequency: id === 'gdp-real' ? 'Quarterly' : 'Monthly',
          units: id === 'gdp-real' 
            ? 'Billions of Chained 2017 Dollars'
            : id === 'unemployment-rate'
            ? 'Percent'
            : 'Index 1982-84=100',
          seasonalAdjustment: 'Seasonally Adjusted Annual Rate',
          startDate: '1947-01-01',
          endDate: '2024-09-30',
          lastUpdated: '2024-12-15',
          dataPoints: generateMockDataPoints(id || 'gdp-real'),
        };
        
        setSeriesData(mockData);
      } catch (err) {
        setError('Failed to load series data');
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchSeriesData();
    }
  }, [id]);

  // Generate mock data points for demonstration
  function generateMockDataPoints(seriesId: string) {
    const points = [];
    const startDate = new Date('2020-01-01');
    const endDate = new Date('2024-12-01');
    const isQuarterly = seriesId === 'gdp-real';
    
    let baseValue = seriesId === 'gdp-real' ? 21000 : seriesId === 'unemployment-rate' ? 5.0 : 250;
    let currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      // Add some realistic variation
      const variation = (Math.random() - 0.5) * 0.02; // ±1% variation
      baseValue *= (1 + variation);
      
      points.push({
        date: currentDate.toISOString().split('T')[0],
        value: Math.round(baseValue * 100) / 100,
        isOriginalRelease: Math.random() > 0.8, // 20% original releases
        revisionDate: currentDate.toISOString().split('T')[0],
      });
      
      // Increment date
      if (isQuarterly) {
        currentDate.setMonth(currentDate.getMonth() + 3);
      } else {
        currentDate.setMonth(currentDate.getMonth() + 1);
      }
    }
    
    return points;
  }

  if (isLoading) {
    return (
      <Box>
        <Skeleton variant="text" width="60%" height={40} sx={{ mb: 2 }} />
        <Skeleton variant="text" width="80%" height={24} sx={{ mb: 4 }} />
        <Grid container spacing={3}>
          <Grid item xs={12} lg={8}>
            <Skeleton variant="rectangular" height={500} />
          </Grid>
          <Grid item xs={12} lg={4}>
            <Skeleton variant="rectangular" height={300} />
          </Grid>
        </Grid>
      </Box>
    );
  }

  if (error || !seriesData) {
    return (
      <Box>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error || 'Series not found'}
        </Alert>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/explore')}>
          Back to Explorer
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      {/* Breadcrumbs */}
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link color="inherit" href="/explore" onClick={(e) => { e.preventDefault(); navigate('/explore'); }}>
          Explore
        </Link>
        <Typography color="text.primary">{seriesData.title}</Typography>
      </Breadcrumbs>

      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h4" component="h1" gutterBottom>
              {seriesData.title}
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
              {seriesData.description}
            </Typography>
            
            {/* Metadata chips */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              <Chip label={seriesData.source} color="primary" variant="outlined" />
              <Chip label={seriesData.frequency} variant="outlined" />
              <Chip label={seriesData.units} variant="outlined" />
              <Chip label={seriesData.seasonalAdjustment} variant="outlined" />
            </Box>
          </Box>

          {/* Action buttons */}
          <Box sx={{ display: 'flex', gap: 1, ml: 2 }}>
            <IconButton aria-label="bookmark">
              <BookmarkIcon />
            </IconButton>
            <IconButton aria-label="share">
              <ShareIcon />
            </IconButton>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={() => {
                // REQUIREMENT: Data download functionality
                const csvContent = seriesData.dataPoints
                  .map(dp => `${dp.date},${dp.value},${dp.isOriginalRelease}`)
                  .join('\n');
                const blob = new Blob([`Date,Value,Original Release\n${csvContent}`], { type: 'text/csv' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${seriesData.id}.csv`;
                a.click();
              }}
            >
              Download Data
            </Button>
          </Box>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Chart */}
        <Grid item xs={12} lg={8}>
          <InteractiveChartWithCollaboration
            data={seriesData.dataPoints}
            seriesId={seriesData.id}
            seriesTitle={seriesData.title}
            units={seriesData.units}
            frequency={seriesData.frequency}
          />
        </Grid>

        {/* Sidebar with metadata and recent data */}
        <Grid item xs={12} lg={4}>
          {/* Series Information */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <InfoIcon sx={{ mr: 1 }} />
                Series Information
              </Typography>
              
              <Table size="small">
                <TableBody>
                  <TableRow>
                    <TableCell><strong>Series ID</strong></TableCell>
                    <TableCell>{seriesData.id}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell><strong>Source</strong></TableCell>
                    <TableCell>{seriesData.source}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell><strong>Frequency</strong></TableCell>
                    <TableCell>{seriesData.frequency}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell><strong>Units</strong></TableCell>
                    <TableCell>{seriesData.units}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell><strong>Date Range</strong></TableCell>
                    <TableCell>
                      {new Date(seriesData.startDate).getFullYear()} - {new Date(seriesData.endDate).getFullYear()}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell><strong>Last Updated</strong></TableCell>
                    <TableCell>{new Date(seriesData.lastUpdated).toLocaleDateString()}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Recent Data Points */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <TrendingUpIcon sx={{ mr: 1 }} />
                Recent Data
              </Typography>
              
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell><strong>Date</strong></TableCell>
                      <TableCell align="right"><strong>Value</strong></TableCell>
                      <TableCell align="center"><strong>Type</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {seriesData.dataPoints.slice(-10).reverse().map((point, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          {new Date(point.date).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                          })}
                        </TableCell>
                        <TableCell align="right">
                          {point.value?.toFixed(2) || 'N/A'}
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={point.isOriginalRelease ? 'Original' : 'Revised'}
                            size="small"
                            color={point.isOriginalRelease ? 'secondary' : 'primary'}
                            variant="outlined"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default SeriesDetail;
