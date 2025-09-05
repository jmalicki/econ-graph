import React from 'react';
import {
  Box,
  Typography,
  TextField,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Pagination,
  Paper,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Autocomplete,
  Skeleton,
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Bookmark as BookmarkIcon,
  TrendingUp as TrendingUpIcon,
  AccessTime as AccessTimeIcon,
} from '@mui/icons-material';
import { useNavigate, useSearchParams } from 'react-router-dom';

interface EconomicSeries {
  id: string;
  title: string;
  description: string;
  source: string;
  frequency: string;
  units: string;
  lastUpdated: string;
  startDate: string;
  endDate: string;
}

/**
 * REQUIREMENT: Browse and search functionality similar to FRED but more modern
 * PURPOSE: Provide comprehensive search and filtering for economic time series
 * This improves on FRED's search with better filters and modern UI patterns
 */
const SeriesExplorer: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // State management
  const [searchQuery, setSearchQuery] = React.useState(searchParams.get('q') || '');
  const [selectedSource, setSelectedSource] = React.useState(searchParams.get('source') || '');
  const [selectedFrequency, setSelectedFrequency] = React.useState(searchParams.get('frequency') || '');
  const [selectedCategory, setSelectedCategory] = React.useState(searchParams.get('category') || '');
  const [currentPage, setCurrentPage] = React.useState(1);
  const [isLoading, setIsLoading] = React.useState(false);

  // Mock data - in real app this would come from GraphQL queries
  const mockSeries: EconomicSeries[] = [
    {
      id: 'gdp-real',
      title: 'Real Gross Domestic Product',
      description: 'Inflation-adjusted measure of the value of all goods and services produced',
      source: 'Bureau of Economic Analysis',
      frequency: 'Quarterly',
      units: 'Billions of Chained 2017 Dollars',
      lastUpdated: '2024-12-15',
      startDate: '1947-01-01',
      endDate: '2024-09-30',
    },
    {
      id: 'unemployment-rate',
      title: 'Unemployment Rate',
      description: 'Percent of labor force that is unemployed',
      source: 'Bureau of Labor Statistics',
      frequency: 'Monthly',
      units: 'Percent',
      lastUpdated: '2024-12-06',
      startDate: '1948-01-01',
      endDate: '2024-11-30',
    },
    {
      id: 'cpi-all',
      title: 'Consumer Price Index for All Urban Consumers: All Items',
      description: 'Measure of average change in prices paid by urban consumers',
      source: 'Bureau of Labor Statistics',
      frequency: 'Monthly',
      units: 'Index 1982-84=100',
      lastUpdated: '2024-12-10',
      startDate: '1947-01-01',
      endDate: '2024-11-30',
    },
  ];

  const dataSources = ['All Sources', 'Bureau of Labor Statistics', 'Bureau of Economic Analysis', 'Federal Reserve'];
  const frequencies = ['All Frequencies', 'Daily', 'Weekly', 'Monthly', 'Quarterly', 'Annual'];
  const categories = ['All Categories', 'Employment', 'Inflation', 'GDP & Growth', 'Interest Rates', 'Trade'];

  const handleSearch = () => {
    setIsLoading(true);
    
    // Update URL parameters
    const params = new URLSearchParams();
    if (searchQuery) params.set('q', searchQuery);
    if (selectedSource && selectedSource !== 'All Sources') params.set('source', selectedSource);
    if (selectedFrequency && selectedFrequency !== 'All Frequencies') params.set('frequency', selectedFrequency);
    if (selectedCategory && selectedCategory !== 'All Categories') params.set('category', selectedCategory);
    
    setSearchParams(params);
    
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  };

  const handleSeriesClick = (seriesId: string) => {
    navigate(`/series/${seriesId}`);
  };

  const renderSeriesCard = (series: EconomicSeries) => (
    <Card
      key={series.id}
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        cursor: 'pointer',
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: 4,
        },
      }}
      onClick={() => handleSeriesClick(series.id)}
    >
      <CardContent sx={{ flexGrow: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
          <TrendingUpIcon color="primary" sx={{ mr: 1, mt: 0.5, flexShrink: 0 }} />
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Typography variant="h6" component="div" sx={{ mb: 1, wordBreak: 'break-word' }}>
              {series.title}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {series.description}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
          <Chip label={series.source} size="small" color="primary" variant="outlined" />
          <Chip label={series.frequency} size="small" variant="outlined" />
          <Chip label={series.units} size="small" variant="outlined" />
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 'auto' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <AccessTimeIcon fontSize="small" color="action" sx={{ mr: 0.5 }} />
            <Typography variant="caption" color="text.secondary">
              {series.startDate} - {series.endDate}
            </Typography>
          </Box>
        </Box>
      </CardContent>

      <CardActions sx={{ pt: 0 }}>
        <Button size="small" startIcon={<TrendingUpIcon />}>
          View Chart
        </Button>
        <IconButton size="small" aria-label="bookmark series">
          <BookmarkIcon />
        </IconButton>
      </CardActions>
    </Card>
  );

  const renderSkeletonCard = () => (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
          <Skeleton variant="circular" width={24} height={24} sx={{ mr: 1, mt: 0.5 }} />
          <Box sx={{ flexGrow: 1 }}>
            <Skeleton variant="text" width="80%" height={32} />
            <Skeleton variant="text" width="100%" height={48} />
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
          <Skeleton variant="rectangular" width={80} height={24} sx={{ borderRadius: 12 }} />
          <Skeleton variant="rectangular" width={60} height={24} sx={{ borderRadius: 12 }} />
          <Skeleton variant="rectangular" width={100} height={24} sx={{ borderRadius: 12 }} />
        </Box>
        <Skeleton variant="text" width="60%" />
      </CardContent>
    </Card>
  );

  return (
    <Box>
      {/* Page header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Explore Economic Series
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Search and discover economic time series data from multiple sources
        </Typography>
      </Box>

      {/* Search and filters */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Grid container spacing={3} alignItems="flex-end">
          {/* Search input */}
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Search series"
              placeholder="e.g., unemployment, GDP, inflation..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              InputProps={{
                startAdornment: <SearchIcon color="action" sx={{ mr: 1 }} />,
              }}
            />
          </Grid>

          {/* Source filter */}
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth>
              <InputLabel>Source</InputLabel>
              <Select
                value={selectedSource}
                onChange={(e) => setSelectedSource(e.target.value)}
                label="Source"
              >
                {dataSources.map((source) => (
                  <MenuItem key={source} value={source}>
                    {source}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Frequency filter */}
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth>
              <InputLabel>Frequency</InputLabel>
              <Select
                value={selectedFrequency}
                onChange={(e) => setSelectedFrequency(e.target.value)}
                label="Frequency"
              >
                {frequencies.map((freq) => (
                  <MenuItem key={freq} value={freq}>
                    {freq}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Category filter */}
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
              <Select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                label="Category"
              >
                {categories.map((category) => (
                  <MenuItem key={category} value={category}>
                    {category}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Search button */}
          <Grid item xs={12} sm={6} md={2}>
            <Button
              fullWidth
              variant="contained"
              size="large"
              onClick={handleSearch}
              disabled={isLoading}
              startIcon={<SearchIcon />}
            >
              Search
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Results */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          {isLoading ? 'Searching...' : `Found ${mockSeries.length} series`}
        </Typography>
      </Box>

      {/* Series grid */}
      <Grid container spacing={3}>
        {isLoading
          ? Array.from({ length: 6 }).map((_, index) => (
              <Grid item xs={12} sm={6} lg={4} key={index}>
                {renderSkeletonCard()}
              </Grid>
            ))
          : mockSeries.map((series) => (
              <Grid item xs={12} sm={6} lg={4} key={series.id}>
                {renderSeriesCard(series)}
              </Grid>
            ))}
      </Grid>

      {/* Pagination */}
      {!isLoading && mockSeries.length > 0 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <Pagination
            count={10}
            page={currentPage}
            onChange={(_, page) => setCurrentPage(page)}
            color="primary"
            size="large"
          />
        </Box>
      )}
    </Box>
  );
};

export default SeriesExplorer;
